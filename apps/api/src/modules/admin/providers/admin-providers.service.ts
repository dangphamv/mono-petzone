import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type {
  VerifyProviderInput,
  AdminUpdateProviderInput,
  RequestInfoInput,
} from '@petzone/validators';
import { SupabaseService } from '../../supabase/supabase.service';
import { PROVIDER_COLUMNS, ROOM_COLUMNS, ADDON_COLUMNS } from '../../../common/constants/columns';
import { paginate, type PaginationParams } from '../../../common/utils/pagination';
import { AdminActionLogService } from '../_shared/admin-action-log.service';

@Injectable()
export class AdminProvidersService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly actionLog: AdminActionLogService,
  ) {}

  async getProviders(params: PaginationParams & { status?: string; search?: string }) {
    const { page = 1, limit = 20, status, search } = params;
    const from = (page - 1) * limit;

    let query = this.supabase.client
      .from('providers')
      .select(`${PROVIDER_COLUMNS}, users!providers_user_id_fkey(id, email, full_name, avatar_url)`, { count: 'exact' })
      .order('created_at', { ascending: true });

    if (status) {
      const values = status.split(',').map((s) => s.trim()).filter(Boolean);
      query = values.length > 1 ? query.in('verification_status', values) : query.eq('verification_status', values[0] ?? status);
    }
    if (search) query = query.ilike('business_name', `%${search}%`);

    const { data, error, count } = await query.range(from, from + limit - 1);
    if (error) throw new BadRequestException(error.message);

    return paginate(data ?? [], count ?? 0, { page, limit });
  }

  async getProviderRooms(providerId: string) {
    const { data, error } = await this.supabase.client
      .from('room_types')
      .select(ROOM_COLUMNS)
      .eq('provider_id', providerId)
      .eq('is_active', true)
      .order('price_per_night', { ascending: true });
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async getProviderAddOns(providerId: string) {
    const { data, error } = await this.supabase.client
      .from('add_on_services')
      .select(ADDON_COLUMNS)
      .eq('provider_id', providerId)
      .eq('is_active', true)
      .order('price', { ascending: true });
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async getProviderDetail(id: string) {
    const { data, error } = await this.supabase.client
      .from('providers')
      .select(`${PROVIDER_COLUMNS}, users!providers_user_id_fkey(id, email, full_name, avatar_url)`)
      .eq('id', id)
      .single();
    if (error || !data) throw new NotFoundException('Provider not found');

    const { data: history } = await this.supabase.client
      .from('admin_action_log')
      .select('*')
      .eq('target_type', 'provider')
      .eq('target_id', id)
      .order('created_at', { ascending: false });

    return { ...data, verification_history: history || [] };
  }

  async updateProvider(adminId: string, id: string, body: AdminUpdateProviderInput) {
    if (Object.keys(body).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const { data, error } = await this.supabase.client
      .from('providers')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(PROVIDER_COLUMNS)
      .single();
    if (error || !data) {
      if (error?.code === 'PGRST116') throw new NotFoundException('Provider not found');
      throw new BadRequestException(error?.message || 'Failed to update provider');
    }

    await this.actionLog.log(adminId, 'update_provider', 'provider', id, body as Record<string, unknown>);

    return data;
  }

  async verifyProvider(userId: string, id: string, body: VerifyProviderInput) {
    const { data, error } = await this.supabase.client
      .from('providers')
      .update({
        verification_status: body.status,
        verification_notes: body.notes || null,
        verified_at: new Date().toISOString(),
        verified_by: userId,
      })
      .eq('id', id)
      .select(PROVIDER_COLUMNS)
      .single();
    if (error || !data) throw new NotFoundException('Provider not found');

    await this.actionLog.log(userId, 'verify_provider', 'provider', id, {
      status: body.status,
      notes: body.notes,
    });

    return data;
  }

  async requestInfo(adminId: string, providerId: string, body: RequestInfoInput) {
    const { data, error } = await this.supabase.client
      .from('providers')
      .update({ verification_status: 'info_requested' })
      .eq('id', providerId)
      .select(PROVIDER_COLUMNS)
      .single();
    if (error || !data) throw new NotFoundException('Provider not found');

    await this.actionLog.log(adminId, 'request_info', 'provider', providerId, {
      requirements: body.requirements,
    });

    return data;
  }
}
