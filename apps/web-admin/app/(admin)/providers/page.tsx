'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Button,
  Badge,
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Textarea,
  Skeleton,
} from '@petzone/ui'
import { useProviders, useVerifyProvider } from '@/lib/hooks/use-admin'
import { useI18n } from '@/lib/i18n'

type Provider = Record<string, unknown>

export default function ProvidersPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useProviders(page)
  const router = useRouter()
  const verify = useVerifyProvider()
  const [selected, setSelected] = useState<Provider | null>(null)
  const [action, setAction] = useState<'approved' | 'rejected' | null>(null)
  const [notes, setNotes] = useState('')
  const { t } = useI18n()

  const statusConfig: Record<string, { variant: 'success' | 'warning' | 'destructive'; label: string }> = {
    approved: { variant: 'success', label: t('status.approved') },
    rejected: { variant: 'destructive', label: t('status.rejected') },
    pending: { variant: 'warning', label: t('status.pending') },
  }

  const handleVerify = () => {
    if (!selected || !action) return
    verify.mutate(
      { id: selected.id as string, status: action, notes: notes || undefined },
      { onSuccess: () => { setSelected(null); setAction(null); setNotes('') } },
    )
  }

  const closeDialog = () => { setAction(null); setSelected(null); setNotes('') }

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center gap-3">
        <div className="stat-icon bg-teal-50 text-teal-600">
          <Building2 size={20} />
        </div>
        <div>
          <h1 className="page-header">{t('providers.title')}</h1>
          <p className="page-description">{t('providers.subtitle')}</p>
        </div>
      </div>

      <div className="table-wrapper mt-8">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">{t('providers.business_name')}</TableHead>
              <TableHead className="font-semibold">{t('providers.owner')}</TableHead>
              <TableHead className="font-semibold">{t('providers.address')}</TableHead>
              <TableHead className="font-semibold">{t('common.status')}</TableHead>
              <TableHead className="font-semibold">{t('providers.rating')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !data?.data?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center">
                  <Building2 className="mx-auto h-10 w-10 text-muted-foreground/30" />
                  <p className="mt-2 text-sm text-muted-foreground">{t('providers.empty')}</p>
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((row: Provider) => {
                const u = row.users as Record<string, unknown> | Record<string, unknown>[] | null
                const user = u ? (Array.isArray(u) ? u[0] : u) : null
                const ownerName = (user?.full_name as string) || (user?.email as string) || '-'
                const status = row.verification_status as string
                const cfg = statusConfig[status] || statusConfig.pending

                return (
                  <TableRow
                    key={row.id as string}
                    className="cursor-pointer transition-colors"
                    onClick={() => router.push(`/providers/${row.id}`)}
                  >
                    <TableCell className="font-medium">{row.business_name as string}</TableCell>
                    <TableCell className="text-muted-foreground">{ownerName}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">{(row.address as string) || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {row.rating_average ? (
                        <span className="inline-flex items-center gap-1 text-sm">
                          <span className="text-amber-500">★</span>
                          {Number(row.rating_average).toFixed(1)}
                          <span className="text-muted-foreground">({row.rating_count as number})</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {status === 'pending' && (
                        <div className="flex gap-1.5">
                          <Button size="sm" onClick={(e) => { e.stopPropagation(); setSelected(row); setAction('approved') }}>
                            {t('providers.approve')}
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setSelected(row); setAction('rejected') }}>
                            {t('providers.reject')}
                          </Button>
                        </div>
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
          <p className="text-sm text-muted-foreground">
            {t('common.showing')} {data.data.length} / {data.meta.total}
          </p>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={16} />
            </Button>
            <span className="min-w-[80px] text-center text-sm text-muted-foreground">
              {data.meta.page} / {data.meta.totalPages}
            </span>
            <Button variant="outline" size="icon" disabled={page >= data.meta.totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={action !== null} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === 'approved' ? t('providers.approve_title') : t('providers.reject_title')}</DialogTitle>
            <DialogDescription>
              {action === 'approved'
                ? `${t('providers.approve_confirm')} "${selected?.business_name}"?`
                : `${t('providers.reject_confirm')} "${selected?.business_name}"?`}
            </DialogDescription>
          </DialogHeader>
          <Textarea rows={3} placeholder={t('common.notes_optional')} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t('common.cancel')}</Button>
            <Button variant={action === 'approved' ? 'default' : 'destructive'} onClick={handleVerify} disabled={verify.isPending}>
              {verify.isPending ? t('common.processing') : action === 'approved' ? t('providers.approve_confirm') : t('providers.reject_confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
