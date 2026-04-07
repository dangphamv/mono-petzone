import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Chính sách bảo mật' }

export default function PrivacyPage() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4 prose">
        <h1 className="font-heading text-4xl font-bold text-text">Chính sách bảo mật</h1>
        <p className="mt-6 text-text-secondary">Nội dung chính sách bảo mật sẽ được cập nhật.</p>
      </div>
    </section>
  )
}
