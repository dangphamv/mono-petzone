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
import {
  ok,
  okPaginated,
  EXAMPLE_ADMIN_DASHBOARD,
  EXAMPLE_ADMIN_ANALYTICS,
  EXAMPLE_ADMIN_CONFIG,
  EXAMPLE_PROVIDER,
  EXAMPLE_PROVIDER_DETAIL,
  EXAMPLE_VERIFY_PROVIDER_RESULT,
  EXAMPLE_REQUEST_INFO_RESULT,
  EXAMPLE_ORDER_LIST_ITEM,
  EXAMPLE_EXPORT_ORDERS,
  EXAMPLE_ADMIN_MESSAGE_RESULT,
  EXAMPLE_DISPUTE,
  EXAMPLE_DISPUTE_RESOLUTION,
  EXAMPLE_USER,
  EXAMPLE_SUSPEND_USER_RESULT,
  EXAMPLE_REVIEW,
  EXAMPLE_MODERATE_REVIEW_RESULT,
  ERROR_400,
  ERROR_401,
  ERROR_403,
  ERROR_404,
} from '../../common/swagger/examples';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard overview' })
  @ApiResponse({ status: 200, description: 'Dashboard data returned', schema: { example: ok(EXAMPLE_ADMIN_DASHBOARD) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  getDashboard(@CurrentUser() user: AuthUser) {
    return this.adminService.getDashboard(user.id);
  }

  @Get('providers')
  @ApiOperation({ summary: 'List all providers for admin review' })
  @ApiResponse({ status: 200, description: 'Providers list returned', schema: { example: okPaginated([EXAMPLE_PROVIDER], 'Providers list returned', 320) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
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
  @ApiResponse({ status: 200, description: 'Provider detail returned', schema: { example: ok(EXAMPLE_PROVIDER_DETAIL) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Provider not found', schema: { example: ERROR_404 } })
  getProviderDetail(@Param('id') id: string) {
    return this.adminService.getProviderDetail(id);
  }

  @Patch('providers/:id/verify')
  @ApiOperation({ summary: 'Verify or reject a provider' })
  @ApiResponse({ status: 200, description: 'Provider verification updated', schema: { example: ok(EXAMPLE_VERIFY_PROVIDER_RESULT, 'Provider verification updated') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Provider not found', schema: { example: ERROR_404 } })
  verifyProvider(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(verifyProviderSchema)) body: VerifyProviderDto) {
    return this.adminService.verifyProvider(user.id, id, body);
  }

  @Post('providers/:id/request-info')
  @ApiOperation({ summary: 'Request additional info from provider' })
  @ApiResponse({ status: 201, description: 'Info request sent to provider', schema: { example: ok(EXAMPLE_REQUEST_INFO_RESULT, 'Info request sent to provider') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Provider not found', schema: { example: ERROR_404 } })
  requestInfo(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(requestInfoSchema)) body: RequestInfoDto) {
    return this.adminService.requestInfo(user.id, id, body);
  }

  @Get('orders')
  @ApiOperation({ summary: 'List all orders' })
  @ApiResponse({ status: 200, description: 'Orders list returned', schema: { example: okPaginated([EXAMPLE_ORDER_LIST_ITEM], 'Orders list returned', 2017) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  getOrders(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getOrders({
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
    });
  }

  @Get('orders/export')
  @ApiOperation({ summary: 'Export orders as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file returned', schema: { example: ok(EXAMPLE_EXPORT_ORDERS, 'Export ready') } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  exportOrders() {
    return this.adminService.exportOrders();
  }

  @Post('orders/:id/message')
  @ApiOperation({ summary: 'Send mediation message to both parties' })
  @ApiResponse({ status: 201, description: 'Message sent to both parties', schema: { example: ok(EXAMPLE_ADMIN_MESSAGE_RESULT, 'Message sent to both parties') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Order not found', schema: { example: ERROR_404 } })
  sendMessage(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(adminMessageSchema)) body: AdminMessageDto) {
    return this.adminService.sendMessage(user.id, id, body);
  }

  @Get('disputes')
  @ApiOperation({ summary: 'List all disputes' })
  @ApiResponse({ status: 200, description: 'Disputes list returned', schema: { example: okPaginated([EXAMPLE_DISPUTE], 'Disputes list returned', 3) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  getDisputes(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getDisputes({
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
    });
  }

  @Patch('disputes/:id/resolve')
  @ApiOperation({ summary: 'Resolve a dispute' })
  @ApiResponse({ status: 200, description: 'Dispute resolved', schema: { example: ok(EXAMPLE_DISPUTE_RESOLUTION, 'Dispute resolved') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Dispute not found', schema: { example: ERROR_404 } })
  resolveDispute(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(resolveDisputeSchema)) body: ResolveDisputeDto) {
    return this.adminService.resolveDispute(user.id, id, body);
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, description: 'Users list returned', schema: { example: okPaginated([EXAMPLE_USER], 'Users list returned', 12450) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  getUsers(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getUsers({
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
    });
  }

  @Patch('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend or unsuspend a user' })
  @ApiResponse({ status: 200, description: 'User suspension updated', schema: { example: ok(EXAMPLE_SUSPEND_USER_RESULT, 'User suspension updated') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'User not found', schema: { example: ERROR_404 } })
  suspendUser(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(suspendUserSchema)) body: SuspendUserDto) {
    return this.adminService.suspendUser(user.id, id, body);
  }

  @Get('reviews/flagged')
  @ApiOperation({ summary: 'List flagged reviews' })
  @ApiResponse({ status: 200, description: 'Flagged reviews returned', schema: { example: okPaginated([EXAMPLE_REVIEW], 'Flagged reviews returned', 7) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  getFlaggedReviews(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getFlaggedReviews({
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
    });
  }

  @Patch('reviews/:id/moderate')
  @ApiOperation({ summary: 'Moderate a review' })
  @ApiResponse({ status: 200, description: 'Review moderated', schema: { example: ok(EXAMPLE_MODERATE_REVIEW_RESULT, 'Review moderated') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Review not found', schema: { example: ERROR_404 } })
  moderateReview(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(moderateReviewSchema)) body: ModerateReviewDto) {
    return this.adminService.moderateReview(user.id, id, body);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get platform analytics' })
  @ApiResponse({ status: 200, description: 'Analytics data returned', schema: { example: ok(EXAMPLE_ADMIN_ANALYTICS) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Get('config')
  @ApiOperation({ summary: 'Get platform configuration' })
  @ApiResponse({ status: 200, description: 'Config returned', schema: { example: ok(EXAMPLE_ADMIN_CONFIG) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  getConfig() {
    return this.adminService.getConfig();
  }

  @Put('config')
  @ApiOperation({ summary: 'Update platform configuration' })
  @ApiResponse({ status: 200, description: 'Config updated', schema: { example: ok(EXAMPLE_ADMIN_CONFIG, 'Config updated') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  updateConfig(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(updateConfigSchema)) body: UpdateConfigDto) {
    return this.adminService.updateConfig(user.id, body);
  }
}
