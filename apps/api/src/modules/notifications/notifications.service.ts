import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(userId: string) {
    const { data, error } = await this.supabase.client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async markRead(userId: string, id: string) {
    const { data, error } = await this.supabase.client
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error || !data) throw new NotFoundException('Notification not found');

    return data;
  }

  async markAllRead(userId: string) {
    const { data, error } = await this.supabase.client
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select();
    if (error) throw new BadRequestException(error.message);

    return { count: data?.length || 0 };
  }

  async registerDeviceToken(userId: string, body: any) {
    const { data, error } = await this.supabase.client
      .from('device_tokens')
      .upsert(
        {
          user_id: userId,
          token: body.token,
          platform: body.platform,
          is_active: true,
        },
        { onConflict: 'user_id,token' },
      )
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async removeDeviceToken(userId: string, token: string) {
    const { data, error } = await this.supabase.client
      .from('device_tokens')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('token', token)
      .select()
      .single();
    if (error || !data) throw new NotFoundException('Device token not found');

    return data;
  }
}
