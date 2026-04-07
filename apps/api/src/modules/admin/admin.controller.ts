import { Controller, Get, Patch, Put, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard overview' })
  @ApiResponse({ status: 200, description: 'Dashboard data returned' })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('providers')
  @ApiOperation({ summary: 'List all providers for admin review' })
  @ApiResponse({ status: 200, description: 'Providers list returned' })
  getProviders() {
    return this.adminService.getProviders();
  }

  @Patch('providers/:id/verify')
  @ApiOperation({ summary: 'Verify or reject a provider' })
  @ApiResponse({ status: 200, description: 'Provider verification updated' })
  verifyProvider(@Param('id') id: string, @Body() body: any) {
    return this.adminService.verifyProvider(id, body);
  }

  @Get('orders')
  @ApiOperation({ summary: 'List all orders' })
  @ApiResponse({ status: 200, description: 'Orders list returned' })
  getOrders() {
    return this.adminService.getOrders();
  }

  @Get('disputes')
  @ApiOperation({ summary: 'List all disputes' })
  @ApiResponse({ status: 200, description: 'Disputes list returned' })
  getDisputes() {
    return this.adminService.getDisputes();
  }

  @Patch('disputes/:id/resolve')
  @ApiOperation({ summary: 'Resolve a dispute' })
  @ApiResponse({ status: 200, description: 'Dispute resolved' })
  resolveDispute(@Param('id') id: string, @Body() body: any) {
    return this.adminService.resolveDispute(id, body);
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, description: 'Users list returned' })
  getUsers() {
    return this.adminService.getUsers();
  }

  @Patch('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend or unsuspend a user' })
  @ApiResponse({ status: 200, description: 'User suspension updated' })
  suspendUser(@Param('id') id: string, @Body() body: any) {
    return this.adminService.suspendUser(id, body);
  }

  @Get('reviews/flagged')
  @ApiOperation({ summary: 'List flagged reviews' })
  @ApiResponse({ status: 200, description: 'Flagged reviews returned' })
  getFlaggedReviews() {
    return this.adminService.getFlaggedReviews();
  }

  @Patch('reviews/:id/moderate')
  @ApiOperation({ summary: 'Moderate a review' })
  @ApiResponse({ status: 200, description: 'Review moderated' })
  moderateReview(@Param('id') id: string, @Body() body: any) {
    return this.adminService.moderateReview(id, body);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get platform analytics' })
  @ApiResponse({ status: 200, description: 'Analytics data returned' })
  getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Get('config')
  @ApiOperation({ summary: 'Get platform configuration' })
  @ApiResponse({ status: 200, description: 'Config returned' })
  getConfig() {
    return this.adminService.getConfig();
  }

  @Put('config')
  @ApiOperation({ summary: 'Update platform configuration' })
  @ApiResponse({ status: 200, description: 'Config updated' })
  updateConfig(@Body() body: any) {
    return this.adminService.updateConfig(body);
  }
}
