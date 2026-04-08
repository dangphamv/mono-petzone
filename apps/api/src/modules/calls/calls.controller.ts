import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { initiateCallSchema } from '@petzone/validators';
import type { AuthUser } from '../../common/interfaces/auth-user';
import type { InitiateCallInput } from '@petzone/validators';
import { CallsService } from './calls.service';
import { InitiateCallDto } from './dto';

@ApiTags('Calls')
@ApiBearerAuth('access-token')
@Controller('calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post('initiate/:conversationId')
  @ApiOperation({ summary: 'Initiate a masked voice/video call' })
  @ApiResponse({ status: 201, description: 'Call initiated, token returned' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a participant of this conversation' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  initiate(
    @CurrentUser() user: AuthUser,
    @Param('conversationId') conversationId: string,
    @Body(new ZodValidationPipe(initiateCallSchema)) body: InitiateCallInput,
  ) {
    return this.callsService.initiate(user.id, conversationId, body);
  }

  @Get('log/:conversationId')
  @ApiOperation({ summary: 'Get call log for a conversation' })
  @ApiResponse({ status: 200, description: 'Call log returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  getLog(@CurrentUser() user: AuthUser, @Param('conversationId') conversationId: string) {
    return this.callsService.getLog(user.id, conversationId);
  }
}
