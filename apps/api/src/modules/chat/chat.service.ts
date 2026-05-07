import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { SupabaseService } from '../supabase/supabase.service'
import { CHAT_CONVERSATION_COLUMNS, CHAT_MESSAGE_COLUMNS } from '../../common/constants/columns'
import { paginate, type PaginationParams } from '../../common/utils/pagination'
import type { CreateConversationInput, SendMessageInput } from '@petzone/validators'

export type ChatConversation = {
  id: string
  order_id: string | null
  owner_id: string
  provider_id: string
  last_message_at: string | null
  owner_unread_count: number
  provider_unread_count: number
  created_at: string
  updated_at: string
}

export type ChatMessage = {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  type: 'text' | 'image'
  image_url: string | null
  status: 'sent' | 'delivered' | 'read'
  created_at: string
  read_at: string | null
}

export const CHAT_EVENTS = {
  MESSAGE_CREATED: 'chat.message.created',
  MESSAGE_DELIVERED: 'chat.message.delivered',
  MESSAGE_READ: 'chat.message.read',
  CONVERSATION_READ: 'chat.conversation.read',
} as const

@Injectable()
export class ChatService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly events: EventEmitter2
  ) {}

  async getConversations(userId: string, params: PaginationParams) {
    const { page = 1, limit = 20 } = params
    const from = (page - 1) * limit

    const { data, error, count } = await this.supabase.client
      .from('chat_conversations')
      .select(CHAT_CONVERSATION_COLUMNS, { count: 'exact' })
      .or(`owner_id.eq.${userId},provider_id.eq.${userId}`)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .range(from, from + limit - 1)
    if (error) throw new BadRequestException(error.message)

    return paginate(data ?? [], count ?? 0, { page, limit })
  }

  async getMessages(userId: string, conversationId: string, params: PaginationParams) {
    await this.verifyParticipant(userId, conversationId)

    const { page = 1, limit = 20 } = params
    const from = (page - 1) * limit

    const { data, error, count } = await this.supabase.client
      .from('chat_messages')
      .select(CHAT_MESSAGE_COLUMNS, { count: 'exact' })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)
    if (error) throw new BadRequestException(error.message)

    return paginate(data ?? [], count ?? 0, { page, limit })
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    body: Omit<SendMessageInput, 'conversation_id'>
  ): Promise<ChatMessage> {
    const conversation = await this.verifyParticipant(userId, conversationId)

    const { data: message, error } = await this.supabase.client
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: body.content ?? null,
        type: body.type ?? 'text',
        image_url: body.image_url ?? null,
        status: 'sent',
      })
      .select(CHAT_MESSAGE_COLUMNS)
      .single()
    if (error || !message) throw new BadRequestException(error?.message ?? 'Failed to send message')

    this.events.emit(CHAT_EVENTS.MESSAGE_CREATED, { message, conversation })

    return message as ChatMessage
  }

  async markRead(userId: string, conversationId: string) {
    const conversation = await this.verifyParticipant(userId, conversationId)
    const otherUserId =
      conversation.owner_id === userId ? conversation.provider_id : conversation.owner_id

    const { data: updatedMessages, error: msgErr } = await this.supabase.client
      .from('chat_messages')
      .update({ status: 'read', read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .neq('status', 'read')
      .select('id')
    if (msgErr) throw new BadRequestException(msgErr.message)

    const isOwner = conversation.owner_id === userId
    const unreadField = isOwner ? 'owner_unread_count' : 'provider_unread_count'
    const { error: convErr } = await this.supabase.client
      .from('chat_conversations')
      .update({ [unreadField]: 0 })
      .eq('id', conversationId)
    if (convErr) throw new BadRequestException(convErr.message)

    const messageIds = (updatedMessages ?? []).map((m) => m.id)
    if (messageIds.length > 0) {
      this.events.emit(CHAT_EVENTS.CONVERSATION_READ, {
        conversationId,
        readerUserId: userId,
        otherUserId,
        messageIds,
      })
    }

    return { unread_count: 0, marked_count: messageIds.length }
  }

  async markMessageRead(userId: string, messageId: string) {
    const { data: message, error: fetchErr } = await this.supabase.client
      .from('chat_messages')
      .select(CHAT_MESSAGE_COLUMNS)
      .eq('id', messageId)
      .single()
    if (fetchErr || !message) throw new NotFoundException('Message not found')

    if (message.sender_id === userId) return message as ChatMessage
    if (message.status === 'read') return message as ChatMessage

    await this.verifyParticipant(userId, message.conversation_id)

    const { data: updated, error } = await this.supabase.client
      .from('chat_messages')
      .update({ status: 'read', read_at: new Date().toISOString() })
      .eq('id', messageId)
      .select(CHAT_MESSAGE_COLUMNS)
      .single()
    if (error || !updated) throw new BadRequestException(error?.message ?? 'Failed to mark read')

    this.events.emit(CHAT_EVENTS.MESSAGE_READ, {
      messageId: updated.id,
      conversationId: updated.conversation_id,
      senderId: updated.sender_id,
      readerUserId: userId,
    })

    return updated as ChatMessage
  }

  async markMessageDelivered(userId: string, messageId: string) {
    const { data: message, error: fetchErr } = await this.supabase.client
      .from('chat_messages')
      .select(CHAT_MESSAGE_COLUMNS)
      .eq('id', messageId)
      .single()
    if (fetchErr || !message) throw new NotFoundException('Message not found')

    if (message.sender_id === userId) return message as ChatMessage
    if (message.status !== 'sent') return message as ChatMessage

    await this.verifyParticipant(userId, message.conversation_id)

    const { data, error } = await this.supabase.client
      .from('chat_messages')
      .update({ status: 'delivered' })
      .eq('id', messageId)
      .eq('status', 'sent')
      .select(CHAT_MESSAGE_COLUMNS)
      .single()
    if (error || !data) return message as ChatMessage

    this.events.emit(CHAT_EVENTS.MESSAGE_DELIVERED, {
      messageId: data.id,
      conversationId: data.conversation_id,
      senderId: data.sender_id,
    })
    return data as ChatMessage
  }

  async getConversation(conversationId: string): Promise<ChatConversation> {
    const { data, error } = await this.supabase.client
      .from('chat_conversations')
      .select(CHAT_CONVERSATION_COLUMNS)
      .eq('id', conversationId)
      .single()
    if (error || !data) throw new NotFoundException('Conversation not found')
    return data as ChatConversation
  }

  async findOrCreateConversation(
    userId: string,
    body: CreateConversationInput
  ): Promise<ChatConversation> {
    let ownerId: string
    let providerUserId: string
    let orderId: string | null = body.order_id ?? null

    if (body.order_id) {
      const { data: order, error } = await this.supabase.client
        .from('orders')
        .select('id, owner_id, provider_id')
        .eq('id', body.order_id)
        .single()
      if (error || !order) throw new NotFoundException('Order not found')

      const { data: provider, error: provErr } = await this.supabase.client
        .from('providers')
        .select('id, user_id')
        .eq('id', order.provider_id)
        .single()
      if (provErr || !provider) throw new NotFoundException('Provider not found')

      ownerId = order.owner_id
      providerUserId = provider.user_id
    } else if (body.owner_id) {
      const { data: callerProvider, error } = await this.supabase.client
        .from('providers')
        .select('id, user_id')
        .eq('user_id', userId)
        .maybeSingle()
      if (error || !callerProvider)
        throw new ForbiddenException('Only providers can start a chat by owner_id')

      const { data: owner, error: ownerErr } = await this.supabase.client
        .from('users')
        .select('id')
        .eq('id', body.owner_id)
        .single()
      if (ownerErr || !owner) throw new NotFoundException('Owner not found')

      ownerId = owner.id
      providerUserId = callerProvider.user_id
    } else {
      const { data: provider, error } = await this.supabase.client
        .from('providers')
        .select('id, user_id')
        .eq('id', body.provider_id!)
        .single()
      if (error || !provider) throw new NotFoundException('Provider not found')

      ownerId = userId
      providerUserId = provider.user_id
    }

    if (userId !== ownerId && userId !== providerUserId)
      throw new ForbiddenException('Not a participant of this conversation')

    const findExisting = async () => {
      let q = this.supabase.client
        .from('chat_conversations')
        .select(CHAT_CONVERSATION_COLUMNS)
        .eq('owner_id', ownerId)
        .eq('provider_id', providerUserId)
      q = orderId ? q.eq('order_id', orderId) : q.is('order_id', null)
      const { data } = await q.maybeSingle()
      return data as ChatConversation | null
    }

    const existing = await findExisting()
    if (existing) return existing

    const { data: created, error: insertErr } = await this.supabase.client
      .from('chat_conversations')
      .insert({
        owner_id: ownerId,
        provider_id: providerUserId,
        order_id: orderId,
        last_message_at: new Date().toISOString(),
      })
      .select(CHAT_CONVERSATION_COLUMNS)
      .single()
    if (created) return created as ChatConversation

    if (insertErr?.code === '23505') {
      const winner = await findExisting()
      if (winner) return winner
    }
    throw new BadRequestException(insertErr?.message ?? 'Failed to create conversation')
  }

  private async verifyParticipant(
    userId: string,
    conversationId: string
  ): Promise<ChatConversation> {
    const conversation = await this.getConversation(conversationId)
    if (conversation.owner_id !== userId && conversation.provider_id !== userId)
      throw new ForbiddenException('Not a participant of this conversation')
    return conversation
  }
}
