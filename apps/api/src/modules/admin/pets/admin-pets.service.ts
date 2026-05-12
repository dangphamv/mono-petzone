import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { AdminCreatePetInput, AdminUpdatePetInput } from '@petzone/validators';
import { SupabaseService } from '../../supabase/supabase.service';
import { PET_COLUMNS } from '../../../common/constants/columns';
import { paginate, type PaginationParams } from '../../../common/utils/pagination';

@Injectable()
export class AdminPetsService {
  constructor(private readonly supabase: SupabaseService) {}

  async getPets(params: PaginationParams & { species?: string; search?: string; ownerId?: string }) {
    const { page = 1, limit = 20, species, search, ownerId } = params;
    const from = (page - 1) * limit;

    let query = this.supabase.client
      .from('pets')
      .select(`${PET_COLUMNS}, users!pets_owner_id_fkey(id, display_id, email, full_name, avatar_url)`, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (ownerId) query = query.eq('owner_id', ownerId);
    if (species) {
      const list = species.split(',').map((s) => s.trim()).filter(Boolean);
      if (list.length === 1) query = query.eq('species', list[0]);
      else if (list.length > 1) query = query.in('species', list);
    }
    if (search) {
      const escaped = search.replace(/[,()]/g, ' ').trim();
      if (escaped) {
        query = query.or(`name.ilike.%${escaped}%,display_id.ilike.%${escaped}%,breed.ilike.%${escaped}%`);
      }
    }

    const { data, error, count } = await query.range(from, from + limit - 1);
    if (error) throw new BadRequestException(error.message);

    return paginate(data ?? [], count ?? 0, { page, limit });
  }

  async getPetDetail(id: string) {
    const { data, error } = await this.supabase.client
      .from('pets')
      .select(`${PET_COLUMNS}, users!pets_owner_id_fkey(id, display_id, email, full_name, avatar_url, phone)`)
      .eq('id', id)
      .single();
    if (error || !data) throw new NotFoundException('Pet not found');
    return data;
  }

  async createPet(_adminId: string, body: AdminCreatePetInput) {
    const { data: owner, error: ownerErr } = await this.supabase.client
      .from('users')
      .select('id, role')
      .eq('id', body.owner_id)
      .maybeSingle();
    if (ownerErr) throw new BadRequestException(ownerErr.message);
    if (!owner) throw new NotFoundException('Owner not found');

    const { data, error } = await this.supabase.client
      .from('pets')
      .insert(body)
      .select(PET_COLUMNS)
      .single();
    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async updatePet(_adminId: string, id: string, body: AdminUpdatePetInput) {
    if (Object.keys(body).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const { data, error } = await this.supabase.client
      .from('pets')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(PET_COLUMNS)
      .single();
    if (error || !data) {
      if (error?.code === 'PGRST116') throw new NotFoundException('Pet not found');
      throw new BadRequestException(error?.message || 'Failed to update pet');
    }

    return data;
  }
}
