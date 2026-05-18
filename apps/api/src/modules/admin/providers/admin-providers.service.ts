import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type {
  VerifyProviderInput,
  AdminUpdateProviderInput,
  AdminCreateProviderInput,
  RequestInfoInput,
} from '@petzone/validators';
import { SupabaseService } from '../../supabase/supabase.service';
import { PROVIDER_COLUMNS, PROVIDER_COLUMNS_ADMIN, ROOM_COLUMNS, ADDON_COLUMNS } from '../../../common/constants/columns';
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
      .select(`${PROVIDER_COLUMNS}, users!providers_user_id_fkey(id, display_id, email, full_name, avatar_url)`, { count: 'exact' })
      .order('created_at', { ascending: true });

    if (status) {
      const values = status.split(',').map((s) => s.trim()).filter(Boolean);
      query = values.length > 1 ? query.in('verification_status', values) : query.eq('verification_status', values[0] ?? status);
    }
    if (search) {
      const escaped = search.replace(/[,()]/g, ' ').trim();
      if (escaped) {
        query = query.or(`business_name.ilike.%${escaped}%,display_id.ilike.%${escaped}%,phone.ilike.%${escaped}%,license_number.ilike.%${escaped}%`);
      }
    }

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
      .select(`${PROVIDER_COLUMNS_ADMIN}, users!providers_user_id_fkey(id, display_id, email, full_name, avatar_url)`)
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

  async createProvider(adminId: string, body: AdminCreateProviderInput) {
    let userId = body.user_id ?? '';

    if (body.new_owner) {
      userId = await this.createOwnerForProvider(body.new_owner);
    } else {
      const { data: owner, error: ownerErr } = await this.supabase.client
        .from('users')
        .select('id, role')
        .eq('id', userId)
        .maybeSingle();
      if (ownerErr) throw new BadRequestException(ownerErr.message);
      if (!owner) throw new NotFoundException('Owner user not found');

      const { data: existing } = await this.supabase.client
        .from('providers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      if (existing) throw new BadRequestException('This user already has a provider profile');

      if (owner.role !== 'provider') {
        await this.supabase.client.from('users').update({ role: 'provider' }).eq('id', userId);
        await this.supabase.client.auth.admin.updateUserById(userId, {
          app_metadata: { role: 'provider' },
        });
      }
    }

    const { new_owner: _newOwner, user_id: _userId, ...providerFields } = body;

    const { data, error } = await this.supabase.client
      .from('providers')
      .insert({
        ...providerFields,
        user_id: userId,
        verification_status: 'approved',
        verified_at: new Date().toISOString(),
        verified_by: adminId,
      })
      .select(PROVIDER_COLUMNS)
      .single();
    if (error || !data) throw new BadRequestException(error?.message || 'Failed to create provider');

    return data;
  }

  private async createOwnerForProvider(
    newOwner: NonNullable<AdminCreateProviderInput['new_owner']>,
  ): Promise<string> {
    const email = newOwner.email?.toLowerCase();
    const phone = newOwner.phone;

    if (email) {
      const { data: existing } = await this.supabase.client
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      if (existing) throw new BadRequestException('A user with this email already exists');
    }
    if (phone) {
      const { data: existing } = await this.supabase.client
        .from('users')
        .select('id')
        .eq('phone', phone)
        .maybeSingle();
      if (existing) throw new BadRequestException('A user with this phone already exists');
    }

    const tempPassword = randomBytes(18).toString('base64url');
    const authEmail = email ?? `provider-${randomBytes(6).toString('hex')}@petzone.internal`;

    const { data: authData, error: authError } = await this.supabase.client.auth.admin.createUser({
      email: authEmail,
      password: tempPassword,
      email_confirm: true,
      phone: phone || undefined,
      phone_confirm: phone ? true : undefined,
      app_metadata: { role: 'provider' },
    });
    if (authError || !authData?.user) {
      throw new BadRequestException(authError?.message || 'Failed to create auth user');
    }

    const { error: insertError } = await this.supabase.client.from('users').insert({
      id: authData.user.id,
      email: email ?? null,
      phone: phone ?? null,
      full_name: newOwner.full_name,
      role: 'provider',
    });
    if (insertError) {
      // Roll back the auth user so we don't orphan it.
      await this.supabase.client.auth.admin.deleteUser(authData.user.id).catch(() => undefined);
      throw new BadRequestException(insertError.message);
    }

    return authData.user.id;
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
    const updates: Record<string, unknown> = {
      verification_status: body.status,
      verification_notes: body.notes || null,
      verified_at: new Date().toISOString(),
      verified_by: userId,
    };

    const { data, error } = await this.supabase.client
      .from('providers')
      .update(updates)
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
