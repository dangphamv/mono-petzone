export function Features() {
  const features = [
    { title: 'Tìm kiếm thông minh', description: 'Tìm khách sạn thú cưng gần bạn với bộ lọc đa dạng', icon: '🔍' },
    { title: 'Đặt phòng nhanh chóng', description: 'Đặt phòng chỉ trong vài phút với thanh toán an toàn', icon: '⚡' },
    { title: 'Theo dõi thời gian thực', description: 'Nhận ảnh check-in và báo cáo hàng ngày về bé yêu', icon: '📸' },
    { title: 'Đánh giá minh bạch', description: 'Hệ thống đánh giá đa chiều từ cộng đồng', icon: '⭐' },
  ]

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="text-center font-heading text-3xl font-bold text-text">
          Tại sao chọn PetZone?
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
              <div className="text-4xl">{f.icon}</div>
              <h3 className="mt-4 font-heading text-lg font-semibold text-text">{f.title}</h3>
              <p className="mt-2 text-sm text-text-secondary">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
