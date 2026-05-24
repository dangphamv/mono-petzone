import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PAGINATION } from '@petzone/shared';
import {
  verifyProviderSchema,
  adminUpdateProviderSchema,
  adminCreateProviderSchema,
  requestInfoSchema,
} from '@petzone/validators';
import type { AdminUpdateProviderInput, AdminCreateProviderInput } from '@petzone/validators';
import { Roles } from '../../../common/decorators/roles.decorator';
import { StaffAccess } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../../../common/interfaces/auth-user';
import { AdminProvidersService } from './admin-providers.service';
import { VerifyProviderDto, RequestInfoDto } from '../dto';
import {
  ok,
  okPaginated,
  EXAMPLE_PROVIDER,
  EXAMPLE_PROVIDER_DETAIL,
  EXAMPLE_VERIFY_PROVIDER_RESULT,
  EXAMPLE_REQUEST_INFO_RESULT,
  ERROR_400,
  ERROR_401,
  ERROR_403,
  ERROR_404,
} from '../../../common/swagger/examples';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Roles('admin')
@Controller('admin')
export class AdminProvidersController {
  constructor(private readonly service: AdminProvidersService) {}

  @Get('providers')
  @StaffAccess('providers:view')
  @ApiOperation({ summary: 'List all providers for admin review' })
  @ApiResponse({ status: 200, description: 'Providers list returned', schema: { example: okPaginated([EXAMPLE_PROVIDER], 'Providers list returned', 320) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  getProviders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
  ) {
    return this.service.getProviders({
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
      status,
      search,
      sort,
      order,
    });
  }

  @Post('providers')
  @StaffAccess('providers:manage')
  @ApiOperation({ summary: 'Create a provider profile for a user (admin)' })
  @ApiResponse({ status: 201, description: 'Provider created', schema: { example: ok(EXAMPLE_PROVIDER, 'Provider created') } })
  @ApiResponse({ status: 400, description: 'Validation error or user already has provider profile', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Owner user not found', schema: { example: ERROR_404 } })
  createProvider(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(adminCreateProviderSchema)) body: AdminCreateProviderInput,
  ) {
    return this.service.createProvider(user.id, body);
  }

  @Get('providers/:id/rooms')
  @StaffAccess('providers:view')
  @ApiOperation({ summary: 'List active room types for a provider' })
  @ApiResponse({ status: 200, description: 'Rooms returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  getProviderRooms(@Param('id') id: string) {
    return this.service.getProviderRooms(id);
  }

  @Get('providers/:id/addons')
  @StaffAccess('providers:view')
  @ApiOperation({ summary: 'List active add-on services for a provider' })
  @ApiResponse({ status: 200, description: 'Add-ons returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  getProviderAddOns(@Param('id') id: string) {
    return this.service.getProviderAddOns(id);
  }

  @Get('providers/:id')
  @StaffAccess('providers:view')
  @ApiOperation({ summary: 'Get provider detail with verification history' })
  @ApiResponse({ status: 200, description: 'Provider detail returned', schema: { example: ok(EXAMPLE_PROVIDER_DETAIL) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Provider not found', schema: { example: ERROR_404 } })
  getProviderDetail(@Param('id') id: string) {
    return this.service.getProviderDetail(id);
  }

  @Patch('providers/:id/verify')
  @StaffAccess('providers:manage')
  @ApiOperation({ summary: 'Verify or reject a provider' })
  @ApiResponse({ status: 200, description: 'Provider verification updated', schema: { example: ok(EXAMPLE_VERIFY_PROVIDER_RESULT, 'Provider verification updated') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Provider not found', schema: { example: ERROR_404 } })
  verifyProvider(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(verifyProviderSchema)) body: VerifyProviderDto) {
    return this.service.verifyProvider(user.id, id, body);
  }

  @Patch('providers/:id')
  @StaffAccess('providers:manage')
  @ApiOperation({ summary: 'Update provider basic info (admin)' })
  @ApiResponse({ status: 200, description: 'Provider updated', schema: { example: ok(EXAMPLE_PROVIDER, 'Provider updated') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Provider not found', schema: { example: ERROR_404 } })
  updateProvider(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminUpdateProviderSchema)) body: AdminUpdateProviderInput,
  ) {
    return this.service.updateProvider(user.id, id, body);
  }

  @Post('providers/:id/request-info')
  @StaffAccess('providers:manage')
  @ApiOperation({ summary: 'Request additional info from provider' })
  @ApiResponse({ status: 201, description: 'Info request sent to provider', schema: { example: ok(EXAMPLE_REQUEST_INFO_RESULT, 'Info request sent to provider') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Provider not found', schema: { example: ERROR_404 } })
  requestInfo(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(requestInfoSchema)) body: RequestInfoDto) {
    return this.service.requestInfo(user.id, id, body);
  }
}
