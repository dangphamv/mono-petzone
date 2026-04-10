'use client'

import Link from 'next/link'
import { Building2, ClipboardList, AlertTriangle, Users, Clock, TrendingUp } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { Card, CardContent, Skeleton } from '@petzone/ui'
import { useDashboard } from '@/lib/hooks/use-admin'

const iconBg: Record<string, string> = {
  users: 'bg-blue-50 text-blue-600',
  providers: 'bg-teal-50 text-teal-600',
  pending: 'bg-amber-50 text-amber-600',
  orders: 'bg-violet-50 text-violet-600',
  disputes: 'bg-red-50 text-red-600',
}

export default function DashboardPage() {
  const { t } = useI18n()
  const { data, isLoading } = useDashboard()

  const stats = [
    { key: 'users', title: t('dashboard.total_users'), value: data?.total_users ?? 0, icon: Users, href: '/users', change: '+12%' },
    { key: 'providers', title: t('dashboard.total_providers'), value: data?.total_providers ?? 0, icon: Building2, href: '/providers', change: '+5%' },
    { key: 'pending', title: t('dashboard.pending_verifications'), value: data?.pending_verifications ?? 0, icon: Clock, href: '/providers', change: null },
    { key: 'orders', title: t('dashboard.active_orders'), value: data?.active_orders ?? 0, icon: ClipboardList, href: '/orders', change: '+8%' },
    { key: 'disputes', title: t('dashboard.open_disputes'), value: data?.open_disputes ?? 0, icon: AlertTriangle, href: '/disputes', change: null },
  ]

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <div>
        <h1 className="page-header">{t('dashboard.title')}</h1>
        <p className="page-description">{t('dashboard.subtitle')}</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.key} href={s.href} className="group">
            <Card className="card-elevated h-full transition-all duration-200 group-hover:-translate-y-0.5">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`stat-icon ${iconBg[s.key]}`}>
                    <s.icon size={20} />
                  </div>
                  {s.change && (
                    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-success">
                      <TrendingUp size={12} />
                      {s.change}
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="mt-1.5 h-3.5 w-24" />
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold tracking-tight">{s.value.toLocaleString('vi-VN')}</p>
                      <p className="mt-0.5 text-[13px] text-muted-foreground">{s.title}</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
