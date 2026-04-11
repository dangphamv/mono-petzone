import { Controller, Get, Post, Patch, Put, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PAGINATION } from '@petzone/shared';
import {
  verifyProviderSchema,
  requestInfoSchema,
  resolveDisputeSchema,
  suspendUserSchema,
  moderateReviewSchema,
  updateConfigSchema,
  adminMessageSchema,
} from '@petzone/validators';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../../common/interfaces/auth-user';
import { AdminService } from './admin.service';
import { VerifyProviderDto, RequestInfoDto, ResolveDisputeDto, SuspendUserDto, ModerateReviewDto, UpdateConfigDto, AdminMessageDto } from './dto';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard overview' })
  @ApiResponse({ status: 200, description: 'Dashboard data returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  getDashboard(@CurrentUser() user: AuthUser) {
    return this.adminService.getDashboard(user.id);
  }

  @Get('providers')
  @ApiOperation({ summary: 'List all providers for admin review' })
  @ApiResponse({ status: 200, description: 'Providers list returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  getProviders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getProviders({
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
      status,
    });
  }

  @Get('providers/:id')
  @ApiOperation({ summary: 'Get provider detail with verification history' })
  @ApiResponse({ status: 200, description: 'Provider detail returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  getProviderDetail(@Param('id') id: string) {
    return this.adminService.getProviderDetail(id);
  }

  @Patch('providers/:id/verify')
  @ApiOperation({ summary: 'Verify or reject a provider' })
  @ApiResponse({ status: 200, description: 'Provider verification updated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  verifyProvider(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(verifyProviderSchema)) body: VerifyProviderDto) {
    return this.adminService.verifyProvider(user.id, id, body);
  }

  @Post('providers/:id/request-info')
  @ApiOperation({ summary: 'Request additional info from provider' })
  @ApiResponse({ status: 201, description: 'Info request sent to provider' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  requestInfo(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(requestInfoSchema)) body: RequestInfoDto) {
    return this.adminService.requestInfo(user.id, id, body);
  }

  @Get('orders')
  @ApiOperation({ summary: 'List all orders' })
  @ApiResponse({ status: 200, description: 'Orders list returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  getOrders(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getOrders({
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
    });
  }

  @Get('orders/export')
  @ApiOperation({ summary: 'Export orders as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  exportOrders() {
    return this.adminService.exportOrders();
  }

  @Post('orders/:id/message')
  @ApiOperation({ summary: 'Send mediation message to both parties' })
  @ApiResponse({ status: 201, description: 'Message sent to both parties' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  sendMessage(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(adminMessageSchema)) body: AdminMessageDto) {
    return this.adminService.sendMessage(user.id, id, body);
  }

  @Get('disputes')
  @ApiOperation({ summary: 'List all disputes' })
  @ApiResponse({ status: 200, description: 'Disputes list returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  getDisputes(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getDisputes({
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
    });
  }

  @Patch('disputes/:id/resolve')
  @ApiOperation({ summary: 'Resolve a dispute' })
  @ApiResponse({ status: 200, description: 'Dispute resolved' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  resolveDispute(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(resolveDisputeSchema)) body: ResolveDisputeDto) {
    return this.adminService.resolveDispute(user.id, id, body);
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, description: 'Users list returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  getUsers(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getUsers({
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
    });
  }

  @Patch('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend or unsuspend a user' })
  @ApiResponse({ status: 200, description: 'User suspension updated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  suspendUser(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(suspendUserSchema)) body: SuspendUserDto) {
    return this.adminService.suspendUser(user.id, id, body);
  }

  @Get('reviews/flagged')
  @ApiOperation({ summary: 'List flagged reviews' })
  @ApiResponse({ status: 200, description: 'Flagged reviews returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  getFlaggedReviews(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getFlaggedReviews({
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
    });
  }

  @Patch('reviews/:id/moderate')
  @ApiOperation({ summary: 'Moderate a review' })
  @ApiResponse({ status: 200, description: 'Review moderated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  moderateReview(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(moderateReviewSchema)) body: ModerateReviewDto) {
    return this.adminService.moderateReview(user.id, id, body);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get platform analytics' })
  @ApiResponse({ status: 200, description: 'Analytics data returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Get('config')
  @ApiOperation({ summary: 'Get platform configuration' })
  @ApiResponse({ status: 200, description: 'Config returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  getConfig() {
    return this.adminService.getConfig();
  }

  @Put('config')
  @ApiOperation({ summary: 'Update platform configuration' })
  @ApiResponse({ status: 200, description: 'Config updated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  updateConfig(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(updateConfigSchema)) body: UpdateConfigDto) {
    return this.adminService.updateConfig(user.id, body);
  }
}
