import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

const STATUS_TRANSITIONS: Record<string, { next: string; allowed_actors: string[] }[]> = {
  pending_payment: [{ next: 'pending', allowed_actors: ['owner'] }],
  pending: [{ next: 'confirmed', allowed_actors: ['provider'] }],
  confirmed: [{ next: 'checked_in', allowed_actors: ['provider'] }],
  checked_in: [{ next: 'in_progress', allowed_actors: ['provider'] }],
  in_progress: [{ next: 'check_out', allowed_actors: ['provider'] }],
  check_out: [{ next: 'completed', allowed_actors: ['owner', 'provider'] }],
};

const CANCELLABLE_STATUSES = ['pending_payment', 'pending', 'confirmed'];

@Injectable()
export class OrdersService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(userId: string, body: any) {
    const { data: roomType, error: rtErr } = await this.supabase.client
      .from('room_types')
      .select('id, price_per_night, provider_id')
      .eq('id', body.room_type_id)
      .single();
    if (rtErr || !roomType) throw new NotFoundException('Room type not found');

    const addOns: any[] = [];
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
    const addOnTotal = addOnBreakdown.reduce((sum: number, a: any) => sum + a.subtotal, 0);
    const totalPrice = roomTotal + addOnTotal;

    const priceBreakdown = {
      room: { price_per_night: roomType.price_per_night, nights: numNights, subtotal: roomTotal },
      add_ons: addOnBreakdown,
      total: totalPrice,
    };

    const { data: provider } = await this.supabase.client
      .from('providers')
      .select('cancellation_policy')
      .eq('id', body.provider_id)
      .single();

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
      .select()
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

  async findAll(userId: string) {
    const { data: providerRows } = await this.supabase.client
      .from('providers')
      .select('id')
      .eq('user_id', userId);
    const providerIds = (providerRows || []).map((p: any) => p.id);

    let query = this.supabase.client
      .from('orders')
      .select('*, providers(id, business_name)')
      .order('created_at', { ascending: false });

    if (providerIds.length) {
      query = query.or(`owner_id.eq.${userId},provider_id.in.(${providerIds.join(',')})`);
    } else {
      query = query.eq('owner_id', userId);
    }

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async findOne(userId: string, id: string) {
    const { data: order, error } = await this.supabase.client
      .from('orders')
      .select('*, room_types(*), providers(id, business_name, user_id)')
      .eq('id', id)
      .single();
    if (error || !order) throw new NotFoundException('Order not found');

    await this.verifyAccess(userId, order);
    return order;
  }

  async updateStatus(userId: string, id: string, body: any) {
    const { data: order, error } = await this.supabase.client
      .from('orders')
      .select('*, providers(id, user_id)')
      .eq('id', id)
      .single();
    if (error || !order) throw new NotFoundException('Order not found');

    const actorType = await this.getActorType(userId, order);
    const transitions = STATUS_TRANSITIONS[order.status];
    if (!transitions) throw new BadRequestException(`Cannot transition from status '${order.status}'`);

    const transition = transitions.find((t) => t.next === body.status);
    if (!transition) throw new BadRequestException(`Invalid status transition: ${order.status} → ${body.status}`);
    if (!transition.allowed_actors.includes(actorType))
      throw new ForbiddenException(`Role '${actorType}' cannot perform this transition`);

    const updates: any = { status: body.status, updated_at: new Date().toISOString() };
    if (body.status === 'confirmed') updates.provider_response_deadline = null;
    if (body.status === 'completed') updates.completed_at = new Date().toISOString();

    const { data: updated, error: updateErr } = await this.supabase.client
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
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

  async cancel(userId: string, id: string, body: any) {
    const { data: order, error } = await this.supabase.client
      .from('orders')
      .select('*, providers(id, user_id)')
      .eq('id', id)
      .single();
    if (error || !order) throw new NotFoundException('Order not found');

    await this.verifyAccess(userId, order);

    if (!CANCELLABLE_STATUSES.includes(order.status))
      throw new BadRequestException(`Cannot cancel order in status '${order.status}'`);

    const cancelledBy = order.owner_id === userId ? 'owner' : 'provider';
    const refundAmount = this.calculateRefund(order);

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
      .select()
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
      .select('*, providers(id, user_id)')
      .eq('id', id)
      .single();
    if (orderErr || !order) throw new NotFoundException('Order not found');

    await this.verifyAccess(userId, order);

    const { data, error } = await this.supabase.client
      .from('order_status_history')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: true });
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  private async verifyAccess(userId: string, order: any) {
    const isOwner = order.owner_id === userId;
    const isProvider = order.providers?.user_id === userId;
    if (!isOwner && !isProvider) throw new ForbiddenException('No access to this order');
  }

  private async getActorType(userId: string, order: any): Promise<string> {
    if (order.owner_id === userId) return 'owner';
    if (order.providers?.user_id === userId) return 'provider';
    throw new ForbiddenException('No access to this order');
  }

  private calculateRefund(order: any): number {
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
