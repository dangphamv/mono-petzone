import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CallsService } from './calls.service';

@ApiTags('Calls')
@ApiBearerAuth('access-token')
@Controller('calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post('initiate/:conversationId')
  @ApiOperation({ summary: 'Initiate a masked voice/video call' })
  @ApiResponse({ status: 201, description: 'Call initiated, token returned' })
  initiate(@Param('conversationId') conversationId: string, @Body() body: any) {
    return this.callsService.initiate(conversationId, body);
  }

  @Get('log/:conversationId')
  @ApiOperation({ summary: 'Get call log for a conversation' })
  @ApiResponse({ status: 200, description: 'Call log returned' })
  getLog(@Param('conversationId') conversationId: string) {
    return this.callsService.getLog(conversationId);
  }
}
