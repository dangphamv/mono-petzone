'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users as UsersIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import {
  Button, Badge,
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Textarea, Label, Checkbox, Skeleton,
} from '@petzone/ui'
import { useUsers, useSuspendUser } from '@/lib/hooks/use-admin'

type User = Record<string, unknown>

const ROLE_VARIANT: Record<string, 'info' | 'default' | 'muted'> = {
  owner: 'info', provider: 'default', admin: 'muted',
}
const ROLE_KEY: Record<string, string> = {
  owner: 'role.owner', provider: 'role.provider', admin: 'role.admin',
}
const STATUS_VARIANT: Record<string, 'success' | 'destructive'> = {
  active: 'success', suspended: 'destructive', banned: 'destructive',
}
const STATUS_KEY: Record<string, string> = {
  active: 'status.active', suspended: 'status.suspended', banned: 'status.banned',
}

export default function UsersPage() {
  const { t } = useI18n()
  const [page, setPage] = useState(1)
  const { data, isLoading } = useUsers(page)
  const router = useRouter()
  const suspend = useSuspendUser()
  const [selected, setSelected] = useState<User | null>(null)
  const [reason, setReason] = useState('')
  const [isPermanent, setIsPermanent] = useState(false)

  const handleSuspend = () => {
    if (!selected || !reason) return
    suspend.mutate(
      { id: selected.id as string, reason, is_permanent: isPermanent },
      { onSuccess: () => { setSelected(null); setReason(''); setIsPermanent(false) } },
    )
  }
  const closeDialog = () => { setSelected(null); setReason(''); setIsPermanent(false) }

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center gap-3">
        <div className="stat-icon bg-blue-50 text-blue-600"><UsersIcon size={20} /></div>
        <div>
          <h1 className="page-header">{t('users.title')}</h1>
          <p className="page-description">{t('users.subtitle')}</p>
        </div>
      </div>

      <div className="table-wrapper mt-8">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">{t('users.name')}</TableHead>
              <TableHead className="font-semibold">{t('users.email')}</TableHead>
              <TableHead className="font-semibold">{t('users.phone')}</TableHead>
              <TableHead className="font-semibold">{t('users.role')}</TableHead>
              <TableHead className="font-semibold">{t('common.status')}</TableHead>
              <TableHead className="font-semibold">{t('common.created_at')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => (<TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>))}</TableRow>
              ))
            ) : !data?.data?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <UsersIcon className="mx-auto h-10 w-10 text-muted-foreground/30" />
                  <p className="mt-2 text-sm text-muted-foreground">{t('users.empty')}</p>
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((row: User) => {
                const rv = ROLE_VARIANT[row.role as string] || ROLE_VARIANT.owner
                const rk = ROLE_KEY[row.role as string] || ROLE_KEY.owner
                const sv = STATUS_VARIANT[row.status as string] || STATUS_VARIANT.active
                const sk = STATUS_KEY[row.status as string] || STATUS_KEY.active
                return (
                  <TableRow key={row.id as string} className="cursor-pointer transition-colors" onClick={() => router.push(`/users/${row.id}`)}>
                    <TableCell className="font-medium">{row.full_name as string}</TableCell>
                    <TableCell className="text-muted-foreground">{row.email as string}</TableCell>
                    <TableCell className="text-muted-foreground">{(row.phone as string) || '-'}</TableCell>
                    <TableCell><Badge variant={rv}>{t(rk as any)}</Badge></TableCell>
                    <TableCell><Badge variant={sv}>{t(sk as any)}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{fmtDate(row.created_at as string)}</TableCell>
                    <TableCell>
                      {row.status === 'active' && (
                        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setSelected(row) }}>
                          {t('users.suspend')}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
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

      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users.suspend_title')}</DialogTitle>
            <DialogDescription>{t('users.suspend_desc')} <strong>{selected?.full_name as string}</strong></DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t('common.reason')} *</Label>
              <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('users.suspend_reason')} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="permanent" checked={isPermanent} onCheckedChange={(c) => setIsPermanent(c === true)} />
              <Label htmlFor="permanent" className="cursor-pointer">{t('users.permanent_ban')}</Label>
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

function fmtDate(d: string | null | undefined) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
