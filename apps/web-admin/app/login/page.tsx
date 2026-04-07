import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Đăng nhập Admin' }

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow-sm">
        <h1 className="font-heading text-2xl font-bold text-text">PetZone Admin</h1>
        <p className="mt-2 text-sm text-text-secondary">Đăng nhập để quản lý hệ thống</p>
        <p className="mt-8 text-sm text-text-secondary">Login form — coming soon</p>
      </div>
    </div>
  )
}
