import { Building2, Heart, Star, TrendingUp } from 'lucide-react'

const stats = [
  { value: '500+', label: 'Khách sạn đối tác', icon: Building2 },
  { value: '10,000+', label: 'Thú cưng đã phục vụ', icon: Heart },
  { value: '4.8/5', label: 'Đánh giá trung bình', icon: Star },
  { value: '98%', label: 'Tỷ lệ hài lòng', icon: TrendingUp },
]

export function Stats() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-dark to-primary p-px shadow-2xl shadow-primary/20">
          <div className="rounded-3xl bg-gradient-to-br from-primary/95 via-primary-dark/95 to-primary/90 px-8 py-16 backdrop-blur-sm md:px-16">
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="group text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/25">
                    <s.icon className="h-6 w-6 text-white/90" strokeWidth={1.8} />
                  </div>
                  <div className="font-heading text-4xl font-bold text-white md:text-5xl">{s.value}</div>
                  <div className="mt-2 text-sm font-medium text-white/70">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
