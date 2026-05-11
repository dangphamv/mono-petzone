import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { ModerateReviewInput } from '@petzone/validators';
import { SupabaseService } from '../../supabase/supabase.service';
import { REVIEW_COLUMNS } from '../../../common/constants/columns';
import { paginate, type PaginationParams } from '../../../common/utils/pagination';
import { AdminActionLogService } from '../_shared/admin-action-log.service';

@Injectable()
export class AdminReviewsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly actionLog: AdminActionLogService,
  ) {}

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

    await this.actionLog.log(userId, 'moderate_review', 'review', id, {
      action: body.action,
      reason: body.reason,
    });

    return data;
  }
}
