'use client'

import { use, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Button,
  Badge,
  Card, CardHeader, CardTitle, CardContent,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Textarea,
  Separator,
  Skeleton,
} from '@petzone/ui'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useVerifyProvider } from '@/lib/hooks/use-admin'
import { useI18n } from '@/lib/i18n'

const statusVariant = (s: string) =>
  s === 'approved' ? 'success' : s === 'rejected' ? 'destructive' : 'warning'

export default function ProviderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { t } = useI18n()

  const statusLabel = (s: string) =>
    s === 'approved' ? t('status.approved') : s === 'rejected' ? t('status.rejected') : t('status.pending')
  const { data: provider, isLoading } = useQuery<Record<string, unknown>>({
    queryKey: ['admin', 'provider', id],
    queryFn: () => api(`/admin/providers?page=1&limit=100`).then((res: any) =>
      res.data?.find((p: any) => p.id === id) || null
    ),
  })
  const verify = useVerifyProvider()
  const [action, setAction] = useState<'approved' | 'rejected' | null>(null)
  const [notes, setNotes] = useState('')

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
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

  if (!provider) {
    return (
      <div>
        <Link href="/providers" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft size={16} /> {t('common.back')}
        </Link>
        <p className="mt-4 text-muted-foreground">{t('providers.not_found')}</p>
      </div>
    )
  }

  const user = provider.users as Record<string, unknown> | Record<string, unknown>[] | null
  const ownerInfo = user ? (Array.isArray(user) ? user[0] : user) : null

  const handleVerify = () => {
    if (!action) return
    verify.mutate(
      { id, status: action, notes: notes || undefined },
      { onSuccess: () => { setAction(null); setNotes('') } },
    )
  }

  const closeDialog = () => { setAction(null); setNotes('') }

  return (
    <div>
      <Link href="/providers" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft size={16} /> {t('common.back_to_list')}
      </Link>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{provider.business_name as string}</h1>
          <Badge variant={statusVariant(provider.verification_status as string)} className="mt-1">
            {statusLabel(provider.verification_status as string)}
          </Badge>
        </div>
        {provider.verification_status === 'pending' && (
          <div className="flex gap-2">
            <Button onClick={() => setAction('approved')}>{t('providers.approve')}</Button>
            <Button variant="destructive" onClick={() => setAction('rejected')}>{t('providers.reject')}</Button>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('providers.business_info')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <InfoRow label={t('providers.address')} value={provider.address as string} />
              <InfoRow label={t('providers.phone')} value={provider.phone as string} />
              <InfoRow label={t('providers.license')} value={provider.license_number as string} />
              <InfoRow label={t('common.description')} value={provider.description as string} />
              <InfoRow label={t('providers.accepted_species')} value={(provider.accepted_species as string[])?.join(', ')} />
              <InfoRow label={t('providers.cancellation_policy')} value={provider.cancellation_policy as string} />
              <InfoRow
                label={t('providers.weight_limit')}
                value={
                  provider.weight_limit_min_kg || provider.weight_limit_max_kg
                    ? `${provider.weight_limit_min_kg ?? 0} - ${provider.weight_limit_max_kg ?? '...'}kg`
                    : t('providers.no_limit')
                }
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('providers.owner_info')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <InfoRow label={t('providers.name')} value={ownerInfo?.full_name as string} />
              <InfoRow label={t('providers.email')} value={ownerInfo?.email as string} />
            </dl>

            <Separator className="my-4" />

            <h3 className="font-heading text-base font-semibold">{t('providers.review_info')}</h3>
            <dl className="mt-3 space-y-3 text-sm">
              <InfoRow
                label={t('providers.rating')}
                value={
                  provider.rating_average
                    ? `${Number(provider.rating_average).toFixed(1)} / 5 (${provider.rating_count} ${t('providers.reviews_count')})`
                    : t('providers.no_rating')
                }
              />
            </dl>

            <Separator className="my-4" />

            <h3 className="font-heading text-base font-semibold">{t('providers.status_info')}</h3>
            <dl className="mt-3 space-y-3 text-sm">
              <InfoRow label={t('providers.is_active')} value={provider.is_active ? t('providers.yes') : t('providers.no')} />
              <InfoRow label={t('common.created_at')} value={formatDate(provider.created_at as string)} />
            </dl>
          </CardContent>
        </Card>
      </div>

      {Array.isArray(provider.facility_photos) && provider.facility_photos.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t('providers.photos')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {(provider.facility_photos as string[]).map((url, i) => (
                <img key={i} src={url} alt={`Facility ${i + 1}`} className="h-32 w-full rounded-lg object-cover" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={action !== null} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === 'approved' ? t('providers.approve_title') : t('providers.reject_title')}</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={3}
            placeholder={t('common.note')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t('common.cancel')}</Button>
            <Button
              variant={action === 'approved' ? 'default' : 'destructive'}
              onClick={handleVerify}
              disabled={verify.isPending}
            >
              {verify.isPending ? t('common.processing') : t('common.confirm')}
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

function formatDate(d: string | undefined) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
