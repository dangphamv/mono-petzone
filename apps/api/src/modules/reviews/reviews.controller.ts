import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PAGINATION } from '@petzone/shared';
import { createReviewSchema, type CreateReviewInput, respondReviewSchema, type RespondReviewInput } from '@petzone/validators';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../../common/interfaces/auth-user';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, RespondReviewDto } from './dto';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a review for a completed order' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or review window expired (7 days)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 409, description: 'Review already exists for this order' })
  create(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(createReviewSchema)) body: CreateReviewInput) {
    return this.reviewsService.create(user.id, body);
  }

  @Get('provider/:providerId')
  @Public()
  @ApiOperation({ summary: 'List reviews for a provider' })
  @ApiResponse({ status: 200, description: 'Provider reviews returned' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  findByProvider(
    @Param('providerId') providerId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reviewsService.findByProvider(providerId, {
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
    });
  }

  @Post(':id/respond')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Respond to a review (provider only)' })
  @ApiResponse({ status: 201, description: 'Response added to review' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only the provider can respond' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @ApiResponse({ status: 409, description: 'Response already exists' })
  respond(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(respondReviewSchema)) body: RespondReviewInput) {
    return this.reviewsService.respond(user.id, id, body);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a specific review' })
  @ApiResponse({ status: 200, description: 'Review details returned' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }
}
