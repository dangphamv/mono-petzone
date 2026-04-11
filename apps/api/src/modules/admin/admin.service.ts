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
  RequestInfoInput,
  ResolveDisputeInput,
  SuspendUserInput,
  ModerateReviewInput,
  UpdateConfigInput,
  AdminMessageInput,
} from '@petzone/validators';
import { SupabaseService } from '../supabase/supabase.service';
import { PROVIDER_COLUMNS, ORDER_LIST_COLUMNS, DISPUTE_COLUMNS, USER_COLUMNS, REVIEW_COLUMNS } from '../../common/constants/columns';
import { paginate, type PaginationParams } from '../../common/utils/pagination';

@Injectable()
export class AdminService {
  constructor(
    private readonly supabase: SupabaseService,
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

  async getProviders(params: PaginationParams & { status?: string }) {
    const { page = 1, limit = 20, status } = params;
    const from = (page - 1) * limit;

    let query = this.supabase.client
      .from('providers')
      .select(`${PROVIDER_COLUMNS}, users!providers_user_id_fkey(id, email, full_name, avatar_url)`, { count: 'exact' })
      .order('created_at', { ascending: true });

    if (status) query = query.eq('verification_status', status);

    const { data, error, count } = await query.range(from, from + limit - 1);
    if (error) throw new BadRequestException(error.message);

    return paginate(data ?? [], count ?? 0, { page, limit });
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

  async getOrders(params: PaginationParams) {
    const { page = 1, limit = 20 } = params;
    const from = (page - 1) * limit;

    const { data, error, count } = await this.supabase.client
      .from('orders')
      .select(`${ORDER_LIST_COLUMNS}, providers(id, business_name)`, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);
    if (error) throw new BadRequestException(error.message);

    return paginate(data ?? [], count ?? 0, { page, limit });
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

  async getUsers(params: PaginationParams) {
    const { page = 1, limit = 20 } = params;
    const from = (page - 1) * limit;

    const { data, error, count } = await this.supabase.client
      .from('users')
      .select(USER_COLUMNS, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);
    if (error) throw new BadRequestException(error.message);

    return paginate(data ?? [], count ?? 0, { page, limit });
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

  async getAnalytics() {
    const cacheKey = 'admin:analytics';
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const { data: ordersByStatus, error: obsErr } = await this.supabase.client
      .rpc('get_orders_by_status_count');

    let statusBreakdown = ordersByStatus;
    if (obsErr) {
      const { data: orders } = await this.supabase.client
        .from('orders')
        .select('status');
      const counts: Record<string, number> = {};
      (orders || []).forEach((o: { status: string }) => {
        counts[o.status] = (counts[o.status] || 0) + 1;
      });
      statusBreakdown = Object.entries(counts).map(([status, count]) => ({ status, count }));
    }

    const [revenueResult, topProvidersResult] = await Promise.all([
      this.supabase.client
        .from('orders')
        .select('total_price')
        .eq('status', 'completed'),
      this.supabase.client
        .from('providers')
        .select('id, business_name, rating_average, rating_count')
        .order('rating_average', { ascending: false })
        .limit(10),
    ]);

    const totalRevenue = (revenueResult.data || []).reduce(
      (sum: number, o: { total_price: number | string | null }) => sum + (Number(o.total_price) || 0),
      0,
    );

    const result = {
      orders_by_status: statusBreakdown || [],
      total_revenue: totalRevenue,
      top_providers: topProvidersResult.data || [],
    };

    await this.cache.set(cacheKey, result, 300_000);
    return result;
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
