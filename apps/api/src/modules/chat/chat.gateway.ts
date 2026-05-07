import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets'
import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OnEvent } from '@nestjs/event-emitter'
import { Server, Socket } from 'socket.io'
import { jwtVerify } from 'jose'
import { sendMessageSchema } from '@petzone/validators'
import { z } from 'zod'
import { SupabaseService } from '../supabase/supabase.service'
import { ChatService, CHAT_EVENTS, type ChatConversation, type ChatMessage } from './chat.service'

type AuthedSocket = Socket & { data: { userId: string } }

const conversationOnlySchema = z.object({ conversation_id: z.string().uuid() })
const messageReadSchema = z.object({ message_id: z.string().uuid() })

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(ChatGateway.name)
  private readonly jwtSecret: Uint8Array | null
  private readonly jwtIssuer: string

  constructor(
    private readonly chatService: ChatService,
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService
  ) {
    const secret = this.config.get<string>('SUPABASE_JWT_SECRET')
    this.jwtSecret = secret ? new TextEncoder().encode(secret) : null
    const supabaseUrl = this.config.get<string>('SUPABASE_URL') ?? ''
    this.jwtIssuer = `${supabaseUrl}/auth/v1`
  }

  async handleConnection(client: Socket) {
    const token = this.extractToken(client)
    const userId = token ? await this.verifyToken(token) : null
    if (!userId) {
      this.logger.warn(`Unauthorized WS connection ${client.id} — disconnecting`)
      client.emit('error', { message: 'Unauthorized' })
      client.disconnect(true)
      return
    }
    client.data.userId = userId
    await client.join(this.userRoom(userId))
    this.logger.log(`WS connected ${client.id} userId=${userId}`)
    client.emit('connected', { user_id: userId })
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WS disconnected ${client.id}`)
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(@ConnectedSocket() client: AuthedSocket, @MessageBody() body: unknown) {
    const userId = this.requireUser(client)
    const parsed = sendMessageSchema.safeParse(body)
    if (!parsed.success) throw new WsException(parsed.error.errors[0]?.message ?? 'Invalid payload')

    const { conversation_id, ...rest } = parsed.data
    const message = await this.chatService.sendMessage(userId, conversation_id, rest)
    return {
      event: 'message_sent',
      data: { id: message.id, status: message.status, timestamp: message.created_at },
    }
  }

  @SubscribeMessage('typing_start')
  async handleTypingStart(@ConnectedSocket() client: AuthedSocket, @MessageBody() body: unknown) {
    await this.broadcastTyping(client, body, true)
  }

  @SubscribeMessage('typing_stop')
  async handleTypingStop(@ConnectedSocket() client: AuthedSocket, @MessageBody() body: unknown) {
    await this.broadcastTyping(client, body, false)
  }

  @SubscribeMessage('message_read')
  async handleMessageRead(@ConnectedSocket() client: AuthedSocket, @MessageBody() body: unknown) {
    const userId = this.requireUser(client)
    const parsed = messageReadSchema.safeParse(body)
    if (!parsed.success) throw new WsException('Invalid payload')
    await this.chatService.markMessageRead(userId, parsed.data.message_id)
  }

  @OnEvent(CHAT_EVENTS.MESSAGE_CREATED)
  async onMessageCreated(payload: { message: ChatMessage; conversation: ChatConversation }) {
    if (!this.server) return
    const { message, conversation } = payload
    const recipientId =
      message.sender_id === conversation.owner_id ? conversation.provider_id : conversation.owner_id

    const newMessagePayload = {
      id: message.id,
      conversation_id: message.conversation_id,
      sender_id: message.sender_id,
      content: message.content,
      type: message.type,
      image_url: message.image_url,
      status: message.status,
      timestamp: message.created_at,
    }

    this.server
      .to([this.userRoom(message.sender_id), this.userRoom(recipientId)])
      .emit('new_message', newMessagePayload)

    const recipientSockets = await this.server.in(this.userRoom(recipientId)).fetchSockets()
    if (recipientSockets.length > 0) {
      await this.chatService.markMessageDelivered(message.id)
    }
  }

  @OnEvent(CHAT_EVENTS.MESSAGE_DELIVERED)
  onMessageDelivered(payload: { messageId: string; senderId: string }) {
    if (!this.server) return
    this.server
      .to(this.userRoom(payload.senderId))
      .emit('message_status', { id: payload.messageId, status: 'delivered' })
  }

  @OnEvent(CHAT_EVENTS.MESSAGE_READ)
  onMessageRead(payload: { messageId: string; senderId: string }) {
    if (!this.server) return
    this.server
      .to(this.userRoom(payload.senderId))
      .emit('message_status', { id: payload.messageId, status: 'read' })
  }

  @OnEvent(CHAT_EVENTS.CONVERSATION_READ)
  async onConversationRead(payload: {
    conversationId: string
    otherUserId: string
    messageIds: string[]
  }) {
    if (!this.server) return
    for (const id of payload.messageIds) {
      this.server
        .to(this.userRoom(payload.otherUserId))
        .emit('message_status', { id, status: 'read' })
    }
  }

  private async broadcastTyping(client: AuthedSocket, body: unknown, isTyping: boolean) {
    const userId = this.requireUser(client)
    const parsed = conversationOnlySchema.safeParse(body)
    if (!parsed.success) throw new WsException('Invalid payload')

    const conversation = await this.chatService.getConversation(parsed.data.conversation_id)
    if (conversation.owner_id !== userId && conversation.provider_id !== userId)
      throw new WsException('Not a participant of this conversation')

    const otherUserId =
      conversation.owner_id === userId ? conversation.provider_id : conversation.owner_id

    this.server.to(this.userRoom(otherUserId)).emit('typing', {
      conversation_id: parsed.data.conversation_id,
      user_id: userId,
      is_typing: isTyping,
    })
  }

  private userRoom(userId: string): string {
    return `user:${userId}`
  }

  private requireUser(client: AuthedSocket): string {
    const userId = client.data?.userId
    if (!userId) throw new WsException('Unauthorized')
    return userId
  }

  private extractToken(client: Socket): string | null {
    const auth = (client.handshake.auth ?? {}) as { token?: string }
    if (auth.token) return auth.token
    const queryToken = client.handshake.query?.token
    if (typeof queryToken === 'string') return queryToken
    const header = client.handshake.headers['authorization']
    if (typeof header === 'string' && header.startsWith('Bearer ')) return header.slice(7)
    return null
  }

  private async verifyToken(token: string): Promise<string | null> {
    if (this.jwtSecret) {
      try {
        const { payload } = await jwtVerify(token, this.jwtSecret, { issuer: this.jwtIssuer })
        if (payload.sub) return payload.sub
      } catch {
        // fall through to API verification
      }
    }
    const { data, error } = await this.supabase.client.auth.getUser(token)
    if (error || !data.user) return null
    return data.user.id
  }
}
