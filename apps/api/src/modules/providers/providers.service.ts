import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ProvidersService {
  constructor(private readonly supabase: SupabaseService) {}

  private async getProviderByUserId(userId: string) {
    const { data, error } = await this.supabase.client
      .from('providers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new ForbiddenException('Not registered as a provider');
    return data;
  }

  async register(userId: string, body: any) {
    const { data: existing } = await this.supabase.client
      .from('providers')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) throw new ConflictException('User already registered as provider');

    const { data, error } = await this.supabase.client
      .from('providers')
      .insert({ ...body, user_id: userId })
      .select()
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
    const { data, error } = await this.supabase.client
      .from('providers')
      .select('*, room_types(*), add_on_services(*)')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Provider not found');
    return data;
  }

  async updateMe(userId: string, body: any) {
    const provider = await this.getProviderByUserId(userId);

    const { data, error } = await this.supabase.client
      .from('providers')
      .update(body)
      .eq('id', provider.id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getRooms(userId: string) {
    const provider = await this.getProviderByUserId(userId);

    const { data, error } = await this.supabase.client
      .from('room_types')
      .select('*')
      .eq('provider_id', provider.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async createRoom(userId: string, body: any) {
    const provider = await this.getProviderByUserId(userId);

    const { data, error } = await this.supabase.client
      .from('room_types')
      .insert({ ...body, provider_id: provider.id })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updateRoom(userId: string, roomId: string, body: any) {
    const provider = await this.getProviderByUserId(userId);

    const { data, error } = await this.supabase.client
      .from('room_types')
      .update(body)
      .eq('id', roomId)
      .eq('provider_id', provider.id)
      .select()
      .single();

    if (error || !data) throw new NotFoundException('Room not found');
    return data;
  }

  async deleteRoom(userId: string, roomId: string) {
    const provider = await this.getProviderByUserId(userId);

    const { data, error } = await this.supabase.client
      .from('room_types')
      .update({ is_active: false })
      .eq('id', roomId)
      .eq('provider_id', provider.id)
      .select()
      .single();

    if (error || !data) throw new NotFoundException('Room not found');
    return { message: 'Room deleted' };
  }

  async getAddOns(userId: string) {
    const provider = await this.getProviderByUserId(userId);

    const { data, error } = await this.supabase.client
      .from('add_on_services')
      .select('*')
      .eq('provider_id', provider.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async createAddOn(userId: string, body: any) {
    const provider = await this.getProviderByUserId(userId);

    const { data, error } = await this.supabase.client
      .from('add_on_services')
      .insert({ ...body, provider_id: provider.id })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updateAddOn(userId: string, addOnId: string, body: any) {
    const provider = await this.getProviderByUserId(userId);

    const { data, error } = await this.supabase.client
      .from('add_on_services')
      .update(body)
      .eq('id', addOnId)
      .eq('provider_id', provider.id)
      .select()
      .single();

    if (error || !data) throw new NotFoundException('Add-on not found');
    return data;
  }

  async deleteAddOn(userId: string, addOnId: string) {
    const provider = await this.getProviderByUserId(userId);

    const { data, error } = await this.supabase.client
      .from('add_on_services')
      .update({ is_active: false })
      .eq('id', addOnId)
      .eq('provider_id', provider.id)
      .select()
      .single();

    if (error || !data) throw new NotFoundException('Add-on not found');
    return { message: 'Add-on deleted' };
  }

  async getAvailability(userId: string) {
    const provider = await this.getProviderByUserId(userId);

    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await this.supabase.client
      .from('provider_availability')
      .select('*, room_types(name)')
      .eq('provider_id', provider.id)
      .gte('date', today)
      .order('date', { ascending: true });

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updateAvailability(userId: string, body: any) {
    const provider = await this.getProviderByUserId(userId);

    const rows = body.dates.map((d: any) => ({
      provider_id: provider.id,
      room_type_id: body.room_type_id,
      date: d.date,
      available_slots: d.available_slots,
      is_blocked: d.is_blocked,
    }));

    const { data, error } = await this.supabase.client
      .from('provider_availability')
      .upsert(rows, { onConflict: 'room_type_id,date' })
      .select();

    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
