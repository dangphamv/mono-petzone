# PetZone — Firebase Cloud Messaging (FCM) Integration Guide (Mobile)

Hướng dẫn cài đặt push notification dùng Firebase Cloud Messaging cho app PetZone (iOS + Android).

---

## 1. Backend đã setup gì

Backend dùng `firebase-admin` để gửi push. App chỉ cần:

1. Cài Firebase SDK
2. Lấy FCM token sau khi user login
3. Đăng ký token với backend
4. Handle notification payload (foreground + background)
5. Handle deep link trong `click_action`

Backend tự fire push notification theo các sự kiện (xem §5).

---

## 2. Setup Firebase project

Backend team đã setup Firebase project. Team app sẽ nhận:

- **iOS**: file `GoogleService-Info.plist`
- **Android**: file `google-services.json`

Đặt vào dự án:
- iOS: drag vào Xcode project root (target: app)
- Android: copy vào `app/` (cùng cấp `build.gradle.kts`)

---

## 3. iOS setup

### 3.1 Dependencies (Swift Package Manager)

```
File → Add Packages → https://github.com/firebase/firebase-ios-sdk
Chọn: FirebaseMessaging
```

### 3.2 Capabilities

Xcode → Target → Signing & Capabilities → "+ Capability":
- **Push Notifications**
- **Background Modes** → check "Remote notifications"

### 3.3 APNs Authentication Key

Backend team cần upload APNs key lên Firebase Console:
1. Apple Developer → Keys → "+", chọn "Apple Push Notifications service (APNs)" → download .p8 file
2. Gửi backend team kèm: Key ID + Team ID
3. Backend upload lên Firebase Console → Project Settings → Cloud Messaging → APNs Keys

App team không cần làm bước này, chỉ cần confirm với backend là đã upload.

### 3.4 AppDelegate setup

```swift
import UIKit
import FirebaseCore
import FirebaseMessaging
import UserNotifications

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        FirebaseApp.configure()

        // Request notification permission
        UNUserNotificationCenter.current().delegate = self
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            print("Notification permission granted: \(granted)")
        }
        application.registerForRemoteNotifications()

        Messaging.messaging().delegate = self
        return true
    }

    // APNs token → Firebase
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Messaging.messaging().apnsToken = deviceToken
    }
}

// MARK: - FCM token rotation
extension AppDelegate: MessagingDelegate {
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        guard let token = fcmToken else { return }
        // Save locally; register with backend when user logs in
        UserDefaults.standard.set(token, forKey: "fcm_token")
        // If user already logged in, push to backend immediately
        if AuthStore.shared.isLoggedIn {
            Task { try await PetZoneAPI.shared.registerDeviceToken(token: token, platform: "ios") }
        }
    }
}

// MARK: - Notification handling
extension AppDelegate: UNUserNotificationCenterDelegate {

    // Foreground: show banner anyway (otherwise notification is suppressed)
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound, .badge])
    }

    // User tapped notification (foreground or background)
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        let userInfo = response.notification.request.content.userInfo
        if let clickAction = userInfo["click_action"] as? String {
            DeepLinkHandler.shared.handle(url: clickAction)
        }
        completionHandler()
    }
}
```

### 3.5 Info.plist additions

```xml
<key>FirebaseAppDelegateProxyEnabled</key>
<false/>

<!-- Custom URI scheme cho deep link -->
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array><string>petzone</string></array>
  </dict>
</array>
```

---

## 4. Android setup

### 4.1 Dependencies

`app/build.gradle.kts`:

```kotlin
plugins {
    id("com.google.gms.google-services") // Apply at bottom of file
}

dependencies {
    implementation(platform("com.google.firebase:firebase-bom:33.5.1"))
    implementation("com.google.firebase:firebase-messaging")
}

apply(plugin = "com.google.gms.google-services")
```

Root `build.gradle.kts`:

```kotlin
plugins {
    id("com.google.gms.google-services") version "4.4.2" apply false
}
```

### 4.2 AndroidManifest.xml

```xml
<manifest ...>
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
  <uses-permission android:name="android.permission.INTERNET" />

  <application ...>
    <!-- FCM service -->
    <service
        android:name=".notifications.PetZoneMessagingService"
        android:exported="false">
      <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
      </intent-filter>
    </service>

    <!-- Custom URI scheme cho deep link -->
    <activity
        android:name=".MainActivity"
        android:exported="true"
        android:launchMode="singleTask">
      <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
      </intent-filter>
      <intent-filter android:autoVerify="false">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="petzone" />
      </intent-filter>
    </activity>
  </application>
</manifest>
```

### 4.3 Messaging service

```kotlin
class PetZoneMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // Save locally; register with backend when user logged in
        getSharedPreferences("petzone", MODE_PRIVATE).edit().putString("fcm_token", token).apply()
        if (AuthStore.isLoggedIn) {
            CoroutineScope(Dispatchers.IO).launch {
                runCatching { PetZoneAPI.registerDeviceToken(token, "android") }
            }
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)

        val notification = message.notification
        val data = message.data
        val clickAction = data["click_action"]

        // Build notification with deep link intent
        val intent = if (clickAction != null) {
            Intent(Intent.ACTION_VIEW, Uri.parse(clickAction)).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
        } else {
            Intent(this, MainActivity::class.java)
        }

        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )

        val channelId = "petzone_default"
        ensureChannel(channelId)

        val builder = NotificationCompat.Builder(this, channelId)
            .setContentTitle(notification?.title ?: data["title"])
            .setContentText(notification?.body ?: data["body"])
            .setSmallIcon(R.drawable.ic_notification)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)

        NotificationManagerCompat.from(this).notify(message.messageId.hashCode(), builder.build())
    }

    private fun ensureChannel(channelId: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, "PetZone", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Thông báo PetZone"
                enableLights(true)
                enableVibration(true)
            }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }
}
```

### 4.4 Request notification permission (Android 13+)

```kotlin
class MainActivity : ComponentActivity() {
    private val permLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted -> Log.d("FCM", "Notification permission: $granted") }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
                permLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
        // ... rest of setup
    }
}
```

---

## 5. Đăng ký token với PetZone backend

### 5.1 Sau khi login thành công

```
POST /api/notifications/device-token
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "token": "<fcm-registration-token>",
  "platform": "ios" | "android"
}
```

Response: 201 với device_token row.

**Khi nào gọi:**
- Ngay sau khi login success
- Khi FCM token rotate (onNewToken / didReceiveRegistrationToken)
- Khi app foreground và token chưa được register lần này

### 5.2 Khi user logout

```
DELETE /api/notifications/device-token/:token
Authorization: Bearer <jwt>
```

Bắt buộc gọi trước khi clear auth token — không thì notification cho user cũ vẫn tới device này.

### 5.3 Lưu token state

Lưu `last_registered_token` ở local. So sánh trước khi gọi `/device-token` để tránh spam:

```kotlin
val current = prefs.getString("fcm_token", null)
val lastRegistered = prefs.getString("last_registered_token", null)
if (current != null && current != lastRegistered) {
    api.registerDeviceToken(current, "android")
    prefs.edit().putString("last_registered_token", current).apply()
}
```

---

## 6. Notification payload format

Backend gửi qua FCM với shape:

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

**Lưu ý:**
- Toàn bộ value trong `data` là **string** (FCM constraint). Numbers/booleans phải parse khi đọc.
- `data.click_action` chứa deep link app sẽ mở khi user tap.
- Field `notification` (title/body) sẽ được OS tự render khi app background. Khi app foreground, app phải tự handle (xem code §3.4 và §4.3).

---

## 7. Notification types — đầy đủ list

### 7.1 Payment events

| `data.event` | `type` | Recipient | Title | Body | `click_action` |
|-------------|--------|-----------|-------|------|---------------|
| `payment.completed` | `payment` | Owner | Đã nhận thanh toán ✅ | Đơn {order_number} ({amount}đ) — đang chờ chủ hotel xác nhận | `petzone://order/{order_id}` |
| `payment.completed` | `payment` | Provider | Đơn mới đã thanh toán 💰 | Đơn {order_number} đã thanh toán {amount}đ. Vui lòng xác nhận trong 4 giờ | `petzone://provider/order/{order_id}` |
| `payment.cash_pending` | `payment` | Provider | Đơn mới — Thanh toán tiền mặt 💵 | Đơn {order_number} ({amount}đ). Nhớ thu tiền mặt khi check-in | `petzone://provider/order/{order_id}` |
| `payment.failed` | `payment` | Owner | Thanh toán không thành công | Đơn {order_number} chưa thanh toán được. Vui lòng thử lại | `petzone://order/{order_id}` |

### 7.2 Order events

| `data.event` | `type` | Recipient | Title |
|-------------|--------|-----------|-------|
| `order.confirmed` | `order_status` | Owner | Chủ hotel đã xác nhận 🎉 |
| `order.declined` | `order_status` | Owner | Đơn bị từ chối |
| `order.cancelled` | `order_status` | Counterparty | Đơn đã hủy |
| `order.checked_in` | `order_status` | Owner | Pet đã check-in 🐾 |
| `order.check_out` | `order_status` | Owner | Pet sẵn sàng được nhận về |
| `order.completed` | `reminder_review` | Owner | Đánh giá trải nghiệm |

### 7.3 Chat events

| `data.event` | `type` | Recipient | Title |
|-------------|--------|-----------|-------|
| `chat.new_message` | `new_message` | Recipient | {sender_name} |

---

## 8. Handle deep link

Khi user tap notification, app cần navigate đúng screen dựa trên `click_action`.

```swift
class DeepLinkHandler {
    static let shared = DeepLinkHandler()

    func handle(url: String) {
        guard let parsed = URL(string: url),
              parsed.scheme == "petzone" else { return }

        let path = parsed.path
        let id = parsed.lastPathComponent

        switch parsed.host {
        case "order":
            AppRouter.shared.navigate(to: .orderDetail(id: id))
        case "provider":
            // petzone://provider/order/abc
            if path.contains("/order/") {
                AppRouter.shared.navigate(to: .providerOrderDetail(id: id))
            }
        case "chat":
            AppRouter.shared.navigate(to: .chat(conversationId: id))
        case "payment":
            // petzone://payment/return?orderId=abc — re-fetch payment state
            if let orderId = URLComponents(url: parsed, resolvingAgainstBaseURL: false)?
                .queryItems?.first(where: { $0.name == "orderId" })?.value {
                AppRouter.shared.navigate(to: .paymentResult(orderId: orderId))
            }
        default:
            break
        }
    }
}
```

**Quan trọng**: KHÔNG trust query params trong deeplink để quyết định state. Luôn re-fetch từ API:

```swift
case .paymentResult(let orderId):
    let payment = try await api.getPayment(orderId: orderId)
    // Show success/failed dựa trên payment.status từ API, không phải từ URL
```

---

## 9. Edge cases

### 9.1 User block notification permission

iOS / Android 13+ user có thể từ chối permission. App vẫn chạy, chỉ không nhận push.

- Detect bằng `UNUserNotificationCenter.current().getNotificationSettings`
- Hiện banner trong app "Bật thông báo để nhận tin nhắn từ chủ hotel" với button mở Settings

### 9.2 Token rotate

FCM token có thể rotate (rare nhưng có thể). Service tự gọi `onNewToken` / `didReceiveRegistrationToken`.

App phải:
1. Gửi token mới lên backend (`POST /device-token`)
2. Token cũ tự deactivate ở backend khi backend gửi push thấy "registration-token-not-registered"

### 9.3 User logout không xóa token

→ User cũ vẫn nhận notification trên device này. **Bắt buộc** call `DELETE /device-token/:token` trước khi clear local auth.

### 9.4 Cùng user login trên 2 devices

OK — mỗi device có token riêng, backend lưu cả 2. Push sẽ tới cả 2 devices.

### 9.5 Notification tới khi app đã killed

- iOS: OS show notification, tap → app cold start. `didFinishLaunchingWithOptions` có `UIApplication.LaunchOptionsKey.remoteNotification` chứa payload. Handle deep link sau khi UI ready.
- Android: tương tự, `getIntent()` trong `MainActivity.onCreate` chứa deep link.

### 9.6 FCM disabled phía backend

Nếu backend env Firebase chưa set, push KHÔNG gửi. App polling vẫn work, chỉ là không có push UX.

App không phát hiện được điều này — fallback bằng polling là đủ.

---

## 10. Testing

### 10.1 Test bằng Firebase Console

1. Firebase Console → project → Cloud Messaging → "Send your first message"
2. Notification title/body bất kỳ
3. Target: "Single device" → paste FCM token (log ra trong app khi register)
4. Send → app nhận trong vài giây

### 10.2 Test bằng PetZone API

Cách dễ nhất: trigger payment success event (qua dev simulate):

```bash
# Trên app, tạo VietQR payment, copy payment_id
JWT=<owner-jwt>
PAYMENT_ID=<copy-from-app>

curl -X POST https://<railway>.up.railway.app/api/payments/$PAYMENT_ID/dev-simulate-paid \
  -H "Authorization: Bearer $JWT"
```

→ Owner device nhận push "Đã nhận thanh toán ✅" + Provider device nhận push "Đơn mới đã thanh toán 💰"

### 10.3 Test checklist

- [ ] Permission request hiện đúng lần đầu mở app
- [ ] FCM token log ra console khi launch
- [ ] Sau login, token được POST lên `/device-token`
- [ ] Sau logout, token được DELETE
- [ ] Test bằng Firebase Console → app foreground nhận banner
- [ ] Test bằng Firebase Console → app background nhận push system
- [ ] Test bằng Firebase Console → app killed → tap notification → cold start vào đúng screen
- [ ] Test deep link: `click_action` = `petzone://order/abc` → navigate `OrderDetail`
- [ ] Trigger `payment.completed` → cả owner và provider nhận push
- [ ] Token rotate (kill app + clear data trên Android) → token mới được register
- [ ] Block notification → app vẫn chạy, hiện banner "bật thông báo"
- [ ] 2 devices cùng user → cả 2 nhận push

---

## 11. Common pitfalls

| Sai | Đúng |
|----|-----|
| Lưu FCM token trong UserDefaults/SharedPreferences thường | Lưu local là OK, KHÔNG cần encrypt (token không phải secret) |
| Register token trước khi login | Phải sau login (cần JWT) |
| Trust nội dung trong `notification.title/body` để quyết định logic | Dùng `data.event` + `data.type` để biết loại sự kiện |
| Parse số trong `data` mà không cast | `data["amount"]` là string `"1200000"`, phải parse → number |
| Hard-code list event trong app | Mở rộng tự nhiên — backend thêm event mới, app handle theo `data.type` (group) |
| Quên init FCM trên main thread iOS | `FirebaseApp.configure()` PHẢI ở `didFinishLaunchingWithOptions` |
| Không request POST_NOTIFICATIONS trên Android 13+ | Bắt buộc — không có thì không hiện notification |

---

## 12. Backend contract reference

| Endpoint | Method | Khi nào gọi |
|----------|--------|-------------|
| `/api/notifications/device-token` | POST | Sau login, sau onNewToken |
| `/api/notifications/device-token/:token` | DELETE | Trước logout |
| `/api/notifications` | GET | Mở tab thông báo trong app |
| `/api/notifications/:id/read` | PATCH | User tap notification trong tab |
| `/api/notifications/read-all` | PATCH | Button "Đánh dấu tất cả đã đọc" |

---

**Phiên bản**: 2026-05-16 — FCM v1
