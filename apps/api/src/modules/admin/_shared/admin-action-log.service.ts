import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class AdminActionLogService {
  constructor(private readonly supabase: SupabaseService) {}

  async log(
    adminId: string,
    actionType: string,
    targetType: string,
    targetId: string,
    details: Record<string, unknown>,
  ) {
    const { error } = await this.supabase.client.from('admin_action_log').insert({
      admin_id: adminId,
      action_type: actionType,
      target_type: targetType,
      target_id: targetId,
      details,
    });
    if (error) console.error(`Failed to log admin action: ${actionType}`, error.message);
  }
}
