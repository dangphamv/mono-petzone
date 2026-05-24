import type { OrderStatus, PaymentMethod, CancellationPolicy } from '../types'
import type { UserRole, AdminPermission } from '../types/user'
import type { PetSpecies } from '../types/pet'

export const USER_ROLES: UserRole[] = ['owner', 'provider', 'admin', 'staff']

/** Granular admin-dashboard permissions assignable to staff accounts (admin = superuser, ignores these). */
export const ADMIN_PERMISSIONS: AdminPermission[] = [
  'orders:view', 'orders:manage',
  'providers:view', 'providers:manage',
  'disputes:view', 'disputes:manage',
  'reviews:view', 'reviews:manage',
  'users:view', 'users:manage',
  'pets:view', 'pets:manage',
  'dashboard:view',
]

export const ADMIN_PERMISSION_LABELS: Record<AdminPermission, string> = {
  'orders:view': 'Xem đơn hàng',
  'orders:manage': 'Quản lý đơn hàng',
  'providers:view': 'Xem đối tác',
  'providers:manage': 'Duyệt & quản lý đối tác',
  'disputes:view': 'Xem tranh chấp',
  'disputes:manage': 'Xử lý tranh chấp',
  'reviews:view': 'Xem đánh giá',
  'reviews:manage': 'Kiểm duyệt đánh giá',
  'users:view': 'Xem người dùng',
  'users:manage': 'Quản lý người dùng',
  'pets:view': 'Xem thú cưng',
  'pets:manage': 'Quản lý thú cưng',
  'dashboard:view': 'Xem dashboard & thống kê',
}

export const PET_SPECIES: PetSpecies[] = ['dog', 'cat', 'other']

export const PET_SPECIES_LABELS: Record<PetSpecies, string> = {
  dog: 'Chó',
  cat: 'Mèo',
  other: 'Khác',
}

export const ORDER_STATUSES: OrderStatus[] = [
  'pending_payment',
  'pending',
  'confirmed',
  'checked_in',
  'in_progress',
  'check_out',
  'completed',
  'cancelled',
  'disputed',
]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Chờ thanh toán',
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  checked_in: 'Đã check-in',
  in_progress: 'Đang thực hiện',
  check_out: 'Đã check-out',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  disputed: 'Tranh chấp',
}

export const PAYMENT_METHODS: PaymentMethod[] = ['vietqr', 'cash', 'momo', 'zalopay', 'vnpay', 'bank_transfer']

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  vietqr: 'Chuyển khoản QR (VietQR)',
  cash: 'Tiền mặt khi check-in',
  momo: 'MoMo',
  zalopay: 'ZaloPay',
  vnpay: 'VNPay',
  bank_transfer: 'Chuyển khoản thủ công',
}

export const CANCELLATION_POLICIES: Record<CancellationPolicy, { label: string; rules: { hours: number; refund_pct: number }[] }> = {
  flexible: {
    label: 'Linh hoạt',
    rules: [
      { hours: 48, refund_pct: 100 },
      { hours: 24, refund_pct: 50 },
      { hours: 0, refund_pct: 0 },
    ],
  },
  moderate: {
    label: 'Vừa phải',
    rules: [
      { hours: 48, refund_pct: 100 },
      { hours: 24, refund_pct: 25 },
      { hours: 0, refund_pct: 0 },
    ],
  },
  strict: {
    label: 'Nghiêm ngặt',
    rules: [
      { hours: 48, refund_pct: 50 },
      { hours: 0, refund_pct: 0 },
    ],
  },
}

export const COMMISSION_RATE = 0.15

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const

export const UPLOAD = {
  MAX_IMAGE_SIZE_MB: 10,
  MAX_IMAGES_PER_UPLOAD: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'] as const,
} as const

export const API_ENDPOINTS = {
  AUTH_SEND_OTP: '/auth/send-otp',
  AUTH_VERIFY_OTP: '/auth/verify-otp',
  AUTH_LOGIN: '/auth/login',
  AUTH_GOOGLE: '/auth/google',
  AUTH_REFRESH: '/auth/refresh',
  AUTH_SELECT_ROLE: '/auth/select-role',
  AUTH_LOGOUT: '/auth/logout',
  USERS_ME: '/users/me',
  PETS: '/pets',
  PROVIDERS: '/providers',
  SEARCH: '/search/providers',
  ORDERS: '/orders',
  PAYMENTS: '/payments',
  CHAT: '/chat/conversations',
  REVIEWS: '/reviews',
  NOTIFICATIONS: '/notifications',
  ADMIN: '/admin',
  UPLOAD: '/upload',
} as const
