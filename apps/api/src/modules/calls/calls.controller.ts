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
import {
  ok,
  EXAMPLE_CALL_INITIATE,
  EXAMPLE_CALL_END,
  EXAMPLE_CALL_LOG,
  EXAMPLE_CALL_WEBHOOK,
  ERROR_400,
  ERROR_401,
  ERROR_403,
  ERROR_404,
} from '../../common/swagger/examples';

@ApiTags('Calls')
@Controller('calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post('initiate/:conversationId')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Initiate a masked voice/video call' })
  @ApiResponse({ status: 201, description: 'Call initiated', schema: { example: ok(EXAMPLE_CALL_INITIATE, 'Call initiated') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Not a participant of this conversation', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Conversation not found', schema: { example: ERROR_404 } })
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
  @ApiResponse({ status: 201, description: 'Call ended', schema: { example: ok(EXAMPLE_CALL_END, 'Call ended') } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 404, description: 'Call not found', schema: { example: ERROR_404 } })
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
  @ApiResponse({ status: 200, description: 'Call log returned', schema: { example: ok([EXAMPLE_CALL_LOG]) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 404, description: 'Conversation not found', schema: { example: ERROR_404 } })
  getLog(@CurrentUser() user: AuthUser, @Param('conversationId') conversationId: string) {
    return this.callsService.getLog(user.id, conversationId);
  }

  @Post('webhook')
  @Public()
  @ApiOperation({ summary: 'Call provider webhook (Stringee/Twilio)' })
  @ApiResponse({ status: 200, description: 'Webhook processed', schema: { example: ok(EXAMPLE_CALL_WEBHOOK, 'Webhook processed') } })
  webhook() {
    return this.callsService.webhook();
  }
}
