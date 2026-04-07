import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Chi tiết đơn hàng' }

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-text">Chi tiết đơn hàng</h1>
      <p className="mt-4 text-text-secondary">Order ID: {id} — Coming soon</p>
    </div>
  )
}
