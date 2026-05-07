import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createConversationSchema, sendMessageBodySchema } from '@petzone/validators';
import { PAGINATION } from '@petzone/shared';
import type { AuthUser } from '../../common/interfaces/auth-user';
import { ChatService } from './chat.service';
import { CreateConversationDto, SendMessageDto } from './dto';
import {
  ok,
  okPaginated,
  EXAMPLE_CHAT_CONVERSATION,
  EXAMPLE_CHAT_MESSAGE,
  EXAMPLE_MARK_READ,
  ERROR_400,
  ERROR_401,
  ERROR_403,
  ERROR_404,
} from '../../common/swagger/examples';

@ApiTags('Chat')
@ApiBearerAuth('access-token')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Find or create a conversation between owner and provider (idempotent)' })
  @ApiResponse({ status: 201, description: 'Conversation returned (existing or newly created)', schema: { example: ok(EXAMPLE_CHAT_CONVERSATION, 'Conversation ready') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Caller is not a participant', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Order or provider not found', schema: { example: ERROR_404 } })
  createConversation(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createConversationSchema)) body: CreateConversationDto,
  ) {
    return this.chatService.findOrCreateConversation(user.id, body);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List conversations for current user' })
  @ApiResponse({ status: 200, description: 'Conversations returned', schema: { example: okPaginated([EXAMPLE_CHAT_CONVERSATION], 'Conversations returned', 5) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  getConversations(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getConversations(user.id, {
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
    });
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages in a conversation' })
  @ApiResponse({ status: 200, description: 'Messages returned', schema: { example: okPaginated([EXAMPLE_CHAT_MESSAGE], 'Messages returned', 38) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Not a participant of this conversation', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Conversation not found', schema: { example: ERROR_404 } })
  getMessages(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessages(user.id, id, {
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
    });
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message in a conversation' })
  @ApiResponse({ status: 201, description: 'Message sent', schema: { example: ok(EXAMPLE_CHAT_MESSAGE, 'Message sent') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Not a participant of this conversation', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Conversation not found', schema: { example: ERROR_404 } })
  sendMessage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(sendMessageBodySchema)) body: SendMessageDto,
  ) {
    return this.chatService.sendMessage(user.id, id, body);
  }

  @Patch('conversations/:id/read')
  @ApiOperation({ summary: 'Mark conversation as read' })
  @ApiResponse({ status: 200, description: 'Conversation marked as read', schema: { example: ok(EXAMPLE_MARK_READ, 'Conversation marked as read') } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 404, description: 'Conversation not found', schema: { example: ERROR_404 } })
  markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.chatService.markRead(user.id, id);
  }

  @Post('messages/:id/delivered')
  @ApiOperation({ summary: 'Mark a single message as delivered (called by recipient on receive)' })
  @ApiResponse({ status: 201, description: 'Message marked delivered (or already past sent)' })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 404, description: 'Message not found', schema: { example: ERROR_404 } })
  markDelivered(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.chatService.markMessageDelivered(user.id, id);
  }
}
