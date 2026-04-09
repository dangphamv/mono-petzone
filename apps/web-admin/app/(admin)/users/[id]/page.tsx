'use client'

import { use, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
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
import { api } from '@/lib/api'
import { useSuspendUser } from '@/lib/hooks/use-admin'

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

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useI18n()
  const { id } = use(params)
  const { data: user, isLoading } = useQuery<Record<string, unknown>>({
    queryKey: ['admin', 'user', id],
    queryFn: () => api(`/admin/users?page=1&limit=100`).then((res: any) =>
      res.data?.find((u: any) => u.id === id) || null
    ),
  })
  const suspend = useSuspendUser()
  const [showModal, setShowModal] = useState(false)
  const [reason, setReason] = useState('')
  const [isPermanent, setIsPermanent] = useState(false)

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
            <h1 className="font-heading text-2xl font-bold">{user.full_name as string}</h1>
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
