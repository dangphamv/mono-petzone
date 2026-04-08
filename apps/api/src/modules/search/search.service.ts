import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class SearchService {
  constructor(private readonly supabase: SupabaseService) {}

  async searchProviders(query: any, userId?: string) {
    let q = this.supabase.client
      .from('providers')
      .select('*, room_types(*)', { count: 'exact' })
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

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const from = (page - 1) * limit;
    q = q.range(from, from + limit - 1);

    const { data, error, count } = await q;

    if (error) throw new BadRequestException(error.message);

    let results = data || [];

    if (query.min_price || query.max_price) {
      results = results.filter((p: any) => {
        const rooms = p.room_types?.filter((r: any) => r.is_active) || [];
        if (rooms.length === 0) return false;
        const minRoomPrice = Math.min(...rooms.map((r: any) => r.price_per_night));
        if (query.min_price && minRoomPrice < Number(query.min_price)) return false;
        if (query.max_price && minRoomPrice > Number(query.max_price)) return false;
        return true;
      });
    }

    if (userId && query.latitude && query.longitude) {
      this.saveSearchHistory(userId, query).catch(() => {});
    }

    return {
      data: results,
      meta: {
        page,
        limit,
        total: count ?? 0,
      },
    };
  }

  private async saveSearchHistory(userId: string, query: any) {
    const { latitude, longitude, page, limit, sort_by, ...filters } = query;
    await this.supabase.client.from('search_history').insert({
      user_id: userId,
      query_text: query.species || '',
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      filters,
    });
  }

  async addFavorite(userId: string, body: any) {
    const { data, error } = await this.supabase.client
      .from('favorites')
      .insert({ user_id: userId, provider_id: body.provider_id })
      .select()
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
      .select()
      .single();

    if (error || !data) throw new NotFoundException('Favorite not found');
    return { message: 'Favorite removed' };
  }

  async getFavorites(userId: string) {
    const { data, error } = await this.supabase.client
      .from('favorites')
      .select('*, providers(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getHistory(userId: string) {
    const { data, error } = await this.supabase.client
      .from('search_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
