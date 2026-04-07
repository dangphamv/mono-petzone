import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Chi tiết tranh chấp' }

export default async function DisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-text">Chi tiết tranh chấp</h1>
      <p className="mt-4 text-text-secondary">Dispute ID: {id} — Coming soon</p>
    </div>
  )
}
