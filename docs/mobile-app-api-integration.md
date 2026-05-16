# PetZone API — Mobile App Integration Guide

Đối tượng: team app mobile (iOS + Android). Tài liệu này cover toàn bộ flow từ login → đặt phòng → thanh toán → check-in/out → review, kèm push notification và deep link.

---

## 0. Quick start

| Hạng mục | Giá trị |
|----------|--------|
| **Base URL (sandbox/staging)** | `https://<railway-app>.up.railway.app` |
| **Base URL (prod)** | `https://api.petzone.vn` *(chưa setup)* |
| **API docs (Swagger UI)** | `{base}/api/docs` |
| **OpenAPI JSON** | `{base}/api/docs-json` — import vào Postman/Insomnia |
| **Auth scheme** | Bearer JWT (Supabase Auth) |
| **API prefix** | Tất cả route đều prefix `/api` |
| **Default Content-Type** | `application/json` |
| **Custom URI scheme** | `petzone://...` (team app reserve trong Info.plist / AndroidManifest) |

---

## 1. Authentication

Auth chạy qua Supabase Auth (số điện thoại OTP). Backend tự verify JWT.

### Sign in flow

```
POST /api/auth/send-otp        { phone: "+84901234567" }
POST /api/auth/verify-otp      { phone, otp }
  → response.data.session.access_token  ← dùng làm Bearer token
  → response.data.session.refresh_token

POST /api/auth/refresh         { refresh_token }
POST /api/auth/logout
```

### Token handling

- Access token lifetime: ~1 giờ
- Refresh khi nhận 401 hoặc proactively trước 5 phút expiry
- Lưu token trong **Keychain (iOS) / EncryptedSharedPreferences (Android)** — không bao giờ ghi vào UserDefaults/SharedPreferences thường

### Authenticated request

```
GET /api/users/me
Headers:
  Authorization: Bearer <access_token>
```

### User profile

```
GET    /api/users/me            — profile hiện tại
PATCH  /api/users/me            — update tên, avatar
POST   /api/users/me/avatar     — upload avatar
```

Field `role` trong profile = `'owner' | 'provider' | 'admin'`. App UI render khác nhau cho owner vs provider.

---

## 2. Common response format

Tất cả response thành công đều bọc trong `{ success, data, message?, pagination? }`:

```json
{
  "success": true,
  "data": { ... },
  "message": "Order created successfully"
}
```

Pagination response:

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 20,
    "total_pages": 1
  }
}
```

Error response:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Order is not in payable status",
  "timestamp": "2026-05-16T08:30:00.000Z"
}
```

**Pagination query**: `?page=1&limit=20`. Max `limit=100`.

---

## 3. Order flow (owner perspective)

### 3.1 Tìm provider

```
GET /api/search/providers?lat=10.78&lng=106.69&page=1
  → trả providers gần vị trí, đã verify, đang active
GET /api/providers/:id
  → chi tiết provider (rooms, add-ons, photos, reviews summary)
```

### 3.2 Tạo pet (1 lần / pet)

```
POST /api/pets         { name, species, breed, weight_kg, ... }
GET  /api/pets         — list pet của owner
```

### 3.3 Tính giá

```
POST /api/orders/calculate-price
Body: {
  provider_id, room_type_id, pet_ids,
  check_in_date: "2026-06-01",
  check_out_date: "2026-06-03",
  add_on_ids: []
}
Response: { room, add_ons, total }
```

App show breakdown trước khi tạo order.

### 3.4 Tạo order

```
POST /api/orders
Body: {
  provider_id, room_type_id, pet_ids,
  check_in_date, check_out_date, add_on_ids,
  special_notes?, daily_status_report: true
}
Response: order { id, status: "pending_payment", total_price, ... }
```

→ Order ở status `pending_payment` chờ thanh toán.

### 3.5 Order status timeline

```
pending_payment    → owner pay
pending            → provider accept (deadline 4h)
confirmed          → provider check-in pet (provider upload photos)
checked_in
in_progress       → provider check-out (upload photos)
check_out         → owner confirm received (deadline 24h, sau đó auto-complete)
completed
  └─ owner có 7 ngày để review

Branches:
cancelled         → bởi owner (trước check-in) hoặc provider (decline)
disputed          → admin xử lý
```

### 3.6 Provider response

```
POST /api/orders/:id/accept   (provider)
POST /api/orders/:id/decline  (provider) — body { reason }
POST /api/orders/:id/cancel    (owner)   — body { reason }
```

### 3.7 Check-in / check-out (provider)

```
POST /api/orders/:id/check-in    body { photos: [], note?, latitude?, longitude? }
POST /api/orders/:id/check-out   body { photos: [], note? }
```

### 3.8 Owner confirm pet received

```
POST /api/orders/:id/confirm-receive    (owner, sau khi provider check-out)
```

Nếu owner không action trong 24h → cron auto-complete (silent).

### 3.9 Review

```
POST /api/reviews    body { order_id, rating_overall, rating_cleanliness, ..., text, photos }
```

7 ngày từ khi order completed.

---

## 4. Payment integration ⚡

PetZone v1 hỗ trợ **4 phương thức**:

| Method | Flow | Hiển thị label | Khi nào dùng |
|--------|------|---------------|--------------|
| `vietqr` ⭐ | QR ngân hàng, owner chuyển khoản trực tiếp tới provider, SePay verify | "Chuyển khoản QR (VietQR)" | Default — đa số owner |
| `cash` | Tiền mặt, provider tự confirm tại check-in | "Tiền mặt khi check-in" | Owner thích trả mặt, không tin chuyển khoản |
| `momo` | Owner pay qua MoMo → PetZone collect → chuyển provider sau | "MoMo" | Owner thích ví MoMo |
| `bank_transfer` | Chuyển khoản thủ công, admin verify | "Chuyển khoản thủ công" | Fallback |

App nên check `app_config` (qua `GET /api/admin/config` — public) để biết method nào đang enabled trước khi render UI selector. Hoặc đơn giản hơn: gọi `POST /payments/create`, nếu trả 400 "method disabled" thì app fallback option khác.

### 4.1 Tạo payment (chung)

```
POST /api/payments/create
Headers: Authorization: Bearer <jwt>
Body: {
  order_id: "<uuid>",
  method: "vietqr" | "cash" | "momo" | "bank_transfer",
  return_url?: "..."     // override env default; chỉ dùng cho MoMo
}
```

Response shape khác nhau theo method — chi tiết bên dưới.

### 4.2 VietQR flow ⭐

```json
// Response
{
  "success": true,
  "data": {
    "payment": { "id": "uuid", "status": "pending", "method": "vietqr", "amount": 1200000, ... },
    "redirect_url": null,
    "qr_code_url": "https://img.vietqr.io/image/VCB-0123456789-compact2.png?amount=1200000&addInfo=PB-20260516-0001&accountName=NGUYEN%20VAN%20A",
    "deeplink": null,
    "bank_info": {
      "bank_name": "Vietcombank",
      "account_number": "0123456789",
      "account_holder": "NGUYEN VAN A",
      "content": "PB-20260516-0001",
      "amount": 1200000
    }
  }
}
```

**App flow:**

1. Hiển thị **QR image** từ `qr_code_url` (kích thước recommended ≥ 320x320)
2. Hiển thị **bank_info** bên dưới QR để owner copy thủ công nếu cần:
   - Ngân hàng: Vietcombank
   - STK: 0123456789 (button Copy)
   - Chủ tài khoản: NGUYEN VAN A
   - **Số tiền: 1,200,000đ** (in đậm, có nút Copy)
   - **Nội dung: PB-20260516-0001** (in đậm, có nút Copy — cảnh báo "Phải nhập đúng nội dung này")
3. Hiển thị countdown 15 phút (timeout payment)
4. **Polling** `GET /api/payments/:orderId` mỗi 3 giây
5. Khi `payment.status === 'completed'` → chuyển sang screen "Đã nhận thanh toán, chờ chủ hotel xác nhận"
6. Hoặc nếu owner đổi ý: `POST /api/payments/:paymentId/cancel`

**Owner có thể scan QR bằng:**
- App ngân hàng VN (35+ banks Napas247): VCB, BIDV, Techcombank, MBBank, ACB, ...
- ZaloPay, Viettel Money, ShopeePay
- MoMo (phiên bản 2024+ có "Chuyển tiền nhanh")

**Owner KHÔNG cần ra khỏi app PetZone** — chỉ mở app bank phụ scan QR, quay lại PetZone xem kết quả.

### 4.3 Cash flow

```json
// Response
{
  "success": true,
  "data": {
    "payment": { "id": "uuid", "status": "pending", "method": "cash", ... },
    "redirect_url": null,
    "qr_code_url": null,
    "deeplink": null,
    "bank_info": null,
    "cash_info": {
      "amount": 1200000,
      "instructions": "Mang đúng số tiền mặt tới điểm check-in. Chủ hotel sẽ xác nhận khi nhận đủ."
    }
  }
}
```

**App flow:**

1. Hiển thị screen "Trả tiền mặt tại check-in"
2. Highlight `cash_info.amount` (1,200,000đ)
3. Hiển thị `instructions`
4. Hiển thị địa chỉ provider để owner biết tới đâu
5. Không cần polling — order tự move sang `pending` ngay (provider sẽ accept)
6. Sau khi provider check-in + confirm cash → owner nhận push notification

**Lưu ý quan trọng cho owner:**
- Đem **đúng** số tiền (không thừa, không thiếu — provider có thể không có tiền thối)
- Order sẽ vào hàng đợi của provider để accept như các phương thức khác
- Nếu owner không xuất hiện → provider có quyền cancel + báo cáo

### 4.4 MoMo flow

```json
// Response
{
  "success": true,
  "data": {
    "payment": { ... },
    "redirect_url": "https://test-payment.momo.vn/v2/gateway/pay/MOMO123...",
    "qr_code_url": "https://test-payment.momo.vn/qr/MOMO123.png",
    "deeplink": "momo://app?action=payWithApp&..."
  }
}
```

**App flow:**

1. App mở `redirect_url`:
   - iOS: `UIApplication.shared.open(URL(string: redirectUrl)!)`
   - Android: `startActivity(Intent(ACTION_VIEW, Uri.parse(redirectUrl)))`
2. OS launch app MoMo nếu có cài, fallback browser
3. Owner thanh toán trong MoMo
4. MoMo redirect về `petzone://payment/return?orderId=...&resultCode=0`
5. App intercept deeplink → re-fetch `GET /api/payments/:orderId`
6. Nếu `status === 'completed'` → success screen

**Sandbox MoMo test:**
- SĐT: `9704 0000 0000 0018`
- OTP: `000000`

**Đặc biệt với MoMo (khác VietQR):**
- KHÔNG trust `resultCode` từ deeplink query params — luôn re-fetch API
- MoMo IPN (server→server) là source of truth, deeplink chỉ là UX trigger

### 4.5 Bank transfer flow

```json
// Response giống cash nhưng cần admin xác nhận thủ công
{
  "data": {
    "payment": { "id": "uuid", "status": "pending", "transaction_ref": "BT-..." }
  }
}
```

App show bank info hard-coded của PetZone + nội dung cần ghi. Admin verify trên dashboard → flip thành completed. Ít dùng — chỉ giữ làm fallback.

### 4.6 Get payment status

```
GET /api/payments/:orderId
Response: payment { id, status, method, amount, transaction_ref, paid_at, ... }
```

Polling interval khuyến nghị:
- VietQR: **3 giây** (owner kỳ vọng feedback nhanh)
- MoMo: **5 giây** (slower, gateway latency)
- Cash: **không polling** — chờ push notification

### 4.7 Cancel pending payment

Owner đổi ý không pay nữa:

```
POST /api/payments/:paymentId/cancel
Response: payment { status: "failed" }
```

Order vẫn ở `pending_payment` — owner có thể tạo payment mới với method khác.

### 4.8 Refund

```
POST /api/payments/:orderId/refund
Body: { amount, reason, type: "full" | "partial" }
```

- MoMo: tự refund qua gateway
- VietQR + Cash: **không tự refund được** — admin coordinate offline với provider, ghi nhận qua admin dashboard

### 4.9 DEV — Simulate payment success (chỉ build dev)

```
POST /api/payments/:paymentId/dev-simulate-paid
Headers: Authorization: Bearer <jwt>
```

- Chỉ hoạt động khi backend env `DEV_SIMULATE_ENABLED=true`
- Chỉ work với method `vietqr`
- App dev build show nút "🧪 Simulate paid" dưới QR — tap → flow chạy hết
- TUYỆT ĐỐI không enable button này trên production build

---

## 5. Push notifications (FCM)

### 5.1 Setup app side

1. Lấy file Firebase config từ backend team:
   - iOS: `GoogleService-Info.plist`
   - Android: `google-services.json`
2. Cài Firebase SDK:
   - iOS: `Firebase/Messaging` qua SPM hoặc CocoaPods
   - Android: `com.google.firebase:firebase-messaging`
3. Request permission, đăng ký FCM token

### 5.2 Đăng ký token với backend

Khi user **login thành công** (hoặc khi FCM token rotate):

```
POST /api/notifications/device-token
Headers: Authorization: Bearer <jwt>
Body: {
  token: "<fcm-registration-token>",
  platform: "ios" | "android"
}
```

Khi user **logout**, xóa token:

```
DELETE /api/notifications/device-token/:token
```

### 5.3 FCM payload format

Backend gửi payload qua FCM với shape:

```json
{
  "notification": {
    "title": "Đã nhận thanh toán ✅",
    "body": "Đơn PB-20260516-0001 (1.200.000đ) — đang chờ chủ hotel xác nhận."
  },
  "data": {
    "type": "payment",
    "event": "payment.completed",
    "notification_id": "<uuid>",
    "click_action": "petzone://order/<uuid>",
    "order_id": "<uuid>",
    "order_number": "PB-20260516-0001",
    "amount": "1200000",
    "gateway": "vietqr"
  }
}
```

**Quan trọng:**
- Tất cả value trong `data` đều là **string** (FCM constraint). Số/boolean phải `parseInt`/`parseBool` ở app side.
- `data.click_action` chứa deep link — app handle khi user tap notification

### 5.4 Notification types

| `data.type` | Khi nào | Hành động app |
|------------|---------|--------------|
| `payment` | Payment success/failed, cash pending | Mở order detail |
| `order_status` | Order confirmed/declined/cancelled/checked_in/check_out | Mở order detail |
| `new_message` | Chat mới | Mở conversation |
| `reminder_review` | Order completed, nhắc review | Mở review screen |
| `verification` | Account verified | Mở profile |
| `system` | Thông báo hệ thống | Mở notification list |

### 5.5 Event keys (chi tiết `data.event`)

| Event | Recipient | Tình huống |
|-------|-----------|-----------|
| `payment.completed` | Owner + Provider | Payment đã success (mọi method) |
| `payment.failed` | Owner | Payment fail |
| `payment.cash_pending` | Provider | Owner pick cash, provider cần biết để thu tiền khi check-in |
| `order.confirmed` | Owner | Provider accept |
| `order.declined` | Owner | Provider decline |
| `order.cancelled` | Counterparty | Bên còn lại cancel |
| `order.checked_in` | Owner | Provider check-in pet |
| `order.check_out` | Owner | Provider check-out, chờ owner confirm |
| `order.completed` | Owner | Order xong, nhắc review |
| `chat.new_message` | Recipient | Tin nhắn mới |

### 5.6 In-app notification center

Notification cũng được lưu DB — show trong notification icon (tab thông báo):

```
GET    /api/notifications?page=1
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
DELETE /api/notifications/:id
```

Field `is_read` = false → badge counter.

---

## 6. Deep links

### 6.1 Custom URI scheme

App reserve scheme `petzone`. Tất cả deep link từ FCM + payment return URL đều dùng:

```
petzone://payment/return?orderId=...&status=...
petzone://order/<uuid>
petzone://provider/order/<uuid>
petzone://chat/<conversation_id>
petzone://order/<uuid>/review
```

iOS — `Info.plist`:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array><string>petzone</string></array>
  </dict>
</array>
```

Android — `AndroidManifest.xml`:
```xml
<activity ...>
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="petzone" />
  </intent-filter>
</activity>
```

### 6.2 Universal Link / App Link (production)

Sau khi go-live với domain `app.petzone.vn`:

- iOS: thêm Associated Domain `applinks:app.petzone.vn`
- Android: intent filter HTTPS với `autoVerify=true`
- Backend host AASA + assetlinks file (do team backend)

Trong dev phase, custom scheme đủ — bỏ qua phần này.

### 6.3 Khi nhận deep link

```typescript
function handleDeepLink(url: string) {
  // petzone://order/abc-123
  const path = url.replace('petzone://', '')
  const parts = path.split('/')

  if (parts[0] === 'order') {
    navigate('OrderDetail', { orderId: parts[1] })
  } else if (parts[0] === 'payment' && parts[1] === 'return') {
    // QUAN TRỌNG: không trust query params, luôn re-fetch
    const orderId = new URL(url).searchParams.get('orderId')
    if (orderId) {
      refetchPayment(orderId)
      navigate('PaymentResult', { orderId })
    }
  }
  // ... chat, provider/order, review
}
```

---

## 7. Provider-specific endpoints

Nếu app cũng dùng cho provider role (1 app duy nhất, role-based UI):

### 7.1 Order management

```
GET  /api/orders                       — list orders (filter theo role tự động)
GET  /api/orders?status=pending         — chỉ orders chờ accept
POST /api/orders/:id/accept             — accept
POST /api/orders/:id/decline            — decline kèm reason
POST /api/orders/:id/check-in           — upload photos handoff
POST /api/orders/:id/check-out          — upload photos pickup
POST /api/payments/:id/confirm-cash     — nếu order method=cash
```

### 7.2 Provider profile

```
GET   /api/providers/me                 — profile provider
PATCH /api/providers/me                 — update business info
PUT   /api/providers/me/bank            — cập nhật STK ngân hàng (sẽ chờ admin verify)
GET   /api/payments/payouts             — list payouts
POST  /api/payments/payouts/request     — request payout (cho online methods)
```

### 7.3 Status reports

```
POST /api/status-reports               — daily report cho 1 order { order_id, photos, feeding_status, ... }
GET  /api/status-reports?order_id=...  — list reports cho 1 order (owner xem được)
```

---

## 8. Chat

Realtime qua Supabase Realtime (subscribe trực tiếp từ app, không qua API).

```
GET  /api/chat/conversations                            — list conversations
GET  /api/chat/conversations/:id/messages?page=1        — paginated messages
POST /api/chat/conversations/:id/messages               — gửi tin
```

Supabase realtime subscribe:
```typescript
supabase
  .channel(`chat:${conversationId}`)
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversationId}` }, handleNewMessage)
  .subscribe()
```

Backend tự emit `chat.new_message` event → push notification gửi cho recipient.

---

## 9. Upload (photos, avatars)

Direct upload từ app lên Supabase Storage:

```
POST /api/upload/signed-url
Body: { bucket: "pet-photos" | "check-in-photos" | "avatars" | ..., filename }
Response: { signed_url, public_url }

→ App PUT file thẳng lên signed_url
→ Lưu public_url vào DB qua các endpoint khác (pets, orders, etc.)
```

Bucket policy đã RLS, app chỉ cần signed URL.

---

## 10. Error handling

| Code | Ý nghĩa | App nên làm gì |
|------|--------|---------------|
| `400` | Validation / business rule | Show error message từ `response.message` |
| `401` | Token expired / invalid | Refresh token, retry. Nếu refresh fail → logout |
| `403` | Không có quyền | Show "Không có quyền truy cập" |
| `404` | Resource không tồn tại | Show "Không tìm thấy" + về home |
| `409` | Conflict (vd: book trùng phòng) | Show error, refresh data |
| `429` | Rate limit | Retry sau 60s với exponential backoff |
| `500+` | Server error | Show "Lỗi hệ thống", retry sau, log lên Sentry |

Globally handle 401 ở interceptor (axios/fetch wrapper):

```typescript
if (status === 401) {
  const refreshed = await refreshToken()
  if (refreshed) return retry()
  else logout()
}
```

---

## 11. Testing checklist

Trước khi ship build dev cho QA:

- [ ] Login/logout flow OK
- [ ] FCM token register sau login, deactivate sau logout
- [ ] Tạo order → pick VietQR → hiển thị QR + bank info
- [ ] Tap "Simulate paid" (dev) → status flip → success screen
- [ ] Test với SePay test webhook trên Railway dashboard
- [ ] Tạo order → pick Cash → screen hiển thị instructions
- [ ] Provider login → thấy order cash pending → confirm cash → owner nhận push
- [ ] Push notification: tap → deep link đúng screen
- [ ] Cancel pending payment → order quay về `pending_payment`
- [ ] Polling stop khi screen unmount (tránh leak)
- [ ] Offline mode: cache last known state, retry khi online
- [ ] Token rotation: FCM rotate token → re-register lên backend

---

## 12. Liên hệ debug

Khi có vấn đề về API:

1. Check Swagger UI `{base}/api/docs` xem request/response chuẩn
2. Check Railway logs (backend team) — filter theo `payment_id` hoặc `user_id`
3. Check Supabase Studio cho state DB nếu API trả 404
4. Cung cấp khi ping backend:
   - HTTP method + URL
   - Request body (mask token)
   - Response status + body
   - Thời điểm (UTC)
   - `order_id` / `payment_id` / `user_id` liên quan

---

## 13. Phương thức thanh toán — bảng tóm tắt

| Method | UX flow | Response chính | Polling? | Notification |
|--------|---------|---------------|----------|-------------|
| `vietqr` | App hiển thị QR + bank info → owner scan bằng app bank → quay về app PetZone | `qr_code_url`, `bank_info` | ✅ 3s | Push khi SePay confirm |
| `cash` | Screen "Trả tiền mặt khi check-in" + amount | `cash_info` | ❌ | Push khi provider confirm cash |
| `momo` | App mở `redirect_url` → MoMo app → back via deeplink | `redirect_url`, `deeplink`, `qr_code_url` | ✅ 5s | Push khi MoMo IPN |
| `bank_transfer` | Screen hiển thị bank info PetZone + ND chuyển khoản | (info hardcode) | ❌ | Push khi admin verify |

---

**Phiên bản doc**: 2026-05-16 | **API version**: v1
