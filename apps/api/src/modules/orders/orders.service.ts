import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ORDER_COLUMNS, ORDER_LIST_COLUMNS, ORDER_HISTORY_COLUMNS, CHECK_IN_PHOTO_COLUMNS } from '../../common/constants/columns';
import { paginate, type PaginationParams } from '../../common/utils/pagination';
import type { CreateOrderInput, CalculatePriceInput, UpdateOrderStatusInput, CancelOrderInput, DeclineOrderInput, CheckOutOrderInput } from '@petzone/validators';

const STATUS_TRANSITIONS: Record<string, { next: string; allowed_actors: string[] }[]> = {
  pending_payment: [{ next: 'pending', allowed_actors: ['owner'] }],
  pending: [{ next: 'confirmed', allowed_actors: ['provider'] }],
  confirmed: [{ next: 'checked_in', allowed_actors: ['provider'] }],
  checked_in: [{ next: 'in_progress', allowed_actors: ['provider'] }],
  in_progress: [{ next: 'check_out', allowed_actors: ['provider'] }],
  check_out: [{ next: 'completed', allowed_actors: ['owner', 'provider'] }],
};

const CANCELLABLE_STATUSES = ['pending_payment', 'pending', 'confirmed'];

interface OrderWithProvider {
  id: string;
  owner_id: string;
  provider_id: string;
  status: string;
  check_in_date: string;
  total_price: number;
  cancellation_policy: string;
  providers?: { id: string; user_id: string }[] | { id: string; user_id: string } | null;
  [key: string]: unknown;
}

@Injectable()
export class OrdersService {
  constructor(private readonly supabase: SupabaseService) {}

  async calculatePrice(body: CalculatePriceInput) {
    const { data: roomType, error: rtErr } = await this.supabase.client
      .from('room_types')
      .select('id, price_per_night, provider_id')
      .eq('id', body.room_type_id)
      .single();
    if (rtErr || !roomType) throw new NotFoundException('Room type not found');

    const addOns: { id: string; name: string; price: number; price_type: string }[] = [];
    if (body.add_on_ids?.length) {
      const { data, error } = await this.supabase.client
        .from('add_on_services')
        .select('id, name, price, price_type')
        .in('id', body.add_on_ids);
      if (error) throw new BadRequestException('Failed to fetch add-on services');
      addOns.push(...(data || []));
    }

    const checkIn = new Date(body.check_in_date);
    const checkOut = new Date(body.check_out_date);
    const numNights = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    if (numNights < 1) throw new BadRequestException('Check-out must be after check-in');

    const roomTotal = roomType.price_per_night * numNights;
    const addOnBreakdown = addOns.map((a) => ({
      id: a.id,
      name: a.name,
      price: a.price,
      price_type: a.price_type,
      subtotal: a.price_type === 'per_night' ? a.price * numNights : a.price,
    }));
    const addOnTotal = addOnBreakdown.reduce((sum, a) => sum + a.subtotal, 0);
    const totalPrice = roomTotal + addOnTotal;

    return {
      room: { price_per_night: roomType.price_per_night, nights: numNights, subtotal: roomTotal },
      add_ons: addOnBreakdown,
      total: totalPrice,
    };
  }

  async create(userId: string, body: CreateOrderInput) {
    const [roomResult, providerResult] = await Promise.all([
      this.supabase.client
        .from('room_types')
        .select('id, price_per_night, provider_id')
        .eq('id', body.room_type_id)
        .single(),
      this.supabase.client
        .from('providers')
        .select('cancellation_policy')
        .eq('id', body.provider_id)
        .single(),
    ]);

    const { data: roomType, error: rtErr } = roomResult;
    if (rtErr || !roomType) throw new NotFoundException('Room type not found');

    // Check room availability — prevent double-booking
    const activeStatuses = ['pending_payment', 'pending', 'confirmed', 'checked_in', 'in_progress'];
    const { count: overlapping } = await this.supabase.client
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('room_type_id', body.room_type_id)
      .in('status', activeStatuses)
      .lt('check_in_date', body.check_out_date)
      .gt('check_out_date', body.check_in_date);
    if (overlapping && overlapping > 0) {
      // Check against room capacity via availability slots
      const { data: availability } = await this.supabase.client
        .from('room_availability')
        .select('date, available_slots')
        .eq('room_type_id', body.room_type_id)
        .gte('date', body.check_in_date)
        .lt('date', body.check_out_date)
        .eq('is_blocked', false);
      const hasBlockedDate = availability?.some((a: { available_slots: number }) => a.available_slots < 1);
      if (hasBlockedDate) throw new BadRequestException('Room is not available for the selected dates');
    }

    const addOns: { id: string; name: string; price: number; price_type: string }[] = [];
    if (body.add_on_ids?.length) {
      const { data, error } = await this.supabase.client
        .from('add_on_services')
        .select('id, name, price, price_type')
        .in('id', body.add_on_ids);
      if (error) throw new BadRequestException('Failed to fetch add-on services');
      addOns.push(...(data || []));
    }

    const checkIn = new Date(body.check_in_date);
    const checkOut = new Date(body.check_out_date);
    const numNights = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    if (numNights < 1) throw new BadRequestException('Check-out must be after check-in');

    const roomTotal = roomType.price_per_night * numNights;
    const addOnBreakdown = addOns.map((a) => ({
      id: a.id,
      name: a.name,
      price: a.price,
      price_type: a.price_type,
      subtotal: a.price_type === 'per_night' ? a.price * numNights : a.price,
    }));
    const addOnTotal = addOnBreakdown.reduce((sum, a) => sum + a.subtotal, 0);
    const totalPrice = roomTotal + addOnTotal;

    const priceBreakdown = {
      room: { price_per_night: roomType.price_per_night, nights: numNights, subtotal: roomTotal },
      add_ons: addOnBreakdown,
      total: totalPrice,
    };

    const { data: provider } = providerResult;

    const { data: order, error: orderErr } = await this.supabase.client
      .from('orders')
      .insert({
        owner_id: userId,
        provider_id: body.provider_id,
        room_type_id: body.room_type_id,
        status: 'pending_payment',
        check_in_date: body.check_in_date,
        check_out_date: body.check_out_date,
        num_nights: numNights,
        pet_ids: body.pet_ids,
        add_on_ids: body.add_on_ids || [],
        special_notes: body.special_notes || null,
        daily_status_report: body.daily_status_report ?? true,
        price_breakdown: priceBreakdown,
        total_price: totalPrice,
        cancellation_policy: provider?.cancellation_policy || 'flexible',
      })
      .select(ORDER_COLUMNS)
      .single();
    if (orderErr) throw new BadRequestException(orderErr.message);

    await this.supabase.client.from('order_status_history').insert({
      order_id: order.id,
      status: 'pending_payment',
      actor_id: userId,
      actor_type: 'owner',
    });

    return order;
  }

  async findAll(userId: string, params: PaginationParams) {
    const { page = 1, limit = 20 } = params;
    const from = (page - 1) * limit;

    const { data: providerRows } = await this.supabase.client
      .from('providers')
      .select('id')
      .eq('user_id', userId);
    const providerIds = (providerRows || []).map((p: { id: string }) => p.id);

    let query = this.supabase.client
      .from('orders')
      .select(`${ORDER_LIST_COLUMNS}, providers(id, business_name)`, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (providerIds.length) {
      const providerFilter = providerIds.map((id: string) => `provider_id.eq.${id}`).join(',');
      query = query.or(`owner_id.eq.${userId},${providerFilter}`);
    } else {
      query = query.eq('owner_id', userId);
    }

    const { data, error, count } = await query.range(from, from + limit - 1);
    if (error) throw new BadRequestException(error.message);
    return paginate(data ?? [], count ?? 0, { page, limit });
  }

  async findOne(userId: string, id: string) {
    const { data: order, error } = await this.supabase.client
      .from('orders')
      .select(`${ORDER_COLUMNS}, room_types(*), providers(id, business_name, user_id)`)
      .eq('id', id)
      .single();
    if (error || !order) throw new NotFoundException('Order not found');

    await this.verifyAccess(userId, order as unknown as OrderWithProvider);
    return order;
  }

  async accept(userId: string, id: string) {
    const order = await this.getOrderForProvider(userId, id);
    if (order.status !== 'pending') throw new BadRequestException('Can only accept orders in pending status');

    const { data, error } = await this.supabase.client
      .from('orders')
      .update({ status: 'confirmed', provider_response_deadline: null, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(ORDER_COLUMNS)
      .single();
    if (error) throw new BadRequestException(error.message);

    await this.supabase.client.from('order_status_history').insert({
      order_id: id, status: 'confirmed', actor_id: userId, actor_type: 'provider',
    });

    return data;
  }

  async decline(userId: string, id: string, body: DeclineOrderInput) {
    const order = await this.getOrderForProvider(userId, id);
    if (order.status !== 'pending') throw new BadRequestException('Can only decline orders in pending status');

    const { data, error } = await this.supabase.client
      .from('orders')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: 'provider',
        cancellation_reason: body.reason,
        refund_amount: Number(order.total_price) || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(ORDER_COLUMNS)
      .single();
    if (error) throw new BadRequestException(error.message);

    await this.supabase.client.from('order_status_history').insert({
      order_id: id, status: 'cancelled', actor_id: userId, actor_type: 'provider', note: body.reason,
    });

    return data;
  }

  async confirmReceive(userId: string, id: string) {
    const { data: order, error: fetchErr } = await this.supabase.client
      .from('orders')
      .select(`${ORDER_COLUMNS}, providers(id, user_id)`)
      .eq('id', id)
      .single();
    if (fetchErr || !order) throw new NotFoundException('Order not found');

    const typedOrder = order as unknown as OrderWithProvider;
    if (typedOrder.owner_id !== userId) throw new ForbiddenException('Only the owner can confirm receipt');
    if (typedOrder.status !== 'check_out') throw new BadRequestException('Can only confirm receipt for orders in check_out status');

    const { data, error } = await this.supabase.client
      .from('orders')
      .update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(ORDER_COLUMNS)
      .single();
    if (error) throw new BadRequestException(error.message);

    await this.supabase.client.from('order_status_history').insert({
      order_id: id, status: 'completed', actor_id: userId, actor_type: 'owner',
    });

    return data;
  }

  async checkOut(userId: string, id: string, body: CheckOutOrderInput) {
    const order = await this.getOrderForProvider(userId, id);
    if (order.status !== 'in_progress') throw new BadRequestException('Can only check out orders in in_progress status');

    // Save check-out photos
    const provider = await this.supabase.client
      .from('providers').select('id').eq('user_id', userId).single();
    if (provider.error || !provider.data) throw new ForbiddenException('Not a provider');

    for (const photoUrl of body.photos) {
      await this.supabase.client.from('check_in_photos').insert({
        order_id: id,
        uploaded_by: userId,
        role: 'provider',
        handoff_point: 'store_to_owner',
        photo_url: photoUrl,
        timestamp: new Date().toISOString(),
        has_concern: false,
      });
    }

    const { data, error } = await this.supabase.client
      .from('orders')
      .update({ status: 'check_out', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(ORDER_COLUMNS)
      .single();
    if (error) throw new BadRequestException(error.message);

    await this.supabase.client.from('order_status_history').insert({
      order_id: id, status: 'check_out', actor_id: userId, actor_type: 'provider', note: body.note || null,
    });

    return data;
  }

  async updateStatus(userId: string, id: string, body: UpdateOrderStatusInput) {
    const { data: order, error } = await this.supabase.client
      .from('orders')
      .select(`${ORDER_COLUMNS}, providers(id, user_id)`)
      .eq('id', id)
      .single();
    if (error || !order) throw new NotFoundException('Order not found');

    const typedOrder = order as unknown as OrderWithProvider;
    const actorType = await this.getActorType(userId, typedOrder);
    const transitions = STATUS_TRANSITIONS[typedOrder.status];
    if (!transitions) throw new BadRequestException(`Cannot transition from status '${typedOrder.status}'`);

    const transition = transitions.find((t) => t.next === body.status);
    if (!transition) throw new BadRequestException(`Invalid status transition: ${typedOrder.status} → ${body.status}`);
    if (!transition.allowed_actors.includes(actorType))
      throw new ForbiddenException(`Role '${actorType}' cannot perform this transition`);

    const updates: Record<string, unknown> = { status: body.status, updated_at: new Date().toISOString() };
    if (body.status === 'confirmed') updates.provider_response_deadline = null;
    if (body.status === 'completed') updates.completed_at = new Date().toISOString();

    const { data: updated, error: updateErr } = await this.supabase.client
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select(ORDER_COLUMNS)
      .single();
    if (updateErr) throw new BadRequestException(updateErr.message);

    await this.supabase.client.from('order_status_history').insert({
      order_id: id,
      status: body.status,
      actor_id: userId,
      actor_type: actorType,
      note: body.note || null,
    });

    return updated;
  }

  async cancel(userId: string, id: string, body: CancelOrderInput) {
    const { data: order, error } = await this.supabase.client
      .from('orders')
      .select(`${ORDER_COLUMNS}, providers(id, user_id)`)
      .eq('id', id)
      .single();
    if (error || !order) throw new NotFoundException('Order not found');

    const typedOrder = order as unknown as OrderWithProvider;
    await this.verifyAccess(userId, typedOrder);

    if (!CANCELLABLE_STATUSES.includes(typedOrder.status))
      throw new BadRequestException(`Cannot cancel order in status '${typedOrder.status}'`);

    const cancelledBy = typedOrder.owner_id === userId ? 'owner' : 'provider';
    const refundAmount = this.calculateRefund(typedOrder);

    const { data: updated, error: updateErr } = await this.supabase.client
      .from('orders')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: cancelledBy,
        cancellation_reason: body.reason,
        refund_amount: refundAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(ORDER_COLUMNS)
      .single();
    if (updateErr) throw new BadRequestException(updateErr.message);

    await this.supabase.client.from('order_status_history').insert({
      order_id: id,
      status: 'cancelled',
      actor_id: userId,
      actor_type: cancelledBy,
      note: body.reason,
    });

    return updated;
  }

  async getHistory(userId: string, id: string) {
    const { data: order, error: orderErr } = await this.supabase.client
      .from('orders')
      .select(`${ORDER_COLUMNS}, providers(id, user_id)`)
      .eq('id', id)
      .single();
    if (orderErr || !order) throw new NotFoundException('Order not found');

    await this.verifyAccess(userId, order as unknown as OrderWithProvider);

    const { data, error } = await this.supabase.client
      .from('order_status_history')
      .select(ORDER_HISTORY_COLUMNS)
      .eq('order_id', id)
      .order('created_at', { ascending: true });
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  private async getOrderForProvider(userId: string, orderId: string): Promise<OrderWithProvider> {
    const { data: order, error } = await this.supabase.client
      .from('orders')
      .select(`${ORDER_COLUMNS}, providers(id, user_id)`)
      .eq('id', orderId)
      .single();
    if (error || !order) throw new NotFoundException('Order not found');

    const typedOrder = order as unknown as OrderWithProvider;
    if (this.getProviderUserId(typedOrder) !== userId) throw new ForbiddenException('Only the provider can perform this action');
    return typedOrder;
  }

  private getProviderUserId(order: OrderWithProvider): string | undefined {
    const p = order.providers;
    if (!p) return undefined;
    if (Array.isArray(p)) return p[0]?.user_id;
    return p.user_id;
  }

  private verifyAccess(userId: string, order: OrderWithProvider): void {
    const isOwner = order.owner_id === userId;
    const isProvider = this.getProviderUserId(order) === userId;
    if (!isOwner && !isProvider) throw new ForbiddenException('No access to this order');
  }

  private getActorType(userId: string, order: OrderWithProvider): string {
    if (order.owner_id === userId) return 'owner';
    if (this.getProviderUserId(order) === userId) return 'provider';
    throw new ForbiddenException('No access to this order');
  }

  private calculateRefund(order: OrderWithProvider): number {
    if (order.status === 'pending_payment') return 0;

    const now = new Date();
    const checkIn = new Date(order.check_in_date);
    const hoursUntilCheckIn = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);
    const total = Number(order.total_price) || 0;
    const policy = order.cancellation_policy || 'flexible';

    if (policy === 'flexible') {
      return hoursUntilCheckIn > 24 ? total : Math.round(total * 0.5);
    }
    if (policy === 'moderate') {
      if (hoursUntilCheckIn > 48) return total;
      if (hoursUntilCheckIn > 24) return Math.round(total * 0.5);
      return 0;
    }
    // strict
    if (hoursUntilCheckIn > 72) return total;
    if (hoursUntilCheckIn > 48) return Math.round(total * 0.5);
    return 0;
  }
}
