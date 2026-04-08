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

export interface ProviderRow {
  room_types?: { price_per_night: number; is_active: boolean }[];
}

@Injectable()
export class SearchService {
  constructor(private readonly supabase: SupabaseService) {}

  async searchProviders(query: SearchProvidersInput, userId?: string) {
    const { page = 1, limit = 20 } = query;
    const from = (page - 1) * limit;

    let q = this.supabase.client
      .from('providers')
      .select(`${PROVIDER_LIST_COLUMNS}, room_types(id, price_per_night, is_active)`, { count: 'exact' })
      .eq('verification_status', 'approved')
      .eq('is_active', true);

    if (query.species) {
      q = q.contains('accepted_species', [query.species]);
    }
    if (query.min_rating) {
      q = q.gte('rating_average', query.min_rating);
    }

    if (query.sort_by === 'rating') {
      q = q.order('rating_average', { ascending: false });
    } else if (query.sort_by === 'price_asc') {
      q = q.order('created_at', { ascending: true });
    } else if (query.sort_by === 'price_desc') {
      q = q.order('created_at', { ascending: false });
    } else {
      q = q.order('rating_average', { ascending: false });
    }

    q = q.range(from, from + limit - 1);

    const { data, error, count } = await q;

    if (error) throw new BadRequestException(error.message);

    let results = (data ?? []) as ProviderRow[];

    if (query.min_price || query.max_price) {
      results = results.filter((p) => {
        const rooms = p.room_types?.filter((r) => r.is_active) ?? [];
        if (rooms.length === 0) return false;
        const minRoomPrice = Math.min(...rooms.map((r) => r.price_per_night));
        if (query.min_price && minRoomPrice < query.min_price) return false;
        if (query.max_price && minRoomPrice > query.max_price) return false;
        return true;
      });
    }

    if (userId && query.latitude && query.longitude) {
      this.saveSearchHistory(userId, query).catch(() => {});
    }

    return paginate(results, count ?? 0, { page, limit });
  }

  private async saveSearchHistory(userId: string, query: SearchProvidersInput) {
    const { latitude, longitude, page, limit, sort_by, ...filters } = query;
    await this.supabase.client.from('search_history').insert({
      user_id: userId,
      query_text: query.species || '',
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
