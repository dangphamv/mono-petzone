export function Stats() {
  const stats = [
    { value: '500+', label: 'Khách sạn đối tác' },
    { value: '10,000+', label: 'Thú cưng đã phục vụ' },
    { value: '4.8/5', label: 'Đánh giá trung bình' },
    { value: '98%', label: 'Tỷ lệ hài lòng' },
  ]

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-8 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-heading text-4xl font-bold text-primary">{s.value}</div>
              <div className="mt-2 text-sm text-text-secondary">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
