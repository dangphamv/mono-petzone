# PetZone API — Mobile Chat Integration Guide

Đối tượng: team app mobile (iOS + Android). Cover toàn bộ flow chat: tạo conversation, gửi/nhận tin nhắn (REST + WebSocket realtime), trạng thái sent/delivered/read, typing indicator, gửi ảnh.

Tham khảo thêm: [`mobile-app-api-integration.md`](./mobile-app-api-integration.md) cho auth/base URL chung.

---

## 0. Connection info & test accounts

> 🔧 **Backend cần fill thông tin thật trước khi share cho team app.** Các giá trị `TODO` bên dưới đang chờ backend cập nhật.

### 0.1 Endpoints

| Môi trường | REST base | WebSocket URL | Trạng thái | 
| **Staging** | `https://petzone-api.up.railway.app` | `https://petzone-api.up.railway.app/chat` | Live | 

Swagger UI staging: `{REST base}/api/docs`
OpenAPI JSON (import vào Postman): `{REST base}/api/docs-json`

### 0.2 Test accounts (staging)

| Role | Phone | OTP test | user_id | Ghi chú |
|------|-------|---------|---------|--------|
| Owner A | `TODO +849...` | `TODO 6-digit` | `TODO uuid` | Có pet + order mẫu |
| Provider B | `TODO +849...` | `TODO 6-digit` | `TODO uuid` | Đã verified |
| Owner C | `TODO +849...` | `TODO 6-digit` | `TODO uuid` | Account rỗng (test empty state) |

OTP flow trên staging:
- [ ] **TODO**: backend chọn 1 trong 2 phương án và cập nhật:
  - (a) Dùng Supabase test phone numbers — OTP cố định, không gửi SMS thật. List phone + OTP cập nhật vào bảng trên.
  - (b) Gửi SMS thật → cung cấp 1 SIM dùng chung cho team QA + hướng dẫn nhận OTP.

### 0.3 Seed data tham khảo

| Resource | ID | Mục đích |
|----------|-----|---------|
| Conversation có lịch sử dài | `TODO uuid` | Test pagination + render scrollback |
| Conversation rỗng | `TODO uuid` | Test empty state |
| Conversation gắn order | `TODO uuid` | Test flow tạo từ `order_id` |
| Order chưa có conversation | `TODO uuid` | Test idempotent create |
| Provider để owner chat lần đầu | `TODO providers.id` | Test flow tạo từ `provider_id` |

> Backend chuẩn bị seed script trong `supabase/seed.sql` (hoặc 1 script TS riêng) — chạy 1 phát ra đủ data trên cho staging.

### 0.4 FCM push notification

- Firebase project, `google-services.json` (Android), `GoogleService-Info.plist` (iOS): xem [`firebase-handoff-mobile.md`](./firebase-handoff-mobile.md).
- Payload + topic + click action: xem [`mobile-fcm-integration.md`](./mobile-fcm-integration.md).
- Push event cho chat: `type: 'new_message'`, `clickAction: petzone://chat/<conversation_id>`.

### 0.5 Postman collection

- [ ] **TODO** backend export collection từ `/api/docs-json` + env file staging có biến `{{base_url}}`, `{{access_token}}`, `{{owner_a_id}}`, `{{provider_b_id}}`. Drop link Drive/Slack vào đây.

### 0.6 Liên hệ / support

- Slack channel: **TODO** (vd `#petzone-mobile-api-support`)
- Backend on-call: **TODO** (tên + handle)
- SLA: response trong giờ làm việc (9h–18h, T2–T6)
- Báo lỗi WS / token / push → kèm `user_id`, `conversation_id`, timestamp UTC, log từ app

### 0.7 Technical constants

| Mục | Giá trị |
|-----|--------|
| **REST prefix** | `/api/chat/*` |
| **WebSocket namespace** | `/chat` (Socket.IO, **không** có prefix `/api`) |
| **WS transport** | `websocket` (Socket.IO v4) |
| **Auth** | Bearer JWT (cùng access_token của REST) |
| **Realtime stack** | Socket.IO (KHÔNG dùng Supabase Realtime nữa) |
| **Message types** | `text`, `image` |
| **Message status** | `sent` → `delivered` → `read` |
| **Storage bucket cho ảnh chat** | `chat-media` |
| **Max text length** | 2000 ký tự |
| **Pagination max limit** | 100 |

> ⚠️ Trước đây doc mobile tổng có gợi ý subscribe trực tiếp Supabase Realtime — **deprecated**. App phải connect qua Socket.IO `/chat` để nhận events.

---

## 1. Mô hình dữ liệu

### Conversation

```ts
{
  id: string,                     // uuid
  order_id: string | null,        // null nếu chat không gắn order
  owner_id: string,               // users.id của owner
  provider_id: string,            // users.id của provider (không phải providers.id)
  last_message_at: string | null, // ISO timestamp
  owner_unread_count: number,
  provider_unread_count: number,
  created_at: string,
  updated_at: string
}
```

Quy tắc:
- Một cặp `(owner_id, provider_id, order_id)` là **unique** → tạo conversation là **idempotent**, gọi lại sẽ trả conversation cũ.
- `order_id = null` cho chat tự do (owner chủ động liên hệ provider trước khi book).
- Khi mở conversation list, app dùng `owner_unread_count` hoặc `provider_unread_count` tuỳ vai trò để hiển thị badge.

### Message

```ts
{
  id: string,                       // uuid
  conversation_id: string,
  sender_id: string,                // users.id của người gửi
  content: string | null,           // null khi type=image
  type: 'text' | 'image',
  image_url: string | null,         // URL ảnh trên Supabase Storage
  status: 'sent' | 'delivered' | 'read',
  created_at: string,               // ISO timestamp
  read_at: string | null
}
```

Quy tắc:
- `type='text'` → bắt buộc `content` (max 2000 ký tự).
- `type='image'` → bắt buộc `image_url`. `content` có thể null hoặc caption.
- Status chỉ tăng đơn hướng `sent → delivered → read`, không quay ngược.

---

## 2. REST endpoints

Tất cả endpoint cần `Authorization: Bearer <access_token>`.

### 2.1 Tạo / tìm conversation (idempotent)

```
POST /api/chat/conversations
```

Body — chỉ cần **1 trong 3 trường** sau:

| Field | Khi dùng |
|-------|---------|
| `order_id` | Có order trong tay (cả owner và provider đều dùng được) |
| `provider_id` | Owner chủ động liên hệ provider (truyền `providers.id`, không phải user_id) |
| `owner_id` | **Provider** chủ động liên hệ owner (truyền `users.id`); caller phải là provider |

Response (201, đã tồn tại hoặc vừa tạo):

```json
{
  "success": true,
  "message": "Conversation ready",
  "data": {
    "id": "...",
    "order_id": null,
    "owner_id": "...",
    "provider_id": "...",
    "last_message_at": "2026-05-17T10:30:00Z",
    "owner_unread_count": 0,
    "provider_unread_count": 0,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

Lỗi:
- `403` — caller không phải owner/provider của order, hoặc cố `owner_id` mà không phải provider
- `404` — order/provider/owner không tồn tại

### 2.2 List conversations

```
GET /api/chat/conversations?page=1&limit=20
```

- Trả conversation mà caller là `owner_id` **hoặc** `provider_id`.
- Sắp xếp theo `last_message_at DESC NULLS LAST`.
- Pagination chuẩn: `{ data, pagination: { page, limit, total, totalPages } }`.

> App cần join thêm thông tin user/provider/last_message: hiện endpoint trả conversation thô. Hãy cache user info ở app, hoặc gọi thêm `/api/users/:id`, `/api/providers/:id`. Nếu cần endpoint trả kèm — báo team backend.

### 2.3 List messages trong 1 conversation

```
GET /api/chat/conversations/:id/messages?page=1&limit=20
```

- Sort `created_at DESC` (mới nhất trước → app reverse khi render).
- `limit` max 100.
- `403` nếu không phải participant.
- `404` nếu conversation không tồn tại.

### 2.4 Gửi message (REST)

```
POST /api/chat/conversations/:id/messages
```

Body — text:
```json
{ "type": "text", "content": "Chào shop, bé Miu nhà mình hơi nhút nhát nhé." }
```

Body — image:
```json
{ "type": "image", "image_url": "https://....supabase.co/.../chat-media/abc.jpg", "content": "optional caption" }
```

Response 201 → trả `ChatMessage` đầy đủ.

> ⚠️ Backend **chỉ nhận URL ảnh**, không upload trực tiếp qua endpoint chat. App phải upload trước (xem mục 5).

### 2.5 Mark conversation as read

```
PATCH /api/chat/conversations/:id/read
```

Hành vi:
- Set tất cả message của đối phương trong conversation → `status='read'`, `read_at=now()`.
- Reset `owner_unread_count` hoặc `provider_unread_count` của caller về 0.
- Trả về `{ unread_count: 0, marked_count: N }`.
- Backend tự emit WS event `message_status` cho đối phương từng message vừa được đọc.

Gọi khi: user mở màn hình chat detail, hoặc khi đang trong screen mà có message mới đến.

### 2.6 Mark 1 message as delivered (fallback)

```
POST /api/chat/messages/:id/delivered
```

App **không cần gọi endpoint này nếu đang connect WebSocket** — backend tự mark delivered ngay khi recipient có socket online (xem mục 3.4). Endpoint dành cho trường hợp app nhận message qua push mà không có WS active.

---

## 3. WebSocket realtime

### 3.1 Kết nối

URL: `{base}/chat` (namespace `/chat`).

Token có thể truyền qua **một trong** 3 cách:

```ts
// Cách 1: Socket.IO auth payload (KHUYẾN NGHỊ)
const socket = io(`${BASE_URL}/chat`, {
  transports: ['websocket'],
  auth: { token: accessToken },
})

// Cách 2: query string
const socket = io(`${BASE_URL}/chat?token=${accessToken}`, { transports: ['websocket'] })

// Cách 3: Authorization header (chỉ một số client lib hỗ trợ)
const socket = io(`${BASE_URL}/chat`, {
  transports: ['websocket'],
  extraHeaders: { Authorization: `Bearer ${accessToken}` },
})
```

Sau khi kết nối thành công:

```ts
socket.on('connected', ({ user_id }) => { /* verify đúng user */ })
socket.on('error', (e) => { /* { message: 'Unauthorized' } → token hết hạn */ })
socket.on('disconnect', (reason) => { /* reconnect logic */ })
```

Backend **tự disconnect** nếu token invalid → app phải refresh token rồi reconnect.

> Mỗi user có 1 room ảo `user:<userId>`. App **không cần** join room thủ công — backend tự join khi handshake.

### 3.2 Events server → client

| Event | Khi nào nhận | Payload |
|-------|-------------|---------|
| `connected` | Sau khi handshake OK | `{ user_id }` |
| `new_message` | Có tin nhắn mới trong conversation user là participant | `{ id, conversation_id, sender_id, content, type, image_url, status, timestamp }` |
| `message_status` | Trạng thái 1 message vừa thay đổi (cho **sender** biết tin của mình đã delivered/read) | `{ id, status: 'delivered' \| 'read' }` |
| `typing` | Đối phương đang gõ trong 1 conversation | `{ conversation_id, user_id, is_typing }` |
| `error` | Lỗi xác thực / payload invalid | `{ message }` |

> `new_message` được emit **cho cả sender và recipient** → app dùng chính event này để confirm message đã được lưu (không cần callback của `send_message` riêng).

> Field `timestamp` trong `new_message` = `created_at` ở REST. Đặt tên khác do legacy — sẽ đồng bộ sau.

### 3.3 Events client → server

#### Gửi message

```ts
socket.emit('send_message', {
  conversation_id: '...',
  type: 'text',                       // hoặc 'image'
  content: 'Hello',                   // bắt buộc nếu type=text
  image_url: 'https://...',           // bắt buộc nếu type=image
})
```

Có thể nhận ack qua callback Socket.IO:

```ts
socket.emitWithAck('send_message', payload).then((res) => {
  // res = { event: 'message_sent', data: { id, status, timestamp } }
})
```

Sau khi gửi:
- Sender nhận event `new_message` (chính tin của mình) → dùng để replace message tạm trong UI.
- Recipient nhận `new_message`. Nếu recipient có WS online → backend tự gọi mark-delivered → sender nhận `message_status` `{ status: 'delivered' }`.

#### Typing indicator

```ts
socket.emit('typing_start', { conversation_id: '...' })
socket.emit('typing_stop',  { conversation_id: '...' })
```

- Đối phương sẽ nhận event `typing` với `is_typing: true|false`.
- Khuyến nghị debounce: emit `typing_start` lần đầu, sau đó throttle 2s; emit `typing_stop` sau khi user dừng gõ ~1.5s hoặc khi gửi message.

#### Mark 1 message đã đọc (real-time)

```ts
socket.emit('message_read', { message_id: '...' })
```

App nên dùng REST `PATCH /chat/conversations/:id/read` khi mở màn hình (mass mark), và `message_read` qua WS cho từng message khi user thực sự nhìn thấy (scroll-into-view) — tuỳ UX nhóm app chọn.

### 3.4 Lifecycle status — ai trigger gì

```
[sender emit send_message]
        ↓
   status = 'sent'   ──→ new_message (cả 2 phía)
        ↓
[recipient có WS online?]
   yes → backend tự mark delivered
        ↓
   status = 'delivered' ──→ message_status (sender)

[recipient mở chat / scroll thấy]
   → REST mark-read  hoặc  WS message_read
        ↓
   status = 'read'    ──→ message_status (sender)
```

Nếu recipient **không có WS** lúc message gửi:
- Status giữ ở `sent`.
- Recipient nhận push (FCM) → mở app.
- Khi recipient connect WS hoặc gọi REST mark-read, status chuyển tiếp đúng tuần tự.
- Optionally recipient gọi `POST /api/chat/messages/:id/delivered` ngay khi nhận push (rare, chỉ cần nếu UX yêu cầu badge "delivered" trước khi mở chat).

---

## 4. Push notification

- Backend tự emit FCM push khi có `new_message` và recipient không có WS active (chi tiết xem `mobile-fcm-integration.md`).
- Data payload có `type: 'chat.new_message'`, `conversation_id`, `message_id`.
- Khi user tap push → deep link `petzone://chat/<conversation_id>`.
- Sau khi app mở conversation → gọi `PATCH /chat/conversations/:id/read` để clear badge.

---

## 5. Gửi ảnh

Flow 2 bước:

### Bước 1: upload ảnh lên Supabase Storage

App được dùng 1 trong 2 cách (xem `mobile-app-api-integration.md` mục Upload):

**Direct base64 (nhỏ, dễ):**
```
POST /api/upload/image
Body: { bucket: "chat-media", filename: "msg-1234.jpg", base64: "..." }
Response: { url: "https://....supabase.co/.../chat-media/<userId>/<ts>-msg-1234.jpg" }
```

**Presigned URL (lớn, dùng PUT trực tiếp):**
```
POST /api/upload/presigned
Body: { bucket: "chat-media", filename: "msg-1234.jpg" }
Response: { url: <signed PUT url>, path: "<userId>/<ts>-msg-1234.jpg" }
```
Sau đó app `PUT` binary file lên `url` đó, rồi tự construct public URL hoặc gọi backend lấy.

Bucket: `chat-media`. File path tự gắn `userId/timestamp-filename`.

### Bước 2: gửi message

```ts
socket.emit('send_message', {
  conversation_id,
  type: 'image',
  image_url: '<url từ bước 1>',
  content: 'optional caption',
})
```

Hoặc REST:
```
POST /api/chat/conversations/:id/messages
Body: { type: 'image', image_url: '...', content: '...' }
```

> Compress ảnh ở client trước khi upload (target ~1MB, max width 1600px). Format: jpg/png/webp/heic được support.

---

## 6. Reconnect & offline strategy

**Token expired:**
- WS nhận `error: { message: 'Unauthorized' }` rồi `disconnect`.
- App refresh token → reconnect với token mới.

**Mất mạng:**
- Socket.IO tự reconnect (set `reconnection: true`, default).
- Sau khi reconnect → gọi `GET /chat/conversations/:id/messages?page=1` để pull các tin nhắn miss trong khoảng disconnect (so sánh `created_at` với tin cuối cùng trong cache).

**Background:**
- iOS/Android có thể kill WS khi app vào background. Không relyance vào WS để nhận tin khi app không foreground → đã có FCM push cover.
- Khi app trở lại foreground → reconnect WS + refresh conversation list để cập nhật unread count.

**Send khi offline (optional UX):**
- App có thể queue local message với `status='pending'`, lưu vào local DB.
- Khi reconnect → flush queue qua WS `send_message` lần lượt; thay thế bằng `new_message` echo về.
- Backend không hỗ trợ idempotency key cho send → tạm thời client tự lo tránh double-send.

---

## 7. Lỗi thường gặp

| Code | Tình huống | Xử lý |
|------|-----------|------|
| `400` | `content` rỗng cho type=text, hoặc `image_url` thiếu cho type=image | Validate trước khi gửi |
| `400` | `content` > 2000 ký tự | Cắt trước, hoặc tách thành nhiều message |
| `401` | Token hết hạn / invalid | Refresh token rồi retry |
| `403` | Không phải participant của conversation | Conversation không thuộc về user — kiểm tra logic flow |
| `404` | Conversation/order/provider không tồn tại | Pull lại list conversations |
| WS `Unauthorized` | Token sai/hết hạn lúc connect | Refresh + reconnect |
| WS `Invalid payload` | Schema sai khi emit | Check payload structure khớp doc |

---

## 8. Checklist tích hợp

- [ ] Connect WS `/chat` ngay sau khi user login + có valid token
- [ ] Handle reconnect khi token refresh, network drop, foreground transition
- [ ] Listen `new_message` → update conversation + message cache
- [ ] Listen `message_status` → cập nhật tick "đã gửi / đã nhận / đã đọc" cho message của mình
- [ ] Listen `typing` → hiển thị typing indicator
- [ ] Emit `typing_start`/`typing_stop` với debounce
- [ ] Mark read khi vào màn hình chat (REST `PATCH /chat/conversations/:id/read`)
- [ ] Pull message history qua REST khi mở conversation (không relyance vào WS để load lịch sử)
- [ ] Compress + upload ảnh lên `chat-media` bucket trước khi gửi image message
- [ ] Handle deep link `petzone://chat/<conversation_id>` từ push notification
- [ ] FCM topic / token đăng ký để nhận push khi WS không active

---

## 9. Liên hệ

Backend chat module: `apps/api/src/modules/chat/` (controller + service + gateway).
Schema migration: `supabase/migrations/20260407000007_chat_calls.sql`.
Validators: `packages/validators/src/chat.ts`.

Có thay đổi schema/contract → backend sẽ update doc này + bump version note ở đầu file.
