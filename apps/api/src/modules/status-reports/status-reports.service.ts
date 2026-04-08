import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class StatusReportsService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(userId: string, orderId: string, body: any) {
    const { data: provider, error: provErr } = await this.supabase.client
      .from('providers')
      .select('id')
      .eq('user_id', userId)
      .single();
    if (provErr || !provider) throw new ForbiddenException('Only providers can create status reports');

    const { data: order, error: orderErr } = await this.supabase.client
      .from('orders')
      .select('id, provider_id')
      .eq('id', orderId)
      .single();
    if (orderErr || !order) throw new NotFoundException('Order not found');
    if (order.provider_id !== provider.id) throw new ForbiddenException('Not your order');

    const { data, error } = await this.supabase.client
      .from('status_reports')
      .insert({
        order_id: orderId,
        provider_id: provider.id,
        photos: body.photos || [],
        feeding_status: body.appetite === 'poor' ? 'eating_less' : 'normal',
        activity_summary: body.content,
        note: body.mood ? `Mood: ${body.mood}` : null,
      })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async findAll(userId: string, orderId: string) {
    await this.verifyOrderAccess(userId, orderId);

    const { data, error } = await this.supabase.client
      .from('status_reports')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async findOne(userId: string, orderId: string, reportId: string) {
    await this.verifyOrderAccess(userId, orderId);

    const { data, error } = await this.supabase.client
      .from('status_reports')
      .select('*')
      .eq('id', reportId)
      .eq('order_id', orderId)
      .single();
    if (error || !data) throw new NotFoundException('Status report not found');

    return data;
  }

  private async verifyOrderAccess(userId: string, orderId: string) {
    const { data: order, error } = await this.supabase.client
      .from('orders')
      .select('*, providers(id, user_id)')
      .eq('id', orderId)
      .single();
    if (error || !order) throw new NotFoundException('Order not found');

    const isOwner = order.owner_id === userId;
    const isProvider = order.providers?.user_id === userId;
    if (!isOwner && !isProvider) throw new ForbiddenException('No access to this order');
  }
}
