'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Skeleton,
  Separator,
} from '@petzone/ui'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { t } = useI18n()

  const STATUS_MAP: Record<string, { variant: 'default' | 'warning' | 'info' | 'success' | 'destructive'; label: string }> = {
    pending: { variant: 'warning', label: t('status.pending') },
    confirmed: { variant: 'default', label: t('status.confirmed') },
    checked_in: { variant: 'info', label: t('status.checked_in') },
    in_progress: { variant: 'info', label: t('status.in_progress') },
    check_out: { variant: 'info', label: t('status.check_out') },
    completed: { variant: 'success', label: t('status.completed') },
    cancelled: { variant: 'destructive', label: t('status.cancelled') },
    disputed: { variant: 'destructive', label: t('status.disputed') },
  }

  function StatusBadge({ status }: { status: string }) {
    const config = STATUS_MAP[status] ?? { variant: 'default' as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }
  const { data: order, isLoading } = useQuery<Record<string, unknown>>({
    queryKey: ['admin', 'order', id],
    queryFn: () => api(`/admin/orders?page=1&limit=100`).then((res: any) =>
      res.data?.find((o: any) => o.id === id) || null
    ),
  })

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-5 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div>
        <Link href="/orders" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft size={16} /> {t('common.back')}
        </Link>
        <p className="mt-4 text-muted-foreground">{t('orders.not_found')}</p>
      </div>
    )
  }

  const provider = order.providers as Record<string, unknown> | Record<string, unknown>[] | null
  const providerName = provider
    ? (Array.isArray(provider) ? provider[0]?.business_name : provider?.business_name) as string
    : '-'

  return (
    <div>
      <Button variant="link" asChild className="px-0">
        <Link href="/orders">
          <ArrowLeft size={16} /> {t('common.back_to_list')}
        </Link>
      </Button>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t('orders.detail')} #{order.order_number as string}</h1>
          <StatusBadge status={order.status as string} />
        </div>
      </div>

      <Separator className="my-6" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('orders.detail')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <InfoRow label={t('orders.provider')} value={providerName} />
              <InfoRow label={t('orders.check_in')} value={formatDate(order.check_in_date as string)} />
              <InfoRow label={t('orders.check_out')} value={formatDate(order.check_out_date as string)} />
              <InfoRow label={t('orders.num_nights')} value={String(order.num_nights ?? '-')} />
              <InfoRow label={t('orders.total_price')} value={order.total_price ? formatVND(order.total_price as number) : '-'} />
              <InfoRow label={t('common.created_at')} value={formatDate(order.created_at as string)} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('orders.additional_info')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <InfoRow label="Owner ID" value={order.owner_id as string} />
              <InfoRow label="Provider ID" value={order.provider_id as string} />
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | undefined | null }) {
  return (
    <div className="flex gap-2">
      <dt className="w-32 shrink-0 text-muted-foreground">{label}</dt>
      <dd>{value || '-'}</dd>
    </div>
  )
}

function formatDate(d: string | undefined | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatVND(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}
