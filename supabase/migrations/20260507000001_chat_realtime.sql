-- Enable Supabase Realtime for chat tables.
-- Clients subscribe to postgres_changes via @supabase/supabase-js and the
-- existing RLS policies (conversations_participant, messages_read) ensure
-- only participants receive change events for a given conversation.
--
-- replica identity full is required so UPDATE payloads include the full row
-- (sender_id, conversation_id, status, …) rather than just the primary key —
-- senders need that context to update their delivered/read indicators.

alter table public.chat_conversations replica identity full;
alter table public.chat_messages replica identity full;

alter publication supabase_realtime add table public.chat_conversations;
alter publication supabase_realtime add table public.chat_messages;
