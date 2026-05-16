# PetZone — VietQR Integration Guide (Mobile)

Hướng dẫn chi tiết cho team app tích hợp luồng thanh toán **VietQR direct-to-provider**. Đây là phương thức thanh toán default của PetZone v1.

---

## 1. Vì sao là VietQR?

| Đặc điểm | Ý nghĩa cho app |
|---------|----------------|
| Tiền vào thẳng STK provider | PetZone không cầm tiền, owner không cần tin tưởng trung gian |
| Verify qua SePay webhook (server-to-server) | App chỉ cần polling backend, không tự verify |
| Owner scan QR bằng app bank (35+ banks VN) | App KHÔNG cần tích hợp SDK ngân hàng nào — chỉ render ảnh QR |
| 0 phí gateway | Toàn bộ số tiền vào provider |

**Owner có thể scan QR bằng:**
- ✅ App ngân hàng VN: VCB, BIDV, Techcombank, MBBank, ACB, VPBank, TPBank, Sacombank, ... (toàn bộ 35+ banks Napas247)
- ✅ ZaloPay, Viettel Money, ShopeePay (mục "Chuyển tiền VietQR")
- ✅ MoMo phiên bản 2024+ (mục "Chuyển tiền nhanh 24/7")

App PetZone **không cần** SDK ngân hàng nào.

---

## 2. Flow tổng thể

```
┌─────────────┐   1. POST /payments/create   ┌─────────────┐
│  Owner App  │ ────────────────────────────▶│  PetZone API │
│  (PetZone)  │                              └─────────────┘
└─────────────┘                                     │
       │                                            │
       │  2. Response { qr_code_url, bank_info }    │
       │ ◀──────────────────────────────────────────│
       │                                            │
       │  3. Render QR + bank info                  │
       │     Start polling /payments/:orderId       │
       │                                            │
       ▼                                            │
┌─────────────┐                                     │
│  Owner App  │  4. Owner mở app bank phụ           │
│  (Bank app) │     Scan QR                         │
└─────────────┘                                     │
       │                                            │
       │  5. Chuyển khoản tới STK provider          │
       ▼                                            │
┌──────────────────┐                                │
│  Provider bank   │                                │
│  account (VCB)   │                                │
└──────────────────┘                                │
       │                                            │
       │  6. SePay (cài trên 1 đt) phát hiện        │
       │     biến động số dư                        │
       ▼                                            │
┌─────────────┐    7. POST webhook to API     ┌─────────────┐
│   SePay     │ ──────────────────────────────▶│  PetZone API │
└─────────────┘                                └─────────────┘
                                                      │
                                       8. Match + flip│
                                          payment to  │
                                          completed   │
                                                      │
       ┌──────────────────────────────────────────────│
       │                                              │
       │  9. App polling thấy status="completed"      │
       │     + nhận FCM push                          │
       ▼                                              │
┌─────────────┐                                       │
│  Owner App  │  10. Show "Thanh toán thành công ✅"  │
└─────────────┘
```

---

## 3. API contract

### 3.1 Tạo VietQR payment

```http
POST /api/payments/create
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "order_id": "uuid-of-pending-payment-order",
  "method": "vietqr"
}
```

### 3.2 Response

```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "order_id": "...",
      "method": "vietqr",
      "amount": 1200000,
      "status": "pending",
      "transaction_ref": "550e8400-...",
      "created_at": "2026-05-16T08:30:00.000Z"
    },
    "redirect_url": null,
    "qr_code_url": "https://img.vietqr.io/image/VCB-0123456789-compact2.png?amount=1200000&addInfo=PB-20260516-0001&accountName=NGUYEN%20VAN%20A",
    "deeplink": null,
    "bank_info": {
      "bank_name": "Vietcombank",
      "account_number": "0123456789",
      "account_holder": "NGUYEN VAN A",
      "content": "PB-20260516-0001",
      "amount": 1200000
    },
    "cash_info": null
  }
}
```

### 3.3 Lỗi có thể gặp

| HTTP | message | Tình huống |
|------|---------|-----------|
| 400 | `Provider has not registered bank account yet` | Provider chưa cấu hình STK trong profile |
| 400 | `Provider bank account not verified by admin` | Admin chưa verify STK provider |
| 400 | `Payment method 'vietqr' is temporarily disabled` | Admin đã tạm tắt VietQR |
| 400 | `Order is not in payable status` | Order không ở `pending_payment` |
| 403 | `Not the order owner` | User gọi không phải owner |
| 404 | `Order not found` | Order ID sai |

App handle bằng cách show error → quay về screen chọn payment method (gợi ý Cash hoặc MoMo).

---

## 4. UI design

### 4.1 Screen "VietQR Payment"

Layout đề xuất (mobile portrait):

```
┌─────────────────────────────────┐
│  ← Thanh toán VietQR            │
├─────────────────────────────────┤
│                                 │
│      ┌─────────────────┐       │
│      │                  │       │
│      │   [QR Image]     │       │  ← qr_code_url (≥ 280x280 dp)
│      │                  │       │
│      └─────────────────┘       │
│                                 │
│  ⏱ Còn 14:35 để thanh toán      │  ← countdown 15 phút
│                                 │
├─────────────────────────────────┤
│  Hoặc chuyển khoản thủ công:    │
│                                 │
│  Ngân hàng:    Vietcombank      │
│  Số tài khoản: 0123456789  [📋] │
│  Chủ TK:       NGUYEN VAN A     │
│  Số tiền:      1.200.000đ  [📋] │  ← in đậm
│  Nội dung:     PB-20260516-0001 │  ← in đậm + cảnh báo
│                            [📋] │
│                                 │
│  ⚠️ Nội dung PHẢI ghi chính xác │
│     để hệ thống nhận diện       │
├─────────────────────────────────┤
│                                 │
│  [Hủy thanh toán]               │
│                                 │
│  Đã chuyển khoản? Hệ thống sẽ   │
│  tự xác nhận trong 30 giây.     │
│                                 │
└─────────────────────────────────┘
```

### 4.2 Quy tắc UX quan trọng

1. **Hiển thị cả QR và bank info song song** — nhiều owner thích copy thủ công thay vì scan QR (đặc biệt người lớn tuổi)
2. **Nút Copy cho từng field** — Số tài khoản, Số tiền, Nội dung. Toast "Đã copy" khi tap.
3. **Highlight nội dung chuyển khoản** — đây là field quan trọng nhất, ghi sai = không auto-match
4. **Countdown 15 phút** — quá thời gian, payment sẽ tự fail (cron sweeper TODO). App có thể chủ động hiện expired state.
5. **Không bắt user quay về app này sau khi pay** — họ vẫn ở app bank, app PetZone tự polling rồi push notification.

### 4.3 Loading states

```
State 1: Loading QR
  Skeleton image + skeleton bank info rows

State 2: QR ready (default)
  Hiện QR + bank info, polling chạy

State 3: Payment success
  Replace toàn bộ screen bằng:
  ┌─────────────────────────────────┐
  │                                 │
  │            ✅                   │
  │                                 │
  │   Đã nhận thanh toán            │
  │   1.200.000đ                    │
  │                                 │
  │   Đang chờ chủ hotel xác nhận   │
  │   (tối đa 4 giờ)                │
  │                                 │
  │   [Xem chi tiết đơn]            │
  │                                 │
  └─────────────────────────────────┘

State 4: Timeout (15+ phút)
  Hiện "Phiên thanh toán hết hạn" + button "Thử lại"
```

---

## 5. Code samples

### 5.1 Polling pattern

**Swift (iOS):**

```swift
class VietQRPaymentViewModel: ObservableObject {
    @Published var status: PaymentStatus = .pending
    private var pollingTask: Task<Void, Never>?
    let orderId: String

    init(orderId: String) {
        self.orderId = orderId
        startPolling()
    }

    func startPolling() {
        pollingTask = Task {
            while !Task.isCancelled {
                do {
                    let payment = try await api.getPayment(orderId: orderId)
                    await MainActor.run { self.status = payment.status }
                    if payment.status == .completed || payment.status == .failed {
                        break // stop polling
                    }
                } catch {
                    print("polling error: \(error)")
                }
                try? await Task.sleep(nanoseconds: 3_000_000_000) // 3s
            }
        }
    }

    deinit {
        pollingTask?.cancel() // CRITICAL: stop on screen unmount
    }
}
```

**Kotlin (Android):**

```kotlin
class VietQRPaymentViewModel(
    private val api: PetZoneApi,
    private val orderId: String,
) : ViewModel() {
    private val _status = MutableStateFlow<PaymentStatus>(PaymentStatus.Pending)
    val status: StateFlow<PaymentStatus> = _status

    private var pollingJob: Job? = null

    init { startPolling() }

    private fun startPolling() {
        pollingJob = viewModelScope.launch {
            while (isActive) {
                try {
                    val payment = api.getPayment(orderId)
                    _status.value = payment.status
                    if (payment.status == PaymentStatus.Completed || payment.status == PaymentStatus.Failed) {
                        return@launch
                    }
                } catch (e: Exception) {
                    Log.w("VietQR", "poll error", e)
                }
                delay(3_000)
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        pollingJob?.cancel() // CRITICAL
    }
}
```

### 5.2 Copy to clipboard

**Swift:**
```swift
UIPasteboard.general.string = bankInfo.accountNumber
// Show toast
```

**Kotlin:**
```kotlin
val cb = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
cb.setPrimaryClip(ClipData.newPlainText("STK", bankInfo.accountNumber))
Toast.makeText(context, "Đã copy", Toast.LENGTH_SHORT).show()
```

### 5.3 Cancel pending payment

Khi user tap "Hủy thanh toán":

```http
POST /api/payments/:paymentId/cancel
Authorization: Bearer <jwt>
```

Response: `{ payment: { status: "failed" } }`

Sau đó app quay về screen chọn payment method. Order vẫn ở `pending_payment` — owner có thể chọn lại method khác.

---

## 6. Edge cases

### 6.1 Owner ghi sai nội dung chuyển khoản

**Tình huống**: Owner gõ "thanh toan PetZone" thay vì `PB-20260516-0001`.

**Hệ quả**: SePay nhận tiền nhưng API không match được payment → bank_transactions ghi nhận `matched_payment_id = NULL`.

**App nhận biết**: polling không thấy `completed` sau ~3-5 phút.

**App handle**:
1. Sau 5 phút polling không thấy success, hiện banner: "Chưa nhận được thanh toán. Nếu bạn đã chuyển khoản, vui lòng liên hệ hỗ trợ kèm mã đơn `PB-20260516-0001`."
2. Admin sẽ vào `/admin/bank-transactions` web → match thủ công
3. Sau match, polling sẽ thấy `completed`

### 6.2 Owner chuyển sai số tiền

**Tình huống**: Owner gõ 1,200,000 nhưng chuyển nhầm 1,000,000 hoặc 1,200,500.

**Hệ quả**: Backend match logic check `amount === payment.amount` → reject auto-match.

**App handle**: Giống case ghi sai content — sau 5 phút show banner liên hệ support.

### 6.3 Owner pay trùng 2 lần

**Tình huống**: Owner sốt ruột, scan QR và chuyển 2 lần liền.

**Hệ quả**: SePay gửi 2 webhook, lần đầu match → completed. Lần 2 đến — payment đã `completed`, không match được (status guard).

**App handle**: Không cần làm gì — chỉ thấy 1 lần success. Owner sẽ thấy 2 giao dịch trong app bank, **PetZone không tự refund**. Show note ở footer: "Nếu chuyển nhiều lần, vui lòng liên hệ chủ hotel để được hoàn lại".

### 6.4 Provider đổi STK ngân hàng giữa chừng

**Tình huống**: Provider đổi STK sau khi owner đã thấy QR cũ.

**Hệ quả**: QR là URL tĩnh, không refresh tự động. Owner pay vào STK cũ → vẫn vào provider (đúng người, đúng tiền) → SePay match OK.

**App handle**: Không cần gì. Edge case rất hiếm.

### 6.5 Backend Railway sleep / timeout

**Tình huống**: Railway lâu không có traffic, cold start ~5s khi polling đầu tiên.

**App handle**:
- Polling timeout per request: **10 giây** (đủ cho cold start + jitter)
- Network error → tự retry với backoff (3s, 5s, 8s) tối đa 3 lần
- Sau 3 lần fail → hiện "Mất kết nối, đang thử lại..." nhưng KHÔNG dừng polling

### 6.6 App background

**Tình huống**: User mở app bank, app PetZone vào background.

**App handle**:
- iOS: polling vẫn chạy được ~30s sau khi background. Sau đó OS kill. Dùng FCM push để wake up khi payment success.
- Android: tương tự nhưng tùy device. Foreground service không cần thiết — push notification đủ.

Khi app quay lại foreground, restart polling 1 lần để sync state ngay.

### 6.7 FCM push tới trước polling response

**Tình huống**: Push notification "Đã thanh toán" tới trước khi polling next round.

**App handle**: Tap notification → mở screen result → fetch fresh state từ API. KHÔNG trust nội dung notification.

---

## 7. Testing

### 7.1 Test môi trường staging (Railway)

Backend đã cấu hình `DEV_SIMULATE_ENABLED=true`. App dev build có button "🧪 Simulate paid" dưới QR:

```http
POST /api/payments/:paymentId/dev-simulate-paid
Authorization: Bearer <jwt>
```

Tap → backend fake SePay webhook → payment flip `completed` → polling thấy ngay.

### 7.2 Test với SePay test webhook

QA có thể:
1. Tạo VietQR payment qua app
2. Copy `bank_info.content` (vd `PB-20260516-0001`)
3. Mở web my.sepay.vn → Webhook → "Test"
4. Paste payload giả với content trùng + amount trùng
5. SePay POST webhook về Railway → API match → app polling thấy completed

### 7.3 Test với chuyển khoản thật (production hoặc staging với provider thật)

1. Tạo order với provider có STK verified
2. Tạo VietQR payment → nhận QR
3. Scan QR bằng app bank thật, chuyển 1.000đ (đơn giá thấp)
4. Sau ~10-30 giây (SePay polling) → app thấy completed

### 7.4 Checklist QA

- [ ] QR render đúng kích thước, scan được bằng VCB Digibank, MBBank, ZaloPay
- [ ] Copy buttons hoạt động (STK, Số tiền, Nội dung)
- [ ] Countdown 15 phút chạy đúng
- [ ] Polling stop khi screen unmount (không leak)
- [ ] Polling stop khi nhận completed/failed
- [ ] Nút "Hủy thanh toán" gọi `/cancel` → flip payment → quay về screen pick method
- [ ] App background → foreground: polling restart 1 lần để sync
- [ ] Push notification tới: tap → mở result screen, re-fetch
- [ ] Network error: retry với backoff, không crash
- [ ] Owner pay sai content: sau 5 phút hiện banner support
- [ ] Test "🧪 Simulate paid" trên dev build chạy được
- [ ] Production build KHÔNG có button simulate

---

## 8. Common pitfalls

| Sai | Đúng |
|----|-----|
| Trust query params trong deeplink return | Luôn re-fetch `GET /payments/:orderId` |
| Polling forever, không cleanup | Cancel polling khi screen unmount + khi status terminal |
| Show success dựa trên QR đã render | Show success chỉ khi API trả `status="completed"` |
| Hardcode bank list, tự verify VietQR | Backend tự verify qua SePay — app chỉ render |
| Hiển thị toàn bộ STK provider không mask | OK hiện full vì đây là tài khoản nhận, không phải tài khoản trả |
| Bắt owner upload biên lai | Không cần — SePay tự verify |
| Polling 1 giây | 3 giây là sweet spot — đủ nhanh, đủ tiết kiệm battery |

---

## 9. FAQ

**Q: Owner pay xong rồi cancel order, refund thế nào?**
A: VietQR không tự refund được. Owner liên hệ provider để chuyển khoản lại. Admin có thể ghi nhận refund qua dashboard cho mục đích audit.

**Q: Có thể dùng VietQR cho subscriptions không?**
A: Không. VietQR là one-time transfer. Subscription cần payment token (MoMo có hỗ trợ).

**Q: Nếu provider chưa có STK ngân hàng?**
A: Provider phải có STK trước khi nhận order VietQR. Profile provider phải fill 3 field: `bank_name`, `bank_account_number`, `bank_account_holder`. Admin verify trước khi provider được nhận order.

**Q: Owner có cần tạo tài khoản SePay không?**
A: Không. SePay là dịch vụ backend dùng để verify, owner không biết SePay tồn tại.

**Q: Khi nào nên fallback sang phương thức khác?**
A: Khi backend trả 400 với "method disabled", hoặc khi user tap "Đổi phương thức". App show modal: "VietQR / Cash / MoMo".

---

**Phiên bản**: 2026-05-16 — VietQR v1
