'use client'

import { use, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
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
  Separator,
  Skeleton,
  Textarea,
} from '@petzone/ui'
import { api } from '@/lib/api'
import { useResolveDispute } from '@/lib/hooks/use-admin'

const STATUS_VARIANT: Record<string, 'default' | 'warning' | 'info' | 'success' | 'destructive'> = {
  open: 'warning', resolved: 'success',
  owner: 'info', provider: 'default',
}
const STATUS_KEY: Record<string, string> = {
  open: 'status.open', resolved: 'status.resolved',
  owner: 'role.owner', provider: 'role.provider',
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

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-5 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
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

  return (
    <div>
      <Button variant="link" asChild className="px-0">
        <Link href="/disputes">
          <ArrowLeft size={16} /> {t('common.back_to_list')}
        </Link>
      </Button>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t('nav.disputes')}</h1>
          <Badge variant={STATUS_VARIANT[dispute.status as string] ?? 'default'}>{t((STATUS_KEY[dispute.status as string] ?? dispute.status) as any)}</Badge>
        </div>
        {dispute.status === 'open' && (
          <Button onClick={() => setShowModal(true)}>{t('disputes.resolve')}</Button>
        )}
      </div>

      <Separator className="my-6" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('disputes.info')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <InfoRow label={t('disputes.order')} value={dispute.order_id as string} />
              <InfoRow label={t('disputes.opened_by')} value={dispute.opened_by_role as string} />
              <InfoRow label={t('common.created_at')} value={formatDate(dispute.created_at as string)} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('disputes.description_label')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{(dispute.description as string) || t('disputes.no_description')}</p>
          </CardContent>
        </Card>

        {dispute.resolution != null && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t('disputes.result')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{dispute.resolution as string}</p>
              {dispute.resolved_at != null && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {t('disputes.resolved_at')}: {formatDate(dispute.resolved_at as string)}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {Array.isArray(dispute.evidence_photos) && dispute.evidence_photos.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t('disputes.evidence')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {(dispute.evidence_photos as string[]).map((url, i) => (
                  <img key={i} src={url} alt={`Evidence ${i + 1}`} className="h-32 w-full rounded-lg object-cover" />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={(open) => { if (!open) closeModal() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('disputes.resolve_title')}</DialogTitle>
            <DialogDescription>{t('disputes.resolve_desc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">{t('disputes.resolution')} *</label>
              <Textarea
                className="mt-1"
                rows={3}
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('disputes.refund_amount')}</label>
              <Input
                type="number"
                className="mt-1"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
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
