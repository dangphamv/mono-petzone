import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(userId: string, body: any) {
    const { data: order, error: orderErr } = await this.supabase.client
      .from('orders')
      .select('id, owner_id, provider_id, status, completed_at')
      .eq('id', body.order_id)
      .single();
    if (orderErr || !order) throw new NotFoundException('Order not found');
    if (order.owner_id !== userId) throw new ForbiddenException('Only the order owner can review');
    if (order.status !== 'completed') throw new BadRequestException('Order must be completed before reviewing');

    if (order.completed_at) {
      const completedAt = new Date(order.completed_at);
      const now = new Date();
      const daysSince = (now.getTime() - completedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > 7) throw new BadRequestException('Review window has expired (7 days)');
    }

    const { data: existing } = await this.supabase.client
      .from('reviews')
      .select('id')
      .eq('order_id', body.order_id)
      .maybeSingle();
    if (existing) throw new ConflictException('Review already exists for this order');

    const { data, error } = await this.supabase.client
      .from('reviews')
      .insert({
        order_id: body.order_id,
        owner_id: userId,
        provider_id: order.provider_id,
        rating_overall: body.rating_overall,
        rating_cleanliness: body.rating_cleanliness ?? null,
        rating_care_quality: body.rating_care_quality ?? null,
        rating_communication: body.rating_communication ?? null,
        rating_value: body.rating_value ?? null,
        text: body.text ?? null,
        photos: body.photos || [],
      })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async findByProvider(providerId: string) {
    const { data, error } = await this.supabase.client
      .from('reviews')
      .select('*')
      .eq('provider_id', providerId)
      .eq('is_visible', true)
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async respond(userId: string, id: string, body: any) {
    const { data: review, error: reviewErr } = await this.supabase.client
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single();
    if (reviewErr || !review) throw new NotFoundException('Review not found');

    if (review.provider_response) throw new ConflictException('Response already exists');

    const { data: provider, error: provErr } = await this.supabase.client
      .from('providers')
      .select('id, user_id')
      .eq('id', review.provider_id)
      .single();
    if (provErr || !provider) throw new NotFoundException('Provider not found');
    if (provider.user_id !== userId) throw new ForbiddenException('Only the provider can respond');

    const { data, error } = await this.supabase.client
      .from('reviews')
      .update({
        provider_response: body.response,
        provider_responded_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase.client
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) throw new NotFoundException('Review not found');

    return data;
  }
}
