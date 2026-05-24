import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PAGINATION } from '@petzone/shared';
import { suspendUserSchema, adminCreateAccountSchema, updateStaffPermissionsSchema } from '@petzone/validators';
import type { AdminCreateAccountInput, UpdateStaffPermissionsInput } from '@petzone/validators';
import { Roles } from '../../../common/decorators/roles.decorator';
import { StaffAccess } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../../../common/interfaces/auth-user';
import { AdminUsersService } from './admin-users.service';
import { SuspendUserDto } from '../dto';
import {
  ok,
  okPaginated,
  EXAMPLE_USER,
  EXAMPLE_SUSPEND_USER_RESULT,
  ERROR_400,
  ERROR_401,
  ERROR_403,
  ERROR_404,
} from '../../../common/swagger/examples';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Roles('admin')
@Controller('admin')
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  @Get('users')
  @StaffAccess('users:view')
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, description: 'Users list returned', schema: { example: okPaginated([EXAMPLE_USER], 'Users list returned', 12450) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getUsers({
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
      role,
      search,
    });
  }

  @Post('users')
  @ApiOperation({ summary: 'Create a new admin or staff account (email + password login). Admin-only.' })
  @ApiResponse({ status: 201, description: 'Account created', schema: { example: ok(EXAMPLE_USER, 'Account created') } })
  @ApiResponse({ status: 400, description: 'Email already exists or validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  createAccount(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(adminCreateAccountSchema)) body: AdminCreateAccountInput) {
    return this.service.createAccount(user.id, body);
  }

  @Patch('users/:id/permissions')
  @ApiOperation({ summary: 'Update a staff account permissions. Admin-only.' })
  @ApiResponse({ status: 200, description: 'Permissions updated' })
  @ApiResponse({ status: 400, description: 'Target is not a staff account', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'User not found', schema: { example: ERROR_404 } })
  updatePermissions(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateStaffPermissionsSchema)) body: UpdateStaffPermissionsInput,
  ) {
    return this.service.updateStaffPermissions(user.id, id, body.permissions);
  }

  @Get('users/:id')
  @StaffAccess('users:view')
  @ApiOperation({ summary: 'Get user detail with suspension info' })
  @ApiResponse({ status: 200, description: 'User detail returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'User not found', schema: { example: ERROR_404 } })
  getUserDetail(@Param('id') id: string) {
    return this.service.getUserDetail(id);
  }

  @Patch('users/:id/suspend')
  @StaffAccess('users:manage')
  @ApiOperation({ summary: 'Suspend or unsuspend a user' })
  @ApiResponse({ status: 200, description: 'User suspension updated', schema: { example: ok(EXAMPLE_SUSPEND_USER_RESULT, 'User suspension updated') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'User not found', schema: { example: ERROR_404 } })
  suspendUser(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(suspendUserSchema)) body: SuspendUserDto) {
    return this.service.suspendUser(user.id, id, body);
  }

  @Patch('users/:id/reactivate')
  @StaffAccess('users:manage')
  @ApiOperation({ summary: 'Reactivate a suspended or banned user (status → active)' })
  @ApiResponse({ status: 200, description: 'User reactivated' })
  @ApiResponse({ status: 400, description: 'User is already active', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'User not found', schema: { example: ERROR_404 } })
  reactivateUser(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { note?: string },
  ) {
    return this.service.reactivateUser(user.id, id, body?.note);
  }
}
