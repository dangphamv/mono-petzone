import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { randomUUID, randomBytes } from 'crypto';
import { Client as PgClient } from 'pg';
import { BadRequestException } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';

import { SupabaseModule } from '../supabase/supabase.module';
import { SupabaseService } from '../supabase/supabase.service';
import { PaymentsModule } from './payments.module';
import { PaymentsService } from './payments.service';

const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321';
const LOCAL_SERVICE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
const LOCAL_ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
const LOCAL_PG_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

interface Fixtures {
  ownerId: string;
  providerId: string;
  providerUserId: string;
  roomTypeId: string;
  orderId: string;
}

/**
 * v1 split-payout test. Verifies requestPayout creates two rows per completed
 * order — one with recipient='provider' (net) and one with recipient='petzone'
 * (commission) — and their net_amounts sum to gross.
 */
describe('PaymentsService v1 split (integration)', () => {
  let service: PaymentsService;
  let admin: SupabaseClient;
  let pg: PgClient;

  beforeAll(async () => {
    process.env.SUPABASE_URL = LOCAL_SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = LOCAL_SERVICE_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = LOCAL_ANON_KEY;

    const mod = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        EventEmitterModule.forRoot(),
        SupabaseModule,
        PaymentsModule,
      ],
    }).compile();

    service = mod.get(PaymentsService);
    admin = mod.get(SupabaseService).client;

    pg = new PgClient({ connectionString: LOCAL_PG_URL });
    await pg.connect();
  });

  afterAll(async () => {
    await pg.end();
  });

  async function makeFixtures(opts: { totalPrice: number; orderStatus?: string }): Promise<Fixtures> {
    const ownerId = randomUUID();
    const providerUserId = randomUUID();
    const ownerEmail = `owner-${randomBytes(4).toString('hex')}@test.local`;
    const providerEmail = `provider-${randomBytes(4).toString('hex')}@test.local`;

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

    const { data: provider } = await admin
      .from('providers')
      .insert({
        user_id: providerUserId,
        business_name: 'v1 Hotel',
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
      })
      .select('id')
      .single();
    const providerId = (provider as { id: string }).id;

    const { data: room } = await admin
      .from('room_types')
      .insert({ provider_id: providerId, name: 'Standard', price_per_night: 500_000 })
      .select('id')
      .single();
    const roomTypeId = (room as { id: string }).id;

    const { data: order } = await admin
      .from('orders')
      .insert({
        owner_id: ownerId,
        provider_id: providerId,
        room_type_id: roomTypeId,
        status: opts.orderStatus ?? 'completed',
        check_in_date: '2026-12-01',
        check_out_date: '2026-12-04',
        num_nights: 3,
        pet_ids: [randomUUID()],
        price_breakdown: { total: opts.totalPrice },
        total_price: opts.totalPrice,
        cancellation_policy: 'flexible',
        payment_version: 1,
        completed_at: opts.orderStatus === 'completed' || !opts.orderStatus ? new Date().toISOString() : null,
      })
      .select('id')
      .single();
    const orderId = (order as { id: string }).id;

    return { ownerId, providerId, providerUserId, roomTypeId, orderId };
  }

  async function cleanup(f: Fixtures) {
    await admin.from('provider_payouts').delete().eq('order_id', f.orderId);
    await admin.from('orders').delete().eq('id', f.orderId);
    await admin.from('room_types').delete().eq('id', f.roomTypeId);
    await admin.from('providers').delete().eq('id', f.providerId);
    await admin.from('users').delete().in('id', [f.ownerId, f.providerUserId]);
    await pg.query('DELETE FROM auth.users WHERE id = ANY($1)', [[f.ownerId, f.providerUserId]]);
  }

  it('creates two payout rows (provider + petzone) summing to gross', async () => {
    const f = await makeFixtures({ totalPrice: 1_500_000 });
    try {
      const result = await service.requestPayout(f.providerUserId);
      expect(result).toHaveLength(2);

      const byRecipient = Object.fromEntries(
        (result as { recipient: string; net_amount: number; commission_amount: number; gross_amount: number }[]).map((r) => [r.recipient, r]),
      );
      expect(byRecipient.provider).toBeDefined();
      expect(byRecipient.petzone).toBeDefined();

      // 15% commission on 1,500,000 = 225,000 → provider net = 1,275,000
      expect(Number(byRecipient.provider.net_amount)).toBe(1_275_000);
      expect(Number(byRecipient.petzone.net_amount)).toBe(225_000);
      expect(Number(byRecipient.provider.net_amount) + Number(byRecipient.petzone.net_amount)).toBe(1_500_000);

      expect(Number(byRecipient.provider.gross_amount)).toBe(1_500_000);
      expect(Number(byRecipient.petzone.gross_amount)).toBe(1_500_000);
      expect(Number(byRecipient.provider.commission_amount)).toBe(225_000);
      expect(Number(byRecipient.petzone.commission_amount)).toBe(225_000);
    } finally {
      await cleanup(f);
    }
  }, 30_000);

  it('is idempotent — second requestPayout call sees the order as already paid', async () => {
    const f = await makeFixtures({ totalPrice: 800_000 });
    try {
      const first = await service.requestPayout(f.providerUserId);
      expect(first).toHaveLength(2);

      await expect(service.requestPayout(f.providerUserId)).rejects.toThrow(BadRequestException);

      const { data: rows } = await admin
        .from('provider_payouts')
        .select('id, recipient')
        .eq('order_id', f.orderId);
      expect(rows).toHaveLength(2); // no duplicates
    } finally {
      await cleanup(f);
    }
  }, 30_000);

  it('does nothing when provider has no completed orders', async () => {
    const f = await makeFixtures({ totalPrice: 500_000, orderStatus: 'pending' });
    try {
      await expect(service.requestPayout(f.providerUserId)).rejects.toThrow(/No completed orders/);
    } finally {
      await cleanup(f);
    }
  }, 30_000);
});
