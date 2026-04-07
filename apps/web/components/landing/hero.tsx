export function Hero() {
  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-4 text-center">
        <h1 className="font-heading text-4xl font-bold leading-tight text-text md:text-6xl">
          Khách sạn thú cưng
          <br />
          <span className="text-primary">uy tín & minh bạch</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary">
          Tìm kiếm, đặt phòng và theo dõi thú cưng của bạn theo thời gian thực.
          An tâm khi gửi bé yêu tại các cơ sở đã được xác minh.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <a
            href="#download"
            className="rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Tải ứng dụng miễn phí
          </a>
          <a
            href="/for-providers"
            className="rounded-xl border border-gray-300 bg-white px-8 py-4 text-lg font-semibold text-text transition-colors hover:bg-gray-50"
          >
            Trở thành đối tác
          </a>
        </div>
      </div>
    </section>
  )
}
