'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Badge, Button, Input,
  Card, CardHeader, CardTitle, CardContent, CardDescription,
  Skeleton,
} from '@petzone/ui'
import {
  BarChart3, DollarSign, TrendingUp, Star, Receipt, Building2,
  MessageSquareText, Wallet, CheckCircle2,
} from 'lucide-react'
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

const TONE: Record<string, { bg: string; text: string }> = {
  teal: { bg: 'bg-teal-50', text: 'text-teal-700' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-700' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700' },
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
  const completed = data?.orders_by_status?.find((o) => o.status === 'completed')?.count ?? 0
  const avgOrderValue = totalOrders > 0 ? (data?.total_revenue ?? 0) / totalOrders : 0

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

      {/* KPI tiles */}
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={DollarSign}
          label={t('analytics.total_revenue')}
          value={isLoading ? null : fmtVND(data?.total_revenue ?? 0)}
          hint={t('analytics.from_completed')}
          tone="green"
        />
        <StatTile
          icon={TrendingUp}
          label={t('analytics.total_orders')}
          value={isLoading ? null : totalOrders.toLocaleString('vi-VN')}
          hint={t('analytics.all_statuses')}
          tone="blue"
        />
        <StatTile
          icon={Wallet}
          label={t('analytics.avg_order_value')}
          value={isLoading ? null : fmtVND(avgOrderValue)}
          tone="amber"
        />
        <StatTile
          icon={CheckCircle2}
          label={t('analytics.completed_orders')}
          value={isLoading ? null : completed.toLocaleString('vi-VN')}
          hint={totalOrders > 0 ? `${Math.round((completed / totalOrders) * 100)}%` : undefined}
          tone="violet"
        />
      </div>

      {/* Status breakdown - full width */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <TrendingUp size={14} />
            </span>
            {t('analytics.orders_by_status')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : data?.orders_by_status?.length ? (
            <div className="space-y-2.5">
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
                    <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">{pct.toFixed(0)}%</span>
                    <span className="w-12 text-right text-sm font-semibold tabular-nums">{item.count}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('analytics.no_data_period')}</p>
          )}
        </CardContent>
      </Card>

      {/* Ranking cards */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <RankingCard
          icon={Receipt}
          iconTone="amber"
          title={t('analytics.top_invoices')}
          description={t('analytics.top_invoices_desc')}
          isLoading={isLoading}
          empty={t('analytics.no_data_period')}
        >
          {(data?.top_invoices ?? []).map((inv, i) => (
            <Link
              key={inv.id}
              href={`/orders/${inv.id}`}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
            >
              <RankBadge index={i} tone="amber" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs font-medium">{inv.order_number || inv.id.slice(0, 8)}</p>
                <p className="truncate text-xs text-muted-foreground">{inv.provider_name || '—'}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">{fmtVND(inv.total_price)}</span>
            </Link>
          ))}
        </RankingCard>

        <RankingCard
          icon={Building2}
          iconTone="green"
          title={t('analytics.top_selling')}
          description={t('analytics.top_selling_desc')}
          isLoading={isLoading}
          empty={t('analytics.no_data_period')}
        >
          {(data?.top_selling_providers ?? []).map((p, i) => (
            <Link
              key={p.id}
              href={`/providers/${p.id}`}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
            >
              <RankBadge index={i} tone="green" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium first-letter:uppercase">{p.business_name}</p>
                <p className="text-xs text-muted-foreground">{p.order_count} {t('analytics.orders')}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-emerald-700 tabular-nums">{fmtVND(p.revenue)}</span>
            </Link>
          ))}
        </RankingCard>

        <RankingCard
          icon={MessageSquareText}
          iconTone="violet"
          title={t('analytics.top_reviewed')}
          description={t('analytics.top_reviewed_desc')}
          isLoading={isLoading}
          empty={t('analytics.no_data_period')}
        >
          {(data?.top_reviewed_providers ?? []).map((p, i) => (
            <Link
              key={p.id}
              href={`/providers/${p.id}`}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
            >
              <RankBadge index={i} tone="violet" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium first-letter:uppercase">{p.business_name}</p>
                <p className="text-xs text-muted-foreground">{p.rating_count} {t('analytics.reviews')}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1 text-sm">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span className="font-semibold tabular-nums">{Number(p.rating_average).toFixed(1)}</span>
              </div>
            </Link>
          ))}
        </RankingCard>
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

function StatTile({ icon: Icon, label, value, hint, tone }: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: string | null
  hint?: string
  tone: keyof typeof TONE
}) {
  const c = TONE[tone]
  return (
    <Card>
      <CardContent className="p-4">
        <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg ${c.bg} ${c.text}`}>
          <Icon size={18} />
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {value === null ? (
          <Skeleton className="mt-1 h-7 w-28" />
        ) : (
          <p className="mt-0.5 font-heading text-xl font-bold tabular-nums">{value}</p>
        )}
        {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}

function RankingCard({
  icon: Icon, iconTone, title, description, isLoading, empty, children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  iconTone: keyof typeof TONE
  title: string
  description: string
  isLoading: boolean
  empty: string
  children: React.ReactNode
}) {
  const c = TONE[iconTone]
  const items = Array.isArray(children) ? children : children ? [children] : []
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${c.bg} ${c.text}`}>
            <Icon size={14} />
          </span>
          {title}
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : items.length > 0 ? (
          <div className="space-y-1">{children}</div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">{empty}</p>
        )}
      </CardContent>
    </Card>
  )
}

function RankBadge({ index, tone }: { index: number; tone: keyof typeof TONE }) {
  const c = TONE[tone]
  const isTop = index < 3
  return (
    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
      isTop ? `${c.bg} ${c.text}` : 'bg-muted text-muted-foreground'
    }`}>
      {index + 1}
    </span>
  )
}

function fmtVND(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}
