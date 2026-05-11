import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly supabase: SupabaseService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async getDashboard(_userId: string) {
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
}
