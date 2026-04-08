import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class CallsService {
  constructor(private readonly supabase: SupabaseService) {}

  async initiate(userId: string, conversationId: string, body: any) {
    const { data: conversation, error: convErr } = await this.supabase.client
      .from('chat_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();
    if (convErr || !conversation) throw new NotFoundException('Conversation not found');
    if (conversation.owner_id !== userId && conversation.provider_id !== userId)
      throw new ForbiddenException('Not a participant of this conversation');

    const calleeId = conversation.owner_id === userId
      ? conversation.provider_id
      : conversation.owner_id;

    const { data: call, error } = await this.supabase.client
      .from('call_logs')
      .insert({
        conversation_id: conversationId,
        order_id: conversation.order_id,
        caller_id: userId,
        callee_id: calleeId,
        status: 'initiating',
      })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);

    return call;
  }

  async getLog(userId: string, conversationId: string) {
    const { data: conversation, error: convErr } = await this.supabase.client
      .from('chat_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();
    if (convErr || !conversation) throw new NotFoundException('Conversation not found');
    if (conversation.owner_id !== userId && conversation.provider_id !== userId)
      throw new ForbiddenException('Not a participant of this conversation');

    const { data, error } = await this.supabase.client
      .from('call_logs')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);

    return data;
  }
}
