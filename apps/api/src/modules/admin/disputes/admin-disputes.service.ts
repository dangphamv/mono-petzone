import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { ResolveDisputeInput, AdminCreateDisputeInput } from '@petzone/validators';
import { SupabaseService } from '../../supabase/supabase.service';
import { DISPUTE_COLUMNS } from '../../../common/constants/columns';
import { paginate, type PaginationParams } from '../../../common/utils/pagination';
import { AdminActionLogService } from '../_shared/admin-action-log.service';

@Injectable()
export class AdminDisputesService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly actionLog: AdminActionLogService,
  ) {}

  async getDisputes(params: PaginationParams) {
    const { page = 1, limit = 20 } = params;
    const from = (page - 1) * limit;

    const { data, error, count } = await this.supabase.client
      .from('disputes')
      .select(DISPUTE_COLUMNS, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);
    if (error) throw new BadRequestException(error.message);

    return paginate(data ?? [], count ?? 0, { page, limit });
  }

  async createDispute(adminId: string, body: AdminCreateDisputeInput) {
    const { data: order, error: orderErr } = await this.supabase.client
      .from('orders')
      .select('id, owner_id, provider_id, providers(user_id)')
      .eq('id', body.order_id)
      .single();
    if (orderErr || !order) throw new NotFoundException('Order not found');

    let openedByUserId: string;
    if (body.opened_by_role === 'owner') {
      openedByUserId = order.owner_id as string;
    } else {
      const provider = (order as Record<string, unknown>).providers as { user_id: string } | { user_id: string }[] | null;
      const userId = Array.isArray(provider) ? provider[0]?.user_id : provider?.user_id;
      if (!userId) throw new BadRequestException('Provider user not found for this order');
      openedByUserId = userId;
    }

    const { data: dispute, error } = await this.supabase.client
      .from('disputes')
      .insert({
        order_id: body.order_id,
        opened_by: openedByUserId,
        opened_by_role: body.opened_by_role,
        description: body.description,
        evidence_photos: body.evidence_photos,
        status: 'open',
      })
      .select(DISPUTE_COLUMNS)
      .single();
    if (error || !dispute) throw new BadRequestException(error?.message || 'Failed to create dispute');

    await this.actionLog.log(adminId, 'create_dispute', 'dispute', dispute.id as string, {
      order_id: body.order_id,
      opened_by_role: body.opened_by_role,
    });

    return dispute;
  }

  async resolveDispute(userId: string, id: string, body: ResolveDisputeInput) {
    const { data: existingDispute, error: fetchErr } = await this.supabase.client
      .from('disputes')
      .select(`${DISPUTE_COLUMNS}, orders(id, total_price)`)
      .eq('id', id)
      .single();
    if (fetchErr || !existingDispute) throw new NotFoundException('Dispute not found');
    if (existingDispute.status === 'resolved')
      throw new BadRequestException('Dispute is already resolved');

    if (body.refund_amount != null) {
      const order = (existingDispute as Record<string, unknown>).orders as { total_price: number } | { total_price: number }[] | null;
      const totalPrice = Array.isArray(order) ? order[0]?.total_price : order?.total_price;
      if (totalPrice != null && body.refund_amount > Number(totalPrice))
        throw new BadRequestException(`Refund amount cannot exceed order total (${totalPrice})`);
    }

    const { data: dispute, error: disputeErr } = await this.supabase.client
      .from('disputes')
      .update({
        resolution: body.resolution,
        resolved_by: userId,
        resolved_at: new Date().toISOString(),
        status: 'resolved',
      })
      .eq('id', id)
      .select(DISPUTE_COLUMNS)
      .single();
    if (disputeErr || !dispute) throw new BadRequestException('Failed to resolve dispute');

    if (body.refund_amount != null) {
      await this.supabase.client
        .from('orders')
        .update({ refund_amount: body.refund_amount })
        .eq('id', dispute.order_id);
    }

    await this.actionLog.log(userId, 'resolve_dispute', 'dispute', id, {
      resolution: body.resolution,
      refund_amount: body.refund_amount,
    });

    return dispute;
  }
}
