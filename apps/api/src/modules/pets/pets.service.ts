import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class PetsService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(userId: string, body: any) {
    const { data, error } = await this.supabase.client
      .from('pets')
      .insert({ ...body, owner_id: userId })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async findAll(userId: string) {
    const { data, error } = await this.supabase.client
      .from('pets')
      .select('*')
      .eq('owner_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getBreeds(species: string) {
    const { data, error } = await this.supabase.client
      .from('breeds')
      .select('*')
      .eq('species', species)
      .order('popularity_rank', { ascending: true });

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async findOne(userId: string, id: string) {
    const { data, error } = await this.supabase.client
      .from('pets')
      .select('*')
      .eq('id', id)
      .eq('owner_id', userId)
      .single();

    if (error || !data) throw new NotFoundException('Pet not found');
    return data;
  }

  async update(userId: string, id: string, body: any) {
    const { data, error } = await this.supabase.client
      .from('pets')
      .update(body)
      .eq('id', id)
      .eq('owner_id', userId)
      .select()
      .single();

    if (error || !data) throw new NotFoundException('Pet not found');
    return data;
  }

  async remove(userId: string, id: string) {
    const { data, error } = await this.supabase.client
      .from('pets')
      .update({ is_active: false })
      .eq('id', id)
      .eq('owner_id', userId)
      .select()
      .single();

    if (error || !data) throw new NotFoundException('Pet not found');
    return { message: 'Pet deleted' };
  }
}
