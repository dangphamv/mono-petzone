import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createStatusReportSchema, reactStatusReportSchema, replyStatusReportSchema } from '@petzone/validators';
import type { AuthUser } from '../../common/interfaces/auth-user';
import { StatusReportsService } from './status-reports.service';
import { CreateStatusReportDto, ReactStatusReportDto, ReplyStatusReportDto } from './dto';

@ApiTags('Status Reports')
@ApiBearerAuth('access-token')
@Controller('status-reports')
export class StatusReportsController {
  constructor(private readonly statusReportsService: StatusReportsService) {}

  @Post(':orderId')
  @ApiOperation({ summary: 'Create a daily status report' })
  @ApiResponse({ status: 201, description: 'Status report created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only the provider can create status reports' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  create(
    @CurrentUser() user: AuthUser,
    @Param('orderId') orderId: string,
    @Body(new ZodValidationPipe(createStatusReportSchema)) body: CreateStatusReportDto,
  ) {
    return this.statusReportsService.create(user.id, orderId, body);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'List status reports for an order' })
  @ApiResponse({ status: 200, description: 'Status reports returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findAll(@CurrentUser() user: AuthUser, @Param('orderId') orderId: string) {
    return this.statusReportsService.findAll(user.id, orderId);
  }

  @Get(':orderId/:reportId')
  @ApiOperation({ summary: 'Get a specific status report' })
  @ApiResponse({ status: 200, description: 'Status report returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('orderId') orderId: string,
    @Param('reportId') reportId: string,
  ) {
    return this.statusReportsService.findOne(user.id, orderId, reportId);
  }

  @Post(':id/react')
  @ApiOperation({ summary: 'React to a status report (owner only)' })
  @ApiResponse({ status: 201, description: 'Reaction saved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only the owner can react' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  react(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(reactStatusReportSchema)) body: ReactStatusReportDto,
  ) {
    return this.statusReportsService.react(user.id, id, body);
  }

  @Post(':id/reply')
  @ApiOperation({ summary: 'Reply to a status report (owner only)' })
  @ApiResponse({ status: 201, description: 'Reply saved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only the owner can reply' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  reply(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(replyStatusReportSchema)) body: ReplyStatusReportDto,
  ) {
    return this.statusReportsService.reply(user.id, id, body);
  }
}
