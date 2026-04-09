'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import {
  Badge, Button,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Input, Skeleton,
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
  Textarea, Label,
} from '@petzone/ui'
import { useDisputes, useResolveDispute } from '@/lib/hooks/use-admin'

type Dispute = Record<string, unknown>

const CFG_VARIANT: Record<string, 'warning' | 'success' | 'info' | 'default'> = {
  open: 'warning', resolved: 'success',
  owner: 'info', provider: 'default',
}
const CFG_KEY: Record<string, string> = {
  open: 'status.open', resolved: 'status.resolved',
  owner: 'role.owner', provider: 'role.provider',
}

export default function DisputesPage() {
  const { t } = useI18n()
  const [page, setPage] = useState(1)
  const { data, isLoading } = useDisputes(page)
  const router = useRouter()
  const resolve = useResolveDispute()
  const [selected, setSelected] = useState<Dispute | null>(null)
  const [resolution, setResolution] = useState('')
  const [refundAmount, setRefundAmount] = useState('')

  const handleResolve = () => {
    if (!selected || !resolution) return
    resolve.mutate(
      { id: selected.id as string, resolution, refund_amount: refundAmount ? Number(refundAmount) : undefined },
      { onSuccess: () => { setSelected(null); setResolution(''); setRefundAmount('') } },
    )
  }
  const closeModal = () => { setSelected(null); setResolution(''); setRefundAmount('') }

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center gap-3">
        <div className="stat-icon bg-red-50 text-red-600"><AlertTriangle size={20} /></div>
        <div>
          <h1 className="page-header">{t('disputes.title')}</h1>
          <p className="page-description">{t('disputes.subtitle')}</p>
        </div>
      </div>

      <div className="table-wrapper mt-8">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">{t('disputes.id')}</TableHead>
              <TableHead className="font-semibold">{t('disputes.order')}</TableHead>
              <TableHead className="font-semibold">{t('disputes.opened_by')}</TableHead>
              <TableHead className="font-semibold">{t('common.description')}</TableHead>
              <TableHead className="font-semibold">{t('common.status')}</TableHead>
              <TableHead className="font-semibold">{t('common.created_at')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => (<TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>))}</TableRow>
              ))
            ) : !(data?.data ?? []).length ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground/30" />
                  <p className="mt-2 text-sm text-muted-foreground">{t('disputes.empty')}</p>
                </TableCell>
              </TableRow>
            ) : (
              (data?.data ?? []).map((row: Dispute) => {
                const sv = CFG_VARIANT[row.status as string] || CFG_VARIANT.open
                const sk = CFG_KEY[row.status as string] || CFG_KEY.open
                const rv = CFG_VARIANT[row.opened_by_role as string] || CFG_VARIANT.owner
                const rk = CFG_KEY[row.opened_by_role as string] || CFG_KEY.owner
                return (
                  <TableRow key={row.id as string} className="cursor-pointer transition-colors" onClick={() => router.push(`/disputes/${row.id}`)}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{(row.id as string).slice(0, 8)}...</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{(row.order_id as string)?.slice(0, 8)}...</TableCell>
                    <TableCell><Badge variant={rv}>{t(rk as any)}</Badge></TableCell>
                    <TableCell className="max-w-[250px] truncate text-muted-foreground">{(row.description as string) || '-'}</TableCell>
                    <TableCell><Badge variant={sv}>{t(sk as any)}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{fmtDate(row.created_at as string)}</TableCell>
                    <TableCell>
                      {row.status === 'open' && (
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); setSelected(row) }}>{t('disputes.resolve')}</Button>
                      )}
                    </TableCell>
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

      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) closeModal() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('disputes.resolve_title')}</DialogTitle>
            <DialogDescription>{t('disputes.resolve_desc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t('disputes.resolution')} *</Label>
              <Textarea rows={3} placeholder={t('disputes.resolution_placeholder')} value={resolution} onChange={(e) => setResolution(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('disputes.refund_amount')}</Label>
              <Input type="number" placeholder="0" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>{t('common.cancel')}</Button>
            <Button onClick={handleResolve} disabled={resolve.isPending || !resolution}>
              {resolve.isPending ? t('common.processing') : t('disputes.confirm_resolve')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
