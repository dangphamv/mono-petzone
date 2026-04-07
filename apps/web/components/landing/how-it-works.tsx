export function HowItWorks() {
  const steps = [
    { step: '1', title: 'Tìm kiếm', description: 'Nhập địa điểm, ngày và loại thú cưng để tìm khách sạn phù hợp' },
    { step: '2', title: 'Đặt phòng', description: 'Chọn phòng, dịch vụ thêm và hoàn tất thanh toán' },
    { step: '3', title: 'Check-in', description: 'Gửi bé yêu với ảnh check-in xác nhận tình trạng' },
    { step: '4', title: 'Theo dõi', description: 'Nhận báo cáo hàng ngày và đón bé về khi hoàn tất' },
  ]

  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="text-center font-heading text-3xl font-bold text-text">
          Cách hoạt động
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-4">
          {steps.map((s) => (
            <div key={s.step} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                {s.step}
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold text-text">{s.title}</h3>
              <p className="mt-2 text-sm text-text-secondary">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
