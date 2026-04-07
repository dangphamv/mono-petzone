import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Quản lý đơn hàng' }

export default function OrdersPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-text">Quản lý đơn hàng</h1>
      <p className="mt-4 text-text-secondary">Coming soon</p>
    </div>
  )
}
