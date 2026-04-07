import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

export default function DashboardPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-text">Dashboard</h1>
      <p className="mt-4 text-text-secondary">Coming soon</p>
    </div>
  )
}
