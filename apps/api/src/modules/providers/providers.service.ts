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
import { PROVIDER_COLUMNS, ROOM_COLUMNS, ADDON_COLUMNS, AVAILABILITY_COLUMNS } from '../../common/constants/columns';
import type {
  RegisterProviderInput,
  UpdateListingInput,
  CreateRoomInput,
  UpdateRoomInput,
  CreateAddOnInput,
  UpdateAddOnInput,
  UpdateAvailabilityInput,
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
}
