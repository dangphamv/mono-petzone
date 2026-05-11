import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { AdminCreateOrderInput, AdminMessageInput } from '@petzone/validators';
import { SupabaseService } from '../../supabase/supabase.service';
import { OrdersService } from '../../orders/orders.service';
import { ORDER_COLUMNS, ORDER_LIST_COLUMNS } from '../../../common/constants/columns';
import { paginate, type PaginationParams } from '../../../common/utils/pagination';
import { AdminActionLogService } from '../_shared/admin-action-log.service';

const CANCELLABLE_STATUSES = ['pending_payment', 'pending', 'confirmed'];

@Injectable()
export class AdminOrdersService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly ordersService: OrdersService,
    private readonly actionLog: AdminActionLogService,
  ) {}

  async getOrders(params: PaginationParams & { search?: string; status?: string }) {
    const { page = 1, limit = 20, search, status } = params;
    const from = (page - 1) * limit;

    let providerIds: string[] = [];
    let ownerIds: string[] = [];

    if (search) {
      const escaped = search.replace(/[,()]/g, ' ').trim();
      if (escaped) {
        const [providersRes, ownersRes] = await Promise.all([
          this.supabase.client.from('providers').select('id').ilike('business_name', `%${escaped}%`),
          this.supabase.client.from('users').select('id').or(`full_name.ilike.%${escaped}%,email.ilike.%${escaped}%,phone.ilike.%${escaped}%`),
        ]);
        providerIds = (providersRes.data ?? []).map((p) => p.id as string);
        ownerIds = (ownersRes.data ?? []).map((u) => u.id as string);
      }
    }

    let query = this.supabase.client
      .from('orders')
      .select(`${ORDER_LIST_COLUMNS}, providers(id, business_name)`, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) {
      const values = status.split(',').map((s) => s.trim()).filter(Boolean);
      query = values.length > 1 ? query.in('status', values) : query.eq('status', values[0] ?? status);
    }

    if (search) {
      const escaped = search.replace(/[,()]/g, ' ').trim();
      if (escaped) {
        const orFilters: string[] = [
          `order_number.ilike.%${escaped}%`,
          `special_notes.ilike.%${escaped}%`,
          `cancellation_reason.ilike.%${escaped}%`,
        ];
        if (providerIds.length) orFilters.push(`provider_id.in.(${providerIds.join(',')})`);
        if (ownerIds.length) orFilters.push(`owner_id.in.(${ownerIds.join(',')})`);
        query = query.or(orFilters.join(','));
      }
    }

    const { data, error, count } = await query.range(from, from + limit - 1);
    if (error) throw new BadRequestException(error.message);

    return paginate(data ?? [], count ?? 0, { page, limit });
  }

  async getOrderDetail(id: string) {
    const { data: order, error } = await this.supabase.client
      .from('orders')
      .select(`${ORDER_COLUMNS}, providers(id, business_name, address, phone), room_types(id, name, capacity, price_per_night), users!orders_owner_id_fkey(id, email, full_name, phone, avatar_url)`)
      .eq('id', id)
      .single();
    if (error || !order) {
      if (error?.code === 'PGRST116') throw new NotFoundException('Order not found');
      throw new BadRequestException(error?.message || 'Failed to load order');
    }

    const petIds = Array.isArray(order.pet_ids) ? (order.pet_ids as string[]) : [];
    const addOnIds = Array.isArray(order.add_on_ids) ? (order.add_on_ids as string[]) : [];

    const [petsRes, addOnsRes] = await Promise.all([
      petIds.length
        ? this.supabase.client.from('pets').select('id, name, species, breed, weight_kg, photos').in('id', petIds)
        : Promise.resolve({ data: [] as Record<string, unknown>[] }),
      addOnIds.length
        ? this.supabase.client.from('add_on_services').select('id, name, price, price_type').in('id', addOnIds)
        : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    ]);

    return {
      ...order,
      pets: petsRes.data ?? [],
      add_ons: addOnsRes.data ?? [],
    };
  }

  async createOrder(adminId: string, body: AdminCreateOrderInput) {
    const { owner_id, ...orderBody } = body;
    const order = await this.ordersService.create(owner_id, orderBody);
    await this.actionLog.log(adminId, 'create_order', 'order', order.id, {
      owner_id,
      provider_id: body.provider_id,
      total_price: order.total_price,
    });
    return order;
  }

  async cancelOrder(adminId: string, id: string, reason: string) {
    const { data: order, error } = await this.supabase.client
      .from('orders')
      .select('id, status, total_price')
      .eq('id', id)
      .single();
    if (error || !order) throw new NotFoundException('Order not found');
    if (!CANCELLABLE_STATUSES.includes(order.status as string))
      throw new BadRequestException(`Cannot cancel order in status '${order.status}'`);

    const { data: updated, error: updateErr } = await this.supabase.client
      .from('orders')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: 'admin',
        cancellation_reason: reason,
        refund_amount: Number(order.total_price) || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(ORDER_LIST_COLUMNS)
      .single();
    if (updateErr) throw new BadRequestException(updateErr.message);

    await this.supabase.client.from('order_status_history').insert({
      order_id: id,
      status: 'cancelled',
      actor_id: adminId,
      actor_type: 'admin',
      note: reason,
    });

    await this.actionLog.log(adminId, 'cancel_order', 'order', id, { reason });

    return updated;
  }

  async sendMessage(adminId: string, orderId: string, body: AdminMessageInput) {
    const { data: order, error } = await this.supabase.client
      .from('orders')
      .select('id, owner_id, provider_id')
      .eq('id', orderId)
      .single();
    if (error || !order) throw new NotFoundException('Order not found');

    const notifications = [
      { user_id: order.owner_id, type: 'admin_message', title: 'Message from Admin', body: body.message, data: { order_id: orderId } },
      { user_id: order.provider_id, type: 'admin_message', title: 'Message from Admin', body: body.message, data: { order_id: orderId } },
    ].filter((n) => n.user_id);

    if (notifications.length) {
      await this.supabase.client.from('notifications').insert(notifications);
    }

    await this.actionLog.log(adminId, 'send_message', 'order', orderId, {
      message: body.message,
      owner_id: order.owner_id,
      provider_id: order.provider_id,
    });

    return { message: 'Mediation message sent to both parties' };
  }

  async exportOrders() {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select(`${ORDER_LIST_COLUMNS}, providers(id, business_name)`)
      .order('created_at', { ascending: false })
      .limit(10000);
    if (error) throw new BadRequestException('Failed to export orders');

    return data || [];
  }
}
