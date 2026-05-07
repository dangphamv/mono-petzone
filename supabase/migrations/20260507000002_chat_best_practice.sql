-- Best-practice chat: let Postgres own the housekeeping so direct-client
-- inserts (via @supabase/supabase-js, RLS-gated) and server-side inserts
-- both keep conversation state consistent without round-trip logic.

-- 1. Trigger — on each new message, atomically:
--    - bump chat_conversations.last_message_at to the message timestamp
--    - increment the recipient's unread counter
create or replace function public.chat_on_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conv public.chat_conversations%rowtype;
begin
  select * into v_conv from public.chat_conversations where id = new.conversation_id;
  if not found then
    raise exception 'Conversation % not found', new.conversation_id;
  end if;

  if new.sender_id = v_conv.owner_id then
    update public.chat_conversations
       set last_message_at = new.created_at,
           provider_unread_count = provider_unread_count + 1,
           updated_at = now()
     where id = new.conversation_id;
  else
    update public.chat_conversations
       set last_message_at = new.created_at,
           owner_unread_count = owner_unread_count + 1,
           updated_at = now()
     where id = new.conversation_id;
  end if;
  return new;
end;
$$;

drop trigger if exists chat_messages_after_insert on public.chat_messages;
create trigger chat_messages_after_insert
  after insert on public.chat_messages
  for each row execute function public.chat_on_message_insert();

-- 2. RPC — find or create a conversation, resolved against auth.uid().
--    Three call shapes:
--      • p_order_id only      — derive both parties from the order
--      • p_owner_id only      — provider-initiated (caller must own a providers row)
--      • p_provider_id only   — owner-initiated  (caller is treated as the owner)
--    Returns the existing row when (owner, provider, order_id) already matches.
create or replace function public.find_or_create_conversation(
  p_provider_id uuid default null,
  p_owner_id uuid default null,
  p_order_id uuid default null
)
returns public.chat_conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_owner_id uuid;
  v_provider_user_id uuid;
  v_conv public.chat_conversations%rowtype;
begin
  if v_caller is null then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  if p_order_id is not null then
    select o.owner_id, p.user_id
      into v_owner_id, v_provider_user_id
      from public.orders o
      join public.providers p on p.id = o.provider_id
     where o.id = p_order_id;
    if not found then
      raise exception 'Order or provider not found' using errcode = 'P0002';
    end if;
  elsif p_owner_id is not null then
    select p.user_id into v_provider_user_id
      from public.providers p
     where p.user_id = v_caller;
    if not found then
      raise exception 'Only providers can start a chat by owner_id' using errcode = '42501';
    end if;
    if not exists (select 1 from public.users where id = p_owner_id) then
      raise exception 'Owner not found' using errcode = 'P0002';
    end if;
    v_owner_id := p_owner_id;
  elsif p_provider_id is not null then
    select p.user_id into v_provider_user_id
      from public.providers p
     where p.id = p_provider_id;
    if not found then
      raise exception 'Provider not found' using errcode = 'P0002';
    end if;
    v_owner_id := v_caller;
  else
    raise exception 'order_id, provider_id, or owner_id is required' using errcode = '22023';
  end if;

  if v_caller <> v_owner_id and v_caller <> v_provider_user_id then
    raise exception 'Not a participant of this conversation' using errcode = '42501';
  end if;

  if p_order_id is null then
    select * into v_conv
      from public.chat_conversations
     where owner_id = v_owner_id
       and provider_id = v_provider_user_id
       and order_id is null
     limit 1;
  else
    select * into v_conv
      from public.chat_conversations
     where owner_id = v_owner_id
       and provider_id = v_provider_user_id
       and order_id = p_order_id
     limit 1;
  end if;

  if found then
    return v_conv;
  end if;

  insert into public.chat_conversations (owner_id, provider_id, order_id)
       values (v_owner_id, v_provider_user_id, p_order_id)
    returning * into v_conv;
  return v_conv;
end;
$$;

revoke all on function public.find_or_create_conversation(uuid, uuid, uuid) from public;
grant execute on function public.find_or_create_conversation(uuid, uuid, uuid) to authenticated;

-- 3. RPC — atomically mark all of the other party's unread messages as read
--    and reset the caller's unread counter.
create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_conv public.chat_conversations%rowtype;
  v_count int;
begin
  if v_caller is null then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  select * into v_conv from public.chat_conversations where id = p_conversation_id;
  if not found then
    raise exception 'Conversation not found' using errcode = 'P0002';
  end if;
  if v_caller <> v_conv.owner_id and v_caller <> v_conv.provider_id then
    raise exception 'Not a participant of this conversation' using errcode = '42501';
  end if;

  with updated as (
    update public.chat_messages
       set status = 'read', read_at = now()
     where conversation_id = p_conversation_id
       and sender_id <> v_caller
       and status <> 'read'
    returning 1
  )
  select count(*)::int into v_count from updated;

  if v_caller = v_conv.owner_id then
    update public.chat_conversations
       set owner_unread_count = 0, updated_at = now()
     where id = p_conversation_id;
  else
    update public.chat_conversations
       set provider_unread_count = 0, updated_at = now()
     where id = p_conversation_id;
  end if;

  return v_count;
end;
$$;

revoke all on function public.mark_conversation_read(uuid) from public;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

-- 4. Tighten message-update RLS so a participant can transition status only on
--    messages they did NOT send (prevents content rewriting).
drop policy if exists "messages_update_read" on public.chat_messages;
create policy "messages_update_status" on public.chat_messages
  for update
  using (
    sender_id <> auth.uid()
    and conversation_id in (
      select id from public.chat_conversations
       where owner_id = auth.uid() or provider_id = auth.uid()
    )
  )
  with check (
    sender_id <> auth.uid()
    and conversation_id in (
      select id from public.chat_conversations
       where owner_id = auth.uid() or provider_id = auth.uid()
    )
  );
