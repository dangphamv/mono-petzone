'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Badge,
  Button,
  Skeleton,
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@petzone/ui'
import { useOrders } from '@/lib/hooks/use-admin'
import { useI18n } from '@/lib/i18n'

type Order = Record<string, unknown>

export default function OrdersPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useOrders(page)
  const router = useRouter()
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

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center gap-3">
        <div className="stat-icon bg-violet-50 text-violet-600">
          <ClipboardList size={20} />
        </div>
        <div>
          <h1 className="page-header">{t('orders.title')}</h1>
          <p className="page-description">{t('orders.subtitle')}</p>
        </div>
      </div>

      <div className="table-wrapper mt-8">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">{t('orders.order_number')}</TableHead>
              <TableHead className="font-semibold">{t('orders.provider')}</TableHead>
              <TableHead className="font-semibold">{t('common.status')}</TableHead>
              <TableHead className="font-semibold">{t('orders.check_in')}</TableHead>
              <TableHead className="font-semibold">{t('orders.check_out')}</TableHead>
              <TableHead className="font-semibold text-right">{t('orders.total_price')}</TableHead>
              <TableHead className="font-semibold">{t('common.created_at')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !(data?.data ?? []).length ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground/30" />
                  <p className="mt-2 text-sm text-muted-foreground">{t('orders.empty')}</p>
                </TableCell>
              </TableRow>
            ) : (
              (data?.data ?? []).map((row: Order) => {
                const p = row.providers as Record<string, unknown> | Record<string, unknown>[] | null
                const providerName = p ? (Array.isArray(p) ? p[0]?.business_name : p?.business_name) as string || '-' : '-'
                const cfg = STATUS_MAP[row.status as string] ?? { variant: 'default' as const, label: row.status as string }
                return (
                  <TableRow key={row.id as string} className="cursor-pointer transition-colors" onClick={() => router.push(`/orders/${row.id}`)}>
                    <TableCell className="font-mono text-sm font-medium">{row.order_number as string}</TableCell>
                    <TableCell>{providerName}</TableCell>
                    <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{fmtDate(row.check_in_date as string)}</TableCell>
                    <TableCell className="text-muted-foreground">{fmtDate(row.check_out_date as string)}</TableCell>
                    <TableCell className="text-right font-medium">{row.total_price ? fmtVND(row.total_price as number) : '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{fmtDate(row.created_at as string)}</TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {data?.meta && data.meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{t('common.showing')} {data.data.length} / {data.meta.total}</p>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></Button>
            <span className="min-w-[80px] text-center text-sm text-muted-foreground">{data.meta.page} / {data.meta.totalPages}</span>
            <Button variant="outline" size="icon" disabled={page >= data.meta.totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></Button>
          </div>
        </div>
      )}
    </div>
  )
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function fmtVND(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}
