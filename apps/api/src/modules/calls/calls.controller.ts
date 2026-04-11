import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { initiateCallSchema, endCallSchema } from '@petzone/validators';
import type { AuthUser } from '../../common/interfaces/auth-user';
import { CallsService } from './calls.service';
import { InitiateCallDto, EndCallDto } from './dto';

@ApiTags('Calls')
@Controller('calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post('initiate/:conversationId')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Initiate a masked voice/video call' })
  @ApiResponse({ status: 201, description: 'Call initiated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a participant of this conversation' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  initiate(
    @CurrentUser() user: AuthUser,
    @Param('conversationId') conversationId: string,
    @Body(new ZodValidationPipe(initiateCallSchema)) body: InitiateCallDto,
  ) {
    return this.callsService.initiate(user.id, conversationId, body);
  }

  @Post(':id/end')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'End a call and record duration' })
  @ApiResponse({ status: 201, description: 'Call ended' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Call not found' })
  end(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(endCallSchema)) body: EndCallDto,
  ) {
    return this.callsService.end(user.id, id, body);
  }

  @Get('log/:conversationId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get call log for a conversation' })
  @ApiResponse({ status: 200, description: 'Call log returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  getLog(@CurrentUser() user: AuthUser, @Param('conversationId') conversationId: string) {
    return this.callsService.getLog(user.id, conversationId);
  }

  @Post('webhook')
  @Public()
  @ApiOperation({ summary: 'Call provider webhook (Stringee/Twilio)' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  webhook() {
    return this.callsService.webhook();
  }
}
