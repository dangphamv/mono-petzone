import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bảng giá',
  description: 'Mô hình hoa hồng minh bạch của PetZone',
}

export default function PricingPage() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="font-heading text-4xl font-bold text-text">Bảng giá</h1>
        <p className="mt-6 text-lg text-text-secondary">
          PetZone hoạt động theo mô hình hoa hồng minh bạch. Không phí ẩn.
        </p>
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-8">
          <h3 className="font-heading text-2xl font-semibold text-primary">Hoa hồng 15%</h3>
          <p className="mt-2 text-text-secondary">
            Chỉ tính trên mỗi đơn hàng hoàn thành. Không phí đăng ký, không phí duy trì.
          </p>
        </div>
      </div>
    </section>
  )
}
