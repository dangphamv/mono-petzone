import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Quản lý người dùng' }

export default function UsersPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-text">Quản lý người dùng</h1>
      <p className="mt-4 text-text-secondary">Coming soon</p>
    </div>
  )
}
