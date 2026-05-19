/**
 * Reusable Swagger response examples.
 *
 * All endpoints are wrapped by TransformInterceptor as { status, data, message }.
 * Errors flow through GlobalExceptionFilter as { status: 'error', data: null, message, statusCode, timestamp }.
 *
 * Use ok() / okPaginated() to wrap any fixture; use ERROR_* constants for error responses.
 * IDs are deterministic across fixtures so cross-referenced examples line up
 * (e.g. EXAMPLE_ORDER.owner_id matches EXAMPLE_USER.id).
 */

// ===== Stable IDs (cross-referenced across fixtures) =====
const OWNER_ID = '11111111-1111-4111-8111-111111111111'
const PROVIDER_USER_ID = '22222222-2222-4222-8222-222222222222'
const ADMIN_ID = '33333333-3333-4333-8333-333333333333'
const PROVIDER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const PET_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const PET_ID_2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbc'
const ROOM_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const ADDON_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
const ORDER_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
const PAYMENT_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff'
const PAYOUT_ID = '99999999-9999-4999-8999-999999999999'
const REVIEW_ID = '88888888-8888-4888-8888-888888888888'
const CONVERSATION_ID = '77777777-7777-4777-8777-777777777777'
const MESSAGE_ID = '66666666-6666-4666-8666-666666666666'
const NOTIFICATION_ID = '55555555-5555-4555-8555-555555555555'
const STATUS_REPORT_ID = '44444444-4444-4444-8444-444444444444'
const CHECK_IN_PHOTO_ID = '12121212-1212-4212-8212-121212121212'
const CALL_ID = '13131313-1313-4313-8313-131313131313'
const DISPUTE_ID = '14141414-1414-4414-8414-141414141414'

const NOW = '2026-04-12T10:00:00.000Z'
const PAST = '2026-03-15T08:30:00.000Z'
const FUTURE = '2026-04-20T14:00:00.000Z'

// ===== Response wrappers =====

export const ok = <T>(data: T, message = 'Request successful') => ({
  status: 'success' as const,
  data,
  message,
})

export const okPaginated = <T>(
  items: T[],
  message = 'Request successful',
  total = 42,
  page = 1,
  limit = 20
) => {
  const total_pages = Math.ceil(total / limit) || 1
  return {
    status: 'success' as const,
    data: items,
    meta: {
      page,
      limit,
      total,
      total_pages,
      has_next: page < total_pages,
      has_prev: page > 1,
    },
    message,
  }
}

const errorResponse = (statusCode: number, message: string) => ({
  status: 'error' as const,
  data: null,
  message,
  statusCode,
  timestamp: NOW,
})

// ===== Common error examples =====

export const ERROR_400 = errorResponse(400, 'Validation failed')
export const ERROR_401 = errorResponse(401, 'Unauthorized')
export const ERROR_403 = errorResponse(403, 'Forbidden')
export const ERROR_404 = errorResponse(404, 'Resource not found')
export const ERROR_409 = errorResponse(409, 'Resource already exists')
export const ERROR_413 = errorResponse(413, 'File too large')
export const ERROR_429 = errorResponse(429, 'Too many requests, please try again later')

// ===== User =====

export const EXAMPLE_USER = {
  id: OWNER_ID,
  phone: '+84901234567',
  email: 'an.nguyen@example.com',
  full_name: 'Nguyễn Văn An',
  avatar_url: 'https://cdn.petzone.vn/avatars/nguyen-van-an.jpg',
  role: 'owner',
  status: 'active',
  social_provider: null,
  social_id: null,
  notification_preferences: {
    order_status: true,
    new_message: true,
    status_report: true,
    review: true,
    promotion: false,
  },
  terms_accepted_at: PAST,
  last_login_at: NOW,
  created_at: '2026-01-10T09:00:00.000Z',
  updated_at: NOW,
}

export const EXAMPLE_USER_PUBLIC = {
  id: PROVIDER_USER_ID,
  full_name: 'Trần Thị Bình',
  avatar_url: 'https://cdn.petzone.vn/avatars/tran-thi-binh.jpg',
  role: 'provider',
}

export const EXAMPLE_NOTIFICATION_PREFERENCES = {
  order_status: true,
  new_message: true,
  status_report: true,
  review: true,
  promotion: false,
}

// ===== Auth =====

export const EXAMPLE_AUTH_SESSION_NEW = {
  access_token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMTExMTExMS0xMTExLTQxMTEtODExMS0xMTExMTExMTExMTEifQ.signature',
  refresh_token: 'v1.NkY1Y2Y0YjYtZjQ0Ny00YjYzLWE3NjUtMDAwMDAwMDAwMDAw',
  user: EXAMPLE_USER,
  is_new_user: true,
}

export const EXAMPLE_AUTH_SESSION_EXISTING = {
  access_token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMTExMTExMS0xMTExLTQxMTEtODExMS0xMTExMTExMTExMTEifQ.signature',
  refresh_token: 'v1.NkY1Y2Y0YjYtZjQ0Ny00YjYzLWE3NjUtMDAwMDAwMDAwMDAw',
  user: EXAMPLE_USER,
  is_new_user: false,
}

export const EXAMPLE_REFRESH = {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.NEW_TOKEN.signature',
  refresh_token: 'v1.NEW_REFRESH_TOKEN',
}

export const EXAMPLE_OTP_SENT = {
  message: 'OTP đã được gửi đến số điện thoại của bạn',
}

export const EXAMPLE_OTP_SENT_DEV = {
  message: 'OTP đã được gửi đến số điện thoại của bạn',
  otp: '123456',
}

export const EXAMPLE_LOGOUT = { message: 'Đăng xuất thành công' }

// ===== Pet =====

export const EXAMPLE_PET = {
  id: PET_ID,
  owner_id: OWNER_ID,
  name: 'Miu',
  species: 'cat',
  breed: 'Mèo Anh lông ngắn',
  gender: 'female',
  date_of_birth: '2024-06-15',
  weight_kg: 4.2,
  color: 'Xám',
  photos: ['https://cdn.petzone.vn/pets/miu-1.jpg', 'https://cdn.petzone.vn/pets/miu-2.jpg'],
  vaccination_records: [
    {
      name: 'Vaccin 4 bệnh',
      date: '2025-08-10',
      expiry_date: '2026-08-10',
      document_url: 'https://cdn.petzone.vn/docs/miu-vaccine.pdf',
    },
  ],
  allergies: ['Cá ngừ'],
  chronic_conditions: [],
  current_medications: [],
  is_neutered: 'yes',
  temperament: 'friendly',
  sociable_with_others: 'yes',
  special_needs_notes: null,
  emergency_vet_name: 'Phòng khám thú y Sài Gòn',
  emergency_vet_phone: '+84283822111',
  is_active: true,
  created_at: '2025-09-01T10:00:00.000Z',
  updated_at: NOW,
}

export const EXAMPLE_PET_2 = {
  ...EXAMPLE_PET,
  id: PET_ID_2,
  name: 'Bông',
  species: 'dog',
  breed: 'Poodle',
  gender: 'male',
  weight_kg: 6.5,
  color: 'Trắng',
  photos: ['https://cdn.petzone.vn/pets/bong-1.jpg'],
  is_neutered: 'no',
  temperament: 'normal',
}

export const EXAMPLE_BREED = {
  id: 12,
  species: 'dog',
  name_vi: 'Chó Poodle',
  name_en: 'Poodle',
  popularity_rank: 1,
}

export const EXAMPLE_BREED_LIST = [
  EXAMPLE_BREED,
  {
    id: 13,
    species: 'dog',
    name_vi: 'Chó Phú Quốc',
    name_en: 'Phu Quoc Ridgeback',
    popularity_rank: 2,
  },
  { id: 14, species: 'dog', name_vi: 'Chó Corgi', name_en: 'Welsh Corgi', popularity_rank: 3 },
]

// ===== Provider =====

export const EXAMPLE_PROVIDER = {
  id: PROVIDER_ID,
  user_id: PROVIDER_USER_ID,
  business_name: 'Pet Hotel Sài Gòn',
  description:
    'Khách sạn thú cưng cao cấp tại trung tâm Sài Gòn. Phòng có điều hòa, camera 24/7, sân chơi rộng rãi.',
  license_number: '0312345678',
  license_photos: ['https://cdn.petzone.vn/providers/license-1.jpg'],
  address: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
  latitude: 10.7745,
  longitude: 106.7016,
  phone: '+84283822999',
  facility_photos: [
    'https://cdn.petzone.vn/providers/sg-facility-1.jpg',
    'https://cdn.petzone.vn/providers/sg-facility-2.jpg',
  ],
  certification_photos: ['https://cdn.petzone.vn/providers/cert-1.jpg'],
  accepted_species: ['dog', 'cat'],
  weight_limit_min_kg: 1,
  weight_limit_max_kg: 30,
  cancellation_policy: 'moderate',
  verification_status: 'approved',
  rating_average: 4.7,
  rating_count: 152,
  is_active: true,
  created_at: '2025-06-01T08:00:00.000Z',
  updated_at: NOW,
}

export const EXAMPLE_PROVIDER_LIST_ITEM = {
  id: PROVIDER_ID,
  business_name: 'Pet Hotel Sài Gòn',
  address: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
  latitude: 10.7745,
  longitude: 106.7016,
  facility_photos: ['https://cdn.petzone.vn/providers/sg-facility-1.jpg'],
  accepted_species: ['dog', 'cat'],
  cancellation_policy: 'moderate',
  rating_average: 4.7,
  rating_count: 152,
  is_active: true,
  distance_km: 2.4,
}

export const EXAMPLE_VERIFICATION_STATUS = {
  verification_status: 'approved',
  verified_at: '2026-01-13T15:30:00.000Z',
}

export const EXAMPLE_ROOM = {
  id: ROOM_ID,
  provider_id: PROVIDER_ID,
  name: 'Phòng VIP có camera',
  description:
    'Phòng riêng có điều hòa, camera live 24/7, giường nệm cao cấp, sức chứa 1 thú cưng.',
  capacity: 1,
  price_per_night: 350000,
  photos: ['https://cdn.petzone.vn/rooms/vip-1.jpg'],
  is_active: true,
  created_at: '2025-06-15T10:00:00.000Z',
  updated_at: NOW,
}

export const EXAMPLE_ADDON = {
  id: ADDON_ID,
  provider_id: PROVIDER_ID,
  name: 'Tắm + Vệ sinh',
  description: 'Dịch vụ tắm và cắt tỉa lông cơ bản.',
  price: 150000,
  price_type: 'per_booking',
  is_active: true,
  created_at: '2025-06-15T10:00:00.000Z',
  updated_at: NOW,
}

export const EXAMPLE_AVAILABILITY = {
  id: '15151515-1515-4515-8515-151515151515',
  provider_id: PROVIDER_ID,
  room_type_id: ROOM_ID,
  date: '2026-04-20',
  available_slots: 1,
  booked_slots: 0,
  is_blocked: false,
}

export const EXAMPLE_PROVIDER_STATS = {
  month: '2026-04',
  total_orders: 28,
  completed_orders: 24,
  cancelled_orders: 2,
  gross_revenue: 18900000,
  commission: 2835000,
  net_revenue: 16065000,
  rating_average: 4.7,
  rating_count: 152,
}

export const EXAMPLE_PROVIDER_DOCUMENTS_UPLOAD = {
  license_photos: ['https://cdn.petzone.vn/providers/license-1.jpg'],
  certification_photos: ['https://cdn.petzone.vn/providers/cert-1.jpg'],
}

// ===== Order =====

export const EXAMPLE_PRICE_BREAKDOWN = {
  room: { price_per_night: 350000, nights: 3, subtotal: 1050000 },
  add_ons: [
    {
      id: ADDON_ID,
      name: 'Tắm + Vệ sinh',
      price: 150000,
      price_type: 'per_booking',
      subtotal: 150000,
    },
  ],
  total: 1200000,
}

export const EXAMPLE_ORDER = {
  id: ORDER_ID,
  order_number: 'PZ-2026041200001',
  owner_id: OWNER_ID,
  provider_id: PROVIDER_ID,
  room_type_id: ROOM_ID,
  status: 'confirmed',
  check_in_date: '2026-04-20',
  check_out_date: '2026-04-23',
  num_nights: 3,
  pet_ids: [PET_ID],
  add_on_ids: [ADDON_ID],
  special_notes: 'Mèo nhà sợ tiếng ồn, cho ăn lúc 8h sáng và 6h chiều.',
  daily_status_report: true,
  price_breakdown: {
    room_price: 350000,
    num_nights: 3,
    room_subtotal: 1050000,
    add_ons: [{ name: 'Tắm + Vệ sinh', price: 150000, quantity: 1 }],
    add_ons_subtotal: 150000,
    service_subtotal: 1200000,
    platform_fee_rate: 0,
    platform_fee: 0,
    total: 1200000,
  },
  total_price: 1200000,
  cancellation_policy: 'moderate',
  provider_response_deadline: '2026-04-12T14:00:00.000Z',
  cancelled_at: null,
  cancelled_by: null,
  cancellation_reason: null,
  refund_amount: null,
  completed_at: null,
  created_at: NOW,
  updated_at: NOW,
}

export const EXAMPLE_ORDER_LIST_ITEM = {
  id: ORDER_ID,
  order_number: 'PZ-2026041200001',
  owner_id: OWNER_ID,
  provider_id: PROVIDER_ID,
  status: 'confirmed',
  check_in_date: '2026-04-20',
  check_out_date: '2026-04-23',
  num_nights: 3,
  total_price: 1200000,
  created_at: NOW,
}

export const EXAMPLE_ORDER_HISTORY_ITEM = {
  id: '16161616-1616-4616-8616-161616161616',
  order_id: ORDER_ID,
  status: 'confirmed',
  actor_id: PROVIDER_USER_ID,
  actor_type: 'provider',
  note: 'Đã xác nhận booking',
  created_at: NOW,
}

// ===== Payment =====

export const EXAMPLE_PAYMENT_CREATE = {
  payment_id: PAYMENT_ID,
  order_id: ORDER_ID,
  amount: 1200000,
  method: 'momo',
  redirect_url: 'https://test-payment.momo.vn/v2/gateway/pay/PZ-2026041200001',
  qr_code: 'https://test-payment.momo.vn/qr/PZ-2026041200001.png',
  expires_at: '2026-04-12T10:15:00.000Z',
}

export const EXAMPLE_PAYMENT = {
  id: PAYMENT_ID,
  order_id: ORDER_ID,
  method: 'momo',
  amount: 1200000,
  status: 'completed',
  transaction_ref: 'MOMO-2026041200001',
  paid_at: NOW,
  refunded_at: null,
  refund_amount: null,
  created_at: NOW,
  updated_at: NOW,
}

export const EXAMPLE_PAYMENT_CALLBACK = {
  message: 'Webhook endpoint ready for momo',
}

export const EXAMPLE_REFUND = {
  payment_id: PAYMENT_ID,
  order_id: ORDER_ID,
  refund_amount: 600000,
  status: 'partially_refunded',
  refunded_at: NOW,
}

export const EXAMPLE_PAYOUT = {
  id: PAYOUT_ID,
  provider_id: PROVIDER_ID,
  order_id: ORDER_ID,
  recipient: 'provider',
  gross_amount: 1200000,
  commission_rate: 0.15,
  commission_amount: 180000,
  net_amount: 1020000,
  status: 'completed',
  payout_date: '2026-04-10',
  created_at: '2026-04-10T09:00:00.000Z',
  updated_at: '2026-04-10T09:00:00.000Z',
}

export const EXAMPLE_PAYOUT_REQUEST = {
  message: 'Payout request submitted successfully',
  available_balance: 5400000,
  estimated_payout_date: '2026-04-15',
}

// ===== Status report =====

export const EXAMPLE_STATUS_REPORT = {
  id: STATUS_REPORT_ID,
  order_id: ORDER_ID,
  provider_id: PROVIDER_ID,
  photos: [
    'https://cdn.petzone.vn/status-reports/sr-1.jpg',
    'https://cdn.petzone.vn/status-reports/sr-2.jpg',
  ],
  feeding_status: 'normal',
  activity_summary: 'Bé Miu ăn ngon, chơi đùa vui vẻ, ngủ ngon giấc.',
  note: 'Hôm nay Miu hoạt động nhiều hơn hôm qua, rất hợp tác.',
  owner_reaction: 'love',
  owner_reply: 'Cảm ơn shop nhiều ạ!',
  owner_replied_at: NOW,
  created_at: NOW,
  updated_at: NOW,
}

// ===== Check-in =====

export const EXAMPLE_CHECK_IN_PHOTO = {
  id: CHECK_IN_PHOTO_ID,
  order_id: ORDER_ID,
  uploaded_by: PROVIDER_USER_ID,
  role: 'provider',
  handoff_point: 'check_in',
  photo_url: 'https://cdn.petzone.vn/check-in/photo-1.jpg',
  thumbnail_url: 'https://cdn.petzone.vn/check-in/photo-1-thumb.jpg',
  timestamp: NOW,
  latitude: 10.7745,
  longitude: 106.7016,
  has_concern: false,
  concern_note: null,
  created_at: NOW,
}

// ===== Chat =====

export const EXAMPLE_CHAT_CONVERSATION = {
  id: CONVERSATION_ID,
  order_id: ORDER_ID,
  owner_id: OWNER_ID,
  provider_id: PROVIDER_USER_ID,
  last_message_at: NOW,
  owner_unread_count: 0,
  provider_unread_count: 1,
  created_at: PAST,
  updated_at: NOW,
  owner: {
    id: OWNER_ID,
    full_name: 'Nguyễn Văn A',
    avatar_url: 'https://cdn.petzone.vn/avatars/owner.jpg',
  },
  provider: {
    id: PROVIDER_USER_ID,
    full_name: 'Trần Thị B',
    avatar_url: 'https://cdn.petzone.vn/avatars/provider.jpg',
    business_name: 'Pet Hotel Sài Gòn',
  },
}

export const EXAMPLE_CHAT_MESSAGE = {
  id: MESSAGE_ID,
  conversation_id: CONVERSATION_ID,
  sender_id: OWNER_ID,
  content: 'Chào shop, bé Miu nhà mình hơi nhút nhát nhé.',
  type: 'text',
  image_url: null,
  status: 'read',
  created_at: NOW,
  read_at: NOW,
  sender_role: 'owner',
  sender: {
    id: OWNER_ID,
    full_name: 'Nguyễn Văn A',
    avatar_url: 'https://cdn.petzone.vn/avatars/owner.jpg',
    display_name: 'Nguyễn Văn A',
  },
}

export const EXAMPLE_MARK_READ = { unread_count: 0, marked_count: 3 }

// ===== Calls =====

export const EXAMPLE_CALL_INITIATE = {
  call_id: CALL_ID,
  conversation_id: CONVERSATION_ID,
  caller_id: OWNER_ID,
  callee_id: PROVIDER_USER_ID,
  proxy_number: '+84899****567',
  status: 'initiating',
  started_at: NOW,
}

export const EXAMPLE_CALL_END = {
  id: CALL_ID,
  conversation_id: CONVERSATION_ID,
  status: 'completed',
  duration_seconds: 145,
  ended_at: NOW,
}

export const EXAMPLE_CALL_LOG = {
  id: CALL_ID,
  conversation_id: CONVERSATION_ID,
  order_id: ORDER_ID,
  caller_id: OWNER_ID,
  callee_id: PROVIDER_USER_ID,
  proxy_number: '+84899****567',
  status: 'completed',
  duration_seconds: 145,
  started_at: NOW,
  ended_at: '2026-04-12T10:02:25.000Z',
  created_at: NOW,
}

export const EXAMPLE_CALL_WEBHOOK = { message: 'Webhook processed' }

// ===== Reviews =====

export const EXAMPLE_REVIEW = {
  id: REVIEW_ID,
  order_id: ORDER_ID,
  owner_id: OWNER_ID,
  provider_id: PROVIDER_ID,
  rating_overall: 5,
  rating_cleanliness: 5,
  rating_care_quality: 5,
  rating_communication: 4,
  rating_value: 5,
  text: 'Shop rất chu đáo, mình rất hài lòng. Bé Miu về nhà còn vui hơn lúc đi gửi.',
  photos: ['https://cdn.petzone.vn/reviews/review-1.jpg'],
  provider_response: 'Cảm ơn anh/chị đã tin tưởng. Mong sẽ được phục vụ Miu trong những lần tới ạ!',
  provider_responded_at: NOW,
  is_visible: true,
  created_at: NOW,
  updated_at: NOW,
}

// ===== Notifications =====

export const EXAMPLE_NOTIFICATION = {
  id: NOTIFICATION_ID,
  user_id: OWNER_ID,
  type: 'order_status',
  title: 'Đơn đặt phòng đã được xác nhận',
  body: 'Pet Hotel Sài Gòn đã xác nhận đơn của bạn. Vui lòng thanh toán trong 24h.',
  data: { order_id: ORDER_ID, status: 'confirmed' },
  is_read: false,
  push_sent: true,
  created_at: NOW,
  read_at: null,
}

export const EXAMPLE_DEVICE_TOKEN = {
  id: '17171717-1717-4717-8717-171717171717',
  user_id: OWNER_ID,
  token: 'fcm-token-abcdef123456',
  platform: 'ios',
  is_active: true,
  created_at: NOW,
  updated_at: NOW,
}

export const EXAMPLE_MARK_ALL_READ = { message: 'All notifications marked as read', count: 5 }

// ===== Search =====

export const EXAMPLE_FAVORITE = {
  id: '18181818-1818-4818-8818-181818181818',
  user_id: OWNER_ID,
  provider_id: PROVIDER_ID,
  created_at: NOW,
  provider: EXAMPLE_PROVIDER_LIST_ITEM,
}

export const EXAMPLE_SEARCH_HISTORY_ITEM = {
  id: '19191919-1919-4919-8919-191919191919',
  user_id: OWNER_ID,
  query_text: 'pet hotel quận 1',
  latitude: 10.7745,
  longitude: 106.7016,
  filters: { species: 'cat', max_price: 500000 },
  created_at: NOW,
}

// ===== Admin =====

export const EXAMPLE_ADMIN_DASHBOARD = {
  total_users: 12450,
  total_providers: 320,
  pending_verifications: 8,
  active_orders: 156,
  open_disputes: 3,
}

export const EXAMPLE_ADMIN_ANALYTICS = {
  status_breakdown: [
    { status: 'completed', count: 1820 },
    { status: 'cancelled', count: 102 },
    { status: 'in_progress', count: 45 },
    { status: 'confirmed', count: 38 },
    { status: 'pending', count: 12 },
  ],
  total_revenue: 1450000000,
  commission_earned: 217500000,
  top_providers: [
    {
      id: PROVIDER_ID,
      business_name: 'Pet Hotel Sài Gòn',
      total_orders: 152,
      total_revenue: 78000000,
    },
  ],
}

export const EXAMPLE_ADMIN_CONFIG = {
  commission_rate: 0.15,
  provider_response_timeout_hours: 4,
  payment_timeout_hours: 24,
  review_window_days: 7,
  verification_sla_hours: 48,
}

export const EXAMPLE_DISPUTE = {
  id: DISPUTE_ID,
  order_id: ORDER_ID,
  opened_by: OWNER_ID,
  opened_by_role: 'owner',
  description: 'Bé Miu bị thương nhẹ ở chân khi nhận về.',
  evidence_photos: ['https://cdn.petzone.vn/disputes/evidence-1.jpg'],
  status: 'open',
  resolution: null,
  resolved_by: null,
  resolved_at: null,
  created_at: NOW,
  updated_at: NOW,
}

export const EXAMPLE_DISPUTE_RESOLUTION = {
  ...EXAMPLE_DISPUTE,
  status: 'resolved',
  resolution: 'Hoàn tiền 50% và shop chịu chi phí khám thú y.',
  resolved_by: ADMIN_ID,
  resolved_at: NOW,
}

export const EXAMPLE_PROVIDER_DETAIL = {
  ...EXAMPLE_PROVIDER,
  user: EXAMPLE_USER_PUBLIC,
  verification_history: [
    {
      action: 'submitted',
      actor_id: PROVIDER_USER_ID,
      note: null,
      created_at: '2026-01-12T10:00:00.000Z',
    },
    {
      action: 'approved',
      actor_id: ADMIN_ID,
      note: 'Hồ sơ đầy đủ, đã kiểm tra giấy phép.',
      created_at: '2026-01-13T15:30:00.000Z',
    },
  ],
}

export const EXAMPLE_VERIFY_PROVIDER_RESULT = {
  id: PROVIDER_ID,
  verification_status: 'approved',
  reviewed_at: NOW,
}

export const EXAMPLE_SUSPEND_USER_RESULT = {
  id: OWNER_ID,
  status: 'suspended',
  suspension_reason: 'Vi phạm điều khoản',
  suspended_at: NOW,
}

export const EXAMPLE_MODERATE_REVIEW_RESULT = {
  id: REVIEW_ID,
  is_visible: false,
  hidden_reason: 'Nội dung không phù hợp',
  hidden_by: ADMIN_ID,
}

export const EXAMPLE_REQUEST_INFO_RESULT = { message: 'Info request sent to provider' }
export const EXAMPLE_ADMIN_MESSAGE_RESULT = { message: 'Message sent to both parties' }
export const EXAMPLE_EXPORT_ORDERS = {
  url: 'https://cdn.petzone.vn/exports/orders-2026-04-12.csv',
  expires_at: '2026-04-12T11:00:00.000Z',
}

// ===== Upload =====

export const EXAMPLE_PRESIGNED_URL = {
  upload_url: 'https://storage.petzone.vn/upload?token=abc123&expires=1712914800',
  public_url: 'https://cdn.petzone.vn/pet-photos/uuid-filename.jpg',
  key: 'pet-photos/uuid-filename.jpg',
  expires_in: 900,
}

export const EXAMPLE_UPLOADED_IMAGE = {
  url: 'https://cdn.petzone.vn/pet-photos/uuid-filename.jpg',
  thumbnail_url: 'https://cdn.petzone.vn/pet-photos/uuid-filename-thumb.jpg',
  size_bytes: 245678,
  content_type: 'image/jpeg',
}

// ===== Health =====

export const EXAMPLE_HEALTH = { status: 'ok', timestamp: NOW }

// ===== Generic ack =====

export const EXAMPLE_ACK = { id: ORDER_ID, message: 'Operation successful' }
