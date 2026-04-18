export interface Dictionary {
  metadata: { title: string; description: string }
  header: { about: string; forProviders: string; pricing: string; contact: string; faq: string; blog: string; download: string }
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
  blogPage: {
    metaTitle: string; metaDescription: string; title: string; subtitle: string
    readMore: string; minRead: string; fullArticlePlaceholder: string
    posts: readonly { slug: string; title: string; excerpt: string; date: string; readTime: string; category: string; body: readonly string[] }[]
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
    blog: 'Blog',
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
    title: 'Điều khoản sử dụng — PetZone',
    lastUpdated: 'Cập nhật lần cuối: 12/04/2026 | Đơn vị vận hành: PetZone (Công ty ABU MEO), TP. Hồ Chí Minh, Việt Nam | Liên hệ: hello@petzone.vn | Hotline: 19900999',
    sections: [
      { heading: '1. Định nghĩa', content: '"PetZone": nền tảng công nghệ kết nối Chủ nuôi và Đối tác. "Chủ nuôi": cá nhân/tổ chức đặt dịch vụ lưu trú cho thú cưng. "Đối tác": cơ sở lưu trú thú cưng được PetZone xác minh. "Đơn": yêu cầu/đặt phòng đã được xác nhận và thanh toán trên PetZone.' },
      { heading: '2. Chấp nhận điều khoản', content: 'Khi tạo tài khoản hoặc thực hiện bất kỳ hành động nào trên PetZone (gửi yêu cầu, thanh toán, chat, đánh giá), bạn xác nhận đã đọc và đồng ý bị ràng buộc bởi Điều khoản này và Chính sách bảo mật.' },
      { heading: '3. Phạm vi và vai trò của PetZone', content: 'PetZone là bên trung gian kết nối, cung cấp hạ tầng đặt phòng, thanh toán và hỗ trợ tranh chấp; PetZone không trực tiếp cung cấp dịch vụ lưu trú, chăm sóc, thú y hay vận chuyển thú cưng. Việc "xác minh" Đối tác chỉ mang tính xác nhận thông tin và quy trình nội bộ, không phải là bảo đảm tuyệt đối về chất lượng dịch vụ, an toàn, hay tính hợp pháp của Đối tác.' },
      { heading: '4. Đăng ký và quản lý tài khoản', content: 'Bạn phải từ 18 tuổi trở lên và chịu trách nhiệm về thông tin đã cung cấp. Bạn chịu trách nhiệm bảo mật thông tin đăng nhập; mọi hành động từ tài khoản của bạn được xem là do bạn thực hiện. PetZone có quyền tạm khóa hoặc chấm dứt tài khoản khi phát hiện gian lận, vi phạm, lừa đảo, hoặc hành vi gây hại cho cộng đồng.' },
      { heading: '5. Quy trình đặt phòng và hình thành hợp đồng', content: 'Chủ nuôi gửi yêu cầu → Đối tác có 4 giờ để xác nhận hoặc từ chối. Sau khi Đối tác xác nhận, Chủ nuôi có 24 giờ để thanh toán đầy đủ. Đơn chỉ có hiệu lực khi thanh toán thành công. Nếu hết thời hạn trên, hệ thống tự hủy. Hợp đồng giữa Chủ nuôi và Đối tác được hình thành theo các điều khoản tại thời điểm đặt và thông tin trên listing của Đối tác.' },
      { heading: '6. Thanh toán, escrow và phí', content: 'Thanh toán qua MoMo, ZaloPay, VNPay hoặc chuyển khoản ngân hàng. Tiền được giữ trong escrow tới khi dịch vụ hoàn tất và không phát sinh tranh chấp chưa xử lý. PetZone thu hoa hồng 15% trên mỗi đơn hoàn thành (có thể thay đổi với thông báo trước 30 ngày qua email/app/website). Đối tác nhận thanh toán trong vòng 3 ngày làm việc sau khi dịch vụ được xác nhận hoàn tất. Bạn đồng ý không thực hiện giao dịch "off-platform" nhằm né thanh toán/hoa hồng; PetZone có quyền xử lý vi phạm theo mục 4.' },
      { heading: '7. Chính sách hủy và hoàn tiền', content: 'Đối tác chọn 1 trong các chính sách hủy (Linh hoạt / Vừa phải / Nghiêm ngặt) hiển thị trên listing; chính sách áp dụng theo thời điểm đặt. Nếu Đối tác hủy sau khi xác nhận: Chủ nuôi được hoàn 100%. Hoàn tiền xử lý 5–7 ngày làm việc (tùy kênh thanh toán). Phí từ cổng thanh toán (nếu có) được trừ theo điều kiện của đối tác thanh toán.' },
      { heading: '8. An toàn thú cưng và trách nhiệm của Chủ nuôi', content: 'Cung cấp thông tin chính xác về thú cưng: giống, tuổi, sức khỏe, vaccine, dị ứng, thuốc. Đảm bảo thú cưng tiêm vaccine đầy đủ theo yêu cầu listing/Đối tác. Chịu trách nhiệm về thiệt hại do thú cưng gây ra cho tài sản/nhân sự Đối tác (nếu có). Drop-off/pick-up đúng giờ; tuân thủ quy trình bàn giao (ảnh, ký xác nhận, biên bản). Trường hợp khẩn cấp sức khỏe: Đối tác được phép đưa thú cưng đi thú y theo chính sách đã công bố; Chủ nuôi thanh toán chi phí thực tế nếu cần.' },
      { heading: '9. Trách nhiệm của Đối tác', content: 'Duy trì giấy phép/điều kiện kinh doanh hợp lệ; cung cấp dịch vụ đúng mô tả; không đăng thông tin sai lệch. Phản hồi yêu cầu trong 4 giờ; chat SLA 2 giờ trong khung giờ hoạt động công bố. Thực hiện check-in/check-out có bằng chứng và timestamp theo yêu cầu hệ thống; gửi báo cáo nếu Chủ nuôi yêu cầu. Chủ động liên hệ PetZone và Chủ nuôi khi thú cưng có vấn đề sức khỏe, sự cố hoặc thay đổi lớn so với mô tả dịch vụ.' },
      { heading: '10. Hành vi bị cấm', content: 'Giao dịch "off-platform" nhằm né thanh toán/hoa hồng. Đăng thông tin sai lệch, gian lận, lừa đảo. Quấy rối, đe dọa, xúc phạm người dùng khác. Sử dụng PetZone cho mục đích bất hợp pháp. Tạo nhiều tài khoản để lạm dụng ưu đãi. Vi phạm sẽ dẫn đến tạm khóa hoặc chấm dứt tài khoản vĩnh viễn.' },
      { heading: '11. Đánh giá và xử lý nội dung', content: 'Chủ nuôi có thể đánh giá trong 7 ngày sau hoàn tất dịch vụ; đánh giá phải trung thực, dựa trên trải nghiệm thực tế. Đối tác có quyền phản hồi. PetZone có quyền gỡ đánh giá/nội dung vi phạm pháp luật, xúc phạm, sai lệch, spam, quảng cáo, hoặc phát tán thông tin cá nhân.' },
      { heading: '12. Quy trình tiếp nhận và xử lý khiếu nại', content: 'Gửi khiếu nại qua app/web hoặc email support@petzone.vn với: mã đơn, mô tả sự cố, bằng chứng (ảnh, báo cáo, lịch sử chat). SLA: PetZone xác nhận tiếp nhận trong 24 giờ làm việc; xử lý và phản hồi kết quả tạm thời trong 3 ngày làm việc (hoặc thông báo nếu cần thêm thời gian). Cơ chế: thương lượng → hòa giải qua PetZone → trọng tài/tòa án theo pháp luật Việt Nam. PetZone có quyền tạm giữ thanh toán trong escrow để xử lý tranh chấp.' },
      { heading: '13. Giới hạn trách nhiệm', content: 'PetZone không chịu trách nhiệm cho hành vi/thiếu sót của Đối tác. Trách nhiệm tối đa của PetZone (nếu có) không vượt quá giá trị đơn liên quan. PetZone không chịu trách nhiệm cho gián đoạn do lỗi kỹ thuật, bảo trì, hoặc sự kiện bất khả kháng.' },
      { heading: '14. Sở hữu trí tuệ', content: 'PetZone và logo thuộc sở hữu của PetZone; bạn không được sử dụng nếu không có văn bản chấp thuận. Bằng việc đăng nội dung (ảnh, mô tả), bạn cấp cho PetZone quyền không độc quyền sử dụng để vận hành, quảng bá dịch vụ (trong phạm vi pháp luật cho phép). Bạn cam kết nội dung không vi phạm bản quyền, quyền cá nhân, hoặc pháp luật Việt Nam.' },
      { heading: '15. Chính sách bảo mật và dữ liệu', content: 'Việc thu thập và xử lý dữ liệu tuân theo Chính sách bảo mật của PetZone. PetZone áp dụng quy định bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP và các quy định hiện hành. Bạn có quyền được thông báo, truy cập, chỉnh sửa, xóa, rút đồng ý; PetZone cung cấp cơ chế để thực hiện các quyền này.' },
      { heading: '16. Thay đổi điều khoản', content: 'PetZone có quyền cập nhật Điều khoản với thông báo trước 30 ngày (qua email/app/website). Việc bạn tiếp tục sử dụng PetZone sau thời gian thông báo được xem là chấp nhận Điều khoản mới. Các điều khoản về sở hữu trí tuệ, giới hạn trách nhiệm, và giải quyết tranh chấp vẫn có hiệu lực sau khi chấm dứt tài khoản.' },
      { heading: '17. Luật áp dụng và giải quyết tranh chấp', content: 'Điều khoản này chịu sự điều chỉnh bởi pháp luật Việt Nam. Tranh chấp (nếu không hòa giải) giải quyết tại Tòa án có thẩm quyền tại TP. Hồ Chí Minh.' },
      { heading: '18. Liên hệ', content: 'Hỗ trợ chung: hello@petzone.vn | Khiếu nại: support@petzone.vn | Pháp lý: legal@petzone.vn | Hotline: 19900999 | Địa chỉ: TP. Hồ Chí Minh, Việt Nam' },
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
  blogPage: {
    metaTitle: 'Blog — PetZone',
    metaDescription: 'Mẹo chăm sóc thú cưng, hướng dẫn gửi boss đi khách sạn, và tin tức từ PetZone.',
    title: 'Blog PetZone',
    subtitle: 'Mẹo chăm sóc boss, hướng dẫn gửi thú cưng, và tin tức mới nhất.',
    readMore: 'Đọc tiếp',
    minRead: 'phút đọc',
    fullArticlePlaceholder: '',
    posts: [
      {
        slug: 'cach-chon-khach-san-thu-cung-uy-tin',
        title: 'Cách chọn khách sạn thú cưng uy tín tại HCMC',
        excerpt: 'Gửi boss đi khách sạn lần đầu? Đây là 6 tiêu chí giúp bạn chọn nơi tốt nhất — từ giấy phép, đánh giá, đến quy trình báo cáo hàng ngày.',
        date: '2026-04-15',
        readTime: '5',
        category: 'Hướng dẫn',
        body: [
          'Gửi boss đi khách sạn lần đầu? Bạn không đơn độc.\n\nHàng nghìn sen tại Sài Gòn cũng từng lo lắng y như vậy. Một nghiên cứu năm 2021 trên tạp chí Nature Scientific Reports cho thấy 50-80% chó có biểu hiện stress khi xa chủ: sủa nhiều, bỏ ăn, đi vệ sinh không đúng chỗ. Nhưng chọn đúng khách sạn giảm được phần lớn tình trạng này. Dưới đây là 6 tiêu chí giúp bạn chọn nơi gửi boss tốt nhất.',
          '1. Giấy phép kinh doanh: hỏi thẳng, không ngại\n\nBước đầu tiên, cũng là bước quan trọng nhất. Khách sạn thú cưng hợp pháp tại Việt Nam cần giấy phép kinh doanh do Sở Kế hoạch và Đầu tư cấp. Hỏi trực tiếp. Nơi uy tín sẽ sẵn sàng cho bạn xem. Kiểm tra thêm trên Google Maps xem có địa chỉ cố định, số điện thoại, và đánh giá không. Nếu khách sạn từ chối cho xem giấy phép hoặc không có địa chỉ cố định? Tìm nơi khác.',
          '2. Đến tận nơi, nhìn tận mắt\n\nẢnh trên mạng có thể đẹp. Thực tế có thể khác. Không có gì thay thế được việc đến thăm cơ sở trước khi đặt. Khi đến, chú ý: Mùi — sạch sẽ, không hôi nồng nặc. Không gian — phòng đủ rộng để boss đứng, xoay người, nằm thoải mái (tối thiểu 1.5m² cho chó trung bình). Ánh sáng và thông gió — có cửa sổ hoặc hệ thống thông gió, có điều hòa. Ở HCMC, điều hòa là bắt buộc. Khu vực chơi — có sân chơi riêng hoặc khu vận động ngoài trời.',
          '3. Bao nhiêu nhân viên cho bao nhiêu boss?\n\nYếu tố này nhiều sen bỏ qua. Nhưng nó quan trọng. Một nghiên cứu trên tạp chí Applied Animal Behaviour Science đo mức cortisol (hormone stress) ở chó trong các cơ sở lưu trú. Kết quả: chó được chăm sóc với tỷ lệ nhân viên/chó thấp có mức cortisol thấp hơn rõ rệt. Tỷ lệ lý tưởng: 1 nhân viên cho 10-15 chó ban ngày, 1 cho 20-30 ban đêm. Với mèo: 1 cho 15-20. Hỏi thẳng: "Có bao nhiêu nhân viên chăm sóc vào ban đêm?" Nếu câu trả lời là "không có ai," bạn nên lo.',
          '4. Vaccine: không có thì không nhận\n\nKhách sạn uy tín sẽ yêu cầu bằng chứng tiêm vaccine trước khi nhận boss. Nếu họ không hỏi, đó là dấu hiệu họ không quan tâm đến sức khỏe cộng đồng thú cưng. Chó cần: vaccine 5 bệnh (DHPPL) và vaccine dại. Mèo cần: vaccine 3 bệnh (FVRCP) và vaccine dại. Vaccine cần tiêm ít nhất 2 tuần trước khi gửi để có hiệu lực. WOAH xếp Việt Nam vào nhóm quốc gia có nguy cơ cao về bệnh dại.',
          '5. Họ có gửi ảnh boss cho bạn mỗi ngày không?\n\nMột khảo sát từ tạp chí Veterinary Record cho thấy chủ nuôi nhận cập nhật thường xuyên về thú cưng trong thời gian gửi có mức lo lắng thấp hơn 60% so với những người không nhận được gì. Khách sạn tốt sẽ gửi ảnh hoặc video boss hàng ngày, có kênh liên lạc trực tiếp, thông báo ngay nếu boss có vấn đề sức khỏe, và có quy trình xử lý khẩn cấp rõ ràng. Câu hỏi bạn nên hỏi: "Nếu boss bị ốm lúc 2 giờ sáng, quy trình xử lý như thế nào?"',
          '6. Đánh giá online: đọc kỹ, đừng chỉ đếm sao\n\nĐánh giá online là nguồn thông tin quý, nhưng cần biết cách đọc. Đánh giá đáng tin có ảnh thật kèm theo, mô tả chi tiết trải nghiệm cụ thể, có cả tích cực lẫn tiêu cực, và khách sạn phản hồi đánh giá tiêu cực một cách chuyên nghiệp. Cảnh giác với đánh giá toàn 5 sao không có nội dung, nhiều đánh giá trong cùng một ngày, hoặc không có ảnh thật nào.',
          'Checklist nhanh trước khi quyết định: Có giấy phép kinh doanh hợp lệ. Cơ sở sạch sẽ, thoáng mát, đủ không gian. Tỷ lệ nhân viên/thú cưng hợp lý. Yêu cầu vaccine trước khi nhận. Có quy trình báo cáo và liên lạc rõ ràng. Có đánh giá tốt từ khách hàng thật. Đảm bảo khách sạn đáp ứng ít nhất 5/6 tiêu chí.',
          'PetZone giúp bạn bỏ qua bước kiểm tra thủ công. Mọi khách sạn trên nền tảng đã được xác minh giấy phép, kiểm tra cơ sở, và có hệ thống ảnh check-in, báo cáo hàng ngày, chat trực tiếp tích hợp sẵn.',
        ],
      },
      {
        slug: 'checklist-gui-boss-di-khach-san',
        title: 'Checklist chuẩn bị cho boss trước khi gửi khách sạn',
        excerpt: 'Sổ tiêm chủng, đồ dùng quen thuộc, thông tin sức khỏe — đừng quên 5 điều quan trọng này trước khi drop-off boss.',
        date: '2026-04-14',
        readTime: '3',
        category: 'Mẹo hay',
        body: [
          'Bạn đã chọn được khách sạn uy tín, đặt phòng xong, ngày drop-off đang đến gần. Nhưng khoan. Bạn đã chuẩn bị đủ chưa?\n\nMình từng thấy sen quên mang sổ vaccine rồi phải quay về lấy. Có sen không báo cho khách sạn biết boss bị dị ứng gà. Kết quả? Boss bị tiêu chảy ngày đầu tiên. Đây là 7 điều bạn cần chuẩn bị, dựa trên khuyến nghị từ bác sĩ thú y và kinh nghiệm thực tế.',
          '1. Sổ tiêm chủng (bắt buộc, không có không nhận)\n\nThứ quan trọng nhất. Hầu hết khách sạn thú cưng tại HCMC yêu cầu boss phải tiêm đầy đủ vaccine. Chó cần vaccine 5 bệnh (DHPPL) và vaccine dại. Mèo cần vaccine 3 bệnh (FVRCP) và vaccine dại. Một điều nhiều sen không biết: vaccine cần ít nhất 14 ngày để cơ thể boss tạo đủ kháng thể. Tiêm hôm nay, gửi ngày mai là chưa có tác dụng.',
          '2. Đồ dùng quen thuộc (giảm stress thật sự)\n\nĐây không phải mẹo vặt. Có khoa học đằng sau. Một nghiên cứu từ Đại học Bristol (Anh) đo mức cortisol ở chó trong môi trường mới. Chó có đồ vật quen thuộc từ nhà có mức cortisol thấp hơn 30% so với chó không có. Nên mang: chăn hoặc áo cũ có mùi của bạn, 1-2 đồ chơi yêu thích, bát ăn riêng nếu boss kén ăn. Không nên mang: đồ chơi có phần nhỏ dễ nuốt, dây thừng dài, đồ có giá trị cao.',
          '3. Thông tin sức khỏe đặc biệt (viết ra giấy, đừng chỉ nói miệng)\n\nĐiều nhiều sen quên nhất. Bạn cần thông báo cho khách sạn: dị ứng thức ăn hoặc môi trường, thuốc đang uống (tên thuốc, liều lượng, giờ uống), bệnh mãn tính, hành vi đặc biệt (sợ tiếng ồn lớn, hung dữ với chó lạ, hay cắn khi sợ). Viết tất cả ra giấy hoặc ghi chú trên điện thoại. Nhân viên tiếp nhận có thể quên nếu bạn chỉ nói miệng lúc drop-off.',
          '4. Thức ăn quen thuộc (đừng để boss đau bụng ngày đầu)\n\nThay đổi thức ăn đột ngột gây rối loạn tiêu hóa. AVMA khuyến nghị chuyển đổi thức ăn từ từ trong 7-10 ngày. Gửi boss 2-3 ngày mà đổi thức ăn hoàn toàn? Công thức cho tiêu chảy. Mang theo đủ thức ăn cho toàn bộ thời gian gửi cộng 1 ngày dự phòng. Chia sẵn theo bữa trong túi zip riêng. Ghi rõ lượng mỗi bữa.',
          '5. Hai số điện thoại liên hệ khẩn cấp\n\nNgoài số của bạn, cung cấp thêm số của 1 người thân có thể liên hệ nếu bạn không nghe máy, và số bác sĩ thú y quen của boss. Tại sao cần số thứ hai? Vì bạn có thể đang trên máy bay, trong cuộc họp, hoặc ở nơi không có sóng. Trong trường hợp khẩn cấp, khách sạn cần liên hệ được ai đó ngay lập tức. 15 phút chờ đợi có thể là quá lâu.',
          '6. Tập cho boss quen dần (nếu lần đầu)\n\nĐừng đợi đến ngày gửi mới bắt đầu. Royal Veterinary College (Anh) công bố nghiên cứu năm 2025 cho thấy chó được tập quen dần với việc xa chủ có biểu hiện stress ít hơn rõ rệt. 1-2 tuần trước: để boss ở nhà một mình 1-2 giờ mỗi ngày. 1 tuần trước: nếu có thể, đưa boss đến khách sạn thăm 30 phút. Ngày gửi: giữ bình tĩnh khi drop-off. Boss cảm nhận được cảm xúc của bạn.',
          '7. Kiểm tra lại thông tin đặt phòng\n\nTrước ngày drop-off, xác nhận lại: ngày check-in và check-out, giờ drop-off và pick-up, dịch vụ thêm đã đặt (tắm, cắt tỉa, cho uống thuốc), chính sách hủy và phí phát sinh nếu pick-up muộn.',
          'Với PetZone, bạn gửi tất cả thông tin sức khỏe và yêu cầu đặc biệt ngay trong app khi đặt phòng. Khách sạn nhận được đầy đủ trước khi boss đến.',
        ],
      },
      {
        slug: '5-sai-lam-khi-gui-thu-cung-lan-dau',
        title: '5 sai lầm phổ biến khi gửi thú cưng lần đầu',
        excerpt: 'Nhiều sen mắc những lỗi này khi gửi boss lần đầu — từ quên sổ vaccine đến không kiểm tra cơ sở trước. Đọc để tránh nhé!',
        date: '2026-04-13',
        readTime: '4',
        category: 'Mẹo hay',
        body: [
          'Gửi boss đi khách sạn lần đầu là trải nghiệm đầy lo lắng. Cho cả sen lẫn boss.\n\nVà thật không may, nhiều sen mắc những sai lầm có thể tránh được. Mình tổng hợp 5 sai lầm phổ biến nhất, dựa trên dữ liệu từ các khách sạn thú cưng và nghiên cứu về hành vi động vật.',
          'Sai lầm 1: Chọn khách sạn chỉ qua ảnh trên mạng\n\nSai lầm phổ biến nhất. Nhiều sen chọn nơi gửi boss chỉ dựa trên ảnh đẹp trên Facebook hoặc giá rẻ, mà không đến tận nơi kiểm tra. Ảnh trên mạng có thể đã cũ hoặc được chỉnh sửa. Một khảo sát từ Whole Dog Journal cho thấy 40% chủ nuôi không hài lòng với dịch vụ boarding đã không thăm cơ sở trước khi đặt. Cách tránh: luôn đến thăm ít nhất 1 lần. Chú ý mùi, tiếng ồn, ánh sáng, cách nhân viên đối xử với thú cưng.',
          'Sai lầm 2: Quên mang sổ tiêm chủng\n\nBạn sẽ ngạc nhiên khi biết có bao nhiêu sen đến drop-off mà quên mang sổ vaccine. Kết quả: khách sạn từ chối nhận boss, kế hoạch đi công tác bị ảnh hưởng. WOAH xếp Việt Nam vào nhóm quốc gia có nguy cơ cao về bệnh dại. Trong môi trường khách sạn, nơi nhiều thú cưng ở cùng nhau, nguy cơ lây bệnh cao hơn bình thường. Cách tránh: kiểm tra sổ vaccine 1 tuần trước ngày gửi. Chụp ảnh sổ vaccine lưu trên điện thoại làm bản dự phòng.',
          'Sai lầm 3: Không thông báo tình trạng sức khỏe đặc biệt\n\n"Boss nhà mình khỏe mạnh, không cần nói gì." Suy nghĩ này nguy hiểm. Hậu quả thực tế: boss bị dị ứng gà mà khách sạn cho ăn thức ăn có gà, kết quả nôn mửa và tiêu chảy. Boss đang uống thuốc tim mà không ai cho uống, bệnh tái phát. Boss sợ chó lớn mà bị xếp chung khu vực, stress nặng. Cách tránh: viết ra giấy tất cả thông tin sức khỏe. Gửi cho khách sạn trước ngày drop-off.',
          'Sai lầm 4: Chia tay boss quá "kịch tính"\n\nSai lầm mà hầu hết sen đều mắc vì yêu boss quá nhiều. Bạn ôm boss, khóc, nói "mẹ xin lỗi con," rồi quay đi quay lại 5 lần trước khi rời đi. Một nghiên cứu năm 2021 trên tạp chí Nature Scientific Reports cho thấy chó đọc cảm xúc của chủ rất tốt. Khi bạn lo lắng và buồn, boss cảm nhận được và cũng trở nên lo lắng. Cách tránh: giữ bình tĩnh và tự tin khi drop-off. Nói lời tạm biệt ngắn gọn, vui vẻ. Không quay lại sau khi đã đi.',
          'Sai lầm 5: Không hỏi về quy trình khẩn cấp\n\n"Nếu boss bị ốm lúc 2 giờ sáng, ai sẽ xử lý?" Nếu bạn không hỏi câu này trước khi gửi, bạn đang mạo hiểm. Bốn câu hỏi cần hỏi: "Có nhân viên trực ban đêm không?" "Nếu boss cần đi bác sĩ thú y khẩn cấp, quy trình như thế nào?" "Ai quyết định đưa boss đi bệnh viện?" "Chi phí thú y khẩn cấp ai chịu?" Hỏi trước khi đặt phòng, không phải lúc drop-off.',
          'Tóm tắt: Chọn qua ảnh, không đến thăm → Đến tận nơi ít nhất 1 lần. Quên sổ vaccine → Kiểm tra 1 tuần trước, chụp ảnh dự phòng. Không báo sức khỏe đặc biệt → Viết ra giấy, gửi trước cho khách sạn. Chia tay quá kịch tính → Bình tĩnh, ngắn gọn, không quay lại. Không hỏi quy trình khẩn cấp → Hỏi trước khi đặt, không phải lúc drop-off.',
          'PetZone giúp bạn tránh hầu hết các sai lầm này. Khách sạn đã được xác minh, thông tin sức khỏe gửi qua app, ảnh check-in có timestamp, chat trực tiếp với khách sạn bất cứ lúc nào.',
        ],
      },
    ],
  },
}

export default vi
