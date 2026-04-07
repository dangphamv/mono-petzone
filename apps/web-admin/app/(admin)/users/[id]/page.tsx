import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Chi tiết người dùng' }

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-text">Chi tiết người dùng</h1>
      <p className="mt-4 text-text-secondary">User ID: {id} — Coming soon</p>
    </div>
  )
}
