# Chat — App Integration Guide

Owner ↔ Provider chat, built on Supabase as a primary citizen.

**Architecture**

```
        ┌────────────────────────────┐
        │   Mobile / Web Client      │
        │  @supabase/supabase-js     │
        └──────────────┬─────────────┘
                       │
            RLS-gated  │  Realtime
            inserts    │  subscribe
                       ▼
        ┌────────────────────────────┐
        │   Supabase (Postgres +     │
        │   Realtime + Storage)      │
        │  • find_or_create_conv RPC │
        │  • mark_conversation_read  │
        │  • after-insert trigger    │
        └────────────────────────────┘
                       ▲
                       │  REST (compat layer)
                       │
        ┌──────────────┴─────────────┐
        │   NestJS API               │
        │   /api/chat/*              │
        └────────────────────────────┘
```

The client talks to Supabase directly for everything that's RLS-safe (selects, inserts, status updates, Realtime). The NestJS REST endpoints exist as a compat layer for clients that can't load `@supabase/supabase-js` and for cross-cutting concerns (rate limits, audit logging).

---

## 1. Setup

```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { realtime: { params: { eventsPerSecond: 10 } } },
)

// After login (your existing OTP/social flow):
const { access_token, refresh_token } = await api.post('/auth/verify-otp', { phone, otp })
await supabase.auth.setSession({ access_token, refresh_token })
```

The same session is now used for REST (`Authorization: Bearer …`) and Realtime (RLS uses `auth.uid()` from the connection's JWT).

---

## 2. Tables

```
chat_conversations
  id            uuid pk
  order_id      uuid? → orders.id        (nullable, pre-booking chats)
  owner_id      uuid  → users.id
  provider_id   uuid  → users.id          (provider's USER id, not providers.id)
  last_message_at        timestamptz?
  owner_unread_count     int
  provider_unread_count  int
  created_at, updated_at

chat_messages
  id              uuid pk
  conversation_id uuid → chat_conversations.id (cascade)
  sender_id       uuid → users.id
  content         text?
  type            'text' | 'image'
  image_url       varchar?
  status          'sent' | 'delivered' | 'read'
  created_at, read_at
```

RLS:
- `select` on both tables — participants only.
- `insert` on `chat_messages` — `sender_id = auth.uid()`.
- `update` on `chat_messages` — only on messages you didn't send (status transitions).

Realtime: both tables are in the `supabase_realtime` publication with `replica identity full`, so UPDATE payloads include the full row.

A trigger on `chat_messages` insert atomically bumps `chat_conversations.last_message_at` and the recipient's unread counter — you never write those fields yourself.

---

## 3. Open a conversation (`find_or_create_conversation`)

Idempotent. Three ways to call it:

```ts
// 3a. Owner taps "Chat" on a provider page
const { data: conv } = await supabase.rpc('find_or_create_conversation', {
  p_provider_id: providerRecordId, // providers.id
})

// 3b. Provider taps "Message" on an owner profile / lead
const { data: conv } = await supabase.rpc('find_or_create_conversation', {
  p_owner_id: ownerUserId, // users.id
})

// 3c. Either party opens chat from an order
const { data: conv } = await supabase.rpc('find_or_create_conversation', {
  p_order_id: orderId,
})
```

Resolution priority: `p_order_id` > `p_owner_id` > `p_provider_id`. One conversation per `(owner, provider, order_id)` — repeat calls return the same row. Provider-initiated requires the caller to own a `providers` row (resolved from `auth.uid()`).

Errors come back as Postgres error codes:
- `42501` → unauthorized / not a participant / not a provider
- `P0002` → order/owner/provider not found
- `22023` → no identifier given

---

## 4. Read history

Direct query. RLS filters to your conversations.

```ts
// Conversation list (sorted by last_message_at DESC)
const { data: conversations } = await supabase
  .from('chat_conversations')
  .select('*')
  .order('last_message_at', { ascending: false, nullsFirst: false })

// Messages for the open conversation, newest first — render reversed
const { data: messages } = await supabase
  .from('chat_messages')
  .select('*')
  .eq('conversation_id', conversationId)
  .order('created_at', { ascending: false })
  .range(0, 49)

// Older page (keyset on created_at is faster than offset)
const { data: older } = await supabase
  .from('chat_messages')
  .select('*')
  .eq('conversation_id', conversationId)
  .lt('created_at', oldestRenderedTimestamp)
  .order('created_at', { ascending: false })
  .limit(50)
```

---

## 5. Send a message

Direct insert. The trigger handles unread/last_message_at; Realtime broadcasts the INSERT.

```ts
const { data: message, error } = await supabase
  .from('chat_messages')
  .insert({
    conversation_id: conversationId,
    sender_id: (await supabase.auth.getUser()).data.user!.id,
    content: 'Xin chào!',
    type: 'text',
  })
  .select('*')
  .single()
```

Image:

```ts
// 1) upload to chat-media bucket
const path = `${conversationId}/${crypto.randomUUID()}.jpg`
await supabase.storage.from('chat-media').upload(path, blob, { contentType: 'image/jpeg' })
const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(path)

// 2) insert message
await supabase.from('chat_messages').insert({
  conversation_id: conversationId,
  sender_id: userId,
  type: 'image',
  image_url: publicUrl,
})
```

**Constraints (enforced both at the DB and via the validator package):** `content ≤ 2000 chars`, `type ∈ {text, image}`, exactly one of `content` or `image_url` populated.

---

## 6. Status transitions

```ts
// Receiver: mark a single message delivered (do this when an INSERT lands)
await supabase
  .from('chat_messages')
  .update({ status: 'delivered' })
  .eq('id', messageId)
  .eq('status', 'sent')

// Receiver: mark the whole conversation read (when user opens / scrolls to bottom)
const { data: markedCount } = await supabase.rpc('mark_conversation_read', {
  p_conversation_id: conversationId,
})
```

Each transition triggers an UPDATE event over Realtime so the sender's UI flips ✓ → ✓✓ → ✓✓ blue with no extra plumbing.

---

## 7. Realtime — subscribe per conversation

```ts
function subscribeToConversation(conversationId, handlers) {
  const channel = supabase
    .channel(`conversation:${conversationId}`, { config: { broadcast: { self: false } } })
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}` },
      ({ new: msg }) => handlers.onNewMessage(msg),
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}` },
      ({ new: msg }) => handlers.onStatusChange(msg),
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'chat_conversations',
        filter: `id=eq.${conversationId}` },
      ({ new: conv }) => handlers.onConversationChange(conv),
    )
    .on('broadcast', { event: 'typing' }, ({ payload }) => handlers.onTyping(payload))
    .on('presence', { event: 'sync' }, () => handlers.onPresence(channel.presenceState()))
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const { data: { user } } = await supabase.auth.getUser()
        await channel.track({ user_id: user!.id, online_at: Date.now() })
      }
    })

  return () => { supabase.removeChannel(channel) }
}
```

### Typing indicator (broadcast — not persisted)

```ts
// Send (debounce: true on first keystroke, false after 3s idle)
channel.send({ type: 'broadcast', event: 'typing', payload: { user_id: me, is_typing: true } })

// Receive: handlers.onTyping payload
```

### Presence (online status)

```ts
// channel.presenceState() returns { [presenceRef]: [{ user_id, online_at }, ...] }
// Show "Online" if the other party's user_id is in any of those arrays.
```

---

## 8. Realtime — global inbox

For the chat list screen, subscribe once at app launch:

```ts
const inbox = supabase
  .channel(`inbox:${userId}`)
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'chat_conversations' },
    ({ new: conv }) => bumpConversationInList(conv),
  )
  .subscribe()
```

RLS filters to conversations where the user is `owner_id` or `provider_id` — no extra filter needed. The trigger ensures `last_message_at` and unread counts are always current.

---

## 9. End-to-end flow

### App launch
1. Restore Supabase session (`setSession`).
2. Fetch conversation list (§4).
3. Subscribe to inbox channel (§8).

### Open a conversation (owner taps a provider, or provider taps a lead, or either taps an order)
1. `rpc('find_or_create_conversation', …)` → conversation id.
2. Fetch latest 50 messages (§4).
3. `subscribeToConversation(...)` (§7).
4. `rpc('mark_conversation_read', { p_conversation_id })`.

### Sending
1. Optimistic-render with a temp id.
2. `from('chat_messages').insert(...)`.
3. On returned row, swap temp id for server id; show `sent` (✓).
4. UPDATE event will flip `delivered` (✓✓), then `read` (✓✓ blue).

### Receiving
1. INSERT event lands in `onNewMessage`.
2. If conversation is open → render + `update({status: 'delivered'})`. When user has clearly seen it → `rpc('mark_conversation_read', …)`.
3. If not open → `chat_conversations` UPDATE will already have bumped unread; just rerender the list.

### Reconnect / offline
- `@supabase/supabase-js` reconnects with backoff automatically. After reconnect, refetch the latest message page to catch up — Realtime gaps are unavoidable on lossy networks.
- For unsent messages (composed while offline): persist locally with a temp id; flush by inserting in order on reconnect. The trigger keeps state consistent even if order arrives out of sync.

### Cleanup
Always call the unsubscribe function returned by `subscribeToConversation` when leaving the screen. Don't keep dozens of channels open — Supabase rate-limits subscribers per project.

---

## 10. REST compat layer

For clients that can't load `@supabase/supabase-js`, every operation has a NestJS REST equivalent. The implementation calls the same DB primitives (RPC + insert + trigger) so behavior matches.

| REST | Equivalent direct call |
|---|---|
| `POST /api/chat/conversations` | `rpc('find_or_create_conversation', …)` |
| `GET /api/chat/conversations` | `from('chat_conversations').select(...).order('last_message_at', { ascending: false })` |
| `GET /api/chat/conversations/:id/messages` | `from('chat_messages').select(...)` filtered |
| `POST /api/chat/conversations/:id/messages` | `from('chat_messages').insert(...)` |
| `POST /api/chat/messages/:id/delivered` | `from('chat_messages').update({ status: 'delivered' })` |
| `PATCH /api/chat/conversations/:id/read` | `rpc('mark_conversation_read', …)` |

---

## 11. Spec mapping (US-012)

| AC | How |
|---|---|
| AC-01 real-time | Realtime `postgres_changes` on `chat_messages` |
| AC-02 text ≤ 2000 / image ≤ 10MB | Zod + Storage upload limits |
| AC-03 sent → delivered → read | Update `status`, observed via UPDATE events |
| AC-04 chat tied to order | `chat_conversations.order_id` + `find_or_create_conversation(p_order_id)` |
| AC-05 history | Direct select with keyset pagination |
| AC-06 push when offline | Notifications module (separate) |
| AC-07 unread count | `chat_conversations.{owner,provider}_unread_count` (trigger-maintained) |
| AC-08 sort by last_message_at | Trigger-maintained; ORDER BY in client query |
| AC-09 timestamps | `created_at` per message |
| AC-10 typing indicator | Realtime `broadcast` event `typing` |
| AC-11 reconnect | `@supabase/supabase-js` built-in |
| AC-12 offline queue | Client-side; retry inserts on reconnect |
| AC-13 retention 2y | DB-level scheduled job (separate) |
