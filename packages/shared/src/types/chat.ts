export type MessageType = 'text' | 'image'

export type MessageStatus = 'sent' | 'delivered' | 'read'

export type CallStatus = 'initiating' | 'ringing' | 'connected' | 'completed' | 'missed' | 'failed'

export interface ChatConversation {
  id: string
  order_id?: string
  owner_id: string
  provider_id: string
  last_message_at?: string
  owner_unread_count: number
  provider_unread_count: number
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  content?: string
  type: MessageType
  image_url?: string
  status: MessageStatus
  created_at: string
  read_at?: string
}

export interface CallLog {
  id: string
  conversation_id: string
  order_id?: string
  caller_id: string
  callee_id: string
  proxy_number?: string
  status: CallStatus
  duration_seconds: number
  started_at?: string
  ended_at?: string
  created_at: string
}

// WebSocket event types
export interface WsSendMessage {
  conversation_id: string
  content?: string
  type: MessageType
  image_url?: string
}

export interface WsNewMessage {
  id: string
  conversation_id: string
  sender_id: string
  content?: string
  type: MessageType
  image_url?: string
  timestamp: string
}

export interface WsTyping {
  conversation_id: string
  user_id: string
}

export interface WsMessageStatus {
  id: string
  status: MessageStatus
}
