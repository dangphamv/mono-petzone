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
}

export default vi
