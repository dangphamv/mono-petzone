import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { RegisterDeviceTokenInput } from '@petzone/validators';
import { SupabaseService } from '../supabase/supabase.service';
import { NOTIFICATION_COLUMNS, DEVICE_TOKEN_COLUMNS } from '../../common/constants/columns';
import { paginate, type PaginationParams } from '../../common/utils/pagination';

@Injectable()
export class NotificationsService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(userId: string, params: PaginationParams) {
    const { page = 1, limit = 20 } = params;
    const from = (page - 1) * limit;

    const { data, error, count } = await this.supabase.client
      .from('notifications')
      .select(NOTIFICATION_COLUMNS, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);
    if (error) throw new BadRequestException(error.message);

    return paginate(data ?? [], count ?? 0, { page, limit });
  }

  async markRead(userId: string, id: string) {
    const { data, error } = await this.supabase.client
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select(NOTIFICATION_COLUMNS)
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
      .select(NOTIFICATION_COLUMNS);
    if (error) throw new BadRequestException(error.message);

    return { count: data?.length || 0 };
  }

  async registerDeviceToken(userId: string, body: RegisterDeviceTokenInput) {
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
      .select(DEVICE_TOKEN_COLUMNS)
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
      .select(DEVICE_TOKEN_COLUMNS)
      .single();
    if (error || !data) throw new NotFoundException('Device token not found');

    return data;
  }
}
