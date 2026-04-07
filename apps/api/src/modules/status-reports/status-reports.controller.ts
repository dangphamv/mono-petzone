import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StatusReportsService } from './status-reports.service';

@ApiTags('Status Reports')
@ApiBearerAuth('access-token')
@Controller('status-reports')
export class StatusReportsController {
  constructor(private readonly statusReportsService: StatusReportsService) {}

  @Post(':orderId')
  @ApiOperation({ summary: 'Create a daily status report' })
  @ApiResponse({ status: 201, description: 'Status report created' })
  create(@Param('orderId') orderId: string, @Body() body: any) {
    return this.statusReportsService.create(orderId, body);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'List status reports for an order' })
  @ApiResponse({ status: 200, description: 'Status reports returned' })
  findAll(@Param('orderId') orderId: string) {
    return this.statusReportsService.findAll(orderId);
  }

  @Get(':orderId/:reportId')
  @ApiOperation({ summary: 'Get a specific status report' })
  @ApiResponse({ status: 200, description: 'Status report returned' })
  findOne(@Param('orderId') orderId: string, @Param('reportId') reportId: string) {
    return this.statusReportsService.findOne(orderId, reportId);
  }
}
