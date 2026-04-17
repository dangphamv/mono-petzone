export interface Dictionary {
  metadata: { title: string; description: string }
  header: { about: string; forProviders: string; pricing: string; contact: string; faq: string; download: string }
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
  about: {
    metaTitle: string; metaDescription: string; title: string
    storyTitle: string; storyText: string
    missionTitle: string; missionText: string
    valuesTitle: string; values: readonly { icon: string; text: string }[]
    diffTitle: string; diffs: readonly { icon: string; text: string }[]
    teamTitle: string; teamText: string
    hotline: string
  }
  contactPage: { metaTitle: string; metaDescription: string; title: string; subtitle: string }
  forProvidersPage: {
    metaTitle: string; metaDescription: string; title: string; subtitle: string
    features: readonly { title: string; description: string }[]
  }
  pricingPage: {
    metaTitle: string; metaDescription: string; title: string; subtitle: string
    commission: string; commissionDesc: string
  }
  termsPage: { metaTitle: string; title: string; lastUpdated: string; sections: readonly { heading: string; content: string }[] }
  privacyPage: { metaTitle: string; title: string; lastUpdated: string; sections: readonly { heading: string; content: string }[] }
  faqPage: {
    metaTitle: string; metaDescription: string; title: string; subtitle: string
    ownerLabel: string; providerLabel: string
    items: readonly { question: string; answer: string; category: 'owner' | 'provider' }[]
  }
}

const vi: Dictionary = {
  metadata: {
    title: 'PetZone — Đặt Khách Sạn Thú Cưng Đã Xác Minh Tại HCMC',
    description: 'Tìm và đặt khách sạn thú cưng đã xác minh tại TP.HCM. Ảnh check-in, báo cáo hàng ngày, chat trực tiếp. Thanh toán an toàn qua MoMo, ZaloPay.',
  },
  header: {
    about: 'Về chúng tôi',
    forProviders: 'Dành cho đối tác',
    pricing: 'Bảng giá',
    contact: 'Liên hệ',
    faq: 'FAQ',
    download: 'Tải ứng dụng',
  },
  hero: {
    badge: 'Nền tảng đặt phòng thú cưng đã xác minh',
    titleLine1: 'Gửi boss yên tâm',
    titleLine2: 'đón boss vui vẻ',
    subtitle: 'Tìm khách sạn thú cưng đã xác minh tại HCMC trong 2 phút. Nhận ảnh check-in, báo cáo hàng ngày, và chat trực tiếp với khách sạn — để bạn luôn biết boss đang được chăm sóc tốt.',
    ctaPrimary: 'Tìm khách sạn ngay',
    ctaSecondary: 'Trở thành đối tác',
    rating: '',
    petServed: '',
    partnerHotels: '',
  },
  features: {
    label: 'Tại sao sen chọn PetZone?',
    title: 'Boss xứng đáng được chăm sóc tốt nhất',
    subtitle: 'Mọi thứ bạn cần để yên tâm khi xa boss — từ tìm kiếm đến đón về.',
    items: [
      { title: 'Chỉ khách sạn đã xác minh', description: 'Mọi khách sạn trên PetZone đều qua kiểm duyệt giấy phép và cơ sở vật chất. Bạn không cần tự kiểm tra — chúng tôi đã làm rồi.' },
      { title: 'Ảnh check-in có thời gian thực', description: 'Nhận ảnh boss ngay khi drop-off và pick-up, kèm timestamp và vị trí. Bằng chứng rõ ràng, không cần lo lắng.' },
      { title: 'Báo cáo hàng ngày về boss', description: 'Mỗi ngày bạn nhận ảnh và cập nhật — boss ăn gì, chơi gì, sức khỏe thế nào. Như đang ở bên boss vậy.' },
      { title: 'Chat trực tiếp với khách sạn', description: 'Nhắn tin hoặc gọi cho khách sạn bất cứ lúc nào trong app. Không cần tìm số điện thoại, không cần chờ đợi.' },
    ],
  },
  howItWorks: {
    label: 'Đơn giản như 1-2-3-4',
    title: 'Đặt phòng cho boss trong 4 bước',
    subtitle: 'Từ tìm kiếm đến đón boss về — nhanh hơn bạn nghĩ.',
    steps: [
      { title: 'Tìm kiếm', description: 'Nhập khu vực và ngày gửi. PetZone hiển thị khách sạn gần bạn, có phòng trống, kèm giá và đánh giá từ sen khác.' },
      { title: 'Đặt phòng', description: 'Chọn phòng, thêm dịch vụ nếu cần, xem giá chi tiết. Gửi yêu cầu — khách sạn xác nhận trong 4 giờ.' },
      { title: 'Thanh toán an toàn', description: 'Chỉ thanh toán khi khách sạn xác nhận đơn. Thanh toán qua MoMo, ZaloPay hoặc chuyển khoản. Tiền được giữ an toàn cho đến khi boss được trả về.' },
      { title: 'Check-in & theo dõi', description: 'Drop-off boss với ảnh check-in. Nhận báo cáo hàng ngày. Đón boss về với ảnh check-out. Đánh giá khách sạn.' },
    ],
  },
  stats: {
    items: [
      { value: '100%', label: 'Đối tác được kiểm duyệt' },
      { value: '2 phút', label: 'Tìm & đặt phòng' },
      { value: '0%', label: 'Phí ẩn' },
      { value: '4 giờ', label: 'Khách sạn xác nhận' },
    ],
  },
  cta: {
    badge: 'Miễn phí — không phí ẩn',
    title: 'Boss đang chờ bạn đặt phòng',
    subtitle: 'Tìm khách sạn thú cưng uy tín gần bạn ngay bây giờ. Đặt phòng lần đầu — miễn phí dịch vụ.',
    downloadOn: 'Tải về trên',
  },
  footer: {
    description: 'Nền tảng đặt khách sạn thú cưng đã xác minh tại Việt Nam. Kết nối sen với các khách sạn uy tín, được kiểm duyệt.',
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
    madeWith: 'Xây dựng với tình yêu dành cho boss tại Việt Nam 🐾',
  },
  about: {
    metaTitle: 'Về PetZone — Câu Chuyện Của Những Người Yêu Boss',
    metaDescription: 'PetZone ra đời từ nỗi lo của những sen yêu boss. Tìm hiểu sứ mệnh và đội ngũ đằng sau nền tảng đặt khách sạn thú cưng tại HCMC.',
    title: 'Về PetZone',
    storyTitle: 'Câu chuyện của chúng tôi',
    storyText: 'PetZone bắt đầu từ một câu hỏi mà mọi sen đều từng hỏi: "Gửi boss ở đâu cho yên tâm?"\n\nLà những người nuôi thú cưng tại Sài Gòn, chúng tôi hiểu cảm giác lo lắng khi phải xa boss — không biết nơi gửi có uy tín không, boss có được chăm sóc tốt không, giá cả có minh bạch không.\n\nChúng tôi xây dựng PetZone để giải quyết vấn đề đó. Một nền tảng nơi mọi khách sạn đều được xác minh, mọi lần gửi boss đều có ảnh check-in, và mọi sen đều có thể yên tâm.',
    missionTitle: 'Sứ mệnh',
    missionText: 'Xây dựng nền tảng đáng tin cậy nhất để kết nối sen với các khách sạn thú cưng đã được xác minh tại Việt Nam. Bắt đầu từ TP. Hồ Chí Minh — nơi có hàng triệu boss đang cần một nơi an toàn khi sen đi xa.',
    valuesTitle: 'Giá trị cốt lõi',
    values: [
      { icon: '🛡️', text: 'An toàn — Boss luôn được bảo vệ' },
      { icon: '👁️', text: 'Minh bạch — Mọi thứ đều rõ ràng, không phí ẩn' },
      { icon: '❤️', text: 'Yêu thương — Xây dựng bởi những người yêu boss' },
      { icon: '🤝', text: 'Tin cậy — Mọi đối tác đều được xác minh' },
    ],
    diffTitle: 'Tại sao PetZone khác biệt?',
    diffs: [
      { icon: '✅', text: 'Mọi khách sạn đều được xác minh bởi đội ngũ PetZone' },
      { icon: '📸', text: 'Ảnh check-in/check-out có timestamp tại mỗi điểm bàn giao' },
      { icon: '📋', text: 'Báo cáo hàng ngày về tình trạng boss' },
      { icon: '💬', text: 'Chat trực tiếp với khách sạn' },
      { icon: '💰', text: 'Thanh toán an toàn, chính sách hoàn tiền rõ ràng' },
      { icon: '⭐', text: 'Đánh giá thật từ người dùng thật' },
    ],
    teamTitle: 'Đội ngũ',
    teamText: 'PetZone được xây dựng bởi một nhóm bạn yêu thú cưng tại TP. Hồ Chí Minh. Chúng tôi tin rằng mọi boss đều xứng đáng được chăm sóc tốt nhất — và mọi sen đều xứng đáng được yên tâm.',
    hotline: 'Hotline: 19900999',
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
    metaTitle: 'Điều Khoản Sử Dụng — PetZone',
    title: 'Điều khoản sử dụng',
    lastUpdated: 'Cập nhật lần cuối: 12/04/2026',
    sections: [
      { heading: '1. Giới thiệu và Phạm vi', content: 'PetZone là nền tảng công nghệ kết nối chủ nuôi thú cưng ("Chủ nuôi") với các cơ sở lưu trú thú cưng đã được xác minh ("Đối tác") tại Việt Nam. PetZone hoạt động với vai trò trung gian kết nối, không trực tiếp cung cấp dịch vụ lưu trú thú cưng. Bằng việc sử dụng PetZone, bạn đồng ý tuân thủ các điều khoản này.' },
      { heading: '2. Đăng ký Tài khoản', content: 'Bạn phải từ 18 tuổi trở lên để đăng ký. Thông tin đăng ký phải chính xác và đầy đủ. Bạn chịu trách nhiệm bảo mật tài khoản và mật khẩu. Mỗi cá nhân chỉ được đăng ký một tài khoản.' },
      { heading: '3. Vai trò của PetZone', content: 'PetZone cung cấp nền tảng để Chủ nuôi tìm kiếm, so sánh và đặt phòng; Đối tác quản lý listing và nhận đơn; xử lý thanh toán an toàn. PetZone KHÔNG trực tiếp cung cấp dịch vụ lưu trú, không đảm bảo chất lượng dịch vụ của từng Đối tác cụ thể. Việc xác minh Đối tác không phải là bảo đảm tuyệt đối.' },
      { heading: '4. Quy trình Đặt phòng', content: 'Chủ nuôi gửi yêu cầu → Đối tác có 4 giờ để xác nhận hoặc từ chối → Sau khi xác nhận, Chủ nuôi có 24 giờ để thanh toán → Đơn chỉ có hiệu lực sau khi thanh toán thành công. Nếu Đối tác không phản hồi trong 4 giờ hoặc Chủ nuôi không thanh toán trong 24 giờ, đơn tự động hủy.' },
      { heading: '5. Thanh toán và Hoa hồng', content: 'Thanh toán qua MoMo, ZaloPay, VNPay, hoặc chuyển khoản ngân hàng. Tiền được giữ trong escrow cho đến khi dịch vụ hoàn tất. PetZone thu hoa hồng 15% trên mỗi đơn hoàn thành (có thể thay đổi với thông báo trước 30 ngày). Đối tác nhận thanh toán trong 3 ngày làm việc sau hoàn tất dịch vụ.' },
      { heading: '6. Chính sách Hủy và Hoàn tiền', content: 'Mỗi Đối tác có chính sách hủy riêng: Linh hoạt (hoàn 100% trước 48h, 50% trước 24h), Vừa phải (hoàn 100% trước 48h, 25% trước 24h), Nghiêm ngặt (hoàn 50% trước 48h, 0% trong 48h). Nếu Đối tác hủy đơn đã xác nhận, Chủ nuôi được hoàn 100%. Hoàn tiền xử lý trong 5-7 ngày làm việc.' },
      { heading: '7. Trách nhiệm của Chủ nuôi', content: 'Cung cấp thông tin chính xác về thú cưng (giống, tuổi, sức khỏe, vaccine). Đảm bảo thú cưng đã tiêm vaccine đầy đủ. Thông báo tình trạng sức khỏe đặc biệt, dị ứng, thuốc đang dùng. Drop-off và pick-up đúng giờ. Thanh toán đầy đủ và đúng hạn.' },
      { heading: '8. Trách nhiệm của Đối tác', content: 'Duy trì giấy phép kinh doanh hợp lệ. Cung cấp dịch vụ đúng mô tả. Phản hồi yêu cầu đặt phòng trong 4 giờ. Thực hiện photo check-in/check-out có timestamp. Gửi báo cáo hàng ngày nếu Chủ nuôi yêu cầu. Phản hồi chat trong 2 giờ. Liên hệ ngay nếu thú cưng có vấn đề sức khỏe.' },
      { heading: '9. Đánh giá', content: 'Chủ nuôi có thể đánh giá trong 7 ngày sau hoàn tất dịch vụ. Đánh giá phải trung thực, dựa trên trải nghiệm thực tế. Đối tác có quyền phản hồi. PetZone có quyền xóa đánh giá vi phạm (xúc phạm, sai lệch, spam).' },
      { heading: '10. Giải quyết Tranh chấp', content: 'Tranh chấp phải báo cáo trong 7 ngày sau hoàn tất dịch vụ. PetZone xem xét bằng chứng từ cả hai bên (ảnh, báo cáo, chat). PetZone có quyền quyết định hoàn tiền. Các bên vẫn có quyền khiếu nại theo pháp luật Việt Nam.' },
      { heading: '11. Giới hạn Trách nhiệm', content: 'PetZone không chịu trách nhiệm về thiệt hại phát sinh từ dịch vụ của Đối tác. Trách nhiệm tối đa không vượt quá giá trị đơn hàng liên quan. PetZone không chịu trách nhiệm về gián đoạn do lỗi kỹ thuật hoặc sự kiện bất khả kháng.' },
      { heading: '12. Thay đổi và Luật Áp dụng', content: 'PetZone có quyền cập nhật điều khoản với thông báo trước 30 ngày. Điều khoản được điều chỉnh bởi pháp luật Việt Nam. Tranh chấp được giải quyết tại Tòa án có thẩm quyền tại TP. Hồ Chí Minh.' },
      { heading: '13. Liên hệ', content: 'Email: legal@petzone.vn | Hotline: 19900999 | Địa chỉ: TP. Hồ Chí Minh, Việt Nam' },
    ],
  },
  privacyPage: {
    metaTitle: 'Chính Sách Bảo Mật — PetZone',
    title: 'Chính sách bảo mật',
    lastUpdated: 'Cập nhật lần cuối: 12/04/2026',
    sections: [
      { heading: '1. Đơn vị Thu thập Dữ liệu', content: 'PetZone (thuộc Công ty ABU MEO), TP. Hồ Chí Minh, Việt Nam. Email: privacy@petzone.vn | Hotline: 19900999.' },
      { heading: '2. Dữ liệu Chúng tôi Thu thập', content: 'Thông tin bạn cung cấp: họ tên, số điện thoại, email, địa chỉ, thông tin thú cưng (tên, giống, tuổi, sức khỏe, ảnh), nội dung chat, ảnh check-in/check-out. Thông tin tự động: địa chỉ IP, thiết bị, vị trí (khi cho phép), lịch sử tìm kiếm và đặt phòng, cookies. Đối tác: giấy phép kinh doanh, ảnh cơ sở, tài khoản ngân hàng. Lưu ý: PetZone không lưu trữ thông tin thẻ thanh toán — xử lý qua cổng thanh toán bên thứ ba.' },
      { heading: '3. Mục đích Sử dụng', content: 'Tạo và quản lý tài khoản. Xử lý đặt phòng và thanh toán. Kết nối Chủ nuôi với Đối tác. Gửi thông báo đơn hàng, thanh toán, báo cáo. Xác minh danh tính Đối tác. Giải quyết tranh chấp. Cải thiện dịch vụ. Gửi thông tin marketing (chỉ khi có sự đồng ý). Tuân thủ pháp luật.' },
      { heading: '4. Chúng tôi KHÔNG', content: 'Bán dữ liệu cá nhân cho bên thứ ba. Sử dụng dữ liệu ngoài mục đích đã nêu mà không có sự đồng ý. Chia sẻ số điện thoại thật giữa Chủ nuôi và Đối tác (sử dụng cuộc gọi ẩn số).' },
      { heading: '5. Chia sẻ Dữ liệu', content: 'Đối tác khách sạn: tên, thông tin thú cưng, yêu cầu đặc biệt (để thực hiện dịch vụ). Cổng thanh toán (MoMo, ZaloPay, VNPay): thông tin giao dịch. Dịch vụ bản đồ: vị trí ẩn danh. Cơ quan nhà nước: theo yêu cầu pháp luật.' },
      { heading: '6. Bảo mật Dữ liệu', content: 'Mã hóa truyền tải: TLS 1.3. Mã hóa lưu trữ: AES-256. Số điện thoại được mã hóa trong cơ sở dữ liệu. Kiểm soát truy cập theo vai trò. Sao lưu tự động, lưu trữ 30 ngày. Ảnh check-in có timestamp, không thể chỉnh sửa, lưu trữ 90 ngày sau hoàn tất. Chat mã hóa, lưu trữ 12 tháng.' },
      { heading: '7. Thời gian Lưu trữ', content: 'Tài khoản: đến khi hủy + 30 ngày. Lịch sử đặt phòng: 3 năm. Ảnh check-in: 90 ngày sau hoàn tất. Chat: 12 tháng. Dữ liệu thanh toán: 5 năm (theo quy định kế toán). Log hệ thống: 12 tháng. Dữ liệu marketing: đến khi rút đồng ý.' },
      { heading: '8. Quyền của Bạn', content: 'Theo Nghị định 13/2023/NĐ-CP, bạn có quyền: Được biết dữ liệu đang được thu thập. Đồng ý hoặc rút đồng ý. Truy cập bản sao dữ liệu. Yêu cầu chỉnh sửa thông tin sai. Yêu cầu xóa dữ liệu. Hạn chế xử lý. Phản đối marketing. Di chuyển dữ liệu sang nền tảng khác. Liên hệ: privacy@petzone.vn.' },
      { heading: '9. Cookies', content: 'Cookies cần thiết: duy trì đăng nhập, bảo mật. Cookies phân tích: Google Analytics (ẩn danh). Cookies marketing: chỉ với sự đồng ý. Bạn có thể quản lý cookies qua cài đặt trình duyệt.' },
      { heading: '10. Chuyển Dữ liệu Xuyên biên giới', content: 'Dữ liệu có thể được xử lý trên máy chủ ngoài Việt Nam. Việc chuyển dữ liệu tuân thủ Nghị định 13/2023, bao gồm đánh giá tác động và đảm bảo mức bảo vệ tương đương.' },
      { heading: '11. Vi phạm Dữ liệu', content: 'Trong trường hợp vi phạm, PetZone sẽ thông báo cơ quan chức năng trong 72 giờ, thông báo người dùng bị ảnh hưởng, và thực hiện biện pháp khắc phục ngay lập tức.' },
      { heading: '12. Liên hệ', content: 'Email: privacy@petzone.vn | Hotline: 19900999 | Địa chỉ: TP. Hồ Chí Minh, Việt Nam. Nếu không hài lòng, bạn có quyền khiếu nại đến Bộ Công an (Cục An ninh mạng).' },
    ],
  },
  faqPage: {
    metaTitle: 'Câu Hỏi Thường Gặp — PetZone',
    metaDescription: 'Giải đáp mọi thắc mắc về PetZone: cách đặt phòng, thanh toán, hủy đơn, và trở thành đối tác.',
    title: 'Câu hỏi thường gặp',
    subtitle: 'Tìm câu trả lời nhanh cho những thắc mắc phổ biến nhất.',
    ownerLabel: 'Dành cho chủ nuôi',
    providerLabel: 'Dành cho đối tác',
    items: [
      { question: 'PetZone là gì?', answer: 'PetZone là nền tảng giúp bạn tìm và đặt khách sạn thú cưng đã được xác minh tại TP.HCM. Mọi khách sạn trên PetZone đều qua kiểm duyệt giấy phép và cơ sở vật chất.', category: 'owner' },
      { question: 'Boss cần chuẩn bị gì trước khi gửi?', answer: 'Sổ tiêm chủng đầy đủ (bắt buộc), đồ dùng quen thuộc (chăn, đồ chơi), thông tin sức khỏe đặc biệt (dị ứng, thuốc), và số điện thoại liên hệ khẩn cấp.', category: 'owner' },
      { question: 'Quy trình đặt phòng như thế nào?', answer: 'Tìm khách sạn gần bạn → Chọn ngày và dịch vụ → Gửi yêu cầu → Khách sạn xác nhận trong 4 giờ → Thanh toán → Drop-off boss với ảnh check-in.', category: 'owner' },
      { question: 'Khi nào tôi cần thanh toán?', answer: 'Bạn chỉ thanh toán sau khi khách sạn xác nhận đơn đặt phòng. Nếu khách sạn không xác nhận trong 4 giờ, đơn tự động hủy và bạn không mất phí.', category: 'owner' },
      { question: 'Tôi có thể hủy đơn không?', answer: 'Có. Chính sách hủy tùy thuộc vào khách sạn (linh hoạt, vừa phải, hoặc nghiêm ngặt). Chi tiết chính sách hủy và mức hoàn tiền hiển thị rõ trước khi bạn đặt.', category: 'owner' },
      { question: 'Làm sao tôi biết boss đang được chăm sóc tốt?', answer: 'Bạn nhận ảnh check-in có timestamp khi drop-off, báo cáo hàng ngày với ảnh và cập nhật sức khỏe, và có thể chat trực tiếp với khách sạn bất cứ lúc nào.', category: 'owner' },
      { question: 'Nếu boss bị ốm hoặc có vấn đề thì sao?', answer: 'Khách sạn sẽ liên hệ bạn ngay lập tức qua app. Trong trường hợp khẩn cấp, đội ngũ PetZone hỗ trợ điều phối. Tiền thanh toán được giữ trong escrow cho đến khi dịch vụ hoàn tất.', category: 'owner' },
      { question: 'PetZone có ở thành phố tôi không?', answer: 'Hiện tại PetZone hoạt động tại TP. Hồ Chí Minh. Chúng tôi đang mở rộng sang Hà Nội và Đà Nẵng trong thời gian tới.', category: 'owner' },
      { question: 'Làm sao để trở thành đối tác PetZone?', answer: 'Đăng ký trên app hoặc website → Upload giấy phép kinh doanh và ảnh cơ sở (tối thiểu 5 ảnh) → Đội ngũ PetZone xác minh trong 48 giờ → Thiết lập hồ sơ và bắt đầu nhận đơn.', category: 'provider' },
      { question: 'Phí hoa hồng là bao nhiêu?', answer: '15% trên mỗi đơn hàng hoàn thành. Không phí đăng ký, không phí duy trì hàng tháng. Ưu đãi ra mắt: 0% hoa hồng trong 3 tháng đầu tiên cho đối tác mới.', category: 'provider' },
      { question: 'Tôi nhận thanh toán khi nào?', answer: 'Sau khi dịch vụ hoàn tất và boss được trả về cho chủ nuôi. Tiền được chuyển vào tài khoản ngân hàng của bạn sau khi trừ hoa hồng.', category: 'provider' },
      { question: 'Tôi có thể từ chối đơn đặt phòng không?', answer: 'Có, nhưng cần nêu lý do rõ ràng. Nếu không phản hồi trong 4 giờ, đơn tự động hủy. Tỷ lệ từ chối cao sẽ ảnh hưởng đến thứ hạng hiển thị của bạn trên PetZone.', category: 'provider' },
    ],
  },
}

export default vi
