'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Users as UsersIcon, Plus, MoreHorizontal, Eye, Ban, ShieldCheck } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Button, Badge, Input,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Textarea, Label, Checkbox,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@petzone/ui'
import { ADMIN_PERMISSIONS, ADMIN_PERMISSION_LABELS } from '@petzone/shared'
import { useI18n } from '@/lib/i18n'
import { useUsers, useSuspendUser, useCreateAccount, useUpdateStaffPermissions } from '@/lib/hooks/use-admin'
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import { useTableParams } from '@/lib/hooks/use-table-params'
import { DataTable, DataTableColumnHeader, DataTableFacetedFilter } from '@/components/data-table'
import { displayId } from '@/lib/display-id'
import { CopyableId } from '@/components/copyable-id'

type User = Record<string, unknown>

const ROLE_CLASS: Record<string, string> = {
  owner: 'bg-violet-50 text-violet-700',
  provider: 'bg-cyan-50 text-cyan-700',
  admin: 'bg-slate-100 text-slate-700',
  staff: 'bg-amber-50 text-amber-700',
}
const STATUS_VARIANT: Record<string, 'success' | 'destructive'> = {
  active: 'success', suspended: 'destructive', banned: 'destructive',
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function UsersPage() {
  const { t } = useI18n()
  const router = useRouter()
  const table = useTableParams()
  const { data, isLoading } = useUsers({
    page: table.page,
    limit: table.pageSize,
    search: table.debouncedSearch,
    filters: table.filters,
  })
  const me = useCurrentUser()
  const isAdmin = me?.role === 'admin'
  const suspend = useSuspendUser()
  const createAccount = useCreateAccount()
  const updatePerms = useUpdateStaffPermissions()
  const [selected, setSelected] = useState<User | null>(null)
  const [reason, setReason] = useState('')
  const [isPermanent, setIsPermanent] = useState(false)
  const [creating, setCreating] = useState(false)
  const emptyAccount = { full_name: '', email: '', password: '', role: 'admin' as 'admin' | 'staff', permissions: [] as string[] }
  const [accountForm, setAccountForm] = useState(emptyAccount)
  const [editingPerms, setEditingPerms] = useState<User | null>(null)
  const [editPerms, setEditPerms] = useState<string[]>([])

  const closeCreate = () => { setCreating(false); setAccountForm(emptyAccount) }
  const toggle = (list: string[], perm: string) =>
    list.includes(perm) ? list.filter((p) => p !== perm) : [...list, perm]

  const handleCreate = () => {
    const { full_name, email, password, role, permissions } = accountForm
    if (!full_name.trim() || !email.trim() || password.length < 8) return
    if (role === 'staff' && permissions.length === 0) return
    createAccount.mutate(
      { full_name: full_name.trim(), email: email.trim(), password, role, permissions: role === 'staff' ? permissions : [] },
      { onSuccess: closeCreate },
    )
  }

  const openEditPerms = (u: User) => { setEditingPerms(u); setEditPerms((u.permissions as string[]) ?? []) }
  const closeEditPerms = () => { setEditingPerms(null); setEditPerms([]) }
  const handleUpdatePerms = () => {
    if (!editingPerms || editPerms.length === 0) return
    updatePerms.mutate(
      { id: editingPerms.id as string, permissions: editPerms },
      { onSuccess: closeEditPerms },
    )
  }

  const handleSuspend = () => {
    if (!selected || !reason) return
    suspend.mutate(
      { id: selected.id as string, reason, is_permanent: isPermanent },
      { onSuccess: () => { setSelected(null); setReason(''); setIsPermanent(false) } },
    )
  }
  const closeDialog = () => { setSelected(null); setReason(''); setIsPermanent(false) }

  const columns = useMemo<ColumnDef<User, unknown>[]>(() => [
    {
      accessorKey: 'display_id',
      header: 'ID',
      enableSorting: false,
      cell: ({ row }) => <CopyableId value={displayId(row.original, 'U')} />,
    },
    {
      accessorKey: 'full_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('users.name')} />,
      cell: ({ row }) => <span className="font-medium">{row.original.full_name as string}</span>,
    },
    {
      accessorKey: 'email',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('users.email')} />,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.email as string}</span>,
    },
    {
      accessorKey: 'phone',
      header: t('users.phone'),
      enableSorting: false,
      cell: ({ row }) => <span className="text-muted-foreground">{(row.original.phone as string) || '-'}</span>,
    },
    {
      accessorKey: 'role',
      header: t('users.role'),
      enableSorting: false,
      filterFn: 'multiValue' as any,
      cell: ({ row }) => {
        const role = row.original.role as string | null | undefined
        if (!role) {
          return <Badge variant="outline" className="text-muted-foreground italic">{t('common.not_set')}</Badge>
        }
        return <Badge variant="outline" className={ROLE_CLASS[role] || 'bg-violet-50 text-violet-700'}>{t(`role.${role}` as any)}</Badge>
      },
    },
    {
      accessorKey: 'status',
      header: t('common.status'),
      enableSorting: false,
      filterFn: 'multiValue' as any,
      cell: ({ row }) => {
        const status = row.original.status as string
        const variant = STATUS_VARIANT[status] || 'success'
        const key = `status.${status}` as any
        return <Badge variant={variant}>{t(key)}</Badge>
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('common.created_at')} />,
      cell: ({ row }) => <span className="text-muted-foreground">{fmtDate(row.original.created_at as string)}</span>,
    },
    {
      id: 'actions',
      size: 100,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const isStaff = row.original.role === 'staff'
        const isActive = row.original.status === 'active'
        const showEdit = isStaff && isAdmin
        const showSuspend = isActive && (me?.can('users:manage') ?? false)
        return (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t('common.actions')}>
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={() => router.push(`/users/${row.original.id}`)}>
                  <Eye size={14} className="mr-2" />
                  {t('common.view_detail')}
                </DropdownMenuItem>
                {showEdit && (
                  <DropdownMenuItem onSelect={() => openEditPerms(row.original)}>
                    <ShieldCheck size={14} className="mr-2" />
                    {t('users.edit_permissions')}
                  </DropdownMenuItem>
                )}
                {showSuspend && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => setSelected(row.original)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Ban size={14} className="mr-2" />
                      {t('users.suspend')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ], [t, isAdmin, me, router])

  const roleOptions = useMemo(() => [
    { label: t('role.owner'), value: 'owner' },
    { label: t('role.provider'), value: 'provider' },
    { label: t('role.admin'), value: 'admin' },
  ], [t])

  const statusOptions = useMemo(() => [
    { label: t('status.active'), value: 'active' },
    { label: t('status.suspended'), value: 'suspended' },
    { label: t('status.banned'), value: 'banned' },
  ], [t])

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="stat-icon bg-blue-50 text-blue-600"><UsersIcon size={20} /></div>
          <div>
            <h1 className="page-header">{t('users.title')}</h1>
            <p className="page-description">{t('users.subtitle')}</p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreating(true)} className="gap-1">
            <Plus size={16} />
            {t('users.create_account')}
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        totalItems={data?.meta?.total ?? 0}
        page={table.page}
        pageSize={table.pageSize}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        searchValue={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder={`${t('common.search')} ${t('users.name').toLowerCase()}, ${t('users.email').toLowerCase()}, ID...`}
        activeFilters={table.filters}
        isLoading={isLoading}
        emptyIcon={UsersIcon}
        emptyMessage={t('users.empty')}
        onRowClick={(row) => router.push(`/users/${row.id}`)}
        toolbarContent={
          <>
            <DataTableFacetedFilter
              title={t('users.role')}
              options={roleOptions}
              value={table.filters.role ?? []}
              onChange={(v) => table.setFilter('role', v)}
            />
            <DataTableFacetedFilter
              title={t('common.status')}
              options={statusOptions}
              value={table.filters.status ?? []}
              onChange={(v) => table.setFilter('status', v)}
            />
          </>
        }
      />

      <Dialog open={creating} onOpenChange={(open) => { if (!open) closeCreate() }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('users.create_account_title')}</DialogTitle>
            <DialogDescription>{t('users.create_account_desc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="acc-name">{t('users.name')} *</Label>
              <Input id="acc-name" value={accountForm.full_name} onChange={(e) => setAccountForm({ ...accountForm, full_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acc-email">{t('users.email')} *</Label>
              <Input id="acc-email" type="email" autoComplete="off" value={accountForm.email} onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acc-password">{t('users.password')} *</Label>
              <Input id="acc-password" type="text" autoComplete="new-password" value={accountForm.password} onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })} />
              <p className="text-xs text-muted-foreground">{t('users.password_hint')}</p>
            </div>
            <div className="space-y-1.5">
              <Label>{t('users.account_role')} *</Label>
              <div className="inline-flex rounded-lg border bg-muted/40 p-1">
                {(['admin', 'staff'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setAccountForm({ ...accountForm, role: r })}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${accountForm.role === r ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {t(`role.${r}` as any)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {accountForm.role === 'admin' ? t('users.role_admin_hint') : t('users.role_staff_hint')}
              </p>
            </div>
            {accountForm.role === 'staff' && (
              <div className="space-y-2">
                <Label>{t('users.permissions')} *</Label>
                <div className="grid grid-cols-2 gap-2 rounded-lg border p-3">
                  {ADMIN_PERMISSIONS.map((perm) => (
                    <label key={perm} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={accountForm.permissions.includes(perm)}
                        onCheckedChange={() => setAccountForm({ ...accountForm, permissions: toggle(accountForm.permissions, perm) })}
                      />
                      <span>{ADMIN_PERMISSION_LABELS[perm]}</span>
                    </label>
                  ))}
                </div>
                {accountForm.permissions.length === 0 && (
                  <p className="text-xs text-destructive">{t('users.permissions_required')}</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeCreate}>{t('common.cancel')}</Button>
            <Button
              onClick={handleCreate}
              disabled={
                createAccount.isPending ||
                !accountForm.full_name.trim() ||
                !accountForm.email.trim() ||
                accountForm.password.length < 8 ||
                (accountForm.role === 'staff' && accountForm.permissions.length === 0)
              }
            >
              {createAccount.isPending ? t('common.processing') : t('users.create_account')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editingPerms !== null} onOpenChange={(open) => { if (!open) closeEditPerms() }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('users.edit_permissions_title')}</DialogTitle>
            <DialogDescription>{editingPerms?.full_name as string}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 rounded-lg border p-3">
            {ADMIN_PERMISSIONS.map((perm) => (
              <label key={perm} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={editPerms.includes(perm)}
                  onCheckedChange={() => setEditPerms(toggle(editPerms, perm))}
                />
                <span>{ADMIN_PERMISSION_LABELS[perm]}</span>
              </label>
            ))}
          </div>
          {editPerms.length === 0 && <p className="text-xs text-destructive">{t('users.permissions_required')}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={closeEditPerms}>{t('common.cancel')}</Button>
            <Button onClick={handleUpdatePerms} disabled={updatePerms.isPending || editPerms.length === 0}>
              {updatePerms.isPending ? t('common.processing') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
