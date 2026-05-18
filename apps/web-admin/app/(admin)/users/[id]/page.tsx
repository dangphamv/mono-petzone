'use client'

import { use, useState } from 'react'
import {
  ArrowLeft, PawPrint, MapPin, ClipboardList, Ban, CheckCircle2,
  Mail, Phone, Calendar, Clock, Globe, ShieldCheck, AlertTriangle,
} from 'lucide-react'
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
} from '@petzone/ui'
import { useSuspendUser, useReactivateUser, useOwnerPets, useUserDetail, useOrders } from '@/lib/hooks/use-admin'
import { displayId } from '@/lib/display-id'
import { CopyableId } from '@/components/copyable-id'

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

const TONE: Record<string, { bg: string; text: string; border: string }> = {
  teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
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
  const { data: ordersResp } = useOrders({ limit: 10, filters: { owner_id: [id] } })
  const recentOrders = ordersResp?.data ?? []
  const [showModal, setShowModal] = useState(false)
  const [reason, setReason] = useState('')
  const [isPermanent, setIsPermanent] = useState(false)
  const [showReactivate, setShowReactivate] = useState(false)
  const [reactivateNote, setReactivateNote] = useState('')

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

  const fullName = (user.full_name as string) || (user.email as string) || '?'
  const role = user.role as string | null | undefined
  const status = (user.status as string) || 'active'
  const email = user.email as string | undefined
  const phone = user.phone as string | undefined
  const social = user.social_provider as string | undefined
  const lastLogin = user.last_login_at as string | undefined
  const isSuspended = status === 'suspended' || status === 'banned'

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <Link href="/users" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft size={16} /> {t('common.back_to_list')}
      </Link>

      {/* Header */}
      <Card className="mt-3">
        <CardContent className="flex flex-wrap items-start gap-4 p-5">
          <Avatar className="h-20 w-20 shrink-0 border text-2xl">
            <AvatarImage src={user.avatar_url as string} alt={fullName} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {fullName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('users.personal_info')}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-bold first-letter:uppercase truncate">{fullName}</h1>
              <CopyableId value={displayId(user, 'U')} showIcon />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {role ? (
                <Badge variant="default" className="gap-1">
                  <ShieldCheck size={12} />
                  {t((ROLE_KEY[role] || 'role.owner') as any)}
                </Badge>
              ) : (
                <Badge variant="muted" className="italic">
                  {t('common.not_set')}
                </Badge>
              )}
              <Badge variant={statusVariant(status)} className="gap-1">
                {status === 'active' ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                {t((STATUS_KEY[status] || 'status.active') as any)}
              </Badge>
              {email ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail size={12} />
                  <span className="truncate">{email}</span>
                </span>
              ) : null}
            </div>
          </div>

          {status === 'active' && (
            <Button size="sm" variant="destructive" onClick={() => setShowModal(true)}>
              <Ban size={14} /> {t('users.suspend')}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Suspension callout */}
      {isSuspended && (() => {
        const s = user.suspension as { reason: string | null; is_permanent: boolean; suspended_at: string } | null
        return (
          <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-destructive/10 p-2 text-destructive">
                <AlertTriangle size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading font-semibold text-destructive">{t('users.suspension_info')}</h3>
                    {s?.is_permanent && <Badge variant="destructive">{t('users.permanent_ban')}</Badge>}
                  </div>
                  <Button size="sm" className="gap-1.5" onClick={() => setShowReactivate(true)}>
                    <CheckCircle2 size={14} />
                    {t('users.reactivate')}
                  </Button>
                </div>
                <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <div className="flex gap-2">
                    <dt className="w-28 shrink-0 text-muted-foreground">{t('users.suspension_reason')}</dt>
                    <dd className="font-medium first-letter:uppercase">{s?.reason || t('users.suspension_no_reason')}</dd>
                  </div>
                  {s?.suspended_at && (
                    <div className="flex gap-2">
                      <dt className="w-28 shrink-0 text-muted-foreground">{t('users.suspension_date')}</dt>
                      <dd className="tabular-nums">{formatDate(s.suspended_at)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Stat tiles */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Calendar} label={t('common.created_at')} value={formatDate(user.created_at as string)} tone="teal" />
        <StatTile icon={Clock} label={t('users.last_login')} value={formatDate(lastLogin)} tone="violet" />
        {isOwner && (
          <StatTile icon={PawPrint} label={t('users.pet_info')} value={String(pets.length)} tone="amber" />
        )}
        <StatTile
          icon={ClipboardList}
          label={t('users.recent_orders')}
          value={String(ordersResp?.meta?.total ?? recentOrders.length)}
          tone="green"
        />
        {!isOwner && (
          <StatTile icon={ShieldCheck} label={t('users.role')} value={role ? t((ROLE_KEY[role] || 'role.owner') as any) : t('common.not_set')} tone="amber" />
        )}
      </div>

      {/* Contact + Account */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Mail size={14} />
              </span>
              {t('users.personal_info')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ContactRow icon={Mail} label={t('users.email')} value={email} href={email ? `mailto:${email}` : undefined} />
              <ContactRow icon={Phone} label={t('users.phone')} value={phone} href={phone ? `tel:${phone}` : undefined} />
              <ContactRow
                icon={ShieldCheck}
                label={t('users.role')}
                value={role ? t((ROLE_KEY[role] || 'role.owner') as any) : t('common.not_set')}
              />
              <ContactRow icon={Globe} label={t('users.social_login')} value={social} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-700">
                <MapPin size={14} />
              </span>
              {t('users.default_address')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground/80 first-letter:uppercase">
              {(user.default_address as string) || '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM'}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-3 text-xs">
              <div>
                <p className="text-muted-foreground">{t('common.updated_at')}</p>
                <p className="mt-0.5 font-medium tabular-nums">{formatDate(user.updated_at as string)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('users.last_login')}</p>
                <p className="mt-0.5 font-medium tabular-nums">{formatDate(lastLogin)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pet grid (owner only) */}
      {isOwner && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-700">
                <PawPrint size={14} />
              </span>
              {t('users.pet_info')}
              <span className="text-xs font-normal text-muted-foreground">({pets.length})</span>
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
                      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/40 hover:shadow-md"
                    >
                      <Avatar className="h-14 w-14 shrink-0">
                        {photo ? <AvatarImage src={photo} alt={p.name as string} /> : null}
                        <AvatarFallback className="bg-amber-50 text-amber-700">
                          <PawPrint size={20} />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium first-letter:uppercase group-hover:text-primary transition-colors">{p.name as string}</span>
                          <Badge variant={p.is_active ? 'success' : 'destructive'} className="shrink-0 text-[10px]">
                            {t(p.is_active ? 'pets.active' : 'pets.inactive')}
                          </Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground first-letter:uppercase">
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

      {/* Recent orders */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-teal-50 text-teal-700">
              <ClipboardList size={14} />
            </span>
            {t('users.recent_orders')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('users.no_recent_orders')}</p>
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

      <Dialog open={showReactivate} onOpenChange={(open) => { if (!open) closeReactivate() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users.reactivate_title')}</DialogTitle>
            <DialogDescription>
              {t('users.reactivate_desc')} <strong>{fullName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>{t('users.reactivate_note')}</Label>
            <Textarea rows={3} value={reactivateNote} onChange={(e) => setReactivateNote(e.target.value)} />
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
              {t('users.suspend_desc')} <strong>{fullName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t('common.reason')} *</Label>
              <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="permanent-detail" checked={isPermanent} onCheckedChange={(checked) => setIsPermanent(checked === true)} />
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

function ContactRow({ icon: Icon, label, value, href }: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: string | undefined | null
  href?: string
}) {
  const content = (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5 transition-colors hover:bg-muted/60">
      <Icon size={16} className="shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium first-letter:uppercase">{value || '-'}</p>
      </div>
    </div>
  )
  return href && value ? <a href={href}>{content}</a> : <div>{content}</div>
}

function formatDate(d: string | undefined | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatVND(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}
