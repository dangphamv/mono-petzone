import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Chi tiết đối tác' }

export default async function ProviderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-text">Chi tiết đối tác</h1>
      <p className="mt-4 text-text-secondary">Provider ID: {id} — Coming soon</p>
    </div>
  )
}
