import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { SupabaseService } from '../supabase/supabase.service';
import { PET_COLUMNS, BREED_COLUMNS } from '../../common/constants/columns';
import { paginate, type PaginationParams } from '../../common/utils/pagination';
import { PAGINATION } from '@petzone/shared';
import type { CreatePetInput, UpdatePetInput } from '@petzone/validators';

@Injectable()
export class PetsService {
  constructor(
    private readonly supabase: SupabaseService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async create(userId: string, body: CreatePetInput) {
    const { data, error } = await this.supabase.client
      .from('pets')
      .insert({ ...body, owner_id: userId })
      .select(PET_COLUMNS)
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async findAll(userId: string, params: PaginationParams = {}) {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { count, error: countError } = await this.supabase.client
      .from('pets')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .eq('is_active', true);

    if (countError) throw new BadRequestException(countError.message);

    const { data, error } = await this.supabase.client
      .from('pets')
      .select(PET_COLUMNS)
      .eq('owner_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new BadRequestException(error.message);
    return paginate(data ?? [], count ?? 0, { page, limit });
  }

  async getBreeds(species: string) {
    const cacheKey = `breeds:${species}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const { data, error } = await this.supabase.client
      .from('breeds')
      .select(BREED_COLUMNS)
      .eq('species', species)
      .order('popularity_rank', { ascending: true });

    if (error) throw new BadRequestException(error.message);

    await this.cache.set(cacheKey, data, 86_400_000); // 24h TTL
    return data;
  }

  async findOne(userId: string, id: string) {
    const { data, error } = await this.supabase.client
      .from('pets')
      .select(PET_COLUMNS)
      .eq('id', id)
      .eq('owner_id', userId)
      .single();

    if (error || !data) throw new NotFoundException('Pet not found');
    return data;
  }

  async update(userId: string, id: string, body: UpdatePetInput) {
    const { data, error } = await this.supabase.client
      .from('pets')
      .update(body)
      .eq('id', id)
      .eq('owner_id', userId)
      .select(PET_COLUMNS)
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
      .select(PET_COLUMNS)
      .single();

    if (error || !data) throw new NotFoundException('Pet not found');
    return { message: 'Pet deleted' };
  }
}
