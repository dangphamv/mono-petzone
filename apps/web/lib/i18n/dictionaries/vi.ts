export interface Dictionary {
  metadata: { title: string; description: string }
  header: { about: string; forProviders: string; pricing: string; contact: string; download: string }
  hero: {
    badge: string; titleLine1: string; titleLine2: string; subtitle: string
    ctaPrimary: string; ctaSecondary: string; rating: string; petServed: string; partnerHotels: string
  }
  features: {
    label: string; title: string; subtitle: string
    items: readonly { title: string; description: string }[]
  }
  howItWorks: {
    label: string; title: string; subtitle: string
    steps: readonly { title: string; description: string }[]
  }
  stats: { items: readonly { value: string; label: string }[] }
  cta: { badge: string; title: string; subtitle: string; downloadOn: string }
  footer: {
    description: string; location: string; product: string; company: string; legal: string
    forProviders: string; pricing: string; about: string; contact: string
    terms: string; privacy: string; madeWith: string
  }
  about: { metaTitle: string; metaDescription: string; title: string; p1: string; p2: string }
  contactPage: { metaTitle: string; metaDescription: string; title: string; subtitle: string }
  forProvidersPage: {
    metaTitle: string; metaDescription: string; title: string; subtitle: string
    features: readonly { title: string; description: string }[]
  }
  pricingPage: {
    metaTitle: string; metaDescription: string; title: string; subtitle: string
    commission: string; commissionDesc: string
  }
  termsPage: { metaTitle: string; title: string; placeholder: string }
  privacyPage: { metaTitle: string; title: string; placeholder: string }
}

const vi: Dictionary = {
  metadata: {
    title: 'PetZone - Nền tảng đặt khách sạn thú cưng',
    description: 'Tìm và đặt khách sạn thú cưng uy tín tại Việt Nam. Theo dõi thú cưng theo thời gian thực, thanh toán an toàn.',
  },
  header: {
    about: 'Về chúng tôi',
    forProviders: 'Dành cho đối tác',
    pricing: 'Bảng giá',
    contact: 'Liên hệ',
    download: 'Tải ứng dụng',
  },
  hero: {
    badge: 'Nền tảng số 1 Việt Nam',
    titleLine1: 'Khách sạn thú cưng',
    titleLine2: 'uy tín & minh bạch',
    subtitle: 'Tìm kiếm, đặt phòng và theo dõi thú cưng của bạn theo thời gian thực. An tâm khi gửi bé yêu tại các cơ sở đã được xác minh.',
    ctaPrimary: 'Tải ứng dụng miễn phí',
    ctaSecondary: 'Trở thành đối tác',
    rating: '4.8/5 đánh giá',
    petServed: 'thú cưng đã phục vụ',
    partnerHotels: 'khách sạn đối tác',
  },
  features: {
    label: 'Tính năng nổi bật',
    title: 'Tại sao chọn',
    subtitle: 'Nền tảng được thiết kế dành riêng cho những người yêu thú cưng tại Việt Nam.',
    items: [
      { title: 'Tìm kiếm thông minh', description: 'Tìm khách sạn thú cưng gần bạn với bộ lọc địa điểm, dịch vụ và đánh giá từ cộng đồng.' },
      { title: 'Đặt phòng nhanh chóng', description: 'Đặt phòng chỉ trong vài phút với thanh toán an toàn qua MoMo, ZaloPay và ngân hàng.' },
      { title: 'Theo dõi thời gian thực', description: 'Nhận ảnh check-in và báo cáo hàng ngày về tình trạng sức khỏe của bé yêu.' },
      { title: 'Đánh giá minh bạch', description: 'Hệ thống đánh giá đa chiều từ cộng đồng giúp bạn chọn nơi tốt nhất cho thú cưng.' },
    ],
  },
  howItWorks: {
    label: 'Quy trình đơn giản',
    title: 'Cách hoạt động',
    subtitle: 'Chỉ 4 bước để bé yêu của bạn được chăm sóc tốt nhất.',
    steps: [
      { title: 'Tìm kiếm', description: 'Nhập địa điểm, ngày và loại thú cưng để tìm khách sạn phù hợp nhất.' },
      { title: 'Đặt phòng', description: 'Chọn phòng, dịch vụ thêm và hoàn tất thanh toán an toàn chỉ trong vài bước.' },
      { title: 'Check-in', description: 'Gửi bé yêu với ảnh check-in xác nhận tình trạng sức khỏe và an toàn.' },
      { title: 'Theo dõi & đón về', description: 'Nhận báo cáo hàng ngày về bé yêu và đón về khi dịch vụ hoàn tất.' },
    ],
  },
  stats: {
    items: [
      { value: '500+', label: 'Khách sạn đối tác' },
      { value: '10,000+', label: 'Thú cưng đã phục vụ' },
      { value: '4.8/5', label: 'Đánh giá trung bình' },
      { value: '98%', label: 'Tỷ lệ hài lòng' },
    ],
  },
  cta: {
    badge: 'Miễn phí tải và sử dụng',
    title: 'Sẵn sàng trải nghiệm?',
    subtitle: 'Tải ứng dụng PetZone ngay hôm nay và tìm khách sạn thú cưng phù hợp nhất cho bé yêu của bạn.',
    downloadOn: 'Tải về trên',
  },
  footer: {
    description: 'Nền tảng đặt khách sạn thú cưng hàng đầu Việt Nam. Kết nối chủ thú cưng với các cơ sở lưu trú uy tín, được xác minh.',
    location: 'TP. Hồ Chí Minh, Việt Nam',
    product: 'Sản phẩm',
    company: 'Công ty',
    legal: 'Pháp lý',
    forProviders: 'Dành cho đối tác',
    pricing: 'Bảng giá',
    about: 'Về chúng tôi',
    contact: 'Liên hệ',
    terms: 'Điều khoản sử dụng',
    privacy: 'Chính sách bảo mật',
    madeWith: 'Made with care for pets in Vietnam',
  },
  about: {
    metaTitle: 'Về chúng tôi',
    metaDescription: 'Tìm hiểu về PetZone - nền tảng đặt khách sạn thú cưng hàng đầu Việt Nam',
    title: 'Về PetZone',
    p1: 'PetZone ra đời với sứ mệnh trở thành nền tảng đáng tin cậy nhất để chủ nuôi tìm kiếm và đặt dịch vụ lưu trú cho thú cưng tại Việt Nam.',
    p2: 'Chúng tôi kết nối chủ nuôi với các khách sạn thú cưng đã được xác minh, đảm bảo mọi thú cưng đều được chăm sóc an toàn và minh bạch.',
  },
  contactPage: {
    metaTitle: 'Liên hệ',
    metaDescription: 'Liên hệ với đội ngũ PetZone',
    title: 'Liên hệ',
    subtitle: 'Có câu hỏi? Hãy liên hệ với chúng tôi.',
  },
  forProvidersPage: {
    metaTitle: 'Dành cho đối tác',
    metaDescription: 'Trở thành đối tác PetZone và tiếp cận hàng nghìn khách hàng tiềm năng',
    title: 'Dành cho đối tác',
    subtitle: 'Tham gia PetZone để tiếp cận hàng nghìn chủ nuôi đang tìm kiếm dịch vụ lưu trú chất lượng cho thú cưng.',
    features: [
      { title: 'Quản lý dễ dàng', description: 'Quản lý phòng, lịch, đơn hàng từ ứng dụng di động' },
      { title: 'Thanh toán minh bạch', description: 'Theo dõi doanh thu và nhận thanh toán định kỳ' },
      { title: 'Hỗ trợ 24/7', description: 'Đội ngũ hỗ trợ luôn sẵn sàng giúp đỡ bạn' },
    ],
  },
  pricingPage: {
    metaTitle: 'Bảng giá',
    metaDescription: 'Mô hình hoa hồng minh bạch của PetZone',
    title: 'Bảng giá',
    subtitle: 'PetZone hoạt động theo mô hình hoa hồng minh bạch. Không phí ẩn.',
    commission: 'Hoa hồng 15%',
    commissionDesc: 'Chỉ tính trên mỗi đơn hàng hoàn thành. Không phí đăng ký, không phí duy trì.',
  },
  termsPage: {
    metaTitle: 'Điều khoản sử dụng',
    title: 'Điều khoản sử dụng',
    placeholder: 'Nội dung điều khoản sử dụng sẽ được cập nhật.',
  },
  privacyPage: {
    metaTitle: 'Chính sách bảo mật',
    title: 'Chính sách bảo mật',
    placeholder: 'Nội dung chính sách bảo mật sẽ được cập nhật.',
  },
}

export default vi
