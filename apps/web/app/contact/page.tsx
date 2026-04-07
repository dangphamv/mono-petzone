import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Liên hệ',
  description: 'Liên hệ với đội ngũ PetZone',
}

export default function ContactPage() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="font-heading text-4xl font-bold text-text">Liên hệ</h1>
        <p className="mt-6 text-lg text-text-secondary">
          Có câu hỏi? Hãy liên hệ với chúng tôi.
        </p>
        <div className="mt-8 space-y-4 text-text-secondary">
          <p>Email: hello@petzone.vn</p>
          <p>Hotline: 1900-PETZONE</p>
        </div>
      </div>
    </section>
  )
}
