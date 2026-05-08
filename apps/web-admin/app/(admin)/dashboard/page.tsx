'use client'

import Link from 'next/link'
import { Building2, ClipboardList, AlertTriangle, Users, Clock, TrendingUp, ArrowRight } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle, Skeleton, Badge } from '@petzone/ui'
import { useDashboard, useProviders, useDisputes } from '@/lib/hooks/use-admin'

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
  const { data: pendingProviders } = useProviders({ page: 1, limit: 5, filters: { verification_status: ['pending'] } })
  const { data: openDisputes } = useDisputes({ page: 1, limit: 5, filters: { status: ['open'] } })

  const stats = [
    { key: 'users', title: t('dashboard.total_users'), value: data?.total_users ?? 0, icon: Users, href: '/users', change: '+12%' },
    { key: 'providers', title: t('dashboard.total_providers'), value: data?.total_providers ?? 0, icon: Building2, href: '/providers', change: '+5%' },
    { key: 'pending', title: t('dashboard.pending_verifications'), value: data?.pending_verifications ?? 0, icon: Clock, href: '/providers', change: null },
    { key: 'orders', title: t('dashboard.active_orders'), value: data?.active_orders ?? 0, icon: ClipboardList, href: '/orders', change: '+8%' },
    { key: 'disputes', title: t('dashboard.open_disputes'), value: data?.open_disputes ?? 0, icon: AlertTriangle, href: '/disputes', change: null },
  ]

  // Combine pending verifications + open disputes into action items
  const actionItems = [
    ...(pendingProviders?.data ?? []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      type: 'verification' as const,
      title: p.business_name as string,
      subtitle: (p.users as any)?.full_name || (p.users as any)?.email || '-',
      href: `/providers/${p.id}`,
      date: p.created_at as string,
    })),
    ...(openDisputes?.data ?? []).map((d: Record<string, unknown>) => ({
      id: d.id as string,
      type: 'dispute' as const,
      title: `Dispute #${(d.id as string).slice(0, 8)}`,
      subtitle: d.reason as string || d.description as string || '-',
      href: `/disputes/${d.id}`,
      date: d.created_at as string,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

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

      {/* Action Required Table */}
      <Card className="card-elevated mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle size={18} className="text-amber-500" />
            {t('dashboard.action_required')}
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {actionItems.length} {t('dashboard.items_pending')}
          </span>
        </CardHeader>
        <CardContent>
          {actionItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t('dashboard.no_actions')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">{t('common.type')}</th>
                    <th className="pb-2 pr-4 font-medium">{t('dashboard.item_name')}</th>
                    <th className="pb-2 pr-4 font-medium">{t('dashboard.detail')}</th>
                    <th className="pb-2 font-medium">{t('common.created_at')}</th>
                    <th className="pb-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {actionItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <Badge variant={item.type === 'verification' ? 'warning' : 'destructive'}>
                          {item.type === 'verification' ? t('dashboard.pending_verifications') : t('dashboard.open_disputes')}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 font-medium">{item.title}</td>
                      <td className="py-3 pr-4 text-muted-foreground max-w-[200px] truncate">{item.subtitle}</td>
                      <td className="py-3 text-muted-foreground text-xs">
                        {item.date ? new Date(item.date).toLocaleDateString('vi-VN') : '-'}
                      </td>
                      <td className="py-3">
                        <Link href={item.href} className="text-primary hover:text-primary/80">
                          <ArrowRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
