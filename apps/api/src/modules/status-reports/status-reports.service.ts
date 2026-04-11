import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { STATUS_REPORT_COLUMNS, ORDER_COLUMNS } from '../../common/constants/columns';
import type { CreateStatusReportInput, ReactStatusReportInput, ReplyStatusReportInput } from '@petzone/validators';

@Injectable()
export class StatusReportsService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(userId: string, orderId: string, body: CreateStatusReportInput) {
    const { data: provider, error: provErr } = await this.supabase.client
      .from('providers')
      .select('id')
      .eq('user_id', userId)
      .single();
    if (provErr || !provider) throw new ForbiddenException('Only providers can create status reports');

    const { data: order, error: orderErr } = await this.supabase.client
      .from('orders')
      .select('id, provider_id')
      .eq('id', orderId)
      .single();
    if (orderErr || !order) throw new NotFoundException('Order not found');
    if (order.provider_id !== provider.id) throw new ForbiddenException('Not your order');

    const { data, error } = await this.supabase.client
      .from('status_reports')
      .insert({
        order_id: orderId,
        provider_id: provider.id,
        photos: body.photos || [],
        feeding_status: body.feeding_status || 'normal',
        activity_summary: body.activity_summary || null,
        note: body.note || null,
      })
      .select(STATUS_REPORT_COLUMNS)
      .single();
    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async findAll(userId: string, orderId: string) {
    await this.verifyOrderAccess(userId, orderId);

    const { data, error } = await this.supabase.client
      .from('status_reports')
      .select(STATUS_REPORT_COLUMNS)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async findOne(userId: string, orderId: string, reportId: string) {
    await this.verifyOrderAccess(userId, orderId);

    const { data, error } = await this.supabase.client
      .from('status_reports')
      .select(STATUS_REPORT_COLUMNS)
      .eq('id', reportId)
      .eq('order_id', orderId)
      .single();
    if (error || !data) throw new NotFoundException('Status report not found');

    return data;
  }

  async react(userId: string, reportId: string, body: ReactStatusReportInput) {
    const report = await this.getReportForOwner(userId, reportId);

    const { data, error } = await this.supabase.client
      .from('status_reports')
      .update({ owner_reaction: body.reaction })
      .eq('id', report.id)
      .select(STATUS_REPORT_COLUMNS)
      .single();
    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async reply(userId: string, reportId: string, body: ReplyStatusReportInput) {
    const report = await this.getReportForOwner(userId, reportId);

    const { data, error } = await this.supabase.client
      .from('status_reports')
      .update({ owner_reply: body.text, owner_replied_at: new Date().toISOString() })
      .eq('id', report.id)
      .select(STATUS_REPORT_COLUMNS)
      .single();
    if (error) throw new BadRequestException(error.message);

    return data;
  }

  private async getReportForOwner(userId: string, reportId: string) {
    const { data: report, error } = await this.supabase.client
      .from('status_reports')
      .select(`${STATUS_REPORT_COLUMNS}, orders!inner(owner_id)`)
      .eq('id', reportId)
      .single();
    if (error || !report) throw new NotFoundException('Status report not found');

    const orders = (report as Record<string, unknown>).orders as { owner_id: string }[] | { owner_id: string } | null;
    const ownerId = Array.isArray(orders) ? orders[0]?.owner_id : orders?.owner_id;
    if (ownerId !== userId) throw new ForbiddenException('Only the order owner can react/reply');

    return report;
  }

  private async verifyOrderAccess(userId: string, orderId: string) {
    const { data: order, error } = await this.supabase.client
      .from('orders')
      .select(`${ORDER_COLUMNS}, providers(id, user_id)`)
      .eq('id', orderId)
      .single();
    if (error || !order) throw new NotFoundException('Order not found');

    const isOwner = order.owner_id === userId;
    const prov = (order as Record<string, unknown>).providers as { user_id: string }[] | { user_id: string } | null;
    const isProvider = (Array.isArray(prov) ? prov[0]?.user_id : prov?.user_id) === userId;
    if (!isOwner && !isProvider) throw new ForbiddenException('No access to this order');
  }
}
