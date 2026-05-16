import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { PAYMENT_COLUMNS } from '../../../common/constants/columns';
import { paginate, type PaginationParams } from '../../../common/utils/pagination';
import { AdminActionLogService } from '../_shared/admin-action-log.service';

interface PaymentRow {
  id: string;
  order_id: string;
  method: string;
  amount: number;
  status: string;
  refund_amount?: number | null;
}

@Injectable()
export class AdminPaymentsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly actionLog: AdminActionLogService,
  ) {}

  // ─────────────────────────── Manual refund (Gap #4) ───────────────────────────

  /**
   * Record a manual refund — admin already wired funds back to the owner
   * out-of-band (e.g. for VietQR where we can't auto-refund). Creates an
   * audit row, bumps payments.refund_amount, flips status to refunded /
   * partially_refunded.
   */
  async recordManualRefund(
    adminId: string,
    paymentId: string,
    body: { amount: number; reason: string; proof_url?: string; note?: string },
  ) {
    const { data: paymentData, error } = await this.supabase.client
      .from('payments')
      .select(PAYMENT_COLUMNS)
      .eq('id', paymentId)
      .single();
    if (error || !paymentData) throw new NotFoundException('Payment not found');
    const payment = paymentData as PaymentRow;

    if (!['completed', 'partially_refunded'].includes(payment.status)) {
      throw new BadRequestException(`Cannot refund payment in status '${payment.status}'`);
    }

    const alreadyRefunded = Number(payment.refund_amount) || 0;
    const remaining = Number(payment.amount) - alreadyRefunded;
    if (body.amount > remaining) {
      throw new BadRequestException(`Refund amount exceeds remaining refundable (${remaining})`);
    }

    const newRefundTotal = alreadyRefunded + body.amount;
    const newStatus = newRefundTotal >= Number(payment.amount) ? 'refunded' : 'partially_refunded';

    // Refund row — marked completed because admin already sent funds.
    const { data: refund, error: refErr } = await this.supabase.client
      .from('refunds')
      .insert({
        order_id: payment.order_id,
        payment_id: payment.id,
        amount: body.amount,
        type: newRefundTotal >= Number(payment.amount) ? 'full' : 'partial',
        reason: body.reason,
        status: 'completed',
        processed_by: adminId,
        gateway_response: {
          manual: true,
          proof_url: body.proof_url ?? null,
          admin_note: body.note ?? null,
          recorded_at: new Date().toISOString(),
        },
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (refErr) throw new BadRequestException(refErr.message);

    const now = new Date().toISOString();
    await this.supabase.client
      .from('payments')
      .update({
        refund_amount: newRefundTotal,
        status: newStatus,
        refunded_at: now,
        updated_at: now,
      })
      .eq('id', paymentId);

    await this.actionLog.log(adminId, 'manual_refund', 'payment', paymentId, {
      amount: body.amount,
      reason: body.reason,
      proof_url: body.proof_url,
      new_status: newStatus,
    });

    return refund;
  }

  // ─────────────────────────── Reconciliation (Gap #3) ───────────────────────────

  /**
   * List bank_transactions that haven't been matched to a payment yet.
   * These are incoming transfers SePay caught but our matcher couldn't link
   * to a pending VietQR payment (usually: wrong memo, missing order code,
   * amount off, or owner paid the wrong account).
   */
  async listUnmatched(params: PaginationParams) {
    const { page = 1, limit = 20 } = params;
    const from = (page - 1) * limit;

    const { data, error, count } = await this.supabase.client
      .from('bank_transactions')
      .select('*', { count: 'exact' })
      .is('matched_payment_id', null)
      .eq('transfer_type', 'in')
      .order('occurred_at', { ascending: false })
      .range(from, from + limit - 1);
    if (error) throw new BadRequestException(error.message);

    return paginate(data ?? [], count ?? 0, { page, limit });
  }

  /**
   * Manually link a bank transaction to a pending VietQR payment. Used when
   * the owner ghi sai nội dung but admin can identify the order from amount +
   * timing + bank account number. Runs the same state machine as the
   * auto-match: payment → completed, order → pending, history written.
   */
  async matchManually(adminId: string, bankTxId: string, body: { payment_id: string }) {
    const { data: bankTxData, error: btErr } = await this.supabase.client
      .from('bank_transactions')
      .select('*')
      .eq('id', bankTxId)
      .single();
    if (btErr || !bankTxData) throw new NotFoundException('Bank transaction not found');
    const bankTx = bankTxData as {
      id: string;
      amount: number;
      account_number: string;
      matched_payment_id: string | null;
    };
    if (bankTx.matched_payment_id) {
      throw new BadRequestException('Bank transaction already matched');
    }

    const { data: paymentData, error: payErr } = await this.supabase.client
      .from('payments')
      .select(`${PAYMENT_COLUMNS}, orders(id, order_number, owner_id, status)`)
      .eq('id', body.payment_id)
      .single();
    if (payErr || !paymentData) throw new NotFoundException('Payment not found');

    type OrderRow = { id: string; order_number: string; owner_id: string; status: string };
    const payment = paymentData as unknown as PaymentRow & { orders: OrderRow[] | OrderRow | null };
    const order = Array.isArray(payment.orders) ? payment.orders[0] : payment.orders;
    if (!order) throw new NotFoundException('Order for payment not found');

    if (payment.method !== 'vietqr') {
      throw new BadRequestException('Manual match only supports VietQR payments');
    }
    if (payment.status !== 'pending') {
      throw new BadRequestException(`Payment is in status '${payment.status}', cannot match`);
    }

    const now = new Date().toISOString();
    const deadline = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

    // Flip payment → completed
    await this.supabase.client
      .from('payments')
      .update({ status: 'completed', paid_at: now, transaction_ref: `MANUAL-MATCH-${bankTxId.slice(0, 8)}` })
      .eq('id', payment.id)
      .eq('status', 'pending');

    // Flip order → pending (if still in pending_payment)
    if (order.status === 'pending_payment') {
      await this.supabase.client
        .from('orders')
        .update({ status: 'pending', provider_response_deadline: deadline, updated_at: now })
        .eq('id', order.id)
        .eq('status', 'pending_payment');

      await this.supabase.client.from('order_status_history').insert({
        order_id: order.id,
        status: 'pending',
        actor_id: adminId,
        actor_type: 'admin',
        note: `Payment matched manually by admin (bank tx ${bankTxId}).`,
      });
    }

    // Link the bank tx
    await this.supabase.client
      .from('bank_transactions')
      .update({ matched_payment_id: payment.id, matched_at: now })
      .eq('id', bankTxId);

    await this.actionLog.log(adminId, 'match_bank_transaction', 'payment', payment.id, {
      bank_transaction_id: bankTxId,
      order_number: order.order_number,
    });

    return { matched: true, payment_id: payment.id, order_id: order.id };
  }
}
