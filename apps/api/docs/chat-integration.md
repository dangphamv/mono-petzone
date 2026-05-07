# Chat API — App Integration Guide

End-to-end guide for integrating the PetZone chat API (REST + WebSocket) in a mobile or web client.

- **Base URL (REST)**: `https://<host>/api/chat`
- **WebSocket URL**: `wss://<host>/chat` (Socket.IO namespace `/chat`)
- **Auth**: Supabase JWT — same token for REST (`Authorization: Bearer <jwt>`) and WS (handshake `auth.token`)

### Env vars

| Var | Local | Example prod |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api` | `https://api.petzone.vn/api` |
| `NEXT_PUBLIC_WS_URL` | `http://localhost:3001` | `https://api.petzone.vn` |

`WS_BASE` is just the API host **without** the `/api` suffix — the Nest server's `setGlobalPrefix('api')` only applies to HTTP routes, not Socket.IO. Use `http://` / `https://`; `socket.io-client` upgrades to `ws://` / `wss://` automatically.

```ts
// Option A — dedicated env
const WS_BASE = process.env['NEXT_PUBLIC_WS_URL'] ?? 'http://localhost:3001'

// Option B — derive from API URL
const WS_BASE = (process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api').replace(/\/api\/?$/, '')
```

---

## 1. Concepts

A `conversation` connects an `owner_id` and a `provider_id` (both are `auth.users.id`), optionally tied to an `order_id`.

Messages have lifecycle: `sent` → `delivered` → `read`.

The server pushes real-time events over WebSocket; REST is the source of truth for history and a fallback for sending.

---

## 2. Auth

Every call needs a Supabase access token (from `POST /api/auth/verify-otp` or refresh).

```ts
const { access_token } = await api.post('/auth/verify-otp', { phone, otp })
```

REST: `Authorization: Bearer <access_token>`

WS handshake (preferred):
```ts
const socket = io(`${WS_BASE}/chat`, {
  auth: { token: access_token },
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 30000,
})
```

WS handshake (alternatives, if the auth field is awkward):
- Query string: `io('/chat?token=<jwt>')`
- Header: `extraHeaders: { Authorization: 'Bearer <jwt>' }`

If the token is missing or invalid the server emits `error` with `{ message: 'Unauthorized' }` and disconnects.

---

## 3. REST endpoints

### 3.0 Create (or open) a conversation
`POST /api/chat/conversations`

Idempotent — returns the existing conversation between the same owner / provider / order, or creates a new one.

Three ways to call it:

```jsonc
// 1. Owner-initiated — owner starts a chat with a provider (pre-booking)
{ "provider_id": "<providers.id>" }

// 2. Provider-initiated — provider starts a chat with an owner
{ "owner_id": "<users.id>" }

// 3. Order-context — either party opens the chat tied to an existing order
{ "order_id": "<orders.id>" }
```

Rules:
- `provider_id` is the **`providers.id`** (business record), not the user id. Server resolves the provider's user id internally.
- `owner_id` is a **`users.id`**. Caller must own a `providers` row (resolved from auth) — owners cannot use this field.
- When `order_id` is given, owner and provider are derived from the order; caller must be one of them. `order_id` takes precedence over the other fields.
- One conversation per `(owner, provider, order_id)` triple — repeated calls return the same row.

Resolution priority: `order_id` → `owner_id` (provider-initiated) → `provider_id` (owner-initiated).

Response: same shape as conversation list items (see §3.1).

### 3.1 List conversations
`GET /api/chat/conversations?page=1&limit=20`

Returns conversations where the current user is `owner_id` or `provider_id`, sorted by `last_message_at DESC`.

```json
{
  "status": "success",
  "data": [
    {
      "id": "77777777-7777-4777-8777-777777777777",
      "order_id": "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      "owner_id": "11111111-...",
      "provider_id": "22222222-...",
      "last_message_at": "2026-04-12T10:00:00.000Z",
      "owner_unread_count": 0,
      "provider_unread_count": 1,
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 5, "total_pages": 1, "has_next": false, "has_prev": false }
}
```

### 3.2 Get messages
`GET /api/chat/conversations/:id/messages?page=1&limit=50`

Newest first. Page 1 = latest 50 messages — render reversed in the UI.

```json
{
  "status": "success",
  "data": [
    {
      "id": "...",
      "conversation_id": "...",
      "sender_id": "...",
      "content": "Chào shop, bé Miu nhà mình hơi nhút nhát nhé.",
      "type": "text",
      "image_url": null,
      "status": "read",
      "created_at": "2026-04-12T10:00:00.000Z",
      "read_at": "2026-04-12T10:01:00.000Z"
    }
  ],
  "meta": { ... }
}
```

### 3.3 Send message (REST fallback)
`POST /api/chat/conversations/:id/messages`

Use WS in normal flow. REST is for offline-queue replay or non-WS clients. Server still fans out `new_message` over WS to connected sockets.

```json
{ "content": "Xin chào!", "type": "text" }
```
or
```json
{ "type": "image", "image_url": "https://cdn.petzone.vn/chat-media/abc.jpg" }
```

Constraints (Zod-enforced): `content ≤ 2000 chars`, `type ∈ {text, image}`, text needs `content`, image needs `image_url`.

### 3.4 Mark conversation read
`PATCH /api/chat/conversations/:id/read`

Marks all of the *other* user's unread messages in this conversation as `read`, resets your unread counter.

```json
{ "status": "success", "data": { "unread_count": 0, "marked_count": 3 } }
```

Server fans out one `message_status: read` per message over WS.

### 3.5 Image upload

Use the upload endpoint to get a public URL before sending an `image` message:

`POST /api/upload` (bucket `chat-media`) → returns `{ url }` → use as `image_url`.

---

## 4. WebSocket protocol

Namespace: `/chat`. Auth via handshake (see §2).

### 4.1 Server → Client events

| Event | Payload | When |
|---|---|---|
| `connected` | `{ user_id }` | After successful auth |
| `error` | `{ message }` | Auth failure or other error (also disconnects on auth fail) |
| `new_message` | `{ id, conversation_id, sender_id, content, type, image_url, status, timestamp }` | A message was created in any conversation you're part of |
| `message_status` | `{ id, status: 'delivered' \| 'read' }` | Status transition for a message you sent |
| `typing` | `{ conversation_id, user_id, is_typing }` | The other party started/stopped typing |

### 4.2 Client → Server events

All payloads must validate against the schemas below or the server replies with `WsException`.

#### `send_message`
```json
{ "conversation_id": "<uuid>", "content": "Xin chào!", "type": "text" }
{ "conversation_id": "<uuid>", "type": "image", "image_url": "https://..." }
```
Server acks the sender with `{ event: 'message_sent', data: { id, status, timestamp } }` (use Socket.IO ack callback). Both sender and recipient also receive `new_message` (sender's other devices stay in sync).

#### `typing_start` / `typing_stop`
```json
{ "conversation_id": "<uuid>" }
```

#### `message_read`
```json
{ "message_id": "<uuid>" }
```
Marks one specific message as read. For "user opened the conversation, mark all read", use the REST `PATCH .../read` instead.

---

## 5. Reference client (TypeScript)

```ts
import { io, Socket } from 'socket.io-client'

type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  type: 'text' | 'image'
  image_url: string | null
  status: 'sent' | 'delivered' | 'read'
  timestamp: string
}

export class ChatClient {
  private socket: Socket | null = null
  private outbox: Array<{ conversation_id: string; payload: any; resolve: any; reject: any }> = []

  constructor(private wsUrl: string, private getToken: () => Promise<string>) {}

  async connect() {
    const token = await this.getToken()
    this.socket = io(`${this.wsUrl}/chat`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
    })

    this.socket.on('connect', () => this.flushOutbox())
    this.socket.on('connected', ({ user_id }) => console.log('chat connected', user_id))
    this.socket.on('error', (e) => console.warn('chat error', e))
    this.socket.on('disconnect', (reason) => console.log('chat disconnected', reason))
  }

  on(event: 'new_message', cb: (m: Message) => void): void
  on(event: 'message_status', cb: (s: { id: string; status: 'delivered' | 'read' }) => void): void
  on(event: 'typing', cb: (t: { conversation_id: string; user_id: string; is_typing: boolean }) => void): void
  on(event: string, cb: (...args: any[]) => void) {
    this.socket?.on(event, cb)
  }

  sendMessage(conversation_id: string, payload: { content?: string; type: 'text' | 'image'; image_url?: string }) {
    return new Promise<{ id: string; status: string; timestamp: string }>((resolve, reject) => {
      const body = { conversation_id, ...payload }
      if (!this.socket?.connected) {
        this.outbox.push({ conversation_id, payload: body, resolve, reject })
        return
      }
      this.socket.emit('send_message', body, (ack: any) => {
        if (ack?.event === 'message_sent') resolve(ack.data)
        else reject(ack ?? new Error('No ack'))
      })
    })
  }

  typing(conversation_id: string, isTyping: boolean) {
    this.socket?.emit(isTyping ? 'typing_start' : 'typing_stop', { conversation_id })
  }

  markRead(message_id: string) {
    this.socket?.emit('message_read', { message_id })
  }

  private flushOutbox() {
    const queue = this.outbox.splice(0)
    for (const item of queue) {
      this.socket!.emit('send_message', item.payload, (ack: any) => {
        if (ack?.event === 'message_sent') item.resolve(ack.data)
        else item.reject(ack)
      })
    }
  }
}
```

---

## 6. Recommended app flow

### 6.1 App launch
1. Acquire access token (login / refresh).
2. `chat.connect()` once globally — keep alive while app is foregrounded.
3. Fetch `GET /api/chat/conversations` for the chat list.
4. Subscribe to `new_message` to bump unread counts and re-sort the list.

### 6.2 Open a conversation
1. If you only have a `provider_id` or `order_id` (e.g. user tapped "Chat" on a provider page or order detail), call `POST /api/chat/conversations` first to get the conversation id. Idempotent — safe to call every time.
2. `GET /api/chat/conversations/:id/messages?page=1&limit=50` — render reversed.
3. Subscribe to `new_message` filtered by `conversation_id` for live append.
4. On scroll-up, fetch `page=2`, etc.
5. After rendering, call `PATCH /api/chat/conversations/:id/read` to clear unread.
6. While typing, debounce `chat.typing(id, true)`; after 3s idle, `chat.typing(id, false)`.

### 6.3 Sending a message
1. Optimistic-render with a temp id and `status: 'sending'`.
2. `chat.sendMessage(id, { type: 'text', content })`.
3. On ack `message_sent`, swap temp id for server id, set `status: 'sent'`.
4. On `message_status` `delivered`/`read`, update the bubble icon (✓ / ✓✓ / ✓✓ blue).

### 6.4 Sending an image
1. Compress client-side (target ≤ 2MB; server cap 10MB).
2. `POST /api/upload` (bucket `chat-media`) → `image_url`.
3. `chat.sendMessage(id, { type: 'image', image_url })`.

### 6.5 Offline / reconnect
- `socket.io-client` reconnects automatically with exponential backoff (1s → 30s).
- Queue outbound messages while disconnected; flush on `connect` (the example client does this).
- After reconnect, refetch the latest page of messages to catch up on anything missed.

### 6.6 Push notifications (when app is backgrounded)
Out of scope for this gateway. Subscribe to FCM/APNs via the Notifications module; the server will push `new_message` notifications when the recipient has no socket in `user:<userId>`.

---

## 7. Errors

| Source | Shape | Notes |
|---|---|---|
| REST | `{ status: 'error', statusCode, message, timestamp }` | Standard `GlobalExceptionFilter` envelope |
| WS | `WsException` → `error` event with `{ message }` | Validation, auth, or business errors |

Common cases:
- `401 Unauthorized` — token expired; refresh and reconnect.
- `403 Not a participant of this conversation` — wrong user for that conversation id.
- `404 Conversation not found` / `Message not found`.
- `400 Validation failed` — payload didn't match Zod schema (missing `content` for text, missing `image_url` for image, content > 2000 chars, etc.).

---

## 8. Test phones (dev only)

The verify-OTP endpoint accepts `123456` for any phone in dev/staging — useful for seeding two users to test chat end-to-end. Don't ship that to prod.

---

## 9. Spec mapping (US-012)

| AC | Where |
|---|---|
| AC-01 real-time text | WS `send_message` + `new_message` |
| AC-02 text ≤ 2000 / images ≤ 10MB | Zod `sendMessageSchema` + upload pipeline |
| AC-03 sent → delivered → read | `message_status` + auto-deliver on recipient online |
| AC-04 chat tied to order | `conversations.order_id` |
| AC-05 history | `GET /messages` |
| AC-06 push when offline | Notifications module (separate) |
| AC-07 unread count | `owner_unread_count` / `provider_unread_count` on conversation |
| AC-08 sort by last_message_at | `GET /conversations` |
| AC-09 timestamps | `created_at` on each message |
| AC-10 typing indicator | `typing_start` / `typing_stop` → `typing` |
| AC-11 reconnect | `socket.io-client` built-in |
| AC-12 offline queue | Client-side (`flushOutbox` in §5) |
| AC-13 retention 2y | DB-level — not client concern |
