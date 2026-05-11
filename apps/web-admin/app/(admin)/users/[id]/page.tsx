'use client'

import { use, useState } from 'react'
import { ArrowLeft, PawPrint, MapPin, ClipboardList, Ban, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import {
  Button,
  Badge,
  Card, CardHeader, CardTitle, CardContent,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Textarea,
  Label,
  Checkbox,
  Skeleton,
  Avatar, AvatarImage, AvatarFallback,
  Separator,
} from '@petzone/ui'
import { useSuspendUser, useReactivateUser, useOwnerPets, useUserDetail } from '@/lib/hooks/use-admin'
import { MOCK_RECENT_ORDERS } from '@/lib/mock-data'
import { displayId } from '@/lib/display-id'

const roleVariant = (r: string) =>
  r === 'admin' ? 'muted' : r === 'provider' ? 'default' : 'info'
const ROLE_KEY: Record<string, string> = {
  owner: 'role.owner', provider: 'role.provider', admin: 'role.admin',
}

const statusVariant = (s: string) =>
  s === 'active' ? 'success' : 'destructive'
const STATUS_KEY: Record<string, string> = {
  active: 'status.active', suspended: 'status.suspended', banned: 'status.banned',
}

const ORDER_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'default'> = {
  completed: 'success', disputed: 'destructive', cancelled: 'destructive', pending: 'warning',
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useI18n()
  const { id } = use(params)
  const router = useRouter()
  const { data: user, isLoading } = useUserDetail(id)
  const suspend = useSuspendUser()
  const reactivate = useReactivateUser()
  const isOwner = (user?.role as string) === 'owner'
  const { data: petsResp } = useOwnerPets(isOwner ? id : undefined)
  const pets = petsResp?.data ?? []
  const [showModal, setShowModal] = useState(false)
  const [reason, setReason] = useState('')
  const [isPermanent, setIsPermanent] = useState(false)
  const [showReactivate, setShowReactivate] = useState(false)
  const [reactivateNote, setReactivateNote] = useState('')

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div>
        <Link href="/users" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft size={16} /> {t('common.back')}
        </Link>
        <p className="mt-4 text-muted-foreground">{t('users.not_found')}</p>
      </div>
    )
  }

  const handleSuspend = () => {
    if (!reason) return
    suspend.mutate(
      { id, reason, is_permanent: isPermanent },
      { onSuccess: () => { setShowModal(false); setReason(''); setIsPermanent(false) } },
    )
  }

  const closeDialog = () => { setShowModal(false); setReason(''); setIsPermanent(false) }

  const handleReactivate = () => {
    reactivate.mutate(
      { id, note: reactivateNote || undefined },
      { onSuccess: () => { setShowReactivate(false); setReactivateNote('') } },
    )
  }
  const closeReactivate = () => { setShowReactivate(false); setReactivateNote('') }

  return (
    <div>
      <Link href="/users" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft size={16} /> {t('common.back_to_list')}
      </Link>

      <div className="mt-4 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 text-xl">
            <AvatarImage src={user.avatar_url as string} alt={user.full_name as string} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {((user.full_name as string) || '?')[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl font-bold">{user.full_name as string}</h1>
              <span className="rounded-md border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                {displayId(user, 'U')}
              </span>
            </div>
            <div className="mt-1 flex gap-2">
              <Badge variant={roleVariant(user.role as string)}>
                {t((ROLE_KEY[user.role as string] || 'role.owner') as any)}
              </Badge>
              <Badge variant={statusVariant(user.status as string)}>
                {t((STATUS_KEY[user.status as string] || 'status.active') as any)}
              </Badge>
            </div>
          </div>
        </div>
        {user.status === 'active' && (
          <Button variant="destructive" onClick={() => setShowModal(true)}>{t('users.suspend')}</Button>
        )}
      </div>

      {(user.status === 'suspended' || user.status === 'banned') && (() => {
        const s = user.suspension as { reason: string | null; is_permanent: boolean; suspended_at: string } | null
        return (
          <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-destructive/10 p-2 text-destructive">
                <Ban size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading font-semibold text-destructive">{t('users.suspension_info')}</h3>
                    <Badge variant="destructive">
                      {t((STATUS_KEY[user.status as string] || 'status.suspended') as any)}
                    </Badge>
                    {s?.is_permanent && (
                      <Badge variant="destructive">{t('users.permanent_ban')}</Badge>
                    )}
                  </div>
                  <Button size="sm" className="gap-1.5" onClick={() => setShowReactivate(true)}>
                    <CheckCircle2 size={14} />
                    {t('users.reactivate')}
                  </Button>
                </div>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex gap-2">
                    <dt className="w-32 shrink-0 text-muted-foreground">{t('users.suspension_reason')}</dt>
                    <dd className="font-medium">{s?.reason || t('users.suspension_no_reason')}</dd>
                  </div>
                  {s?.suspended_at && (
                    <div className="flex gap-2">
                      <dt className="w-32 shrink-0 text-muted-foreground">{t('users.suspension_date')}</dt>
                      <dd>{formatDate(s.suspended_at)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        )
      })()}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('users.personal_info')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow label={t('users.email')} value={user.email as string} />
            <Separator />
            <InfoRow label={t('users.phone')} value={user.phone as string} />
            <Separator />
            <InfoRow label={t('users.role')} value={user.role as string} />
            <Separator />
            <InfoRow label={t('users.social_login')} value={user.social_provider as string} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('users.activity')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow label={t('common.created_at')} value={formatDate(user.created_at as string)} />
            <Separator />
            <InfoRow label={t('users.last_login')} value={formatDate(user.last_login_at as string)} />
            <Separator />
            <InfoRow label={t('common.updated_at')} value={formatDate(user.updated_at as string)} />
          </CardContent>
        </Card>
      </div>

      {/* Default Address */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin size={16} />
            {t('users.default_address')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {(user.default_address as string) || '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM'}
          </p>
        </CardContent>
      </Card>

      {/* Pet Information - uses real API data from useOwnerPets */}
      {isOwner && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <PawPrint size={18} className="text-amber-600" />
              {t('users.pet_info')}
              <span className="text-sm font-normal text-muted-foreground">({pets.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pets.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('users.no_pets')}</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pets.map((p) => {
                  const photo = Array.isArray(p.photos) && (p.photos as string[])[0]
                  const species = p.species as string
                  return (
                    <Link
                      key={p.id as string}
                      href={`/pets/${p.id}`}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary hover:bg-muted/50"
                    >
                      <Avatar className="h-12 w-12">
                        {photo ? <AvatarImage src={photo} alt={p.name as string} /> : null}
                        <AvatarFallback className="bg-amber-50 text-amber-600">
                          <PawPrint size={20} />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{p.name as string}</span>
                          <Badge variant={p.is_active ? 'success' : 'destructive'} className="shrink-0 text-[10px]">
                            {t(p.is_active ? 'pets.active' : 'pets.inactive')}
                          </Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {species}
                          {p.breed ? ` · ${p.breed as string}` : ''}
                          {p.weight_kg != null ? ` · ${p.weight_kg}kg` : ''}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent 5 Orders */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList size={16} />
            {t('users.recent_orders')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {MOCK_RECENT_ORDERS.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('users.no_recent_orders')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">{t('orders.order_number')}</th>
                    <th className="pb-2 pr-4 font-medium">{t('common.status')}</th>
                    <th className="pb-2 pr-4 font-medium">{t('orders.check_in')}</th>
                    <th className="pb-2 font-medium">{t('orders.total_price')}</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_RECENT_ORDERS.map((ord) => (
                    <tr
                      key={ord.id}
                      className="border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push(`/orders/${ord.id}`)}
                    >
                      <td className="py-2.5 pr-4 font-mono text-xs">{ord.order_number}</td>
                      <td className="py-2.5 pr-4">
                        <Badge variant={ORDER_STATUS_VARIANT[ord.status] || 'default'}>
                          {t(`status.${ord.status}` as any)}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{formatDate(ord.check_in_date)}</td>
                      <td className="py-2.5 font-medium">{formatVND(ord.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showReactivate} onOpenChange={(open) => { if (!open) closeReactivate() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users.reactivate_title')}</DialogTitle>
            <DialogDescription>
              {t('users.reactivate_desc')} <strong>{user.full_name as string}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>{t('users.reactivate_note')}</Label>
            <Textarea
              rows={3}
              value={reactivateNote}
              onChange={(e) => setReactivateNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeReactivate}>{t('common.cancel')}</Button>
            <Button onClick={handleReactivate} disabled={reactivate.isPending}>
              {reactivate.isPending ? t('common.processing') : t('users.reactivate_confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showModal} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users.suspend_title')}</DialogTitle>
            <DialogDescription>
              {t('users.suspend_desc')} <strong>{user.full_name as string}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t('common.reason')} *</Label>
              <Textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="permanent-detail"
                checked={isPermanent}
                onCheckedChange={(checked) => setIsPermanent(checked === true)}
              />
              <Label htmlFor="permanent-detail" className="cursor-pointer">{t('users.permanent_ban')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleSuspend} disabled={suspend.isPending || !reason}>
              {suspend.isPending ? t('common.processing') : t('common.confirm')}
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

function formatVND(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}
