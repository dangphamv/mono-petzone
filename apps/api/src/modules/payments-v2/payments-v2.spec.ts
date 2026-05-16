import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { randomUUID, randomBytes } from 'crypto';
import { Client as PgClient } from 'pg';
import type { SupabaseClient } from '@supabase/supabase-js';

import { SupabaseModule } from '../supabase/supabase.module';
import { SupabaseService } from '../supabase/supabase.service';
import { PaymentsV2Module } from './payments-v2.module';
import { PaymentsV2Service } from './payments-v2.service';
import { DisbursementWorker } from './disbursement.worker';
import { PaymentListener } from './listeners/payment.listener';
import { PAYMENT_PROVIDER, type PaymentProvider } from './psp/psp.interface';

const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321';
const LOCAL_SERVICE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
const LOCAL_ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
const LOCAL_PG_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

/**
 * Integration test for the Payments v2 flow.
 *
 * Runs against local Supabase (supabase start). Uses the MockProvider (default
 * when NINEPAY_ENABLED is unset) so no real PSP calls happen. Verifies:
 *
 *   create order(v2)
 *   → initiate()            → payments_v2.status='awaiting_payment'
 *   → collection IPN        → status='captured', escrow hold, order='pending'
 *   → enqueueSplit()        → 2 outbox rows, 2 payouts (sum = gross)
 *   → worker.drain()        → both legs 'dispatched', got psp_disbursement_id
 *   → 2 disbursement IPNs   → both 'completed', payment='split_completed'
 *   → idempotency: replay collection IPN → no double-credit
 *   → bank-info-missing path → payment goes 'split_failed'
 */

interface Fixtures {
  ownerId: string;
  providerId: string;
  providerUserId: string;
  roomTypeId: string;
  orderId: string;
}

describe('PaymentsV2 (integration)', () => {
  let service: PaymentsV2Service;
  let listener: PaymentListener;
  let worker: DisbursementWorker;
  let psp: PaymentProvider;
  let admin: SupabaseClient;
  let pg: PgClient;

  beforeAll(async () => {
    process.env.SUPABASE_URL = LOCAL_SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = LOCAL_SERVICE_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = LOCAL_ANON_KEY;
    process.env.NINEPAY_ENABLED = 'false';
    process.env.NINEPAY_PETZONE_BANK_NAME = 'Vietcombank';
    process.env.NINEPAY_PETZONE_ACCOUNT_NUMBER = '9999000011';
    process.env.NINEPAY_PETZONE_ACCOUNT_HOLDER = 'PetZone JSC';

    const mod = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        EventEmitterModule.forRoot(),
        ScheduleModule.forRoot(),
        SupabaseModule,
        PaymentsV2Module,
      ],
      providers: [ConfigService],
    }).compile();

    service = mod.get(PaymentsV2Service);
    listener = mod.get(PaymentListener);
    worker = mod.get(DisbursementWorker);
    psp = mod.get(PAYMENT_PROVIDER);
    admin = mod.get(SupabaseService).client;

    pg = new PgClient({ connectionString: LOCAL_PG_URL });
    await pg.connect();

    expect(psp.name).toBe('mock');
  });

  afterAll(async () => {
    await pg.end();
  });

  async function makeFixtures(opts: { withBank: boolean }): Promise<Fixtures> {
    const ownerId = randomUUID();
    const providerUserId = randomUUID();
    const ownerEmail = `owner-${randomBytes(4).toString('hex')}@test.local`;
    const providerEmail = `provider-${randomBytes(4).toString('hex')}@test.local`;

    // Bypass gotrue admin API (rejecting HS256 against ES256 JWKS in newer supabase).
    // Insert directly into auth.users via the postgres connection. Service role
    // would normally use auth.admin.createUser; this is test-only.
    for (const [id, email] of [
      [ownerId, ownerEmail],
      [providerUserId, providerEmail],
    ]) {
      await pg.query(
        `INSERT INTO auth.users (id, email, instance_id, aud, role, encrypted_password, email_confirmed_at, raw_app_meta_data)
         VALUES ($1, $2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '', now(), '{"role":"owner"}'::jsonb)`,
        [id, email],
      );
    }

    await admin.from('users').insert([
      { id: ownerId, email: ownerEmail, full_name: 'Test Owner', role: 'owner' },
      { id: providerUserId, email: providerEmail, full_name: 'Test Provider', role: 'provider' },
    ]);

    const { data: provider, error: provInsertErr } = await admin
      .from('providers')
      .insert({
        user_id: providerUserId,
        business_name: 'E2E Hotel',
        address: '1 Test St',
        latitude: 10.77,
        longitude: 106.7,
        facility_photos: [
          'https://example.com/1.jpg',
          'https://example.com/2.jpg',
          'https://example.com/3.jpg',
          'https://example.com/4.jpg',
          'https://example.com/5.jpg',
        ],
        license_photos: ['https://example.com/license.jpg'],
        verification_status: 'approved',
        bank_name: opts.withBank ? 'Vietcombank' : null,
        bank_account_number_encrypted: opts.withBank ? '0123456789012' : null,
        bank_account_holder: opts.withBank ? 'TEST PROVIDER' : null,
        bank_verified_at: opts.withBank ? new Date().toISOString() : null,
      })
      .select('id')
      .single();
    if (provInsertErr || !provider) throw new Error(`insert provider failed: ${provInsertErr?.message}`);
    const providerId = (provider as { id: string }).id;

    const { data: room, error: roomErr } = await admin
      .from('room_types')
      .insert({ provider_id: providerId, name: 'Standard', price_per_night: 500_000 })
      .select('id')
      .single();
    if (roomErr || !room) throw new Error(`insert room failed: ${roomErr?.message}`);
    const roomTypeId = (room as { id: string }).id;

    const { data: order, error: orderErr } = await admin
      .from('orders')
      .insert({
        owner_id: ownerId,
        provider_id: providerId,
        room_type_id: roomTypeId,
        status: 'pending_payment',
        check_in_date: '2026-12-01',
        check_out_date: '2026-12-04',
        num_nights: 3,
        pet_ids: [randomUUID()],
        price_breakdown: { total: 1_500_000 },
        total_price: 1_500_000,
        cancellation_policy: 'flexible',
        payment_version: 2,
      })
      .select('id')
      .single();
    if (orderErr || !order) throw new Error(`insert order failed: ${orderErr?.message}`);
    const orderId = (order as { id: string }).id;

    return { ownerId, providerId, providerUserId, roomTypeId, orderId };
  }

  async function cleanupFixtures(f: Fixtures) {
    // Order needs payments_v2 + escrow + payouts + outbox cleaned up via cascade.
    await admin.from('payments_v2').delete().eq('order_id', f.orderId);
    await admin.from('orders').delete().eq('id', f.orderId);
    await admin.from('room_types').delete().eq('id', f.roomTypeId);
    await admin.from('providers').delete().eq('id', f.providerId);
    await admin.from('users').delete().in('id', [f.ownerId, f.providerUserId]);
    await pg.query('DELETE FROM auth.users WHERE id = ANY($1)', [[f.ownerId, f.providerUserId]]);
  }

  it('runs the full v2 happy path: initiate → capture → split → settle', async () => {
    const f = await makeFixtures({ withBank: true });

    try {
      // 1. initiate
      const initRes = await service.initiate(f.ownerId, {
        order_id: f.orderId,
        method: 'momo',
      });
      expect(initRes.payment_url).toMatch(/^https:\/\/mock-psp\.local\/pay\/MOCK-/);
      expect(initRes.payment.status).toBe('awaiting_payment');
      expect(initRes.payment.psp_order_id).toMatch(/^MOCK-/);

      // 2. simulate collection IPN
      const pspOrderId = initRes.payment.psp_order_id;
      const collectionIpn = JSON.stringify({
        event_id: `evt-col-${randomUUID()}`,
        psp_order_id: pspOrderId,
        amount: 1_500_000,
        method: 'momo',
        status: 'success',
      });
      const colRes = await service.handleWebhook('collection', collectionIpn, {});
      expect(colRes).toEqual({ ok: true });

      const { data: afterCapture } = await admin
        .from('payments_v2')
        .select('status, captured_at, method')
        .eq('order_id', f.orderId)
        .single();
      expect((afterCapture as any).status).toBe('captured');
      expect((afterCapture as any).captured_at).toBeTruthy();
      expect((afterCapture as any).method).toBe('momo');

      const { data: hold } = await admin
        .from('escrow_ledger_v2')
        .select('type, amount')
        .eq('type', 'hold');
      expect((hold as { type: string; amount: number }[]).some((r) => r.amount === 1_500_000)).toBe(true);

      const { data: orderAfterCapture } = await admin
        .from('orders')
        .select('status')
        .eq('id', f.orderId)
        .single();
      expect((orderAfterCapture as any).status).toBe('pending');

      // 3. idempotency: replay the same IPN — should not double-update
      const beforeReplay = await admin.from('payments_v2').select('updated_at').eq('order_id', f.orderId).single();
      const replay = await service.handleWebhook('collection', collectionIpn, {});
      expect(replay).toEqual({ ok: true, idempotent: true });
      const afterReplay = await admin.from('payments_v2').select('updated_at').eq('order_id', f.orderId).single();
      expect((afterReplay.data as any).updated_at).toBe((beforeReplay.data as any).updated_at);

      // 4. emit order.v2.completed (the listener writes outbox + flips status)
      await listener.onOrderCompleted({ order_id: f.orderId, actor_id: f.providerUserId });

      const { data: outboxRows } = await admin
        .from('psp_outbox_v2')
        .select('kind, status, payload')
        .order('kind', { ascending: true });
      expect(outboxRows).toHaveLength(2);
      const kinds = (outboxRows as { kind: string }[]).map((r) => r.kind).sort();
      expect(kinds).toEqual(['disburse_petzone', 'disburse_provider']);

      const { data: payouts } = await admin
        .from('provider_payouts_v2')
        .select('recipient, gross_amount, commission_amount, net_amount')
        .order('recipient', { ascending: true });
      expect(payouts).toHaveLength(2);
      const byRecipient = Object.fromEntries(
        (payouts as { recipient: string; gross_amount: number; commission_amount: number; net_amount: number }[]).map((p) => [p.recipient, p]),
      );
      // 15% commission on 1,500,000 = 225,000 → provider net = 1,275,000
      expect(Number(byRecipient.provider.net_amount)).toBe(1_275_000);
      expect(Number(byRecipient.petzone.net_amount)).toBe(225_000);
      expect(Number(byRecipient.provider.net_amount) + Number(byRecipient.petzone.net_amount)).toBe(1_500_000);

      const { data: paymentSplitPending } = await admin.from('payments_v2').select('status').eq('order_id', f.orderId).single();
      expect((paymentSplitPending as any).status).toBe('split_pending');

      // 5. drain worker — should mark both outbox rows completed and payouts dispatched
      await worker.drain();
      const { data: outboxAfter } = await admin.from('psp_outbox_v2').select('status, payout_v2_id');
      expect((outboxAfter as { status: string }[]).every((r) => r.status === 'completed')).toBe(true);

      const { data: payoutsAfterDrain } = await admin
        .from('provider_payouts_v2')
        .select('id, status, psp_disbursement_id, recipient');
      expect(payoutsAfterDrain).toHaveLength(2);
      for (const p of payoutsAfterDrain as { status: string; psp_disbursement_id: string }[]) {
        expect(p.status).toBe('dispatched');
        expect(p.psp_disbursement_id).toMatch(/^MOCK-DSB-/);
      }

      // 6. simulate disbursement IPNs (one per leg)
      for (const p of payoutsAfterDrain as { psp_disbursement_id: string; recipient: string }[]) {
        const dsbIpn = JSON.stringify({
          event_id: `evt-dsb-${p.psp_disbursement_id}`,
          psp_disbursement_id: p.psp_disbursement_id,
          status: 'success',
        });
        const r = await service.handleWebhook('disbursement', dsbIpn, {});
        expect(r).toEqual({ ok: true });
      }

      const { data: finalPayouts } = await admin.from('provider_payouts_v2').select('status, completed_at');
      expect((finalPayouts as { status: string; completed_at: string | null }[]).every((p) => p.status === 'completed')).toBe(true);
      expect((finalPayouts as { completed_at: string | null }[]).every((p) => p.completed_at != null)).toBe(true);

      const { data: finalPayment } = await admin
        .from('payments_v2')
        .select('status, split_completed_at')
        .eq('order_id', f.orderId)
        .single();
      expect((finalPayment as any).status).toBe('split_completed');
      expect((finalPayment as any).split_completed_at).toBeTruthy();

      const { data: ledger } = await admin
        .from('escrow_ledger_v2')
        .select('type, amount')
        .order('created_at', { ascending: true });
      const ledgerTypes = (ledger as { type: string }[]).map((r) => r.type);
      expect(ledgerTypes).toContain('hold');
      expect(ledgerTypes.filter((t) => t === 'release')).toHaveLength(2);
    } finally {
      await cleanupFixtures(f);
    }
  }, 60_000);

  it('flips payment to split_failed when provider has no bank info on enqueue', async () => {
    const f = await makeFixtures({ withBank: false });

    try {
      const initRes = await service.initiate(f.ownerId, { order_id: f.orderId, method: 'vnpay' });
      const collectionIpn = JSON.stringify({
        event_id: `evt-col-${randomUUID()}`,
        psp_order_id: initRes.payment.psp_order_id,
        amount: 1_500_000,
        method: 'vnpay',
        status: 'success',
      });
      await service.handleWebhook('collection', collectionIpn, {});

      await listener.onOrderCompleted({ order_id: f.orderId, actor_id: f.providerUserId });

      const { data: payment } = await admin
        .from('payments_v2')
        .select('status')
        .eq('order_id', f.orderId)
        .single();
      expect((payment as any).status).toBe('split_failed');

      const { data: payouts } = await admin
        .from('provider_payouts_v2')
        .select('id')
        .eq('payment_v2_id', initRes.payment.id);
      expect(payouts).toEqual([]);

      const { data: outbox } = await admin
        .from('psp_outbox_v2')
        .select('id')
        .eq('payment_v2_id', initRes.payment.id);
      expect(outbox).toEqual([]);
    } finally {
      await cleanupFixtures(f);
    }
  }, 60_000);

  it('rejects initiate for v1 orders and for orders not in pending_payment', async () => {
    const f = await makeFixtures({ withBank: true });
    try {
      // Flip the order to v1
      await admin.from('orders').update({ payment_version: 1 }).eq('id', f.orderId);
      await expect(service.initiate(f.ownerId, { order_id: f.orderId, method: 'momo' })).rejects.toThrow(/not v2/);

      // Flip back to v2 but move to confirmed
      await admin.from('orders').update({ payment_version: 2, status: 'confirmed' }).eq('id', f.orderId);
      await expect(service.initiate(f.ownerId, { order_id: f.orderId, method: 'momo' })).rejects.toThrow(/payable/);
    } finally {
      await cleanupFixtures(f);
    }
  }, 30_000);
});
