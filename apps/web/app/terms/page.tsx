import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Điều khoản sử dụng' }

export default function TermsPage() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4 prose">
        <h1 className="font-heading text-4xl font-bold text-text">Điều khoản sử dụng</h1>
        <p className="mt-6 text-text-secondary">Nội dung điều khoản sử dụng sẽ được cập nhật.</p>
      </div>
    </section>
  )
}
