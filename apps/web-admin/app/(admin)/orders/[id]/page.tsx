'use client'

import { use, useState } from 'react'
import {
  ArrowLeft, ArrowRight, Ban, ChevronDown, ChevronRight,
  PawPrint, Receipt, BedDouble, XCircle, Calendar, Moon, Users, Building2, ShieldCheck,
} from 'lucide-react'
import Link from 'next/link'
import {
  Avatar, AvatarImage, AvatarFallback,
  Badge, Button, Card, CardContent, Skeleton, Separator,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Textarea, Label,
} from '@petzone/ui'
import { useI18n } from '@/lib/i18n'
import { useOrderDetail, useCancelOrder } from '@/lib/hooks/use-admin'
import { displayId } from '@/lib/display-id'
import { CopyableId } from '@/components/copyable-id'

const CANCELLABLE_STATUSES = new Set(['pending_payment', 'pending', 'confirmed'])

const STATUS_VARIANT: Record<string, 'default' | 'warning' | 'info' | 'success' | 'destructive'> = {
  pending_payment: 'warning', pending: 'warning',
  confirmed: 'default', checked_in: 'info', in_progress: 'info', check_out: 'info',
  completed: 'success', cancelled: 'destructive', disputed: 'destructive',
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { t } = useI18n()

  const { data: order, isLoading } = useOrderDetail(id)
  const cancelOrder = useCancelOrder()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    pet: true, price: false, addons: false,
  })

  const toggleSection = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))

  const handleCancel = () => {
    if (!cancelReason.trim()) return
    cancelOrder.mutate(
      { id, reason: cancelReason.trim() },
      { onSuccess: () => { setCancelOpen(false); setCancelReason('') } },
    )
  }

  const closeCancel = () => { setCancelOpen(false); setCancelReason('') }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
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
  const providerObj = provider ? (Array.isArray(provider) ? provider[0] : provider) : null
  const providerName = (providerObj?.business_name as string) || '-'
  const providerDisplayId = providerObj ? displayId(providerObj, 'P') : null
  const providerAddress = providerObj?.address as string | undefined
  const providerPhone = providerObj?.phone as string | undefined

  const roomTypeRaw = order.room_types as Record<string, unknown> | Record<string, unknown>[] | null
  const roomType = roomTypeRaw ? (Array.isArray(roomTypeRaw) ? roomTypeRaw[0] : roomTypeRaw) : null
  const roomName = (roomType?.name as string) || ''

  const pets = (order.pets as Array<Record<string, unknown>>) ?? []
  const addOns = (order.add_ons as Array<Record<string, unknown>>) ?? []
  const priceBreakdown = (order.price_breakdown as Record<string, unknown>) || {}

  const ownerInfoRaw = order.users as Record<string, unknown> | Record<string, unknown>[] | null
  const ownerInfo = ownerInfoRaw ? (Array.isArray(ownerInfoRaw) ? ownerInfoRaw[0] : ownerInfoRaw) : null
  const ownerName = (ownerInfo?.full_name as string) || (ownerInfo?.email as string) || '-'
  const ownerDisplayId = ownerInfo ? displayId(ownerInfo, 'U') : null
  const ownerEmail = ownerInfo?.email as string | undefined
  const ownerPhone = ownerInfo?.phone as string | undefined
  const ownerAvatar = ownerInfo?.avatar_url as string | undefined

  const status = order.status as string
  const statusVariant = STATUS_VARIANT[status] ?? 'default'
  const totalPrice = Number(order.total_price) || 0
  const numNights = Number(order.num_nights) || 0
  const paymentVersion = Number(order.payment_version) || 1
  const cancellationPolicy = (order.cancellation_policy as string) || '-'

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <Button variant="link" asChild className="px-0">
        <Link href="/orders">
          <ArrowLeft size={16} /> {t('common.back_to_list')}
        </Link>
      </Button>

      {/* Header */}
      <Card className="mt-3">
        <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('orders.detail')}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-bold">#{order.order_number as string}</h1>
              <CopyableId value={order.order_number as string} showIcon />
              <Badge variant={statusVariant}>{t(`status.${status}` as any) || status}</Badge>
              {paymentVersion === 2 && (
                <Badge variant="outline" className="border-primary/40 bg-primary/5 text-primary">
                  v2 · 9Pay PSP
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('common.created_at')}: {formatDate(order.created_at as string)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{t('orders.total_price')}</p>
              <p className="mt-0.5 font-heading text-2xl font-bold text-primary tabular-nums">{formatVND(totalPrice)}</p>
            </div>
            {CANCELLABLE_STATUSES.has(status) && (
              <Button size="sm" variant="destructive" onClick={() => setCancelOpen(true)}>
                <Ban size={14} />
                {t('orders.cancel_order')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cancellation callout */}
      {status === 'cancelled' && (
        <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <XCircle size={16} />
            <span className="font-medium text-sm">{t('orders.cancellation_info')}</span>
          </div>
          <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <InfoRow label={t('orders.cancellation_reason')} value={(order.cancellation_reason as string) || '-'} />
            <InfoRow
              label={t('orders.cancelled_by')}
              value={order.cancelled_by ? t(`orders.cancelled_by.${order.cancelled_by as string}` as any) || (order.cancelled_by as string) : '-'}
            />
            <InfoRow label={t('orders.cancelled_at')} value={formatDateTime(order.cancelled_at as string)} />
            {order.refund_amount != null && (
              <InfoRow label={t('orders.refund_amount')} value={formatVND(Number(order.refund_amount))} />
            )}
          </dl>
        </div>
      )}

      {/* Stat tiles */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Moon} label={t('orders.num_nights')} value={String(numNights)} tone="teal" />
        <StatTile icon={PawPrint} label={t('orders.pet_info')} value={String(pets.length)} tone="amber" />
        <StatTile icon={Receipt} label={t('orders.addon_services')} value={String(addOns.length)} tone="violet" />
        <StatTile icon={ShieldCheck} label={t('orders.cancellation_policy' as any)} value={cancellationPolicy} tone="green" />
      </div>

      {/* Stay timeline */}
      <Card className="mt-6 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground">
            <BedDouble size={16} className="text-primary" />
            <span>{roomName || t('orders.no_room')}</span>
            {pets.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                <PawPrint size={12} />
                {t('orders.pets_staying')}: {pets.map((p) => (p.name as string) || '?').join(', ')}
              </span>
            )}
          </div>
          <div className="mt-4 grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <DatePill label={t('orders.check_in')} date={order.check_in_date as string} icon={Calendar} />
            <div className="flex flex-col items-center gap-1">
              <ArrowRight size={18} className="hidden text-muted-foreground sm:block" />
              <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                {numNights} {t('orders.num_nights').toLowerCase()}
              </Badge>
            </div>
            <DatePill label={t('orders.check_out')} date={order.check_out_date as string} icon={Calendar} align="end" />
          </div>
        </CardContent>
      </Card>

      {/* People */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PersonCard
          icon={Users}
          role={t('orders.owner_name')}
          name={ownerName}
          displayIdValue={ownerDisplayId}
          avatarUrl={ownerAvatar}
          contacts={[ownerEmail, ownerPhone].filter(Boolean) as string[]}
          tone="teal"
        />
        <PersonCard
          icon={Building2}
          role={t('orders.provider_name')}
          name={providerName}
          displayIdValue={providerDisplayId}
          contacts={[providerPhone, providerAddress].filter(Boolean) as string[]}
          tone="amber"
        />
      </div>

      {/* Collapsibles */}
      <div className="mt-6 space-y-4">
        <CollapsibleCard title={t('orders.pet_info')} icon={<PawPrint size={16} />} open={openSections.pet} onToggle={() => toggleSection('pet')}>
          {pets.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('orders.no_pets')}</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {pets.map((p, i) => <PetCard key={(p.id as string) || i} pet={p} />)}
            </div>
          )}
        </CollapsibleCard>

        <CollapsibleCard title={t('orders.price_breakdown')} icon={<Receipt size={16} />} open={openSections.price} onToggle={() => toggleSection('price')}>
          <dl className="space-y-2.5 text-sm">
            <PriceRow label={t('orders.base_price')} amount={Number(priceBreakdown.base_price) || 0} />
            <PriceRow label={t('orders.addon_total')} amount={Number(priceBreakdown.addon_total) || 0} />
            <PriceRow label={t('orders.platform_fee')} amount={Number(priceBreakdown.platform_fee) || 0} />
            <Separator />
            <PriceRow label={t('orders.total_price')} amount={Number(priceBreakdown.total) || totalPrice} emphasize />
          </dl>
        </CollapsibleCard>

        <CollapsibleCard title={t('orders.addon_services')} icon={<span className="text-sm">+</span>} open={openSections.addons} onToggle={() => toggleSection('addons')}>
          {addOns.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('orders.no_addons' as any) || '-'}</p>
          ) : (
            <div className="space-y-2">
              {addOns.map((svc, i) => (
                <div key={(svc.id as string) || i} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
                  <span>{svc.name as string}</span>
                  <span className="font-medium tabular-nums">{formatVND(Number(svc.price) || 0)}</span>
                </div>
              ))}
            </div>
          )}
        </CollapsibleCard>
      </div>

      <Dialog open={cancelOpen} onOpenChange={(open) => { if (!open) closeCancel() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('orders.cancel_title')}</DialogTitle>
            <DialogDescription>
              {t('orders.cancel_desc')} <strong>{order.order_number as string}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>{t('common.reason')} *</Label>
            <Textarea rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder={t('orders.cancel_reason')} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeCancel}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelOrder.isPending || !cancelReason.trim()}>
              {cancelOrder.isPending ? t('common.processing') : t('orders.cancel_confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const TONE_CLASSES: Record<string, { bg: string; text: string; border: string }> = {
  teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
}

function StatTile({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string; tone: keyof typeof TONE_CLASSES }) {
  const c = TONE_CLASSES[tone]
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${c.bg} ${c.text}`}>
        <Icon size={16} />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate font-heading text-lg font-semibold first-letter:uppercase">{value || '-'}</p>
    </div>
  )
}

function DatePill({ label, date, icon: Icon, align }: { label: string; date: string | undefined; icon: React.ComponentType<{ size?: number; className?: string }>; align?: 'start' | 'end' }) {
  return (
    <div className={`flex flex-col gap-1 ${align === 'end' ? 'sm:items-end' : ''}`}>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="inline-flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
        <Icon size={14} className="text-muted-foreground" />
        <span className="font-medium tabular-nums">{formatDate(date)}</span>
      </div>
    </div>
  )
}

function PersonCard({
  icon: Icon, role, name, displayIdValue, avatarUrl, contacts, tone,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  role: string
  name: string
  displayIdValue: string | null
  avatarUrl?: string
  contacts: string[]
  tone: keyof typeof TONE_CLASSES
}) {
  const c = TONE_CLASSES[tone]
  const initial = name?.[0]?.toUpperCase() || '?'
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-start gap-4">
        <Avatar className="h-14 w-14 border">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
          <AvatarFallback className={`${c.bg} ${c.text} font-medium`}>{initial}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className={`inline-flex items-center gap-1.5 rounded-full border ${c.border} ${c.bg} ${c.text} px-2 py-0.5 text-[11px] font-medium`}>
            <Icon size={11} />
            {role}
          </div>
          <p className="mt-1.5 truncate font-heading text-base font-semibold first-letter:uppercase">{name}</p>
          {displayIdValue && (
            <div className="mt-0.5"><CopyableId value={displayIdValue} size="xs" /></div>
          )}
          {contacts.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
              {contacts.map((line, i) => <li key={i} className="truncate first-letter:uppercase">{line}</li>)}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function PetCard({ pet }: { pet: Record<string, unknown> }) {
  const photos = pet.photos as string[] | undefined
  const photo = photos?.[0]
  const name = (pet.name as string) || '-'
  const species = pet.species as string | undefined
  const breed = pet.breed as string | undefined
  const weight = pet.weight_kg as number | undefined
  return (
    <div className="flex gap-3 rounded-xl border bg-card p-3">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">
        {photo ? <img src={photo} alt={name} className="h-full w-full object-cover" /> : <PawPrint size={20} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium first-letter:uppercase">{name}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {species && <Badge variant="outline" className="font-normal first-letter:uppercase">{species}</Badge>}
          {breed && <Badge variant="outline" className="font-normal first-letter:uppercase">{breed}</Badge>}
          {weight != null && <Badge variant="outline" className="font-normal">{weight}kg</Badge>}
        </div>
      </div>
    </div>
  )
}

function PriceRow({ label, amount, emphasize }: { label: string; amount: number; emphasize?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${emphasize ? 'pt-1' : ''}`}>
      <span className={emphasize ? 'font-medium' : 'text-muted-foreground'}>{label}</span>
      <span className={`tabular-nums ${emphasize ? 'font-heading text-base font-bold text-primary' : 'font-medium'}`}>
        {formatVND(amount)}
      </span>
    </div>
  )
}

function CollapsibleCard({ title, icon, open, onToggle, children }: {
  title: string
  icon: React.ReactNode
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/30"
        onClick={onToggle}
      >
        <span className="flex items-center gap-2 font-medium text-sm">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">{icon}</span>
          {title}
        </span>
        {open ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
      </button>
      {open && <CardContent className="pt-0 pb-4 px-4">{children}</CardContent>}
    </Card>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode | string | undefined | null }) {
  return (
    <div className="flex gap-2">
      <dt className="w-36 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="first-letter:uppercase">{value || '-'}</dd>
    </div>
  )
}

function formatDate(d: string | undefined | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateTime(d: string | undefined | null) {
  if (!d) return '-'
  return new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatVND(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}
