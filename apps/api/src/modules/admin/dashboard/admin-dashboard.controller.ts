import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../../common/interfaces/auth-user';
import { AdminDashboardService } from './admin-dashboard.service';
import {
  ok,
  EXAMPLE_ADMIN_DASHBOARD,
  EXAMPLE_ADMIN_ANALYTICS,
  ERROR_401,
  ERROR_403,
} from '../../../common/swagger/examples';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Roles('admin')
@Controller('admin')
export class AdminDashboardController {
  constructor(private readonly service: AdminDashboardService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard overview' })
  @ApiResponse({ status: 200, description: 'Dashboard data returned', schema: { example: ok(EXAMPLE_ADMIN_DASHBOARD) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  getDashboard(@CurrentUser() user: AuthUser) {
    return this.service.getDashboard(user.id);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get platform analytics (lifetime or filtered by month YYYY-MM)' })
  @ApiResponse({ status: 200, description: 'Analytics data returned', schema: { example: ok(EXAMPLE_ADMIN_ANALYTICS) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  getAnalytics(@Query('month') month?: string) {
    return this.service.getAnalytics({ month });
  }
}
