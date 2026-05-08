/**
 * Mock data for admin pages where backend endpoints may not be ready.
 * This provides realistic data for UI development and testing.
 */

// ─── Disputes Mock Data ───────────────────────────────────────────────────────
export const MOCK_DISPUTES = [
  {
    id: 'd1a2b3c4-5678-9abc-def0-111111111111',
    order_id: 'o1a2b3c4-5678-9abc-def0-222222222222',
    order_number: 'PZ-2026-0042',
    opened_by_role: 'owner',
    opened_by_name: 'Nguyễn Thị Mai',
    provider_name: 'Happy Paws Hotel',
    description: 'Thú cưng bị trầy xước khi nhận lại. Provider không thông báo sự cố trong thời gian lưu trú.',
    status: 'open',
    created_at: '2026-04-14T08:30:00Z',
    updated_at: '2026-04-14T08:30:00Z',
  },
  {
    id: 'd1a2b3c4-5678-9abc-def0-333333333333',
    order_id: 'o1a2b3c4-5678-9abc-def0-444444444444',
    order_number: 'PZ-2026-0038',
    opened_by_role: 'owner',
    opened_by_name: 'Trần Văn Hùng',
    provider_name: 'PetLove Spa & Hotel',
    description: 'Đặt phòng VIP nhưng thú cưng được nhốt trong phòng thường. Yêu cầu hoàn tiền chênh lệch.',
    status: 'open',
    created_at: '2026-04-13T14:20:00Z',
    updated_at: '2026-04-13T14:20:00Z',
  },
  {
    id: 'd1a2b3c4-5678-9abc-def0-555555555555',
    order_id: 'o1a2b3c4-5678-9abc-def0-666666666666',
    order_number: 'PZ-2026-0035',
    opened_by_role: 'provider',
    opened_by_name: 'Mèo Xinh Hotel',
    provider_name: 'Mèo Xinh Hotel',
    description: 'Chủ pet không đến nhận đúng hẹn, quá 24h. Yêu cầu tính phí lưu trú thêm.',
    status: 'open',
    created_at: '2026-04-12T10:00:00Z',
    updated_at: '2026-04-12T10:00:00Z',
  },
  {
    id: 'd1a2b3c4-5678-9abc-def0-777777777777',
    order_id: 'o1a2b3c4-5678-9abc-def0-888888888888',
    order_number: 'PZ-2026-0029',
    opened_by_role: 'owner',
    opened_by_name: 'Lê Hoàng Anh',
    provider_name: 'Golden Pet Resort',
    description: 'Provider hủy đơn vào phút chót khi đã thanh toán. Không hoàn tiền tự động.',
    status: 'resolved',
    resolution: 'Hoàn tiền 100% cho owner. Cảnh cáo provider lần 1.',
    resolved_at: '2026-04-11T16:45:00Z',
    created_at: '2026-04-10T09:15:00Z',
    updated_at: '2026-04-11T16:45:00Z',
  },
  {
    id: 'd1a2b3c4-5678-9abc-def0-999999999999',
    order_id: 'o1a2b3c4-5678-9abc-def0-aaaaaaaaaaaa',
    order_number: 'PZ-2026-0025',
    opened_by_role: 'owner',
    opened_by_name: 'Phạm Minh Tuấn',
    provider_name: 'Buddy House',
    description: 'Thú cưng bị bệnh sau khi ở hotel 3 ngày. Nghi ngờ vệ sinh kém.',
    status: 'resolved',
    resolution: 'Hoàn 50% tiền đơn. Yêu cầu provider cải thiện vệ sinh và gửi bằng chứng.',
    resolved_at: '2026-04-09T11:30:00Z',
    created_at: '2026-04-07T15:00:00Z',
    updated_at: '2026-04-09T11:30:00Z',
  },
]

// ─── Reviews Mock Data ────────────────────────────────────────────────────────
export const MOCK_REVIEWS = [
  {
    id: 'r1a2b3c4-1111-1111-1111-111111111111',
    rating_overall: 1,
    text: 'Phòng bẩn, nhân viên thái độ kém. Mèo tôi bị stress nặng khi nhận về. Không bao giờ quay lại!',
    is_visible: true,
    order_id: 'o1a2b3c4-5678-9abc-def0-222222222222',
    order_number: 'PZ-2026-0042',
    provider_name: 'Happy Paws Hotel',
    reviewer_name: 'Nguyễn Thị Mai',
    created_at: '2026-04-14T10:00:00Z',
  },
  {
    id: 'r1a2b3c4-2222-2222-2222-222222222222',
    rating_overall: 2,
    text: 'Dịch vụ không như quảng cáo. Nói có camera theo dõi 24/7 nhưng thực tế camera hỏng 2 ngày không sửa.',
    is_visible: true,
    order_id: 'o1a2b3c4-5678-9abc-def0-444444444444',
    order_number: 'PZ-2026-0038',
    provider_name: 'PetLove Spa & Hotel',
    reviewer_name: 'Trần Văn Hùng',
    created_at: '2026-04-13T16:30:00Z',
  },
  {
    id: 'r1a2b3c4-3333-3333-3333-333333333333',
    rating_overall: 5,
    text: 'Tuyệt vời! Chó tôi rất vui khi ở đây. Nhân viên chăm sóc tận tình, gửi ảnh/video hàng ngày.',
    is_visible: true,
    order_id: 'o1a2b3c4-5678-9abc-def0-bbbbbbbbbbbb',
    order_number: 'PZ-2026-0040',
    provider_name: 'Golden Pet Resort',
    reviewer_name: 'Lê Hoàng Anh',
    created_at: '2026-04-12T09:00:00Z',
  },
  {
    id: 'r1a2b3c4-4444-4444-4444-444444444444',
    rating_overall: 1,
    text: 'SCAM! Lấy tiền rồi hủy đơn. Liên hệ không được. Cần ban provider này ngay.',
    is_visible: false,
    order_id: 'o1a2b3c4-5678-9abc-def0-cccccccccccc',
    order_number: 'PZ-2026-0033',
    provider_name: 'Buddy House',
    reviewer_name: 'Phạm Minh Tuấn',
    created_at: '2026-04-11T14:00:00Z',
  },
  {
    id: 'r1a2b3c4-5555-5555-5555-555555555555',
    rating_overall: 4,
    text: 'Khá tốt, phòng sạch sẽ. Chỉ tiếc là không có khu vui chơi ngoài trời cho chó lớn.',
    is_visible: true,
    order_id: 'o1a2b3c4-5678-9abc-def0-dddddddddddd',
    order_number: 'PZ-2026-0031',
    provider_name: 'Mèo Xinh Hotel',
    reviewer_name: 'Võ Thị Hương',
    created_at: '2026-04-10T11:30:00Z',
  },
  {
    id: 'r1a2b3c4-6666-6666-6666-666666666666',
    rating_overall: 3,
    text: 'Bình thường, giá hơi cao so với chất lượng. Phòng nhỏ hơn ảnh quảng cáo.',
    is_visible: true,
    order_id: 'o1a2b3c4-5678-9abc-def0-eeeeeeeeeeee',
    order_number: 'PZ-2026-0028',
    provider_name: 'PetLove Spa & Hotel',
    reviewer_name: 'Đỗ Quang Minh',
    created_at: '2026-04-09T08:45:00Z',
  },
]

// ─── Dashboard Action Items (combines pending providers + open disputes) ──────
export const MOCK_ACTION_ITEMS = [
  {
    id: 'p-pending-001',
    type: 'verification' as const,
    subject: 'Sunshine Pet Hotel',
    description: 'Đăng ký mới - chờ xác minh giấy phép',
    date: '2026-04-15T09:00:00Z',
    href: '/providers/p-pending-001',
  },
  {
    id: 'd1a2b3c4-5678-9abc-def0-111111111111',
    type: 'dispute' as const,
    subject: 'Happy Paws Hotel',
    description: 'Thú cưng bị trầy xước - owner khiếu nại',
    date: '2026-04-14T08:30:00Z',
    href: '/disputes/d1a2b3c4-5678-9abc-def0-111111111111',
  },
  {
    id: 'p-pending-002',
    type: 'verification' as const,
    subject: 'Cat Paradise Quận 7',
    description: 'Đăng ký mới - chờ xác minh địa chỉ',
    date: '2026-04-14T07:00:00Z',
    href: '/providers/p-pending-002',
  },
  {
    id: 'd1a2b3c4-5678-9abc-def0-333333333333',
    type: 'dispute' as const,
    subject: 'PetLove Spa & Hotel',
    description: 'Phòng VIP nhưng nhốt phòng thường',
    date: '2026-04-13T14:20:00Z',
    href: '/disputes/d1a2b3c4-5678-9abc-def0-333333333333',
  },
  {
    id: 'd1a2b3c4-5678-9abc-def0-555555555555',
    type: 'dispute' as const,
    subject: 'Mèo Xinh Hotel',
    description: 'Chủ pet không đến nhận đúng hẹn',
    date: '2026-04-12T10:00:00Z',
    href: '/disputes/d1a2b3c4-5678-9abc-def0-555555555555',
  },
]

// ─── Mock recent orders for provider/user detail pages ────────────────────────
export const MOCK_RECENT_ORDERS = [
  {
    id: 'ord-001',
    order_number: 'PZ-2026-0045',
    status: 'completed',
    check_in_date: '2026-04-10',
    check_out_date: '2026-04-13',
    total_price: 1_020_000,
    pet_name: 'Milo',
  },
  {
    id: 'ord-002',
    order_number: 'PZ-2026-0042',
    status: 'disputed',
    check_in_date: '2026-04-08',
    check_out_date: '2026-04-11',
    total_price: 680_000,
    pet_name: 'Luna',
  },
  {
    id: 'ord-003',
    order_number: 'PZ-2026-0039',
    status: 'completed',
    check_in_date: '2026-04-05',
    check_out_date: '2026-04-07',
    total_price: 510_000,
    pet_name: 'Buddy',
  },
  {
    id: 'ord-004',
    order_number: 'PZ-2026-0035',
    status: 'cancelled',
    check_in_date: '2026-04-03',
    check_out_date: '2026-04-05',
    total_price: 340_000,
    pet_name: 'Kitty',
  },
  {
    id: 'ord-005',
    order_number: 'PZ-2026-0031',
    status: 'completed',
    check_in_date: '2026-04-01',
    check_out_date: '2026-04-04',
    total_price: 850_000,
    pet_name: 'Max',
  },
]

// ─── Mock pet info for user detail ────────────────────────────────────────────
export const MOCK_USER_PETS = [
  { name: 'Milo', species: 'Chó', breed: 'Golden Retriever', weight_kg: 28, age_months: 24 },
  { name: 'Luna', species: 'Mèo', breed: 'British Shorthair', weight_kg: 4.5, age_months: 18 },
]

// ─── Mock order extended info ─────────────────────────────────────────────────
export const MOCK_ORDER_EXTENDED = {
  payment_method: 'MoMo',
  disbursement_status: 'pending',
  pet_info: { name: 'Milo', species: 'Chó', breed: 'Golden Retriever', weight_kg: 28 },
  addon_services: [
    { name: 'Tắm & Grooming', price: 150_000 },
    { name: 'Đón/Trả tận nơi', price: 80_000 },
  ],
  price_breakdown: {
    base_price: 680_000,
    addon_total: 230_000,
    platform_fee: 136_500,
    total: 1_046_500,
  },
  checkin_photos: [
    'https://placehold.co/300x200/e2e8f0/64748b?text=Check-in+1',
    'https://placehold.co/300x200/e2e8f0/64748b?text=Check-in+2',
  ],
  checkout_photos: [
    'https://placehold.co/300x200/e2e8f0/64748b?text=Check-out+1',
    'https://placehold.co/300x200/e2e8f0/64748b?text=Check-out+2',
  ],
  owner_name: 'Nguyễn Thị Mai',
  provider_name: 'Happy Paws Hotel',
}
