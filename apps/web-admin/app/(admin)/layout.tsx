import { Suspense } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { RouteGuard } from '@/components/layout/route-guard'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-[260px] flex-1">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <Suspense>
            <RouteGuard>{children}</RouteGuard>
          </Suspense>
        </div>
      </main>
    </div>
  )
}
