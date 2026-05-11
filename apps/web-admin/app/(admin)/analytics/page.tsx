'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Badge, Button, Input,
  Card, CardHeader, CardTitle, CardContent, CardDescription,
  Skeleton,
} from '@petzone/ui'
import { BarChart3, DollarSign, TrendingUp, Star, Award, Receipt, Building2, MessageSquareText } from 'lucide-react'
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

function currentMonth(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export default function AnalyticsPage() {
  const { t } = useI18n()
  const [mode, setMode] = useState<'lifetime' | 'month'>('lifetime')
  const [month, setMonth] = useState<string>(currentMonth())
  const queryMonth = mode === 'month' ? month : undefined
  const { data, isLoading } = useAnalytics({ month: queryMonth })

  const totalOrders = data?.orders_by_status?.reduce((s, o) => s + o.count, 0) ?? 0

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="stat-icon bg-indigo-50 text-indigo-600"><BarChart3 size={20} /></div>
          <div>
            <h1 className="page-header">{t('analytics.title')}</h1>
            <p className="page-description">{t('analytics.subtitle')}</p>
          </div>
        </div>

        <PeriodFilter mode={mode} month={month} onModeChange={setMode} onMonthChange={setMonth} />
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

      {/* Status breakdown + top providers (rating) */}
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
              <p className="py-8 text-center text-sm text-muted-foreground">{t('analytics.no_data_period')}</p>
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
                  <Link key={p.id} href={`/providers/${p.id}`} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}>
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate text-sm font-medium">{p.business_name}</span>
                    <div className="flex items-center gap-1 text-sm">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      <span className="font-semibold">{Number(p.rating_average).toFixed(1)}</span>
                      <span className="text-muted-foreground">({p.rating_count})</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('common.no_data')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top invoices, top selling, top reviewed */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <TopInvoicesCard isLoading={isLoading} invoices={data?.top_invoices ?? []} />
        <TopSellingCard isLoading={isLoading} providers={data?.top_selling_providers ?? []} />
        <TopReviewedCard isLoading={isLoading} providers={data?.top_reviewed_providers ?? []} />
      </div>
    </div>
  )
}

function PeriodFilter({
  mode, month, onModeChange, onMonthChange,
}: {
  mode: 'lifetime' | 'month'
  month: string
  onModeChange: (m: 'lifetime' | 'month') => void
  onMonthChange: (m: string) => void
}) {
  const { t } = useI18n()
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card p-1 shadow-sm">
      <Button
        type="button"
        size="sm"
        variant={mode === 'lifetime' ? 'default' : 'ghost'}
        className="h-8"
        onClick={() => onModeChange('lifetime')}
      >
        {t('analytics.lifetime')}
      </Button>
      <Button
        type="button"
        size="sm"
        variant={mode === 'month' ? 'default' : 'ghost'}
        className="h-8"
        onClick={() => onModeChange('month')}
      >
        {t('analytics.month')}
      </Button>
      {mode === 'month' && (
        <Input
          type="month"
          value={month}
          onChange={(e) => onMonthChange(e.target.value)}
          className="ml-1 h-8 w-[160px] text-sm"
        />
      )}
    </div>
  )
}

function TopInvoicesCard({ isLoading, invoices }: { isLoading: boolean; invoices: NonNullable<ReturnType<typeof useAnalytics>['data']>['top_invoices'] }) {
  const { t } = useI18n()
  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt size={18} className="text-muted-foreground" />
          {t('analytics.top_invoices')}
        </CardTitle>
        <CardDescription>{t('analytics.top_invoices_desc')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : invoices.length ? (
          <div className="space-y-1">
            {invoices.map((inv, i) => (
              <Link
                key={inv.id}
                href={`/orders/${inv.id}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs font-medium">{inv.order_number || inv.id.slice(0, 8)}</p>
                  <p className="truncate text-xs text-muted-foreground">{inv.provider_name || '—'}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold">{fmtVND(inv.total_price)}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">{t('analytics.no_data_period')}</p>
        )}
      </CardContent>
    </Card>
  )
}

function TopSellingCard({ isLoading, providers }: { isLoading: boolean; providers: NonNullable<ReturnType<typeof useAnalytics>['data']>['top_selling_providers'] }) {
  const { t } = useI18n()
  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 size={18} className="text-muted-foreground" />
          {t('analytics.top_selling')}
        </CardTitle>
        <CardDescription>{t('analytics.top_selling_desc')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : providers.length ? (
          <div className="space-y-1">
            {providers.map((p, i) => (
              <Link
                key={p.id}
                href={`/providers/${p.id}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i < 3 ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.business_name}</p>
                  <p className="text-xs text-muted-foreground">{p.order_count} {t('analytics.orders')}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-emerald-700">{fmtVND(p.revenue)}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">{t('analytics.no_data_period')}</p>
        )}
      </CardContent>
    </Card>
  )
}

function TopReviewedCard({ isLoading, providers }: { isLoading: boolean; providers: NonNullable<ReturnType<typeof useAnalytics>['data']>['top_reviewed_providers'] }) {
  const { t } = useI18n()
  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareText size={18} className="text-muted-foreground" />
          {t('analytics.top_reviewed')}
        </CardTitle>
        <CardDescription>{t('analytics.top_reviewed_desc')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : providers.length ? (
          <div className="space-y-1">
            {providers.map((p, i) => (
              <Link
                key={p.id}
                href={`/providers/${p.id}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i < 3 ? 'bg-violet-100 text-violet-700' : 'bg-muted text-muted-foreground'}`}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.business_name}</p>
                  <p className="text-xs text-muted-foreground">{p.rating_count} {t('analytics.reviews')}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-sm">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{Number(p.rating_average).toFixed(1)}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">{t('analytics.no_data_period')}</p>
        )}
      </CardContent>
    </Card>
  )
}

function fmtVND(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}
