import { Search, Zap, Camera, Star } from 'lucide-react'

const features = [
  {
    title: 'Tìm kiếm thông minh',
    description: 'Tìm khách sạn thú cưng gần bạn với bộ lọc địa điểm, dịch vụ và đánh giá từ cộng đồng.',
    icon: Search,
    gradient: 'from-primary/20 to-primary/5',
    iconColor: 'text-primary',
  },
  {
    title: 'Đặt phòng nhanh chóng',
    description: 'Đặt phòng chỉ trong vài phút với thanh toán an toàn qua MoMo, ZaloPay và ngân hàng.',
    icon: Zap,
    gradient: 'from-secondary/20 to-secondary/5',
    iconColor: 'text-secondary-dark',
  },
  {
    title: 'Theo dõi thời gian thực',
    description: 'Nhận ảnh check-in và báo cáo hàng ngày về tình trạng sức khỏe của bé yêu.',
    icon: Camera,
    gradient: 'from-primary/15 to-secondary/10',
    iconColor: 'text-primary-dark',
  },
  {
    title: 'Đánh giá minh bạch',
    description: 'Hệ thống đánh giá đa chiều từ cộng đồng giúp bạn chọn nơi tốt nhất cho thú cưng.',
    icon: Star,
    gradient: 'from-secondary/15 to-primary/10',
    iconColor: 'text-secondary',
  },
]

export function Features() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">Tính năng nổi bật</span>
          <h2 className="mt-3 font-heading text-3xl font-bold text-text md:text-4xl lg:text-5xl">
            Tại sao chọn <span className="text-primary">PetZone</span>?
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Nền tảng được thiết kế dành riêng cho những người yêu thú cưng tại Việt Nam.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="glass-card group cursor-default rounded-2xl p-8 text-center transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${f.gradient} transition-transform duration-300 group-hover:scale-110`}>
                <f.icon className={`h-7 w-7 ${f.iconColor}`} strokeWidth={2} />
              </div>
              <h3 className="mt-6 font-heading text-lg font-bold text-text">{f.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
