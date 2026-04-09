'use client'

import {
  Badge,
  Card, CardHeader, CardTitle, CardContent, CardDescription,
  Skeleton, Separator,
} from '@petzone/ui'
import { BarChart3, DollarSign, TrendingUp, Star, Award } from 'lucide-react'
import { useAnalytics } from '@/lib/hooks/use-admin'
import { useI18n } from '@/lib/i18n'

const STATUS_LABEL_KEY: Record<string, string> = {
  completed: 'status.completed', pending: 'status.pending', confirmed: 'status.confirmed',
  checked_in: 'status.checked_in', in_progress: 'status.in_progress', check_out: 'status.check_out',
  cancelled: 'status.cancelled', disputed: 'status.disputed',
}
const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'destructive' | 'default' | 'muted'> = {
  completed: 'success', pending: 'warning', confirmed: 'info',
  checked_in: 'info', in_progress: 'default', check_out: 'default',
  cancelled: 'destructive', disputed: 'destructive',
}

export default function AnalyticsPage() {
  const { t } = useI18n()
  const { data, isLoading } = useAnalytics()

  const totalOrders = data?.orders_by_status?.reduce((s, o) => s + o.count, 0) ?? 0

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center gap-3">
        <div className="stat-icon bg-indigo-50 text-indigo-600"><BarChart3 size={20} /></div>
        <div>
          <h1 className="page-header">{t('analytics.title')}</h1>
          <p className="page-description">{t('analytics.subtitle')}</p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="card-elevated overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center gap-5 p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <DollarSign size={28} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('analytics.total_revenue')}</p>
                {isLoading ? (
                  <Skeleton className="mt-1 h-8 w-40" />
                ) : (
                  <p className="text-3xl font-bold tracking-tight">{fmtVND(data?.total_revenue ?? 0)}</p>
                )}
              </div>
            </div>
            <div className="border-t bg-emerald-50/50 px-6 py-2.5">
              <span className="text-xs font-medium text-emerald-600">{t('analytics.from_completed')}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center gap-5 p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <TrendingUp size={28} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('analytics.total_orders')}</p>
                {isLoading ? (
                  <Skeleton className="mt-1 h-8 w-20" />
                ) : (
                  <p className="text-3xl font-bold tracking-tight">{totalOrders.toLocaleString('vi-VN')}</p>
                )}
              </div>
            </div>
            <div className="border-t bg-blue-50/50 px-6 py-2.5">
              <span className="text-xs font-medium text-blue-600">{t('analytics.all_statuses')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail sections */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={18} className="text-muted-foreground" />
              {t('analytics.orders_by_status')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : data?.orders_by_status?.length ? (
              <div className="space-y-3">
                {data.orders_by_status.map((item) => {
                  const pct = totalOrders > 0 ? (item.count / totalOrders) * 100 : 0
                  return (
                    <div key={item.status} className="flex items-center gap-3">
                      <Badge variant={STATUS_VARIANT[item.status] ?? 'muted'} className="w-28 justify-center">
                        {t((STATUS_LABEL_KEY[item.status] ?? item.status) as any)}
                      </Badge>
                      <div className="flex-1">
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="w-10 text-right text-sm font-semibold">{item.count}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('common.no_data')}</p>
            )}
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award size={18} className="text-muted-foreground" />
              {t('analytics.top_providers')}
            </CardTitle>
            <CardDescription>{t('analytics.ranked_by_rating')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : data?.top_providers?.length ? (
              <div className="space-y-1">
                {data.top_providers.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}>
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium">{p.business_name}</span>
                    <div className="flex items-center gap-1 text-sm">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      <span className="font-semibold">{Number(p.rating_average).toFixed(1)}</span>
                      <span className="text-muted-foreground">({p.rating_count})</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('common.no_data')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function fmtVND(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}
