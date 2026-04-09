'use client'

import { useState } from 'react'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import {
  Button, Badge,
  Card, CardContent,
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Textarea, Label, Skeleton,
} from '@petzone/ui'
import { useReviews, useModerateReview } from '@/lib/hooks/use-admin'

type Review = Record<string, unknown>

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={14} className={i < value ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
      ))}
    </div>
  )
}

export default function ReviewsPage() {
  const { t } = useI18n()
  const [page, setPage] = useState(1)
  const { data, isLoading } = useReviews(page)
  const moderate = useModerateReview()
  const [selected, setSelected] = useState<Review | null>(null)
  const [action, setAction] = useState<'hide' | 'show' | null>(null)
  const [reason, setReason] = useState('')

  const handleModerate = () => {
    if (!selected || !action) return
    moderate.mutate(
      { id: selected.id as string, action, reason: reason || undefined },
      { onSuccess: () => { setSelected(null); setAction(null); setReason('') } },
    )
  }
  const closeDialog = () => { setAction(null); setSelected(null); setReason('') }

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center gap-3">
        <div className="stat-icon bg-amber-50 text-amber-600"><Star size={20} /></div>
        <div>
          <h1 className="page-header">{t('reviews.title')}</h1>
          <p className="page-description">{t('reviews.subtitle')}</p>
        </div>
      </div>

      <div className="table-wrapper mt-8">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">{t('reviews.rating')}</TableHead>
              <TableHead className="font-semibold">{t('reviews.content')}</TableHead>
              <TableHead className="font-semibold">{t('reviews.visibility')}</TableHead>
              <TableHead className="font-semibold">{t('common.created_at')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => (<TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>))}</TableRow>
              ))
            ) : !data?.data?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center">
                  <Star className="mx-auto h-10 w-10 text-muted-foreground/30" />
                  <p className="mt-2 text-sm text-muted-foreground">{t('reviews.empty')}</p>
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((row: Review) => (
                <TableRow key={row.id as string}>
                  <TableCell><StarRating value={row.rating_overall as number} /></TableCell>
                  <TableCell className="max-w-[300px] truncate text-muted-foreground">{(row.text as string) || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={row.is_visible ? 'success' : 'destructive'}>
                      {row.is_visible ? t('status.visible') : t('status.hidden')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{fmtDate(row.created_at as string)}</TableCell>
                  <TableCell>
                    {row.is_visible ? (
                      <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => { setSelected(row); setAction('hide') }}>{t('reviews.hide')}</Button>
                    ) : (
                      <Button size="sm" onClick={() => { setSelected(row); setAction('show') }}>{t('reviews.show')}</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
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

      <Dialog open={action !== null} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === 'hide' ? t('reviews.hide_title') : t('reviews.show_title')}</DialogTitle>
            <DialogDescription>{action === 'hide' ? t('reviews.hide_desc') : t('reviews.show_desc')}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/50 p-4">
                <StarRating value={selected.rating_overall as number} />
                <p className="mt-2 text-sm leading-relaxed">{(selected.text as string) || t('reviews.no_content')}</p>
              </div>
              {action === 'hide' && (
                <div className="space-y-1.5">
                  <Label>{t('reviews.hide_reason')}</Label>
                  <Textarea rows={2} placeholder={t('reviews.hide_reason_placeholder')} value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t('common.cancel')}</Button>
            <Button variant={action === 'hide' ? 'destructive' : 'default'} onClick={handleModerate} disabled={moderate.isPending}>
              {moderate.isPending ? t('common.processing') : t('common.confirm')}
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
