import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type {
  VerifyProviderInput,
  AdminUpdateProviderInput,
  AdminCreatePetInput,
  AdminUpdatePetInput,
  RequestInfoInput,
  ResolveDisputeInput,
  SuspendUserInput,
  ModerateReviewInput,
  UpdateConfigInput,
  AdminMessageInput,
  AdminCreateOrderInput,
} from '@petzone/validators';
import { SupabaseService } from '../supabase/supabase.service';
import { OrdersService } from '../orders/orders.service';
import { PROVIDER_COLUMNS, ORDER_COLUMNS, ORDER_LIST_COLUMNS, DISPUTE_COLUMNS, USER_COLUMNS, REVIEW_COLUMNS, PET_COLUMNS, ROOM_COLUMNS, ADDON_COLUMNS } from '../../common/constants/columns';
import { paginate, type PaginationParams } from '../../common/utils/pagination';

@Injectable()
export class AdminService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly ordersService: OrdersService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async getDashboard(userId: string) {
    const cacheKey = 'admin:dashboard';
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const [users, providers, pendingVerifications, activeOrders, openDisputes] = await Promise.all([
      this.supabase.client.from('users').select('id', { count: 'exact', head: true }),
      this.supabase.client.from('providers').select('id', { count: 'exact', head: true }),
      this.supabase.client.from('providers').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
      this.supabase.client.from('orders').select('id', { count: 'exact', head: true }).in('status', ['pending', 'confirmed', 'checked_in', 'in_progress', 'check_out']),
      this.supabase.client.from('disputes').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    ]);

    const result = {
      total_users: users.count || 0,
      total_providers: providers.count || 0,
      pending_verifications: pendingVerifications.count || 0,
      active_orders: activeOrders.count || 0,
      open_disputes: openDisputes.count || 0,
    };

    await this.cache.set(cacheKey, result, 60_000);
    return result;
  }

  async getProviders(params: PaginationParams & { status?: string; search?: string }) {
    const { page = 1, limit = 20, status, search } = params;
    const from = (page - 1) * limit;

    let query = this.supabase.client
      .from('providers')
      .select(`${PROVIDER_COLUMNS}, users!providers_user_id_fkey(id, email, full_name, avatar_url)`, { count: 'exact' })
      .order('created_at', { ascending: true });

    if (status) {
      const values = status.split(',').map((s) => s.trim()).filter(Boolean);
      query = values.length > 1 ? query.in('verification_status', values) : query.eq('verification_status', values[0] ?? status);
    }
    if (search) query = query.ilike('business_name', `%${search}%`);

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

  async createOrder(adminId: string, body: AdminCreateOrderInput) {
    const { owner_id, ...orderBody } = body;
    const order = await this.ordersService.create(owner_id, orderBody);
    await this.logAction(adminId, 'create_order', 'order', order.id, {
      owner_id,
      provider_id: body.provider_id,
      total_price: order.total_price,
    });
    return order;
  }

  private readonly CANCELLABLE_STATUSES = ['pending_payment', 'pending', 'confirmed'];

  async cancelOrder(adminId: string, id: string, reason: string) {
    const { data: order, error } = await this.supabase.client
      .from('orders')
      .select('id, status, total_price')
      .eq('id', id)
      .single();
    if (error || !order) throw new NotFoundException('Order not found');
    if (!this.CANCELLABLE_STATUSES.includes(order.status as string))
      throw new BadRequestException(`Cannot cancel order in status '${order.status}'`);

    const { data: updated, error: updateErr } = await this.supabase.client
      .from('orders')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: 'admin',
        cancellation_reason: reason,
        refund_amount: Number(order.total_price) || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(ORDER_LIST_COLUMNS)
      .single();
    if (updateErr) throw new BadRequestException(updateErr.message);

    await this.supabase.client.from('order_status_history').insert({
      order_id: id,
      status: 'cancelled',
      actor_id: adminId,
      actor_type: 'admin',
      note: reason,
    });

    await this.logAction(adminId, 'cancel_order', 'order', id, { reason });

    return updated;
  }

  async getProviderDetail(id: string) {
    const { data, error } = await this.supabase.client
      .from('providers')
      .select(`${PROVIDER_COLUMNS}, users!providers_user_id_fkey(id, email, full_name, avatar_url)`)
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

    await this.logAction(adminId, 'update_provider', 'provider', id, body as Record<string, unknown>);

    return data;
  }

  async verifyProvider(userId: string, id: string, body: VerifyProviderInput) {
    const { data, error } = await this.supabase.client
      .from('providers')
      .update({
        verification_status: body.status,
        verification_notes: body.notes || null,
        verified_at: new Date().toISOString(),
        verified_by: userId,
      })
      .eq('id', id)
      .select(PROVIDER_COLUMNS)
      .single();
    if (error || !data) throw new NotFoundException('Provider not found');

    await this.logAction(userId, 'verify_provider', 'provider', id, {
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

    await this.logAction(adminId, 'request_info', 'provider', providerId, {
      requirements: body.requirements,
    });

    return data;
  }

  async getOrders(params: PaginationParams & { search?: string; status?: string }) {
    const { page = 1, limit = 20, search, status } = params;
    const from = (page - 1) * limit;

    let providerIds: string[] = [];
    let ownerIds: string[] = [];

    if (search) {
      const escaped = search.replace(/[,()]/g, ' ').trim();
      if (escaped) {
        const [providersRes, ownersRes] = await Promise.all([
          this.supabase.client.from('providers').select('id').ilike('business_name', `%${escaped}%`),
          this.supabase.client.from('users').select('id').or(`full_name.ilike.%${escaped}%,email.ilike.%${escaped}%,phone.ilike.%${escaped}%`),
        ]);
        providerIds = (providersRes.data ?? []).map((p) => p.id as string);
        ownerIds = (ownersRes.data ?? []).map((u) => u.id as string);
      }
    }

    let query = this.supabase.client
      .from('orders')
      .select(`${ORDER_LIST_COLUMNS}, providers(id, business_name)`, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) {
      const values = status.split(',').map((s) => s.trim()).filter(Boolean);
      query = values.length > 1 ? query.in('status', values) : query.eq('status', values[0] ?? status);
    }

    if (search) {
      const escaped = search.replace(/[,()]/g, ' ').trim();
      if (escaped) {
        const orFilters: string[] = [
          `order_number.ilike.%${escaped}%`,
          `special_notes.ilike.%${escaped}%`,
          `cancellation_reason.ilike.%${escaped}%`,
        ];
        if (providerIds.length) orFilters.push(`provider_id.in.(${providerIds.join(',')})`);
        if (ownerIds.length) orFilters.push(`owner_id.in.(${ownerIds.join(',')})`);
        query = query.or(orFilters.join(','));
      }
    }

    const { data, error, count } = await query.range(from, from + limit - 1);
    if (error) throw new BadRequestException(error.message);

    return paginate(data ?? [], count ?? 0, { page, limit });
  }

  async getOrderDetail(id: string) {
    const { data: order, error } = await this.supabase.client
      .from('orders')
      .select(`${ORDER_COLUMNS}, providers(id, business_name, address, phone), room_types(id, name, capacity, price_per_night), users!orders_owner_id_fkey(id, email, full_name, phone, avatar_url)`)
      .eq('id', id)
      .single();
    if (error || !order) {
      if (error?.code === 'PGRST116') throw new NotFoundException('Order not found');
      throw new BadRequestException(error?.message || 'Failed to load order');
    }

    const petIds = Array.isArray(order.pet_ids) ? (order.pet_ids as string[]) : [];
    const addOnIds = Array.isArray(order.add_on_ids) ? (order.add_on_ids as string[]) : [];

    const [petsRes, addOnsRes] = await Promise.all([
      petIds.length
        ? this.supabase.client.from('pets').select('id, name, species, breed, weight_kg, photos').in('id', petIds)
        : Promise.resolve({ data: [] as Record<string, unknown>[] }),
      addOnIds.length
        ? this.supabase.client.from('add_on_services').select('id, name, price, price_type').in('id', addOnIds)
        : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    ]);

    return {
      ...order,
      pets: petsRes.data ?? [],
      add_ons: addOnsRes.data ?? [],
    };
  }

  async getDisputes(params: PaginationParams) {
    const { page = 1, limit = 20 } = params;
    const from = (page - 1) * limit;

    const { data, error, count } = await this.supabase.client
      .from('disputes')
      .select(DISPUTE_COLUMNS, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);
    if (error) throw new BadRequestException(error.message);

    return paginate(data ?? [], count ?? 0, { page, limit });
  }

  async resolveDispute(userId: string, id: string, body: ResolveDisputeInput) {
    // Fetch dispute first to validate refund amount against order
    const { data: existingDispute, error: fetchErr } = await this.supabase.client
      .from('disputes')
      .select(`${DISPUTE_COLUMNS}, orders(id, total_price)`)
      .eq('id', id)
      .single();
    if (fetchErr || !existingDispute) throw new NotFoundException('Dispute not found');
    if (existingDispute.status === 'resolved')
      throw new BadRequestException('Dispute is already resolved');

    if (body.refund_amount != null) {
      const order = (existingDispute as Record<string, unknown>).orders as { total_price: number } | { total_price: number }[] | null;
      const totalPrice = Array.isArray(order) ? order[0]?.total_price : order?.total_price;
      if (totalPrice != null && body.refund_amount > Number(totalPrice))
        throw new BadRequestException(`Refund amount cannot exceed order total (${totalPrice})`);
    }

    const { data: dispute, error: disputeErr } = await this.supabase.client
      .from('disputes')
      .update({
        resolution: body.resolution,
        resolved_by: userId,
        resolved_at: new Date().toISOString(),
        status: 'resolved',
      })
      .eq('id', id)
      .select(DISPUTE_COLUMNS)
      .single();
    if (disputeErr || !dispute) throw new BadRequestException('Failed to resolve dispute');

    if (body.refund_amount != null) {
      await this.supabase.client
        .from('orders')
        .update({ refund_amount: body.refund_amount })
        .eq('id', dispute.order_id);
    }

    await this.logAction(userId, 'resolve_dispute', 'dispute', id, {
      resolution: body.resolution,
      refund_amount: body.refund_amount,
    });

    return dispute;
  }

  async getUsers(params: PaginationParams & { role?: string; search?: string }) {
    const { page = 1, limit = 20, role, search } = params;
    const from = (page - 1) * limit;

    let query = this.supabase.client
      .from('users')
      .select(USER_COLUMNS, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (role) query = query.eq('role', role);
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);

    const { data, error, count } = await query.range(from, from + limit - 1);
    if (error) throw new BadRequestException(error.message);

    return paginate(data ?? [], count ?? 0, { page, limit });
  }

  async getUserDetail(id: string) {
    const { data: user, error } = await this.supabase.client
      .from('users')
      .select(USER_COLUMNS)
      .eq('id', id)
      .single();
    if (error || !user) {
      if (error?.code === 'PGRST116') throw new NotFoundException('User not found');
      throw new BadRequestException(error?.message || 'Failed to load user');
    }

    let suspension: { reason: string | null; is_permanent: boolean; suspended_at: string; admin_id: string } | null = null;
    if (user.status === 'suspended' || user.status === 'banned') {
      const { data: log } = await this.supabase.client
        .from('admin_action_log')
        .select('admin_id, details, created_at')
        .eq('target_type', 'user')
        .eq('target_id', id)
        .in('action_type', ['suspend_user', 'ban_user'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (log) {
        const details = (log.details ?? {}) as Record<string, unknown>;
        suspension = {
          reason: (details.reason as string) || null,
          is_permanent: Boolean(details.is_permanent),
          suspended_at: log.created_at as string,
          admin_id: log.admin_id as string,
        };
      }
    }

    return { ...user, suspension };
  }

  async suspendUser(userId: string, id: string, body: SuspendUserInput) {
    const status = body.is_permanent ? 'banned' : 'suspended';

    const { data, error } = await this.supabase.client
      .from('users')
      .update({ status })
      .eq('id', id)
      .select(USER_COLUMNS)
      .single();
    if (error || !data) throw new NotFoundException('User not found');

    await this.logAction(userId, 'suspend_user', 'user', id, {
      reason: body.reason,
      is_permanent: body.is_permanent,
      status,
    });

    return data;
  }

  async getPets(params: PaginationParams & { species?: string; search?: string; ownerId?: string }) {
    const { page = 1, limit = 20, species, search, ownerId } = params;
    const from = (page - 1) * limit;

    let query = this.supabase.client
      .from('pets')
      .select(`${PET_COLUMNS}, users!pets_owner_id_fkey(id, email, full_name, avatar_url)`, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (ownerId) query = query.eq('owner_id', ownerId);
    if (species) {
      const list = species.split(',').map((s) => s.trim()).filter(Boolean);
      if (list.length === 1) query = query.eq('species', list[0]);
      else if (list.length > 1) query = query.in('species', list);
    }
    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error, count } = await query.range(from, from + limit - 1);
    if (error) throw new BadRequestException(error.message);

    return paginate(data ?? [], count ?? 0, { page, limit });
  }

  async getPetDetail(id: string) {
    const { data, error } = await this.supabase.client
      .from('pets')
      .select(`${PET_COLUMNS}, users!pets_owner_id_fkey(id, email, full_name, avatar_url, phone)`)
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

  async getFlaggedReviews(params: PaginationParams) {
    const { page = 1, limit = 20 } = params;
    const from = (page - 1) * limit;

    const { data, error, count } = await this.supabase.client
      .from('reviews')
      .select(REVIEW_COLUMNS, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);
    if (error) throw new BadRequestException(error.message);

    return paginate(data ?? [], count ?? 0, { page, limit });
  }

  async moderateReview(userId: string, id: string, body: ModerateReviewInput) {
    const updates: Record<string, unknown> = {
      is_visible: body.action === 'show',
    };
    if (body.action === 'hide') {
      updates.hidden_reason = body.reason || null;
      updates.hidden_by = userId;
    } else {
      updates.hidden_reason = null;
      updates.hidden_by = null;
    }

    const { data, error } = await this.supabase.client
      .from('reviews')
      .update(updates)
      .eq('id', id)
      .select(REVIEW_COLUMNS)
      .single();
    if (error || !data) throw new NotFoundException('Review not found');

    await this.logAction(userId, 'moderate_review', 'review', id, {
      action: body.action,
      reason: body.reason,
    });

    return data;
  }

  async getAnalytics(params: { month?: string } = {}) {
    const range = params.month ? this.monthToRange(params.month) : null;
    const cacheKey = `admin:analytics:${range ? params.month : 'lifetime'}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const applyRange = <Q extends { gte: (...a: any[]) => Q; lt: (...a: any[]) => Q }>(q: Q, column: string) =>
      range ? q.gte(column, range.start).lt(column, range.end) : q;

    let ordersQ = this.supabase.client.from('orders').select('status');
    ordersQ = applyRange(ordersQ as any, 'created_at') as typeof ordersQ;
    const { data: ordersForStatus } = await ordersQ;
    const statusCounts: Record<string, number> = {};
    (ordersForStatus || []).forEach((o: { status: string }) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });
    const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

    let revenueQ = this.supabase.client.from('orders').select('total_price').eq('status', 'completed');
    revenueQ = applyRange(revenueQ as any, range ? 'completed_at' : 'created_at') as typeof revenueQ;

    let invoicesQ = this.supabase.client
      .from('orders')
      .select('id, order_number, total_price, status, created_at, providers(id, business_name), users!orders_owner_id_fkey(full_name, email)')
      .not('total_price', 'is', null)
      .order('total_price', { ascending: false })
      .limit(10);
    invoicesQ = applyRange(invoicesQ as any, 'created_at') as typeof invoicesQ;

    let sellingQ = this.supabase.client
      .from('orders')
      .select('provider_id, total_price')
      .eq('status', 'completed');
    sellingQ = applyRange(sellingQ as any, range ? 'completed_at' : 'created_at') as typeof sellingQ;

    const [revenueResult, invoicesResult, sellingResult, topProvidersResult, reviewsResult] = await Promise.all([
      revenueQ,
      invoicesQ,
      sellingQ,
      this.supabase.client
        .from('providers')
        .select('id, business_name, rating_average, rating_count')
        .order('rating_average', { ascending: false })
        .limit(10),
      range
        ? this.supabase.client
            .from('reviews')
            .select('provider_id, rating_overall')
            .gte('created_at', range.start)
            .lt('created_at', range.end)
        : Promise.resolve({ data: [] as Array<{ provider_id: string; rating_overall: number }>, error: null }),
    ]);

    const totalRevenue = (revenueResult.data || []).reduce(
      (sum: number, o: { total_price: number | string | null }) => sum + (Number(o.total_price) || 0),
      0,
    );

    const sellingMap: Record<string, number> = {};
    (sellingResult.data || []).forEach((o: { provider_id: string; total_price: number | string | null }) => {
      if (!o.provider_id) return;
      sellingMap[o.provider_id] = (sellingMap[o.provider_id] || 0) + (Number(o.total_price) || 0);
    });
    const sellingTopIds = Object.entries(sellingMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    let topSellingProviders: Array<{ id: string; business_name: string; revenue: number; order_count: number }> = [];
    if (sellingTopIds.length) {
      const ids = sellingTopIds.map(([id]) => id);
      const { data: providers } = await this.supabase.client
        .from('providers')
        .select('id, business_name')
        .in('id', ids);
      const nameMap = new Map((providers || []).map((p: any) => [p.id, p.business_name]));
      const orderCount: Record<string, number> = {};
      (sellingResult.data || []).forEach((o: { provider_id: string }) => {
        if (o.provider_id) orderCount[o.provider_id] = (orderCount[o.provider_id] || 0) + 1;
      });
      topSellingProviders = sellingTopIds.map(([id, revenue]) => ({
        id,
        business_name: (nameMap.get(id) as string) || '—',
        revenue,
        order_count: orderCount[id] || 0,
      }));
    }

    let topReviewedProviders: Array<{ id: string; business_name: string; rating_average: number; rating_count: number }> = [];
    if (range) {
      const aggMap: Record<string, { sum: number; count: number }> = {};
      ((reviewsResult.data as Array<{ provider_id: string; rating_overall: number }>) || []).forEach((r) => {
        if (!r.provider_id) return;
        const a = aggMap[r.provider_id] || { sum: 0, count: 0 };
        a.sum += Number(r.rating_overall) || 0;
        a.count += 1;
        aggMap[r.provider_id] = a;
      });
      const reviewedTop = Object.entries(aggMap)
        .sort(([, a], [, b]) => b.count - a.count || b.sum / b.count - a.sum / a.count)
        .slice(0, 10);
      if (reviewedTop.length) {
        const ids = reviewedTop.map(([id]) => id);
        const { data: providers } = await this.supabase.client
          .from('providers')
          .select('id, business_name')
          .in('id', ids);
        const nameMap = new Map((providers || []).map((p: any) => [p.id, p.business_name]));
        topReviewedProviders = reviewedTop.map(([id, agg]) => ({
          id,
          business_name: (nameMap.get(id) as string) || '—',
          rating_average: agg.count ? agg.sum / agg.count : 0,
          rating_count: agg.count,
        }));
      }
    } else {
      const { data: providers } = await this.supabase.client
        .from('providers')
        .select('id, business_name, rating_average, rating_count')
        .gt('rating_count', 0)
        .order('rating_count', { ascending: false })
        .limit(10);
      topReviewedProviders = (providers || []).map((p: any) => ({
        id: p.id,
        business_name: p.business_name,
        rating_average: Number(p.rating_average) || 0,
        rating_count: Number(p.rating_count) || 0,
      }));
    }

    const result = {
      period: range ? { month: params.month } : { month: null },
      orders_by_status: statusBreakdown,
      total_revenue: totalRevenue,
      top_providers: topProvidersResult.data || [],
      top_invoices: (invoicesResult.data || []).map((o: any) => ({
        id: o.id,
        order_number: o.order_number,
        total_price: Number(o.total_price) || 0,
        status: o.status,
        created_at: o.created_at,
        provider_name: Array.isArray(o.providers) ? o.providers[0]?.business_name : o.providers?.business_name,
        owner_name: Array.isArray(o.users)
          ? (o.users[0]?.full_name || o.users[0]?.email)
          : (o.users?.full_name || o.users?.email),
      })),
      top_selling_providers: topSellingProviders,
      top_reviewed_providers: topReviewedProviders,
    };

    await this.cache.set(cacheKey, result, 300_000);
    return result;
  }

  private monthToRange(month: string): { start: string; end: string } {
    const match = /^(\d{4})-(\d{2})$/.exec(month);
    if (!match) throw new BadRequestException('month must be YYYY-MM');
    const year = Number(match[1]);
    const mon = Number(match[2]);
    if (mon < 1 || mon > 12) throw new BadRequestException('Invalid month');
    const start = new Date(Date.UTC(year, mon - 1, 1)).toISOString();
    const end = new Date(Date.UTC(mon === 12 ? year + 1 : year, mon === 12 ? 0 : mon, 1)).toISOString();
    return { start, end };
  }

  private readonly CONFIG_DEFAULTS = {
    commission_rate: 0.15,
    auto_confirm_hours: 4,
    payment_timeout_hours: 24,
  };

  async getConfig() {
    const cacheKey = 'admin:config';
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const { data } = await this.supabase.client
      .from('app_config')
      .select('key, value')
      .in('key', Object.keys(this.CONFIG_DEFAULTS));

    const config = { ...this.CONFIG_DEFAULTS };
    if (data) {
      for (const row of data as { key: string; value: string }[]) {
        if (row.key in config) {
          (config as Record<string, unknown>)[row.key] = Number(row.value) || row.value;
        }
      }
    }

    await this.cache.set(cacheKey, config, 600_000);
    return config;
  }

  async updateConfig(userId: string, body: UpdateConfigInput) {
    const entries = Object.entries(body).filter(([, v]) => v != null);
    for (const [key, value] of entries) {
      await this.supabase.client
        .from('app_config')
        .upsert({ key, value: String(value), updated_by: userId }, { onConflict: 'key' });
    }

    await this.cache.del('admin:config');
    await this.logAction(userId, 'update_config', 'config', 'app_config', body as Record<string, unknown>);

    return this.getConfig();
  }

  async sendMessage(adminId: string, orderId: string, body: AdminMessageInput) {
    const { data: order, error } = await this.supabase.client
      .from('orders')
      .select('id, owner_id, provider_id')
      .eq('id', orderId)
      .single();
    if (error || !order) throw new NotFoundException('Order not found');

    // Create notifications for both parties
    const notifications = [
      { user_id: order.owner_id, type: 'admin_message', title: 'Message from Admin', body: body.message, data: { order_id: orderId } },
      { user_id: order.provider_id, type: 'admin_message', title: 'Message from Admin', body: body.message, data: { order_id: orderId } },
    ].filter((n) => n.user_id);

    if (notifications.length) {
      await this.supabase.client.from('notifications').insert(notifications);
    }

    await this.logAction(adminId, 'send_message', 'order', orderId, {
      message: body.message,
      owner_id: order.owner_id,
      provider_id: order.provider_id,
    });

    return { message: 'Mediation message sent to both parties' };
  }

  async exportOrders() {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select(`${ORDER_LIST_COLUMNS}, providers(id, business_name)`)
      .order('created_at', { ascending: false })
      .limit(10000);
    if (error) throw new BadRequestException('Failed to export orders');

    return data || [];
  }

  private async logAction(
    adminId: string,
    actionType: string,
    targetType: string,
    targetId: string,
    details: Record<string, unknown>,
  ) {
    const { error } = await this.supabase.client.from('admin_action_log').insert({
      admin_id: adminId,
      action_type: actionType,
      target_type: targetType,
      target_id: targetId,
      details,
    });
    if (error) console.error(`Failed to log admin action: ${actionType}`, error.message);
  }
}
