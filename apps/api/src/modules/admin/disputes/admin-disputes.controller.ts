import { Controller, Get, Patch, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PAGINATION } from '@petzone/shared';
import { resolveDisputeSchema, adminCreateDisputeSchema } from '@petzone/validators';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../../../common/interfaces/auth-user';
import { AdminDisputesService } from './admin-disputes.service';
import { ResolveDisputeDto, AdminCreateDisputeDto } from '../dto';
import {
  ok,
  okPaginated,
  EXAMPLE_DISPUTE,
  EXAMPLE_DISPUTE_RESOLUTION,
  ERROR_400,
  ERROR_401,
  ERROR_403,
  ERROR_404,
} from '../../../common/swagger/examples';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Roles('admin')
@Controller('admin')
export class AdminDisputesController {
  constructor(private readonly service: AdminDisputesService) {}

  @Get('disputes')
  @ApiOperation({ summary: 'List all disputes' })
  @ApiResponse({ status: 200, description: 'Disputes list returned', schema: { example: okPaginated([EXAMPLE_DISPUTE], 'Disputes list returned', 3) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  getDisputes(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.getDisputes({
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
    });
  }

  @Post('disputes')
  @ApiOperation({ summary: 'Create a dispute on behalf of an owner or provider' })
  @ApiResponse({ status: 201, description: 'Dispute created', schema: { example: ok(EXAMPLE_DISPUTE, 'Dispute created') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Order not found', schema: { example: ERROR_404 } })
  createDispute(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(adminCreateDisputeSchema)) body: AdminCreateDisputeDto) {
    return this.service.createDispute(user.id, body);
  }

  @Patch('disputes/:id/resolve')
  @ApiOperation({ summary: 'Resolve a dispute' })
  @ApiResponse({ status: 200, description: 'Dispute resolved', schema: { example: ok(EXAMPLE_DISPUTE_RESOLUTION, 'Dispute resolved') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Dispute not found', schema: { example: ERROR_404 } })
  resolveDispute(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(resolveDisputeSchema)) body: ResolveDisputeDto) {
    return this.service.resolveDispute(user.id, id, body);
  }
}
