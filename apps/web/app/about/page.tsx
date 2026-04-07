import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Về chúng tôi',
  description: 'Tìm hiểu về PetZone - nền tảng đặt khách sạn thú cưng hàng đầu Việt Nam',
}

export default function AboutPage() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="font-heading text-4xl font-bold text-text">Về PetZone</h1>
        <p className="mt-6 text-lg text-text-secondary">
          PetZone ra đời với sứ mệnh trở thành nền tảng đáng tin cậy nhất để chủ nuôi tìm kiếm
          và đặt dịch vụ lưu trú cho thú cưng tại Việt Nam.
        </p>
        <p className="mt-4 text-text-secondary">
          Chúng tôi kết nối chủ nuôi với các khách sạn thú cưng đã được xác minh,
          đảm bảo mọi thú cưng đều được chăm sóc an toàn và minh bạch.
        </p>
      </div>
    </section>
  )
}
