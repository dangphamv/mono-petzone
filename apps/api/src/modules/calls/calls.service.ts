import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CHAT_CONVERSATION_COLUMNS, CALL_LOG_COLUMNS } from '../../common/constants/columns';
import type { InitiateCallInput, EndCallInput } from '@petzone/validators';

@Injectable()
export class CallsService {
  constructor(private readonly supabase: SupabaseService) {}

  async initiate(userId: string, conversationId: string, body: InitiateCallInput) {
    const { data: conversation, error: convErr } = await this.supabase.client
      .from('chat_conversations')
      .select(CHAT_CONVERSATION_COLUMNS)
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
        call_type: body.type,
        status: 'initiating',
      })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);

    return call;
  }

  async end(userId: string, callId: string, body: EndCallInput) {
    const { data: call, error: fetchErr } = await this.supabase.client
      .from('call_logs')
      .select(CALL_LOG_COLUMNS)
      .eq('id', callId)
      .single();
    if (fetchErr || !call) throw new NotFoundException('Call not found');
    if (call.caller_id !== userId && call.callee_id !== userId)
      throw new ForbiddenException('Not a participant of this call');
    if (call.status === 'completed')
      throw new BadRequestException('Call has already ended');

    const { data, error } = await this.supabase.client
      .from('call_logs')
      .update({
        status: 'completed',
        duration_seconds: body.duration_seconds,
        ended_at: new Date().toISOString(),
      })
      .eq('id', callId)
      .select(CALL_LOG_COLUMNS)
      .single();
    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async getLog(userId: string, conversationId: string) {
    const { data: conversation, error: convErr } = await this.supabase.client
      .from('chat_conversations')
      .select(CHAT_CONVERSATION_COLUMNS)
      .eq('id', conversationId)
      .single();
    if (convErr || !conversation) throw new NotFoundException('Conversation not found');
    if (conversation.owner_id !== userId && conversation.provider_id !== userId)
      throw new ForbiddenException('Not a participant of this conversation');

    const { data, error } = await this.supabase.client
      .from('call_logs')
      .select(CALL_LOG_COLUMNS)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw new BadRequestException(error.message);

    return data;
  }

  webhook() {
    return { message: 'Call webhook endpoint ready' };
  }
}
