import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { USER_COLUMNS } from '../../common/constants/columns';
import type { UpdateProfileInput, NotificationPreferencesInput } from '@petzone/validators';

@Injectable()
export class UsersService {
  constructor(private readonly supabase: SupabaseService) {}

  async getMe(userId: string) {
    const { data, error } = await this.supabase.client
      .from('users')
      .select(USER_COLUMNS)
      .eq('id', userId)
      .single();

    if (error) throw new NotFoundException('User not found');
    return data;
  }

  async updateMe(userId: string, body: UpdateProfileInput) {
    const { data, error } = await this.supabase.client
      .from('users')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select(USER_COLUMNS)
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getById(id: string) {
    const { data, error } = await this.supabase.client
      .from('users')
      .select('id, full_name, avatar_url, role')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('User not found');
    return data;
  }

  async getNotificationPreferences(userId: string) {
    const { data, error } = await this.supabase.client
      .from('users')
      .select('notification_preferences')
      .eq('id', userId)
      .single();

    if (error) throw new BadRequestException(error.message);
    return data?.notification_preferences ?? {};
  }

  async updateNotificationPreferences(userId: string, body: NotificationPreferencesInput) {
    const { data: current, error: fetchError } = await this.supabase.client
      .from('users')
      .select('notification_preferences')
      .eq('id', userId)
      .single();

    if (fetchError) throw new BadRequestException(fetchError.message);

    const merged = { ...(current?.notification_preferences ?? {}), ...body };

    const { data, error } = await this.supabase.client
      .from('users')
      .update({
        notification_preferences: merged,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select(USER_COLUMNS)
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
