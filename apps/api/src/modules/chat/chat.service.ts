import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ChatService {
  constructor(private readonly supabase: SupabaseService) {}

  async getConversations(userId: string) {
    const { data, error } = await this.supabase.client
      .from('chat_conversations')
      .select('*')
      .or(`owner_id.eq.${userId},provider_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async getMessages(userId: string, conversationId: string) {
    await this.verifyParticipant(userId, conversationId);

    const { data, error } = await this.supabase.client
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(100);
    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async sendMessage(userId: string, conversationId: string, body: any) {
    const conversation = await this.verifyParticipant(userId, conversationId);

    const { data: message, error } = await this.supabase.client
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: body.content || null,
        type: body.type || 'text',
        image_url: body.image_url || null,
        status: 'sent',
      })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);

    const isOwner = conversation.owner_id === userId;
    const unreadField = isOwner ? 'provider_unread_count' : 'owner_unread_count';
    const currentCount = isOwner
      ? (conversation.provider_unread_count || 0)
      : (conversation.owner_unread_count || 0);

    const { error: updateErr } = await this.supabase.client
      .from('chat_conversations')
      .update({
        last_message_at: new Date().toISOString(),
        [unreadField]: currentCount + 1,
      })
      .eq('id', conversationId);
    if (updateErr) throw new BadRequestException(updateErr.message);

    return message;
  }

  async markRead(userId: string, conversationId: string) {
    const conversation = await this.verifyParticipant(userId, conversationId);

    const isOwner = conversation.owner_id === userId;
    const unreadField = isOwner ? 'owner_unread_count' : 'provider_unread_count';

    const { error: convErr } = await this.supabase.client
      .from('chat_conversations')
      .update({ [unreadField]: 0 })
      .eq('id', conversationId);
    if (convErr) throw new BadRequestException(convErr.message);

    const { error: msgErr } = await this.supabase.client
      .from('chat_messages')
      .update({ status: 'read', read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .neq('status', 'read');
    if (msgErr) throw new BadRequestException(msgErr.message);

    return { success: true };
  }

  private async verifyParticipant(userId: string, conversationId: string) {
    const { data, error } = await this.supabase.client
      .from('chat_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();
    if (error || !data) throw new NotFoundException('Conversation not found');
    if (data.owner_id !== userId && data.provider_id !== userId)
      throw new ForbiddenException('Not a participant of this conversation');
    return data;
  }
}
