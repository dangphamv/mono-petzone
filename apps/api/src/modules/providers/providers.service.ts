import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { SupabaseService } from '../supabase/supabase.service';
import { PROVIDER_COLUMNS, ROOM_COLUMNS, ADDON_COLUMNS, AVAILABILITY_COLUMNS, ORDER_LIST_COLUMNS } from '../../common/constants/columns';
import { paginate, type PaginationParams } from '../../common/utils/pagination';
import type {
  RegisterProviderInput,
  UpdateListingInput,
  UploadDocumentsInput,
  CreateRoomInput,
  UpdateRoomInput,
  CreateAddOnInput,
  UpdateAddOnInput,
  UpdateAvailabilityInput,
  BulkUpdateAvailabilityInput,
} from '@petzone/validators';

const PROVIDER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class ProvidersService {
  constructor(
    private readonly supabase: SupabaseService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  private providerCacheKey(id: string) {
    return `provider:${id}`;
  }

  private async invalidateProviderCache(providerId: string) {
    await this.cache.del(this.providerCacheKey(providerId));
  }

  private async getProviderByUserId(userId: string) {
    const { data, error } = await this.supabase.client
      .from('providers')
      .select(PROVIDER_COLUMNS)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new ForbiddenException('Not registered as a provider');
    return data;
  }

  async register(userId: string, body: RegisterProviderInput) {
    const { data: existing } = await this.supabase.client
      .from('providers')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) throw new ConflictException('User already registered as provider');

    const { data, error } = await this.supabase.client
      .from('providers')
      .insert({ ...body, user_id: userId })
      .select(PROVIDER_COLUMNS)
      .single();

    if (error) throw new BadRequestException(error.message);

    await this.supabase.client
      .from('users')
      .update({ role: 'provider' })
      .eq('id', userId);

    await this.supabase.client.auth.admin.updateUserById(userId, {
      app_metadata: { role: 'provider' },
    });

    return data;
  }

  async getMe(userId: string) {
    const provider = await this.getProviderByUserId(userId);

    const { data, error } = await this.supabase.client
      .from('providers')
      .select(`${PROVIDER_COLUMNS}, room_types(${ROOM_COLUMNS}), add_on_services(${ADDON_COLUMNS})`)
      .eq('id', provider.id)
      .single();

    if (error || !data) throw new NotFoundException('Provider not found');
    return data;
  }

  async findOne(id: string) {
    const cached = await this.cache.get(this.providerCacheKey(id));
    if (cached) return cached;

    const { data, error } = await this.supabase.client
      .from('providers')
      .select(`${PROVIDER_COLUMNS}, room_types(${ROOM_COLUMNS}), add_on_services(${ADDON_COLUMNS})`)
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Provider not found');

    await this.cache.set(this.providerCacheKey(id), data, PROVIDER_CACHE_TTL);
    return data;
  }

  async updateMe(userId: string, body: UpdateListingInput) {
    const provider = await this.getProviderByUserId(userId);

    const { data, error } = await this.supabase.client
      .from('providers')
      .update(body)
      .eq('id', provider.id)
      .select(PROVIDER_COLUMNS)
      .single();

    if (error) throw new BadRequestException(error.message);
    await this.invalidateProviderCache(provider.id);
    return data;
  }

  async uploadDocuments(userId: string, body: UploadDocumentsInput) {
    const provider = await this.getProviderByUserId(userId);

    const updates: Record<string, unknown> = {};
    if (body.license_photos) updates.license_photos = body.license_photos;
    if (body.facility_photos) updates.facility_photos = body.facility_photos;
    if (body.certification_photos) updates.certification_photos = body.certification_photos;

    const { data, error } = await this.supabase.client
      .from('providers')
      .update(updates)
      .eq('id', provider.id)
      .select(PROVIDER_COLUMNS)
      .single();

    if (error) throw new BadRequestException(error.message);
    await this.invalidateProviderCache(provider.id);
    return data;
  }

  async submitVerification(userId: string) {
    const provider = await this.getProviderByUserId(userId);

    if (provider.verification_status === 'approved') {
      throw new BadRequestException('Provider is already approved');
    }

    const { data, error } = await this.supabase.client
      .from('providers')
      .update({ verification_status: 'pending' })
      .eq('id', provider.id)
      .select(PROVIDER_COLUMNS)
      .single();

    if (error) throw new BadRequestException(error.message);
    await this.invalidateProviderCache(provider.id);
    return data;
  }

  async getVerificationStatus(userId: string) {
    const { data, error } = await this.supabase.client
      .from('providers')
      .select('verification_status, verified_at')
      .eq('user_id', userId)
      .single();
    if (error || !data) throw new ForbiddenException('Not registered as a provider');
    return data;
  }

  async getOrders(userId: string, params: PaginationParams & { status?: string }) {
    const provider = await this.getProviderByUserId(userId);
    const { page = 1, limit = 20, status } = params;
    const from = (page - 1) * limit;

    let query = this.supabase.client
      .from('orders')
      .select(`${ORDER_LIST_COLUMNS}, users!orders_owner_id_fkey(id, full_name, avatar_url)`, { count: 'exact' })
      .eq('provider_id', provider.id)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query.range(from, from + limit - 1);
    if (error) throw new BadRequestException(error.message);
    return paginate(data ?? [], count ?? 0, { page, limit });
  }

  async getStats(userId: string, month?: string) {
    const provider = await this.getProviderByUserId(userId);

    const target = month || new Date().toISOString().slice(0, 7);
    const startDate = `${target}-01`;
    const endDate = new Date(Number(target.slice(0, 4)), Number(target.slice(5, 7)), 0).toISOString().split('T')[0];

    const { data: orders, error } = await this.supabase.client
      .from('orders')
      .select('id, status, total_price')
      .eq('provider_id', provider.id)
      .gte('created_at', startDate)
      .lte('created_at', `${endDate}T23:59:59`);

    if (error) throw new BadRequestException(error.message);

    const all = orders || [];
    const completed = all.filter((o: { status: string }) => o.status === 'completed');
    const cancelled = all.filter((o: { status: string }) => o.status === 'cancelled');
    const grossRevenue = completed.reduce((sum: number, o: { total_price: number | string | null }) => sum + (Number(o.total_price) || 0), 0);
    const commissionRate = 0.15;

    return {
      month: target,
      total_orders: all.length,
      completed_orders: completed.length,
      cancelled_orders: cancelled.length,
      gross_revenue: grossRevenue,
      commission: Math.round(grossRevenue * commissionRate),
      net_revenue: Math.round(grossRevenue * (1 - commissionRate)),
      rating_average: provider.rating_average,
      rating_count: provider.rating_count,
    };
  }

  async getPublicRooms(providerId: string) {
    const { data, error } = await this.supabase.client
      .from('room_types')
      .select(ROOM_COLUMNS)
      .eq('provider_id', providerId)
      .eq('is_active', true)
      .order('price_per_night', { ascending: true });

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getPublicAddOns(providerId: string) {
    const { data, error } = await this.supabase.client
      .from('add_on_services')
      .select(ADDON_COLUMNS)
      .eq('provider_id', providerId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getRooms(userId: string) {
    const provider = await this.getProviderByUserId(userId);

    const { data, error } = await this.supabase.client
      .from('room_types')
      .select(ROOM_COLUMNS)
      .eq('provider_id', provider.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async createRoom(userId: string, body: CreateRoomInput) {
    const provider = await this.getProviderByUserId(userId);

    const { data, error } = await this.supabase.client
      .from('room_types')
      .insert({ ...body, provider_id: provider.id })
      .select(ROOM_COLUMNS)
      .single();

    if (error) throw new BadRequestException(error.message);
    await this.invalidateProviderCache(provider.id);
    return data;
  }

  async updateRoom(userId: string, roomId: string, body: UpdateRoomInput) {
    const provider = await this.getProviderByUserId(userId);

    const { data, error } = await this.supabase.client
      .from('room_types')
      .update(body)
      .eq('id', roomId)
      .eq('provider_id', provider.id)
      .select(ROOM_COLUMNS)
      .single();

    if (error || !data) throw new NotFoundException('Room not found');
    await this.invalidateProviderCache(provider.id);
    return data;
  }

  async deleteRoom(userId: string, roomId: string) {
    const provider = await this.getProviderByUserId(userId);

    const { data, error } = await this.supabase.client
      .from('room_types')
      .update({ is_active: false })
      .eq('id', roomId)
      .eq('provider_id', provider.id)
      .select(ROOM_COLUMNS)
      .single();

    if (error || !data) throw new NotFoundException('Room not found');
    await this.invalidateProviderCache(provider.id);
    return { message: 'Room deleted' };
  }

  async getAddOns(userId: string) {
    const provider = await this.getProviderByUserId(userId);

    const { data, error } = await this.supabase.client
      .from('add_on_services')
      .select(ADDON_COLUMNS)
      .eq('provider_id', provider.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async createAddOn(userId: string, body: CreateAddOnInput) {
    const provider = await this.getProviderByUserId(userId);

    const { data, error } = await this.supabase.client
      .from('add_on_services')
      .insert({ ...body, provider_id: provider.id })
      .select(ADDON_COLUMNS)
      .single();

    if (error) throw new BadRequestException(error.message);
    await this.invalidateProviderCache(provider.id);
    return data;
  }

  async updateAddOn(userId: string, addOnId: string, body: UpdateAddOnInput) {
    const provider = await this.getProviderByUserId(userId);

    const { data, error } = await this.supabase.client
      .from('add_on_services')
      .update(body)
      .eq('id', addOnId)
      .eq('provider_id', provider.id)
      .select(ADDON_COLUMNS)
      .single();

    if (error || !data) throw new NotFoundException('Add-on not found');
    await this.invalidateProviderCache(provider.id);
    return data;
  }

  async deleteAddOn(userId: string, addOnId: string) {
    const provider = await this.getProviderByUserId(userId);

    const { data, error } = await this.supabase.client
      .from('add_on_services')
      .update({ is_active: false })
      .eq('id', addOnId)
      .eq('provider_id', provider.id)
      .select(ADDON_COLUMNS)
      .single();

    if (error || !data) throw new NotFoundException('Add-on not found');
    await this.invalidateProviderCache(provider.id);
    return { message: 'Add-on deleted' };
  }

  async getAvailability(userId: string) {
    const provider = await this.getProviderByUserId(userId);

    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await this.supabase.client
      .from('provider_availability')
      .select(`${AVAILABILITY_COLUMNS}, room_types(name)`)
      .eq('provider_id', provider.id)
      .gte('date', today)
      .order('date', { ascending: true });

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updateAvailability(userId: string, body: UpdateAvailabilityInput) {
    const provider = await this.getProviderByUserId(userId);

    const rows = body.dates.map((d) => ({
      provider_id: provider.id,
      room_type_id: body.room_type_id,
      date: d.date,
      available_slots: d.available_slots,
      is_blocked: d.is_blocked,
    }));

    const { data, error } = await this.supabase.client
      .from('provider_availability')
      .upsert(rows, { onConflict: 'room_type_id,date' })
      .select(AVAILABILITY_COLUMNS);

    if (error) throw new BadRequestException(error.message);
    await this.invalidateProviderCache(provider.id);
    return data;
  }

  async bulkUpdateAvailability(userId: string, body: BulkUpdateAvailabilityInput) {
    const provider = await this.getProviderByUserId(userId);

    const start = new Date(body.start_date);
    const end = new Date(body.end_date);
    if (start > end) throw new BadRequestException('start_date must be before end_date');

    const rows: { provider_id: string; room_type_id: string; date: string; available_slots: number; is_blocked: boolean }[] = [];
    const current = new Date(start);
    while (current <= end) {
      rows.push({
        provider_id: provider.id,
        room_type_id: body.room_type_id,
        date: current.toISOString().split('T')[0],
        available_slots: body.available_slots,
        is_blocked: body.is_blocked,
      });
      current.setDate(current.getDate() + 1);
    }

    const { data, error } = await this.supabase.client
      .from('provider_availability')
      .upsert(rows, { onConflict: 'room_type_id,date' })
      .select(AVAILABILITY_COLUMNS);

    if (error) throw new BadRequestException(error.message);
    await this.invalidateProviderCache(provider.id);
    return data;
  }
}
