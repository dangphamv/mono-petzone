import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dành cho đối tác',
  description: 'Trở thành đối tác PetZone và tiếp cận hàng nghìn khách hàng tiềm năng',
}

export default function ForProvidersPage() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="font-heading text-4xl font-bold text-text">Dành cho đối tác</h1>
        <p className="mt-6 text-lg text-text-secondary">
          Tham gia PetZone để tiếp cận hàng nghìn chủ nuôi đang tìm kiếm dịch vụ lưu trú
          chất lượng cho thú cưng.
        </p>
        <div className="mt-8 space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="font-heading text-lg font-semibold">Quản lý dễ dàng</h3>
            <p className="mt-2 text-text-secondary">Quản lý phòng, lịch, đơn hàng từ ứng dụng di động</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="font-heading text-lg font-semibold">Thanh toán minh bạch</h3>
            <p className="mt-2 text-text-secondary">Theo dõi doanh thu và nhận thanh toán định kỳ</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="font-heading text-lg font-semibold">Hỗ trợ 24/7</h3>
            <p className="mt-2 text-text-secondary">Đội ngũ hỗ trợ luôn sẵn sàng giúp đỡ bạn</p>
          </div>
        </div>
      </div>
    </section>
  )
}
