import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { SuspendUserInput } from '@petzone/validators';
import { SupabaseService } from '../../supabase/supabase.service';
import { USER_COLUMNS } from '../../../common/constants/columns';
import { paginate, type PaginationParams } from '../../../common/utils/pagination';
import { AdminActionLogService } from '../_shared/admin-action-log.service';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly actionLog: AdminActionLogService,
  ) {}

  async getUsers(params: PaginationParams & { role?: string; search?: string }) {
    const { page = 1, limit = 20, role, search } = params;
    const from = (page - 1) * limit;

    let query = this.supabase.client
      .from('users')
      .select(USER_COLUMNS, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (role) query = query.eq('role', role);
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);

    const { data, error, count } = await query.range(from, from + limit - 1);
    if (error) throw new BadRequestException(error.message);

    return paginate(data ?? [], count ?? 0, { page, limit });
  }

  async getUserDetail(id: string) {
    const { data: user, error } = await this.supabase.client
      .from('users')
      .select(USER_COLUMNS)
      .eq('id', id)
      .single();
    if (error || !user) {
      if (error?.code === 'PGRST116') throw new NotFoundException('User not found');
      throw new BadRequestException(error?.message || 'Failed to load user');
    }

    let suspension: { reason: string | null; is_permanent: boolean; suspended_at: string; admin_id: string } | null = null;
    if (user.status === 'suspended' || user.status === 'banned') {
      const { data: log } = await this.supabase.client
        .from('admin_action_log')
        .select('admin_id, details, created_at')
        .eq('target_type', 'user')
        .eq('target_id', id)
        .in('action_type', ['suspend_user', 'ban_user'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (log) {
        const details = (log.details ?? {}) as Record<string, unknown>;
        suspension = {
          reason: (details.reason as string) || null,
          is_permanent: Boolean(details.is_permanent),
          suspended_at: log.created_at as string,
          admin_id: log.admin_id as string,
        };
      }
    }

    return { ...user, suspension };
  }

  async suspendUser(userId: string, id: string, body: SuspendUserInput) {
    const status = body.is_permanent ? 'banned' : 'suspended';

    const { data, error } = await this.supabase.client
      .from('users')
      .update({ status })
      .eq('id', id)
      .select(USER_COLUMNS)
      .single();
    if (error || !data) throw new NotFoundException('User not found');

    await this.actionLog.log(userId, 'suspend_user', 'user', id, {
      reason: body.reason,
      is_permanent: body.is_permanent,
      status,
    });

    return data;
  }

  async reactivateUser(adminId: string, id: string, note?: string) {
    const { data: current, error: fetchErr } = await this.supabase.client
      .from('users')
      .select('id, status')
      .eq('id', id)
      .maybeSingle();
    if (fetchErr || !current) throw new NotFoundException('User not found');
    if (current.status === 'active') {
      throw new BadRequestException('User is already active');
    }

    const { data, error } = await this.supabase.client
      .from('users')
      .update({ status: 'active' })
      .eq('id', id)
      .select(USER_COLUMNS)
      .single();
    if (error || !data) throw new NotFoundException('User not found');

    await this.actionLog.log(adminId, 'unsuspend_user', 'user', id, {
      previous_status: current.status,
      note: note || null,
    });

    return data;
  }
}
