-- Smoothness + hardening pass for chat:
--   • race-safe conversation pairing (unique indexes + ON CONFLICT)
--   • new conversations sort to top (last_message_at = now() on create)
--   • out-of-order inserts can't roll last_message_at backwards (greatest)
--   • clients can no longer insert chat_conversations directly — RPC only
--   • chat-media storage scoped to conversation participants

-- 1. Race-safe conversation pairing.
create unique index if not exists chat_conversations_unique_with_order
  on public.chat_conversations(owner_id, provider_id, order_id)
  where order_id is not null;

create unique index if not exists chat_conversations_unique_no_order
  on public.chat_conversations(owner_id, provider_id)
  where order_id is null;

-- 2. find_or_create_conversation: stamp last_message_at on creation so the
--    new chat sorts to the top of the inbox immediately, and converge
--    concurrent callers via ON CONFLICT retry.
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
     where owner_id = v_owner_id and provider_id = v_provider_user_id and order_id is null
     limit 1;
  else
    select * into v_conv
      from public.chat_conversations
     where owner_id = v_owner_id and provider_id = v_provider_user_id and order_id = p_order_id
     limit 1;
  end if;
  if found then
    return v_conv;
  end if;

  begin
    insert into public.chat_conversations (owner_id, provider_id, order_id, last_message_at)
         values (v_owner_id, v_provider_user_id, p_order_id, now())
      returning * into v_conv;
    return v_conv;
  exception when unique_violation then
    if p_order_id is null then
      select * into v_conv from public.chat_conversations
        where owner_id = v_owner_id and provider_id = v_provider_user_id and order_id is null
        limit 1;
    else
      select * into v_conv from public.chat_conversations
        where owner_id = v_owner_id and provider_id = v_provider_user_id and order_id = p_order_id
        limit 1;
    end if;
    return v_conv;
  end;
end;
$$;

-- 3. Trigger: greatest() prevents out-of-order/backfilled inserts from
--    rolling last_message_at backwards.
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
       set last_message_at = greatest(last_message_at, new.created_at),
           provider_unread_count = provider_unread_count + 1,
           updated_at = now()
     where id = new.conversation_id;
  else
    update public.chat_conversations
       set last_message_at = greatest(last_message_at, new.created_at),
           owner_unread_count = owner_unread_count + 1,
           updated_at = now()
     where id = new.conversation_id;
  end if;
  return new;
end;
$$;

-- 4. Drop the permissive client-side insert policy. Clients must use
--    find_or_create_conversation (security definer) which validates
--    participant identity. Server uses service role and is unaffected.
drop policy if exists "conversations_insert" on public.chat_conversations;

-- 5. chat-media: scope read + upload to conversation participants. Path
--    convention is `{conversation_id}/{filename}`.
drop policy if exists "chat_media_auth_read" on storage.objects;
drop policy if exists "chat_media_auth_upload" on storage.objects;

create policy "chat_media_participant_read" on storage.objects for select
  using (
    bucket_id = 'chat-media'
    and (storage.foldername(name))[1] in (
      select id::text from public.chat_conversations
       where owner_id = auth.uid() or provider_id = auth.uid()
    )
  );

create policy "chat_media_participant_upload" on storage.objects for insert
  with check (
    bucket_id = 'chat-media'
    and (storage.foldername(name))[1] in (
      select id::text from public.chat_conversations
       where owner_id = auth.uid() or provider_id = auth.uid()
    )
  );
