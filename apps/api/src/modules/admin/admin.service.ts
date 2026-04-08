import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AdminService {
  constructor(private readonly supabase: SupabaseService) {}

  async getDashboard(userId: string) {
    const [users, providers, pendingVerifications, activeOrders, openDisputes] = await Promise.all([
      this.supabase.client.from('users').select('id', { count: 'exact', head: true }),
      this.supabase.client.from('providers').select('id', { count: 'exact', head: true }),
      this.supabase.client.from('providers').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
      this.supabase.client.from('orders').select('id', { count: 'exact', head: true }).in('status', ['pending', 'confirmed', 'checked_in', 'in_progress', 'check_out']),
      this.supabase.client.from('disputes').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    ]);

    return {
      total_users: users.count || 0,
      total_providers: providers.count || 0,
      pending_verifications: pendingVerifications.count || 0,
      active_orders: activeOrders.count || 0,
      open_disputes: openDisputes.count || 0,
    };
  }

  async getProviders() {
    const { data, error } = await this.supabase.client
      .from('providers')
      .select('*, users!providers_user_id_fkey(id, email, full_name, avatar_url)')
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async verifyProvider(userId: string, id: string, body: any) {
    const { data, error } = await this.supabase.client
      .from('providers')
      .update({
        verification_status: body.status,
        verification_notes: body.notes || null,
        verified_at: new Date().toISOString(),
        verified_by: userId,
      })
      .eq('id', id)
      .select()
      .single();
    if (error || !data) throw new NotFoundException('Provider not found');

    await this.logAction(userId, 'verify_provider', 'provider', id, {
      status: body.status,
      notes: body.notes,
    });

    return data;
  }

  async getOrders() {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select('*, providers(id, business_name)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async getDisputes() {
    const { data, error } = await this.supabase.client
      .from('disputes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async resolveDispute(userId: string, id: string, body: any) {
    const { data: dispute, error: disputeErr } = await this.supabase.client
      .from('disputes')
      .update({
        resolution: body.resolution,
        resolved_by: userId,
        resolved_at: new Date().toISOString(),
        status: 'resolved',
      })
      .eq('id', id)
      .select()
      .single();
    if (disputeErr || !dispute) throw new NotFoundException('Dispute not found');

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

  async getUsers() {
    const { data, error } = await this.supabase.client
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async suspendUser(userId: string, id: string, body: any) {
    const status = body.is_permanent ? 'banned' : 'suspended';

    const { data, error } = await this.supabase.client
      .from('users')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error || !data) throw new NotFoundException('User not found');

    await this.logAction(userId, 'suspend_user', 'user', id, {
      reason: body.reason,
      is_permanent: body.is_permanent,
      status,
    });

    return data;
  }

  async getFlaggedReviews() {
    const { data, error } = await this.supabase.client
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async moderateReview(userId: string, id: string, body: any) {
    const updates: any = {
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
      .select()
      .single();
    if (error || !data) throw new NotFoundException('Review not found');

    await this.logAction(userId, 'moderate_review', 'review', id, {
      action: body.action,
      reason: body.reason,
    });

    return data;
  }

  async getAnalytics() {
    const { data: ordersByStatus, error: obsErr } = await this.supabase.client
      .rpc('get_orders_by_status_count');

    let statusBreakdown = ordersByStatus;
    if (obsErr) {
      const { data: orders } = await this.supabase.client
        .from('orders')
        .select('status');
      const counts: Record<string, number> = {};
      (orders || []).forEach((o: any) => {
        counts[o.status] = (counts[o.status] || 0) + 1;
      });
      statusBreakdown = Object.entries(counts).map(([status, count]) => ({ status, count }));
    }

    const { data: revenueData } = await this.supabase.client
      .from('orders')
      .select('total_price')
      .eq('status', 'completed');
    const totalRevenue = (revenueData || []).reduce(
      (sum: number, o: any) => sum + (Number(o.total_price) || 0),
      0,
    );

    const { data: topProviders } = await this.supabase.client
      .from('providers')
      .select('id, business_name, rating_average, rating_count')
      .order('rating_average', { ascending: false })
      .limit(10);

    return {
      orders_by_status: statusBreakdown || [],
      total_revenue: totalRevenue,
      top_providers: topProviders || [],
    };
  }

  async getConfig() {
    return {
      commission_rate: 0.15,
      auto_confirm_hours: 4,
      payment_timeout_hours: 24,
    };
  }

  async updateConfig(userId: string, body: any) {
    const defaults = {
      commission_rate: 0.15,
      auto_confirm_hours: 4,
      payment_timeout_hours: 24,
    };
    return { ...defaults, ...body };
  }

  private async logAction(
    adminId: string,
    actionType: string,
    targetType: string,
    targetId: string,
    details: any,
  ) {
    await this.supabase.client.from('admin_action_log').insert({
      admin_id: adminId,
      action_type: actionType,
      target_type: targetType,
      target_id: targetId,
      details,
    });
  }
}
