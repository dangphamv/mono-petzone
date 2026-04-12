import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createStatusReportSchema, reactStatusReportSchema, replyStatusReportSchema } from '@petzone/validators';
import type { AuthUser } from '../../common/interfaces/auth-user';
import { StatusReportsService } from './status-reports.service';
import { CreateStatusReportDto, ReactStatusReportDto, ReplyStatusReportDto } from './dto';
import {
  ok,
  EXAMPLE_STATUS_REPORT,
  ERROR_400,
  ERROR_401,
  ERROR_403,
  ERROR_404,
} from '../../common/swagger/examples';

@ApiTags('Status Reports')
@ApiBearerAuth('access-token')
@Controller('status-reports')
export class StatusReportsController {
  constructor(private readonly statusReportsService: StatusReportsService) {}

  @Post(':orderId')
  @ApiOperation({ summary: 'Create a daily status report' })
  @ApiResponse({ status: 201, description: 'Status report created', schema: { example: ok(EXAMPLE_STATUS_REPORT, 'Status report created') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Only the provider can create status reports', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Order not found', schema: { example: ERROR_404 } })
  create(
    @CurrentUser() user: AuthUser,
    @Param('orderId') orderId: string,
    @Body(new ZodValidationPipe(createStatusReportSchema)) body: CreateStatusReportDto,
  ) {
    return this.statusReportsService.create(user.id, orderId, body);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'List status reports for an order' })
  @ApiResponse({ status: 200, description: 'Status reports returned', schema: { example: ok([EXAMPLE_STATUS_REPORT]) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 404, description: 'Order not found', schema: { example: ERROR_404 } })
  findAll(@CurrentUser() user: AuthUser, @Param('orderId') orderId: string) {
    return this.statusReportsService.findAll(user.id, orderId);
  }

  @Get(':orderId/:reportId')
  @ApiOperation({ summary: 'Get a specific status report' })
  @ApiResponse({ status: 200, description: 'Status report returned', schema: { example: ok(EXAMPLE_STATUS_REPORT) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 404, description: 'Report not found', schema: { example: ERROR_404 } })
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('orderId') orderId: string,
    @Param('reportId') reportId: string,
  ) {
    return this.statusReportsService.findOne(user.id, orderId, reportId);
  }

  @Post(':id/react')
  @ApiOperation({ summary: 'React to a status report (owner only)' })
  @ApiResponse({ status: 201, description: 'Reaction saved', schema: { example: ok({ ...EXAMPLE_STATUS_REPORT, owner_reaction: 'love' }, 'Reaction saved') } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Only the owner can react', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Report not found', schema: { example: ERROR_404 } })
  react(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(reactStatusReportSchema)) body: ReactStatusReportDto,
  ) {
    return this.statusReportsService.react(user.id, id, body);
  }

  @Post(':id/reply')
  @ApiOperation({ summary: 'Reply to a status report (owner only)' })
  @ApiResponse({ status: 201, description: 'Reply saved', schema: { example: ok(EXAMPLE_STATUS_REPORT, 'Reply saved') } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Only the owner can reply', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Report not found', schema: { example: ERROR_404 } })
  reply(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(replyStatusReportSchema)) body: ReplyStatusReportDto,
  ) {
    return this.statusReportsService.reply(user.id, id, body);
  }
}
