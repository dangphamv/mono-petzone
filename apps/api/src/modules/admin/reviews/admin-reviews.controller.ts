import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PAGINATION } from '@petzone/shared';
import { moderateReviewSchema } from '@petzone/validators';
import { Roles } from '../../../common/decorators/roles.decorator';
import { StaffAccess } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../../../common/interfaces/auth-user';
import { AdminReviewsService } from './admin-reviews.service';
import { ModerateReviewDto } from '../dto';
import {
  ok,
  okPaginated,
  EXAMPLE_REVIEW,
  EXAMPLE_MODERATE_REVIEW_RESULT,
  ERROR_400,
  ERROR_401,
  ERROR_403,
  ERROR_404,
} from '../../../common/swagger/examples';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Roles('admin')
@Controller('admin')
export class AdminReviewsController {
  constructor(private readonly service: AdminReviewsService) {}

  @Get('reviews/flagged')
  @StaffAccess('reviews:view')
  @ApiOperation({ summary: 'List flagged reviews' })
  @ApiResponse({ status: 200, description: 'Flagged reviews returned', schema: { example: okPaginated([EXAMPLE_REVIEW], 'Flagged reviews returned', 7) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  getFlaggedReviews(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.getFlaggedReviews({
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
    });
  }

  @Patch('reviews/:id/moderate')
  @StaffAccess('reviews:manage')
  @ApiOperation({ summary: 'Moderate a review' })
  @ApiResponse({ status: 200, description: 'Review moderated', schema: { example: ok(EXAMPLE_MODERATE_REVIEW_RESULT, 'Review moderated') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Review not found', schema: { example: ERROR_404 } })
  moderateReview(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(moderateReviewSchema)) body: ModerateReviewDto) {
    return this.service.moderateReview(user.id, id, body);
  }
}
