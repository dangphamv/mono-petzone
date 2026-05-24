import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { SearchProvidersInput } from '@petzone/validators';
import { SupabaseService } from '../supabase/supabase.service';
import { PROVIDER_LIST_COLUMNS, FAVORITE_COLUMNS, SEARCH_HISTORY_COLUMNS } from '../../common/constants/columns';
import { paginate, type PaginationParams } from '../../common/utils/pagination';

@Injectable()
export class SearchService {
  constructor(private readonly supabase: SupabaseService) {}

  async searchProviders(query: SearchProvidersInput, userId?: string) {
    const { page = 1, limit = 20 } = query;
    const from = (page - 1) * limit;

    const { data, error } = await this.supabase.client.rpc('search_providers_nearby', {
      p_latitude: query.latitude ?? null,
      p_longitude: query.longitude ?? null,
      p_radius_km: query.radius_km,
      p_species: query.species ?? null,
      p_min_rating: query.min_rating ?? null,
      p_min_price: query.min_price ?? null,
      p_max_price: query.max_price ?? null,
      p_keyword: query.keyword ?? null,
      p_sort_by: query.sort_by,
      p_limit: limit,
      p_offset: from,
    });

    if (error) throw new BadRequestException(error.message);

    const { results = [], total = 0 } = (data ?? {}) as { results?: unknown[]; total?: number };

    if (userId && query.latitude && query.longitude) {
      this.saveSearchHistory(userId, query).catch(() => {});
    }

    return paginate(results, total, { page, limit });
  }

  private async saveSearchHistory(userId: string, query: SearchProvidersInput) {
    const { latitude, longitude, page, limit, sort_by, ...filters } = query;
    await this.supabase.client.from('search_history').insert({
      user_id: userId,
      query_text: query.keyword || query.species || '',
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      filters,
    });
  }

  async addFavorite(userId: string, body: { provider_id: string }) {
    const { data, error } = await this.supabase.client
      .from('favorites')
      .insert({ user_id: userId, provider_id: body.provider_id })
      .select(FAVORITE_COLUMNS)
      .single();

    if (error) {
      if (error.code === '23505') throw new ConflictException('Provider already in favorites');
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async removeFavorite(userId: string, providerId: string) {
    const { data, error } = await this.supabase.client
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('provider_id', providerId)
      .select(FAVORITE_COLUMNS)
      .single();

    if (error || !data) throw new NotFoundException('Favorite not found');
    return { message: 'Favorite removed' };
  }

  async getFavorites(userId: string, params: PaginationParams) {
    const { page = 1, limit = 20 } = params;
    const from = (page - 1) * limit;

    const { data, error, count } = await this.supabase.client
      .from('favorites')
      .select(`${FAVORITE_COLUMNS}, providers(${PROVIDER_LIST_COLUMNS})`, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw new BadRequestException(error.message);
    return paginate(data ?? [], count ?? 0, { page, limit });
  }

  async getHistory(userId: string) {
    const { data, error } = await this.supabase.client
      .from('search_history')
      .select(SEARCH_HISTORY_COLUMNS)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
