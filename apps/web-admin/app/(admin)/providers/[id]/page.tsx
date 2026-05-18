'use client'

import { use, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  Avatar, AvatarImage, AvatarFallback,
  Button, Badge,
  Card, CardHeader, CardTitle, CardContent,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Textarea,
  Separator,
  Skeleton,
} from '@petzone/ui'
import {
  ArrowLeft, ClipboardList, MapPin, Phone, BadgeCheck, ShieldCheck,
  Star, Mail, User, PawPrint, Scale, FileCheck2, Image as ImageIcon,
  CheckCircle2, XCircle, Building2, Landmark, AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useVerifyProvider, useOrders } from '@/lib/hooks/use-admin'
import { useI18n } from '@/lib/i18n'
import { displayId } from '@/lib/display-id'
import { CopyableId } from '@/components/copyable-id'

const statusVariant = (s: string) =>
  s === 'approved' ? 'success' : s === 'rejected' ? 'destructive' : 'warning'

const ORDER_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'default'> = {
  completed: 'success', disputed: 'destructive', cancelled: 'destructive', pending: 'warning',
}

const TONE: Record<string, { bg: string; text: string; border: string }> = {
  teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
}

export default function ProviderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { t, locale } = useI18n()
  const router = useRouter()

  const statusLabel = (s: string) =>
    s === 'approved' ? t('status.approved') : s === 'rejected' ? t('status.rejected') : t('status.pending')
  const { data: provider, isLoading } = useQuery<Record<string, unknown>>({
    queryKey: ['admin', 'provider', id],
    queryFn: () => api(`/admin/providers?page=1&limit=100`).then((res: any) =>
      res.data?.find((p: any) => p.id === id) || null
    ),
  })
  const verify = useVerifyProvider()
  const { data: ordersResp } = useOrders({ limit: 10, filters: { provider_id: [id] } })
  const recentOrders = ordersResp?.data ?? []
  const [action, setAction] = useState<'approved' | 'rejected' | null>(null)
  const [notes, setNotes] = useState('')
  const [lightbox, setLightbox] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="lg:col-span-2 h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
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
  const ownerName = (ownerInfo?.full_name as string) || (ownerInfo?.email as string) || '-'
  const ownerEmail = ownerInfo?.email as string | undefined
  const ownerPhone = ownerInfo?.phone as string | undefined
  const ownerAvatar = ownerInfo?.avatar_url as string | undefined
  const ownerInitial = ownerName?.[0]?.toUpperCase() || '?'

  const verificationStatus = provider.verification_status as string
  const bankName = provider.bank_name as string | null | undefined
  const bankHolder = provider.bank_account_holder as string | null | undefined
  const bankVerifiedAt = provider.bank_verified_at as string | null | undefined
  const hasBankInfo = Boolean(bankName && bankHolder)
  const ratingAvg = provider.rating_average ? Number(provider.rating_average) : null
  const ratingCount = Number(provider.rating_count) || 0
  const acceptedSpecies = (provider.accepted_species as string[]) || []
  const facilityPhotos = (provider.facility_photos as string[]) || []
  const coverPhoto = facilityPhotos[0]
  const weightMin = provider.weight_limit_min_kg as number | undefined
  const weightMax = provider.weight_limit_max_kg as number | undefined
  const weightLabel = weightMin || weightMax ? `${weightMin ?? 0} - ${weightMax ?? '∞'}kg` : t('providers.no_limit')

  const handleVerify = () => {
    if (!action) return
    verify.mutate(
      { id, status: action, notes: notes || undefined },
      { onSuccess: () => { setAction(null); setNotes('') } },
    )
  }

  const closeDialog = () => { setAction(null); setNotes('') }

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <Link href="/providers" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft size={16} /> {t('common.back_to_list')}
      </Link>

      {/* Header */}
      <Card className="mt-3">
        <CardContent className="flex flex-wrap items-start gap-4 p-5">
          {coverPhoto ? (
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border">
              <img src={coverPhoto} alt={provider.business_name as string} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="h-20 w-20 shrink-0 rounded-xl border bg-primary/10 flex items-center justify-center text-primary">
              <Building2 size={28} />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('providers.business_info')}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-bold first-letter:uppercase">{provider.business_name as string}</h1>
              <CopyableId value={displayId(provider, 'P')} showIcon />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant(verificationStatus)} className="gap-1">
                <BadgeCheck size={12} />
                {statusLabel(verificationStatus)}
              </Badge>
              <Badge variant={provider.is_active ? 'success' : 'muted'} className="gap-1">
                {provider.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                {provider.is_active ? t('providers.is_active') : t('providers.no')}
              </Badge>
              {provider.address ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin size={12} />
                  <span className="truncate first-letter:uppercase">{provider.address as string}</span>
                </span>
              ) : null}
            </div>
          </div>

          {verificationStatus === 'pending' && (
            <div className="flex shrink-0 gap-2">
              <Button size="sm" onClick={() => setAction('approved')}>
                <CheckCircle2 size={14} /> {t('providers.approve')}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setAction('rejected')}>
                <XCircle size={14} /> {t('providers.reject')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank info — required for VietQR v1 (direct-to-provider) + v2 payout */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Landmark size={16} className="text-primary" />
            {t('providers.bank.title')}
            {hasBankInfo ? (
              <Badge variant={bankVerifiedAt ? 'success' : 'warning'} className="ml-auto gap-1">
                {bankVerifiedAt ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
                {bankVerifiedAt ? t('providers.bank.verified') : t('providers.bank.unverified')}
              </Badge>
            ) : (
              <Badge variant="destructive" className="ml-auto">{t('providers.bank.missing')}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('providers.bank.bank')}</p>
            <p className="mt-1 font-medium">{bankName || <span className="text-muted-foreground">—</span>}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('providers.bank.holder')}</p>
            <p className="mt-1 font-medium">{bankHolder || <span className="text-muted-foreground">—</span>}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('providers.bank.verified_at')}</p>
            <p className="mt-1 font-medium">
              {bankVerifiedAt ? new Date(bankVerifiedAt).toLocaleString(locale) : <span className="text-muted-foreground">—</span>}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stat tiles */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={Star}
          label={t('providers.rating')}
          value={ratingAvg != null ? `${ratingAvg.toFixed(1)} / 5` : t('providers.no_rating')}
          sub={ratingCount ? `${ratingCount} ${t('providers.reviews_count')}` : undefined}
          tone="amber"
        />
        <StatTile
          icon={ClipboardList}
          label={t('providers.recent_orders')}
          value={String(ordersResp?.meta?.total ?? recentOrders.length)}
          tone="teal"
        />
        <StatTile
          icon={Scale}
          label={t('providers.weight_limit')}
          value={weightLabel}
          tone="violet"
        />
        <StatTile
          icon={ShieldCheck}
          label={t('providers.cancellation_policy')}
          value={(provider.cancellation_policy as string) || '-'}
          tone="green"
        />
      </div>

      {/* About + Owner */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FileCheck2 size={14} />
              </span>
              {t('common.description')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm leading-relaxed text-foreground/80 first-letter:uppercase">
              {(provider.description as string) || '-'}
            </p>

            <Separator />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldBlock icon={PawPrint} label={t('providers.accepted_species')}>
                {acceptedSpecies.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {acceptedSpecies.map((s) => (
                      <Badge key={s} variant="outline" className="border-primary/30 bg-primary/5 text-primary first-letter:uppercase">
                        {s}
                      </Badge>
                    ))}
                  </div>
                ) : <span className="text-sm text-muted-foreground">-</span>}
              </FieldBlock>

              <FieldBlock icon={FileCheck2} label={t('providers.license')}>
                <span className="text-sm font-medium tabular-nums">{(provider.license_number as string) || '-'}</span>
              </FieldBlock>

              <FieldBlock icon={MapPin} label={t('providers.address')}>
                <span className="text-sm first-letter:uppercase">{(provider.address as string) || '-'}</span>
              </FieldBlock>

              <FieldBlock icon={Phone} label={t('providers.phone')}>
                {provider.phone ? (
                  <a href={`tel:${provider.phone}`} className="text-sm font-medium text-primary hover:underline">
                    {provider.phone as string}
                  </a>
                ) : <span className="text-sm text-muted-foreground">-</span>}
              </FieldBlock>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-700">
                <User size={14} />
              </span>
              {t('providers.owner_info')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14 border">
                {ownerAvatar ? <AvatarImage src={ownerAvatar} alt={ownerName} /> : null}
                <AvatarFallback className="bg-amber-50 text-amber-700 font-medium">{ownerInitial}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-base font-semibold first-letter:uppercase">{ownerName}</p>
                {ownerInfo?.id ? (
                  <div className="mt-0.5"><CopyableId value={displayId(ownerInfo, 'U')} size="xs" /></div>
                ) : null}
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              {ownerEmail && (
                <a href={`mailto:${ownerEmail}`} className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 hover:bg-muted/60 transition-colors">
                  <Mail size={14} className="text-muted-foreground" />
                  <span className="truncate">{ownerEmail}</span>
                </a>
              )}
              {ownerPhone && (
                <a href={`tel:${ownerPhone}`} className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 hover:bg-muted/60 transition-colors">
                  <Phone size={14} className="text-muted-foreground" />
                  <span className="truncate font-medium">{ownerPhone}</span>
                </a>
              )}
              <div className="flex items-center gap-2 px-1 pt-2 text-xs text-muted-foreground">
                <span>{t('common.created_at')}:</span>
                <span className="tabular-nums">{formatDate(provider.created_at as string)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Facility Photos */}
      {facilityPhotos.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-violet-50 text-violet-700">
                <ImageIcon size={14} />
              </span>
              {t('providers.photos')}
              <span className="text-xs font-normal text-muted-foreground">({facilityPhotos.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {facilityPhotos.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  className="group relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted"
                  onClick={() => setLightbox(url)}
                >
                  <img src={url} alt={`Facility ${i + 1}`} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/15" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent orders */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-teal-50 text-teal-700">
              <ClipboardList size={14} />
            </span>
            {t('providers.recent_orders')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('providers.no_recent_orders')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">{t('orders.order_number')}</th>
                    <th className="pb-2 pr-4 font-medium">{t('common.status')}</th>
                    <th className="pb-2 pr-4 font-medium">{t('orders.check_in')}</th>
                    <th className="pb-2 font-medium text-right">{t('orders.total_price')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((ord) => {
                    const status = ord.status as string
                    return (
                      <tr
                        key={ord.id as string}
                        className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/50"
                        onClick={() => router.push(`/orders/${ord.id}`)}
                      >
                        <td className="py-2.5 pr-4 font-mono text-xs">{ord.order_number as string}</td>
                        <td className="py-2.5 pr-4">
                          <Badge variant={ORDER_STATUS_VARIANT[status] || 'default'}>
                            {t(`status.${status}` as any)}
                          </Badge>
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{formatDate(ord.check_in_date as string)}</td>
                        <td className="py-2.5 text-right font-medium tabular-nums">{formatVND(Number(ord.total_price) || 0)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification dialog */}
      <Dialog open={action !== null} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === 'approved' ? t('providers.approve_title') : t('providers.reject_title')}</DialogTitle>
          </DialogHeader>
          <Textarea rows={3} placeholder={t('common.note')} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t('common.cancel')}</Button>
            <Button variant={action === 'approved' ? 'default' : 'destructive'} onClick={handleVerify} disabled={verify.isPending}>
              {verify.isPending ? t('common.processing') : t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {lightbox && (
        <button
          type="button"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-[fade-in_0.15s_ease-out]"
          onClick={() => setLightbox(null)}
          aria-label="Close"
        >
          <img src={lightbox} alt="Facility full view" className="max-h-full max-w-full rounded-xl" />
        </button>
      )}
    </div>
  )
}

function StatTile({ icon: Icon, label, value, sub, tone }: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: string
  sub?: string
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
      {sub ? <p className="text-[11px] text-muted-foreground first-letter:uppercase">{sub}</p> : null}
    </div>
  )
}

function FieldBlock({ icon: Icon, label, children }: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon size={12} />
        {label}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

function formatDate(d: string | undefined) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatVND(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}
