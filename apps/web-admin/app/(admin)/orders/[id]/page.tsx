'use client'

import { use, useState } from 'react'
import { ArrowLeft, ChevronDown, ChevronRight, CreditCard, PawPrint, Camera, Receipt, BedDouble } from 'lucide-react'
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
import { useI18n } from '@/lib/i18n'
import { useOrderDetail } from '@/lib/hooks/use-admin'
import { MOCK_ORDER_EXTENDED } from '@/lib/mock-data'
import { displayId } from '@/lib/display-id'

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

  const { data: order, isLoading } = useOrderDetail(id)

  // Collapsible sections state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    payment: true,
    pet: true,
    price: false,
    photos: false,
    addons: false,
  })

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

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
  const providerObj = provider ? (Array.isArray(provider) ? provider[0] : provider) : null
  const providerName = (providerObj?.business_name as string) || MOCK_ORDER_EXTENDED.provider_name
  const providerDisplayId = providerObj ? displayId(providerObj, 'P') : null

  const roomTypeRaw = order.room_types as Record<string, unknown> | Record<string, unknown>[] | null
  const roomType = roomTypeRaw ? (Array.isArray(roomTypeRaw) ? roomTypeRaw[0] : roomTypeRaw) : null
  const roomName = (roomType?.name as string) || ''
  const pets = (order.pets as Array<Record<string, unknown>>) ?? []
  const petNames = pets.map((p) => p.name as string).filter(Boolean)
  const roomAndPets = roomName
    ? petNames.length ? `${roomName} — ${petNames.join(', ')}` : roomName
    : petNames.length ? petNames.join(', ') : t('orders.no_room')

  const ownerInfoRaw = order.users as Record<string, unknown> | Record<string, unknown>[] | null
  const ownerInfo = ownerInfoRaw ? (Array.isArray(ownerInfoRaw) ? ownerInfoRaw[0] : ownerInfoRaw) : null
  const ownerName = (ownerInfo?.full_name as string) || (ownerInfo?.email as string) || MOCK_ORDER_EXTENDED.owner_name
  const ownerDisplayId = ownerInfo ? displayId(ownerInfo, 'U') : null

  const ext = MOCK_ORDER_EXTENDED

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
        {/* Basic Order Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('orders.detail')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <InfoRow
                label={t('orders.owner_name')}
                value={
                  <span className="inline-flex items-center gap-2">
                    <span>{ownerName}</span>
                    {ownerDisplayId ? (
                      <span className="rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {ownerDisplayId}
                      </span>
                    ) : null}
                  </span>
                }
              />
              <InfoRow
                label={t('orders.provider_name')}
                value={
                  <span className="inline-flex items-center gap-2">
                    <span>{providerName}</span>
                    {providerDisplayId ? (
                      <span className="rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {providerDisplayId}
                      </span>
                    ) : null}
                  </span>
                }
              />
              <InfoRow
                label={t('orders.room_and_pets')}
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <BedDouble size={14} className="text-muted-foreground" />
                    <span className="font-medium">{roomAndPets}</span>
                  </span>
                }
              />
              <InfoRow label={t('orders.check_in')} value={formatDate(order.check_in_date as string)} />
              <InfoRow label={t('orders.check_out')} value={formatDate(order.check_out_date as string)} />
              <InfoRow label={t('orders.num_nights')} value={String(order.num_nights ?? '-')} />
              <InfoRow label={t('orders.total_price')} value={order.total_price ? formatVND(order.total_price as number) : '-'} />
              <InfoRow label={t('common.created_at')} value={formatDate(order.created_at as string)} />
            </dl>
          </CardContent>
        </Card>

        {/* Payment & Disbursement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard size={16} />
              {t('orders.payment_method')} / {t('orders.disbursement_status')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <InfoRow label={t('orders.payment_method')} value={ext.payment_method} />
              <InfoRow label={t('orders.disbursement_status')} value={
                <Badge variant={ext.disbursement_status === 'completed' ? 'success' : 'warning'}>
                  {ext.disbursement_status === 'completed' ? 'Đã giải ngân' : 'Chờ giải ngân'}
                </Badge>
              } />
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Collapsible Sections */}
      <div className="mt-6 space-y-4">
        {/* Pet Information */}
        <CollapsibleCard
          title={t('orders.pet_info')}
          icon={<PawPrint size={16} />}
          open={openSections.pet}
          onToggle={() => toggleSection('pet')}
        >
          {pets.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('orders.no_pets')}</p>
          ) : (
            <div className="space-y-4">
              {pets.map((p, i) => (
                <div key={(p.id as string) || i}>
                  {i > 0 && <Separator className="mb-4" />}
                  <p className="mb-2 font-medium text-sm">{p.name as string}</p>
                  <dl className="space-y-2 text-sm">
                    <InfoRow label="Loại" value={(p.species as string) || '-'} />
                    <InfoRow label="Giống" value={(p.breed as string) || '-'} />
                    <InfoRow label="Cân nặng" value={p.weight_kg ? `${p.weight_kg} kg` : '-'} />
                  </dl>
                </div>
              ))}
            </div>
          )}
        </CollapsibleCard>

        {/* Price Breakdown */}
        <CollapsibleCard
          title={t('orders.price_breakdown')}
          icon={<Receipt size={16} />}
          open={openSections.price}
          onToggle={() => toggleSection('price')}
        >
          <dl className="space-y-3 text-sm">
            <InfoRow label={t('orders.base_price')} value={formatVND(ext.price_breakdown.base_price)} />
            <InfoRow label={t('orders.addon_total')} value={formatVND(ext.price_breakdown.addon_total)} />
            <InfoRow label={t('orders.platform_fee')} value={formatVND(ext.price_breakdown.platform_fee)} />
            <Separator />
            <InfoRow label={t('orders.total_price')} value={<strong>{formatVND(ext.price_breakdown.total)}</strong>} />
          </dl>
        </CollapsibleCard>

        {/* Add-on Services */}
        <CollapsibleCard
          title={t('orders.addon_services')}
          icon={<span className="text-sm">+</span>}
          open={openSections.addons}
          onToggle={() => toggleSection('addons')}
        >
          <div className="space-y-2">
            {ext.addon_services.map((svc, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{svc.name}</span>
                <span className="font-medium">{formatVND(svc.price)}</span>
              </div>
            ))}
          </div>
        </CollapsibleCard>

        {/* Check-in/Check-out Photos */}
        <CollapsibleCard
          title={`${t('orders.checkin_photos')} / ${t('orders.checkout_photos')}`}
          icon={<Camera size={16} />}
          open={openSections.photos}
          onToggle={() => toggleSection('photos')}
        >
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">{t('orders.checkin_photos')}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ext.checkin_photos.map((url, i) => (
                  <img key={i} src={url} alt={`Check-in ${i + 1}`} className="h-24 w-full rounded-lg object-cover border" />
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2">{t('orders.checkout_photos')}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ext.checkout_photos.map((url, i) => (
                  <img key={i} src={url} alt={`Check-out ${i + 1}`} className="h-24 w-full rounded-lg object-cover border" />
                ))}
              </div>
            </div>
          </div>
        </CollapsibleCard>
      </div>
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
    <Card>
      <button
        type="button"
        className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors rounded-t-xl"
        onClick={onToggle}
      >
        <span className="flex items-center gap-2 font-medium text-sm">
          {icon}
          {title}
        </span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {open && (
        <CardContent className="pt-0 pb-4 px-4">
          {children}
        </CardContent>
      )}
    </Card>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode | string | undefined | null }) {
  return (
    <div className="flex gap-2">
      <dt className="w-36 shrink-0 text-muted-foreground">{label}</dt>
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
