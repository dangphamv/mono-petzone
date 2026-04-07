export function Cta() {
  return (
    <section id="download" className="bg-primary py-20">
      <div className="mx-auto max-w-7xl px-4 text-center">
        <h2 className="font-heading text-3xl font-bold text-white">
          Sẵn sàng trải nghiệm?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
          Tải ứng dụng PetZone ngay hôm nay và tìm khách sạn thú cưng phù hợp nhất cho bé yêu của bạn.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <a
            href="#"
            className="rounded-xl bg-white px-8 py-4 text-lg font-semibold text-primary transition-colors hover:bg-gray-100"
          >
            App Store
          </a>
          <a
            href="#"
            className="rounded-xl bg-white px-8 py-4 text-lg font-semibold text-primary transition-colors hover:bg-gray-100"
          >
            Google Play
          </a>
        </div>
      </div>
    </section>
  )
}
