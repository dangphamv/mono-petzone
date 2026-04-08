import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CHECK_IN_PHOTO_COLUMNS, ORDER_COLUMNS } from '../../common/constants/columns';
import type { UploadCheckInPhotosInput } from '@petzone/validators';

@Injectable()
export class CheckInService {
  constructor(private readonly supabase: SupabaseService) {}

  async uploadPhotos(userId: string, orderId: string, body: UploadCheckInPhotosInput) {
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

    const role = isOwner ? 'owner' : 'provider';

    let handoffPoint: string;
    if (order.status === 'checked_in') {
      handoffPoint = 'owner_to_store';
    } else if (order.status === 'check_out') {
      handoffPoint = 'store_to_owner';
    } else {
      throw new BadRequestException(`Order status '${order.status}' does not allow check-in photos`);
    }

    const rows = body.photos.map((url) => ({
      order_id: orderId,
      uploaded_by: userId,
      role,
      handoff_point: handoffPoint,
      photo_url: url,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      has_concern: false,
      concern_note: body.notes ?? null,
    }));

    const { data, error } = await this.supabase.client
      .from('check_in_photos')
      .insert(rows)
      .select(CHECK_IN_PHOTO_COLUMNS);
    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async getPhotos(userId: string, orderId: string) {
    const { data: order, error: orderErr } = await this.supabase.client
      .from('orders')
      .select(`${ORDER_COLUMNS}, providers(id, user_id)`)
      .eq('id', orderId)
      .single();
    if (orderErr || !order) throw new NotFoundException('Order not found');

    const isOwner = order.owner_id === userId;
    const prov = (order as Record<string, unknown>).providers as { user_id: string }[] | { user_id: string } | null;
    const isProvider = (Array.isArray(prov) ? prov[0]?.user_id : prov?.user_id) === userId;
    if (!isOwner && !isProvider) throw new ForbiddenException('No access to this order');

    const { data, error } = await this.supabase.client
      .from('check_in_photos')
      .select(CHECK_IN_PHOTO_COLUMNS)
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });
    if (error) throw new BadRequestException(error.message);

    return data;
  }
}
