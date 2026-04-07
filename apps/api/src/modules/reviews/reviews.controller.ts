import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a review for a completed order' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  create(@Body() body: any) {
    return this.reviewsService.create(body);
  }

  @Get('provider/:providerId')
  @Public()
  @ApiOperation({ summary: 'List reviews for a provider' })
  @ApiResponse({ status: 200, description: 'Provider reviews returned' })
  findByProvider(@Param('providerId') providerId: string) {
    return this.reviewsService.findByProvider(providerId);
  }

  @Post(':id/respond')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Respond to a review (provider only)' })
  @ApiResponse({ status: 201, description: 'Response added to review' })
  respond(@Param('id') id: string, @Body() body: any) {
    return this.reviewsService.respond(id, body);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a specific review' })
  @ApiResponse({ status: 200, description: 'Review details returned' })
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }
}
