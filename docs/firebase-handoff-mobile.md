# PetZone Firebase — Mobile Hand-off

## Files đính kèm

| File | Cho | Note |
|------|-----|------|
| `GoogleService-Info.plist` | iOS team | Drag vào Xcode project root (target: app) |
| `google-services.json` | Android team | Copy vào `app/` cùng cấp `build.gradle.kts` |

## Firebase project info

```
Project ID:         petzone-dev-c3270
Project Number:     (xem trong file config)
Region:             default (us-central)
Environment:        DEV/STAGING (không phải prod)
```

## Cloud Messaging (FCM) — đã enable

Backend dùng `firebase-admin` SDK để gửi push. App chỉ cần:
1. Cài Firebase SDK + Messaging module
2. Request notification permission (đặc biệt iOS + Android 13+)
3. Lấy FCM registration token
4. POST token lên backend khi user login

## API endpoint đăng ký token

```
POST /api/notifications/device-token
Authorization: Bearer <jwt>
Content-Type: application/json
Body: { "token": "<fcm-token>", "platform": "ios" | "android" }
```

Khi user logout:
```
DELETE /api/notifications/device-token/:token
Authorization: Bearer <jwt>
```

## FCM payload format

Backend gửi qua FCM với shape:

```json
{
  "notification": {
    "title": "Đã nhận thanh toán ✅",
    "body": "Đơn PB-20260516-0001 (1.200.000đ)..."
  },
  "data": {
    "type": "payment",
    "event": "payment.completed",
    "notification_id": "<uuid>",
    "click_action": "petzone://orders/<uuid>",
    "order_id": "<uuid>",
    "order_number": "PB-20260516-0001",
    "amount": "1200000",
    "gateway": "vietqr"
  }
}
```

**Quan trọng:** mọi value trong `data` là **string** (FCM constraint). Số/bool phải parse.

## Deep links đã thống nhất

| Click action | Mô tả |
|-------------|------|
| `petzone://orders/{id}` | Owner xem order detail |
| `petzone://provider-orders/{id}` | Provider xem order detail |
| `petzone://chat/{conversationId}` | Mở chat |
| `petzone://providers/{id}` | Provider profile |
| `petzone://pets/{id}` | Pet detail |
| `petzone://booking/{providerId}` | Bắt đầu đặt phòng |
| `petzone://notifications` | Mở tab thông báo |

App phải register scheme `petzone` trong Info.plist + AndroidManifest.

## Notification types đầy đủ

App có thể fetch metadata để render UI theo type:

```
GET /api/notifications/meta    (public, không cần auth)
```

Response trả về danh sách 11 types + 10 events + scheme + data keys.

## iOS — APNs setup

**Backend team không setup được bước này** — cần app team:

```
1. Apple Developer → Keys → "+", chọn "Apple Push Notifications service (APNs)"
2. Download .p8 file + ghi lại Key ID + Team ID
3. Gửi backend team để upload lên Firebase Console:
   - Firebase Console → Project Settings → Cloud Messaging
   - "Apple app configuration" → "Upload" → chọn .p8 + nhập Key ID + Team ID
```

Sau bước này push notification mới work trên iOS.

## Android — SHA-1 fingerprint (optional)

Cần nếu sau này dùng Firebase Auth phone/social login. Lấy bằng:

```bash
# Debug build (mỗi máy dev khác nhau):
keytool -list -v -keystore ~/.android/debug.keystore \
  -alias androiddebugkey -storepass android | grep SHA1

# Production keystore (1 SHA-1 duy nhất):
keytool -list -v -keystore release.keystore -alias <alias> | grep SHA1
```

Gửi backend team để add vào Firebase Console → Project Settings → Your apps → Android → "Add fingerprint".

## Test push notification

### Cách 1 — Firebase Console

```
Firebase Console → Cloud Messaging → "Send your first message"
- Title: Test
- Body: Hello PetZone
- Target: Single device → paste FCM token (log từ app khi register)
- Send → device nhận trong vài giây
```

### Cách 2 — Trigger event qua backend (E2E test)

```bash
# Tạo VietQR payment → simulate paid → cả owner + provider nhận push
RAILWAY=https://<your-railway>.up.railway.app
JWT=<owner-jwt>

# Step 1: Tạo payment VietQR
curl -X POST $RAILWAY/api/payments/create \
  -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
  -d '{"order_id":"<order-uuid>","method":"vietqr"}'
# → response.data.payment.id

# Step 2: Simulate paid (chỉ dev mode, env DEV_SIMULATE_ENABLED=true)
curl -X POST $RAILWAY/api/payments/<payment-id>/dev-simulate-paid \
  -H "Authorization: Bearer $JWT"
# → Owner + Provider devices nhận push trong vài giây
```

## Docs chi tiết khác

- `docs/mobile-fcm-integration.md` — code Swift + Kotlin đầy đủ, edge cases
- `docs/mobile-app-api-integration.md` — toàn bộ API contract
- `docs/mobile-vietqr-integration.md` — chi tiết flow thanh toán VietQR

## Liên hệ debug

Khi push không tới được:
1. Check log app: FCM token có register được không? POST lên backend có 201?
2. Check Supabase `notifications` table: row có `push_sent=true` không?
3. Check Supabase `notification_delivery_log`: status của từng device
4. Check Railway logs filter `[FcmService]` xem có error không

Phiên bản: 2026-05-16 | Firebase project: petzone-dev-c3270
