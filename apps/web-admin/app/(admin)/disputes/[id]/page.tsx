'use client'

import { use, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, AlertTriangle, ClipboardList, FileText, Gavel,
  User, Calendar, Wallet, Image as ImageIcon, CheckCircle2, Clock,
} from 'lucide-react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Skeleton,
  Textarea,
  Label,
} from '@petzone/ui'
import { api } from '@/lib/api'
import { useResolveDispute } from '@/lib/hooks/use-admin'
import { CopyableId } from '@/components/copyable-id'

const STATUS_VARIANT: Record<string, 'default' | 'warning' | 'info' | 'success' | 'destructive' | 'muted'> = {
  open: 'warning',
  investigating: 'info',
  resolved: 'success',
  closed: 'muted',
}
const STATUS_KEY: Record<string, string> = {
  open: 'status.open',
  investigating: 'status.investigating',
  resolved: 'status.resolved',
  closed: 'status.closed',
}
const ROLE_KEY: Record<string, string> = {
  owner: 'role.owner', provider: 'role.provider',
}

const TONE: Record<string, { bg: string; text: string; border: string }> = {
  teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
}

export default function DisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useI18n()
  const { id } = use(params)
  const { data: dispute, isLoading } = useQuery<Record<string, unknown>>({
    queryKey: ['admin', 'dispute', id],
    queryFn: () => api(`/admin/disputes?page=1&limit=100`).then((res: any) =>
      res.data?.find((d: any) => d.id === id) || null
    ),
  })
  const resolve = useResolveDispute()
  const [showModal, setShowModal] = useState(false)
  const [resolution, setResolution] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [lightbox, setLightbox] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  if (!dispute) {
    return (
      <div>
        <Link href="/disputes" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft size={16} /> {t('common.back')}
        </Link>
        <p className="mt-4 text-muted-foreground">{t('disputes.not_found')}</p>
      </div>
    )
  }

  const handleResolve = () => {
    if (!resolution) return
    resolve.mutate(
      { id, resolution, refund_amount: refundAmount ? Number(refundAmount) : undefined },
      { onSuccess: () => { setShowModal(false); setResolution(''); setRefundAmount('') } },
    )
  }

  const closeModal = () => {
    setShowModal(false)
    setResolution('')
    setRefundAmount('')
  }

  const status = dispute.status as string
  const openedByRole = dispute.opened_by_role as string | undefined
  const orderId = dispute.order_id as string | undefined
  const description = dispute.description as string | undefined
  const resolutionText = dispute.resolution as string | undefined
  const resolvedAt = dispute.resolved_at as string | undefined
  const refund = dispute.refund_amount as number | null | undefined
  const evidence = (dispute.evidence_photos as string[]) || []
  const isPending = status === 'open' || status === 'investigating'

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <Link href="/disputes" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft size={16} /> {t('common.back_to_list')}
      </Link>

      {/* Header */}
      <Card className="mt-3">
        <CardContent className="flex flex-wrap items-start gap-4 p-5">
          <div className={`h-20 w-20 shrink-0 rounded-xl border flex items-center justify-center ${
            isPending ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
          }`}>
            {isPending ? <AlertTriangle size={32} /> : <CheckCircle2 size={32} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('nav.disputes')}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-bold">#{(dispute.id as string)?.slice(0, 8).toUpperCase()}</h1>
              <CopyableId
                value={dispute.id as string}
                displayValue={(dispute.id as string)?.slice(0, 8) + '…'}
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={STATUS_VARIANT[status] ?? 'default'} className="gap-1">
                {isPending ? <Clock size={12} /> : <CheckCircle2 size={12} />}
                {t((STATUS_KEY[status] ?? status) as any)}
              </Badge>
              {openedByRole && (
                <Badge variant="info" className="gap-1">
                  <User size={12} />
                  {t((ROLE_KEY[openedByRole] ?? openedByRole) as any)}
                </Badge>
              )}
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar size={12} />
                <span className="tabular-nums">{formatDate(dispute.created_at as string)}</span>
              </span>
            </div>
          </div>
          {isPending && (
            <Button size="sm" onClick={() => setShowModal(true)}>
              <Gavel size={14} /> {t('disputes.resolve')}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Stat tiles */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={isPending ? Clock : CheckCircle2}
          label={t('common.status')}
          value={t((STATUS_KEY[status] ?? status) as any)}
          tone={isPending ? 'amber' : 'green'}
        />
        <StatTile
          icon={User}
          label={t('disputes.opened_by')}
          value={openedByRole ? t((ROLE_KEY[openedByRole] ?? openedByRole) as any) : '-'}
          tone="violet"
        />
        <StatTile
          icon={Calendar}
          label={resolvedAt ? t('disputes.resolved_at') : t('common.created_at')}
          value={formatDate(resolvedAt || (dispute.created_at as string))}
          tone="teal"
        />
        <StatTile
          icon={Wallet}
          label={t('disputes.refund_amount')}
          value={refund != null ? formatVND(Number(refund)) : '-'}
          tone={refund ? 'rose' : 'green'}
        />
      </div>

      {/* Description + Related order */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FileText size={14} />
              </span>
              {t('disputes.description_label')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground/80 first-letter:uppercase whitespace-pre-wrap">
              {description || t('disputes.no_description')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-teal-50 text-teal-700">
                <ClipboardList size={14} />
              </span>
              {t('disputes.order')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orderId ? (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
                <ClipboardList size={16} className="shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t('orders.order_number')}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <CopyableId value={orderId} displayValue={`${orderId.slice(0, 8)}…`} />
                    <Link href={`/orders/${orderId}`} className="text-xs text-primary hover:underline">
                      {t('common.view_detail')} →
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">-</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resolution */}
      {resolutionText && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                <Gavel size={14} />
              </span>
              {t('disputes.result')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
              <p className="text-sm leading-relaxed text-foreground/80 first-letter:uppercase whitespace-pre-wrap">{resolutionText}</p>
              <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-emerald-200/60 pt-3 text-xs">
                {resolvedAt && (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Calendar size={12} />
                    {t('disputes.resolved_at')}: <span className="font-medium tabular-nums">{formatDate(resolvedAt)}</span>
                  </span>
                )}
                {refund != null && (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Wallet size={12} />
                    {t('disputes.refund_amount')}: <span className="font-medium tabular-nums">{formatVND(Number(refund))}</span>
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evidence */}
      {evidence.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-violet-50 text-violet-700">
                <ImageIcon size={14} />
              </span>
              {t('disputes.evidence')}
              <span className="text-xs font-normal text-muted-foreground">({evidence.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {evidence.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  className="group relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted"
                  onClick={() => setLightbox(url)}
                >
                  <img src={url} alt={`Evidence ${i + 1}`} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/15" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showModal} onOpenChange={(open) => { if (!open) closeModal() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('disputes.resolve_title')}</DialogTitle>
            <DialogDescription>{t('disputes.resolve_desc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t('disputes.resolution')} *</Label>
              <Textarea rows={3} value={resolution} onChange={(e) => setResolution(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('disputes.refund_amount')}</Label>
              <Input type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>{t('common.cancel')}</Button>
            <Button onClick={handleResolve} disabled={resolve.isPending || !resolution}>
              {resolve.isPending ? t('common.processing') : t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {lightbox && (
        <button
          type="button"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-[fade-in_0.15s_ease-out]"
          onClick={() => setLightbox(null)}
          aria-label="Close"
        >
          <img src={lightbox} alt="Evidence full view" className="max-h-full max-w-full rounded-xl" />
        </button>
      )}
    </div>
  )
}

function StatTile({ icon: Icon, label, value, tone }: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: string
  tone: keyof typeof TONE
}) {
  const c = TONE[tone]
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${c.bg} ${c.text}`}>
        <Icon size={16} />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate font-heading text-base font-semibold first-letter:uppercase">{value || '-'}</p>
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
