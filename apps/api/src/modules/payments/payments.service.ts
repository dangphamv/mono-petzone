import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { COMMISSION_RATE } from '@petzone/shared';
import { PAYMENT_COLUMNS, ORDER_COLUMNS, PAYOUT_COLUMNS } from '../../common/constants/columns';
import { paginate, type PaginationParams } from '../../common/utils/pagination';
import { randomUUID } from 'crypto';
import type { CreatePaymentInput, RefundInput } from '@petzone/validators';

@Injectable()
export class PaymentsService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(userId: string, body: CreatePaymentInput) {
    const { data: order, error: orderErr } = await this.supabase.client
      .from('orders')
      .select(ORDER_COLUMNS)
      .eq('id', body.order_id)
      .single();
    if (orderErr || !order) throw new NotFoundException('Order not found');
    if (order.owner_id !== userId) throw new ForbiddenException('Not the order owner');
    if (order.status !== 'pending_payment')
      throw new BadRequestException('Order is not in payable status');

    const transactionRef = `TXN-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;

    const { data: payment, error: payErr } = await this.supabase.client
      .from('payments')
      .insert({
        order_id: body.order_id,
        method: body.method,
        amount: order.total_price,
        status: 'pending',
        transaction_ref: transactionRef,
      })
      .select(PAYMENT_COLUMNS)
      .single();
    if (payErr) throw new BadRequestException(payErr.message);

    // Auto-complete payment (simulated -- no real gateway)
    const now = new Date().toISOString();
    const { data: updatedPayment, error: upErr } = await this.supabase.client
      .from('payments')
      .update({ status: 'completed', paid_at: now })
      .eq('id', payment.id)
      .select(PAYMENT_COLUMNS)
      .single();
    if (upErr) throw new BadRequestException(upErr.message);

    const deadline = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
    await this.supabase.client
      .from('orders')
      .update({
        status: 'pending',
        provider_response_deadline: deadline,
        updated_at: now,
      })
      .eq('id', body.order_id);

    await this.supabase.client.from('escrow_ledger').insert({
      order_id: body.order_id,
      type: 'hold',
      amount: order.total_price,
      balance_after: order.total_price,
      description: `Payment hold for order ${order.order_number || order.id}`,
    });

    await this.supabase.client.from('order_status_history').insert({
      order_id: body.order_id,
      status: 'pending',
      actor_id: userId,
      actor_type: 'system',
      note: `Payment completed via ${body.method}. Awaiting provider confirmation.`,
    });

    return { payment: updatedPayment, redirect_url: null };
  }

  callback() {
    return { message: 'Webhook endpoint ready' };
  }

  async findByOrder(userId: string, orderId: string) {
    const { data: order, error: orderErr } = await this.supabase.client
      .from('orders')
      .select(`${ORDER_COLUMNS}, providers(id, user_id)`)
      .eq('id', orderId)
      .single();
    if (orderErr || !order) throw new NotFoundException('Order not found');

    const isOwner = order.owner_id === userId;
    const providers = (order as Record<string, unknown>).providers as { user_id: string }[] | { user_id: string } | null;
    const providerUserId = Array.isArray(providers) ? providers[0]?.user_id : providers?.user_id;
    const isProvider = providerUserId === userId;
    if (!isOwner && !isProvider) throw new ForbiddenException('No access to this order');

    const { data: payment, error } = await this.supabase.client
      .from('payments')
      .select(PAYMENT_COLUMNS)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (error || !payment) throw new NotFoundException('Payment not found');

    return payment;
  }

  async refund(userId: string, orderId: string, body: RefundInput) {
    const { data: order, error: orderErr } = await this.supabase.client
      .from('orders')
      .select(ORDER_COLUMNS)
      .eq('id', orderId)
      .single();
    if (orderErr || !order) throw new NotFoundException('Order not found');

    const { data: payment, error: payErr } = await this.supabase.client
      .from('payments')
      .select(PAYMENT_COLUMNS)
      .eq('order_id', orderId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (payErr || !payment) throw new NotFoundException('No completed payment found for this order');

    if (body.amount > Number(payment.amount))
      throw new BadRequestException('Refund amount exceeds payment amount');

    const { data: refund, error: refErr } = await this.supabase.client
      .from('refunds')
      .insert({
        order_id: orderId,
        payment_id: payment.id,
        amount: body.amount,
        type: body.type,
        reason: body.reason,
        status: 'processing',
        processed_by: userId,
      })
      .select()
      .single();
    if (refErr) throw new BadRequestException(refErr.message);

    const now = new Date().toISOString();
    const newStatus = body.type === 'full' ? 'refunded' : 'partially_refunded';
    await this.supabase.client
      .from('payments')
      .update({
        refund_amount: (Number(payment.refund_amount) || 0) + body.amount,
        status: newStatus,
        refunded_at: now,
        updated_at: now,
      })
      .eq('id', payment.id);

    // Get current escrow balance
    const { data: lastLedger } = await this.supabase.client
      .from('escrow_ledger')
      .select('balance_after')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const balanceAfter = (Number(lastLedger?.balance_after) || 0) - body.amount;

    await this.supabase.client.from('escrow_ledger').insert({
      order_id: orderId,
      type: 'refund',
      amount: body.amount,
      balance_after: balanceAfter,
      description: `Refund (${body.type}): ${body.reason}`,
    });

    return refund;
  }

  async getPayouts(userId: string, params: PaginationParams) {
    const { page = 1, limit = 20 } = params;
    const from = (page - 1) * limit;

    const { data: provider, error: provErr } = await this.supabase.client
      .from('providers')
      .select('id')
      .eq('user_id', userId)
      .single();
    if (provErr || !provider) throw new ForbiddenException('Not a provider');

    const { data, error, count } = await this.supabase.client
      .from('provider_payouts')
      .select(PAYOUT_COLUMNS, { count: 'exact' })
      .eq('provider_id', provider.id)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);
    if (error) throw new BadRequestException(error.message);
    return paginate(data ?? [], count ?? 0, { page, limit });
  }

  async requestPayout(userId: string) {
    const { data: provider, error: provErr } = await this.supabase.client
      .from('providers')
      .select('id')
      .eq('user_id', userId)
      .single();
    if (provErr || !provider) throw new ForbiddenException('Not a provider');

    const [completedResult, payoutsResult] = await Promise.all([
      this.supabase.client
        .from('orders')
        .select('id, total_price')
        .eq('provider_id', provider.id)
        .eq('status', 'completed'),
      this.supabase.client
        .from('provider_payouts')
        .select('order_id')
        .eq('provider_id', provider.id),
    ]);

    const allCompleted = completedResult.data;
    const existingPayouts = payoutsResult.data;

    const paidOrderIds = new Set((existingPayouts || []).map((p: { order_id: string }) => p.order_id));
    const unpaidOrders = (allCompleted || []).filter((o: { id: string }) => !paidOrderIds.has(o.id));

    if (!unpaidOrders.length) throw new BadRequestException('No completed orders available for payout');

    const payouts = unpaidOrders.map((order: { id: string; total_price: number }) => {
      const gross = Number(order.total_price);
      const commission = Math.round(gross * COMMISSION_RATE);
      return {
        provider_id: provider.id,
        order_id: order.id,
        gross_amount: gross,
        commission_rate: COMMISSION_RATE,
        commission_amount: commission,
        net_amount: gross - commission,
        status: 'pending',
      };
    });

    const { data: created, error: insertErr } = await this.supabase.client
      .from('provider_payouts')
      .insert(payouts)
      .select(PAYOUT_COLUMNS);
    if (insertErr) throw new BadRequestException(insertErr.message);

    return created;
  }
}
