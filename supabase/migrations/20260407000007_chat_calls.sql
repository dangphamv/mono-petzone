-- Chat conversations
create table public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id),
  owner_id uuid not null references public.users(id),
  provider_id uuid not null references public.users(id),
  last_message_at timestamptz,
  owner_unread_count int not null default 0,
  provider_unread_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index conversations_owner_idx on public.chat_conversations(owner_id, last_message_at desc);
create index conversations_provider_idx on public.chat_conversations(provider_id, last_message_at desc);
create index conversations_order_idx on public.chat_conversations(order_id) where order_id is not null;

create trigger conversations_updated_at
  before update on public.chat_conversations
  for each row execute function public.update_updated_at();

-- Chat messages
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id),
  content text,
  type varchar(10) not null default 'text' check (type in ('text', 'image')),
  image_url varchar(500),
  status varchar(10) not null default 'sent' check (status in ('sent', 'delivered', 'read')),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index messages_conversation_idx on public.chat_messages(conversation_id, created_at desc);
create index messages_unread_idx on public.chat_messages(conversation_id, status) where status != 'read';

-- Call logs
create table public.call_logs (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id),
  order_id uuid references public.orders(id),
  caller_id uuid not null references public.users(id),
  callee_id uuid not null references public.users(id),
  proxy_number varchar(20),
  status varchar(20) not null default 'initiating' check (status in ('initiating', 'ringing', 'connected', 'completed', 'missed', 'failed')),
  duration_seconds int not null default 0,
  started_at timestamptz,
  ended_at timestamptz,
  provider_call_id varchar(255),
  created_at timestamptz not null default now()
);

create index call_logs_conversation_idx on public.call_logs(conversation_id, created_at desc);
