'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Pencil, Ban, Plus, Search, X, Check, MoreHorizontal, Eye } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Button, Badge, Input, Label, Skeleton,
  Avatar, AvatarFallback,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Textarea,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@petzone/ui'
import { useI18n } from '@/lib/i18n'
import {
  useProviders, useVerifyProvider, useUpdateProvider, useCreateProvider, useUsers,
  type UpdateProviderBody, type CreateProviderBody,
} from '@/lib/hooks/use-admin'
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import { useTableParams } from '@/lib/hooks/use-table-params'
import { DataTable, DataTableColumnHeader, DataTableFacetedFilter } from '@/components/data-table'
import { displayId } from '@/lib/display-id'
import { CopyableId } from '@/components/copyable-id'

type Provider = Record<string, unknown>

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive'> = {
  approved: 'success', rejected: 'destructive', pending: 'warning', suspended: 'destructive',
}

const SORT_MAP = {
  newest: { sort: 'created_at', order: 'desc' },
  oldest: { sort: 'created_at', order: 'asc' },
  orders: { sort: 'order_count', order: 'desc' },
} as const

export default function ProvidersPage() {
  const { t } = useI18n()
  const router = useRouter()
  const table = useTableParams()
  const me = useCurrentUser()
  const canManage = me?.can('providers:manage') ?? false
  const [sortKey, setSortKey] = useState<'newest' | 'oldest' | 'orders'>('newest')
  const sortParams = SORT_MAP[sortKey]
  const { data, isLoading } = useProviders({
    page: table.page,
    limit: table.pageSize,
    search: table.debouncedSearch,
    filters: table.filters,
    sort: sortParams.sort,
    order: sortParams.order,
  })
  const verify = useVerifyProvider()
  const update = useUpdateProvider()
  const create = useCreateProvider()
  const [selected, setSelected] = useState<Provider | null>(null)
  const [action, setAction] = useState<'approved' | 'rejected' | 'suspended' | null>(null)
  const [notes, setNotes] = useState('')
  const [editing, setEditing] = useState<Provider | null>(null)
  const [editForm, setEditForm] = useState<UpdateProviderBody>({})
  const [creating, setCreating] = useState(false)
  const [ownerMode, setOwnerMode] = useState<'existing' | 'new'>('existing')
  const [createForm, setCreateForm] = useState<CreateProviderBody>({
    user_id: '',
    business_name: '',
    address: '',
    description: '',
    license_number: '',
    phone: '',
    cancellation_policy: 'flexible',
  })
  const [ownerLabel, setOwnerLabel] = useState('')
  const [newOwner, setNewOwner] = useState({ full_name: '', email: '', phone: '' })

  useEffect(() => {
    if (editing) {
      setEditForm({
        business_name: (editing.business_name as string) || '',
        description: (editing.description as string) || '',
        license_number: (editing.license_number as string) || '',
        address: (editing.address as string) || '',
        phone: (editing.phone as string) || '',
        cancellation_policy: (editing.cancellation_policy as 'flexible' | 'moderate' | 'strict') || 'flexible',
      })
    }
  }, [editing])

  const handleVerify = () => {
    if (!selected || !action) return
    verify.mutate(
      { id: selected.id as string, status: action, notes: notes || undefined },
      { onSuccess: () => { setSelected(null); setAction(null); setNotes('') } },
    )
  }
  const closeDialog = () => { setAction(null); setSelected(null); setNotes('') }

  const handleEditSave = () => {
    if (!editing) return
    const payload: UpdateProviderBody = {}
    Object.entries(editForm).forEach(([k, v]) => {
      if (v !== '' && v !== undefined && v !== (editing as any)[k]) (payload as any)[k] = v
    })
    if (Object.keys(payload).length === 0) {
      setEditing(null)
      return
    }
    update.mutate(
      { id: editing.id as string, ...payload },
      { onSuccess: () => setEditing(null) },
    )
  }
  const closeEdit = () => { setEditing(null); setEditForm({}) }

  const openCreate = () => {
    setCreateForm({
      user_id: '',
      business_name: '',
      address: '',
      description: '',
      license_number: '',
      phone: '',
      cancellation_policy: 'flexible',
    })
    setOwnerLabel('')
    setNewOwner({ full_name: '', email: '', phone: '' })
    setOwnerMode('existing')
    setCreating(true)
  }
  const closeCreate = () => {
    setCreating(false)
    setOwnerLabel('')
    setNewOwner({ full_name: '', email: '', phone: '' })
  }
  const handleCreate = () => {
    if (!createForm.business_name.trim() || !createForm.address.trim()) return

    const ownerPart: Pick<CreateProviderBody, 'user_id' | 'new_owner'> =
      ownerMode === 'existing'
        ? { user_id: createForm.user_id }
        : {
            new_owner: {
              full_name: newOwner.full_name.trim(),
              email: newOwner.email.trim() || undefined,
              phone: newOwner.phone.trim() || undefined,
            },
          }

    if (ownerMode === 'existing' && !ownerPart.user_id) return
    if (ownerMode === 'new') {
      if (!ownerPart.new_owner?.full_name) return
      if (!ownerPart.new_owner.email && !ownerPart.new_owner.phone) return
    }

    const payload: CreateProviderBody = {
      ...ownerPart,
      business_name: createForm.business_name.trim(),
      address: createForm.address.trim(),
      description: createForm.description?.trim() || undefined,
      license_number: createForm.license_number?.trim() || undefined,
      phone: createForm.phone?.trim() || undefined,
      cancellation_policy: createForm.cancellation_policy,
    }
    create.mutate(payload, { onSuccess: closeCreate })
  }

  const columns = useMemo<ColumnDef<Provider, unknown>[]>(() => [
    {
      accessorKey: 'display_id',
      header: 'ID',
      enableSorting: false,
      cell: ({ row }) => <CopyableId value={displayId(row.original, 'P')} />,
    },
    {
      accessorKey: 'business_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('providers.business_name')} />,
      cell: ({ row }) => <span className="font-medium">{row.original.business_name as string}</span>,
    },
    {
      accessorKey: 'address',
      header: t('providers.address'),
      enableSorting: false,
      cell: ({ row }) => (
        <span className="block max-w-[200px] truncate text-muted-foreground">
          {(row.original.address as string) || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'verification_status',
      header: t('common.status'),
      enableSorting: false,
      filterFn: 'multiValue' as any,
      cell: ({ row }) => {
        const status = row.original.verification_status as string
        const variant = STATUS_VARIANT[status] || 'warning'
        const key = `status.${status}` as any
        return <Badge variant={variant}>{t(key)}</Badge>
      },
    },
    {
      accessorKey: 'rating_average',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('providers.rating')} />,
      cell: ({ row }) => {
        if (!row.original.rating_average) return <span className="text-muted-foreground">-</span>
        return (
          <span className="inline-flex items-center gap-1 text-sm">
            <span className="text-amber-500">★</span>
            {Number(row.original.rating_average).toFixed(1)}
            <span className="text-muted-foreground">({row.original.rating_count as number})</span>
          </span>
        )
      },
    },
    {
      accessorKey: 'order_count',
      header: t('providers.order_count'),
      enableSorting: false,
      cell: ({ row }) => (
        <span className="tabular-nums">{Number(row.original.order_count) || 0}</span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: t('common.created_at'),
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums">
          {row.original.created_at
            ? new Date(row.original.created_at as string).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : '-'}
        </span>
      ),
    },
    {
      id: 'actions',
      size: 80,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const status = row.original.verification_status as string
        return (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t('common.actions')}>
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={() => router.push(`/providers/${row.original.id}`)}>
                  <Eye size={14} className="mr-2" />
                  {t('common.view_detail')}
                </DropdownMenuItem>
                {canManage && (status === 'pending' || status === 'suspended') && (
                  <DropdownMenuItem onSelect={() => { setSelected(row.original); setAction('approved') }}>
                    <Check size={14} className="mr-2" />
                    {t('providers.approve')}
                  </DropdownMenuItem>
                )}
                {canManage && status === 'pending' && (
                  <DropdownMenuItem
                    onSelect={() => { setSelected(row.original); setAction('rejected') }}
                    className="text-destructive focus:text-destructive"
                  >
                    <X size={14} className="mr-2" />
                    {t('providers.reject')}
                  </DropdownMenuItem>
                )}
                {canManage && status === 'approved' && (
                  <DropdownMenuItem
                    onSelect={() => { setSelected(row.original); setAction('suspended') }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Ban size={14} className="mr-2" />
                    {t('providers.suspend')}
                  </DropdownMenuItem>
                )}
                {canManage && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setEditing(row.original)}>
                      <Pencil size={14} className="mr-2" />
                      {t('common.edit')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ], [t, canManage, router])

  const statusOptions = useMemo(() => [
    { label: t('status.pending'), value: 'pending' },
    { label: t('status.approved'), value: 'approved' },
    { label: t('status.rejected'), value: 'rejected' },
    { label: t('status.suspended'), value: 'suspended' },
  ], [t])

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="stat-icon bg-teal-50 text-teal-600">
            <Building2 size={20} />
          </div>
          <div>
            <h1 className="page-header">{t('providers.title')}</h1>
            <p className="page-description">{t('providers.subtitle')}</p>
          </div>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="gap-1">
            <Plus size={16} />
            {t('providers.create')}
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
        searchPlaceholder={`${t('common.search')} ${t('providers.business_name').toLowerCase()}, ID...`}
        activeFilters={table.filters}
        isLoading={isLoading}
        emptyIcon={Building2}
        emptyMessage={t('providers.empty')}
        onRowClick={(row) => router.push(`/providers/${row.id}`)}
        toolbarContent={
          <>
            <DataTableFacetedFilter
              title={t('common.status')}
              options={statusOptions}
              value={table.filters.status ?? []}
              onChange={(v) => table.setFilter('status', v)}
            />
            <Select value={sortKey} onValueChange={(v) => { setSortKey(v as typeof sortKey); table.setPage(1) }}>
              <SelectTrigger className="h-8 w-auto gap-1 text-xs">
                <span className="text-muted-foreground">{t('providers.sort_label')}:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t('providers.sort.newest')}</SelectItem>
                <SelectItem value="oldest">{t('providers.sort.oldest')}</SelectItem>
                <SelectItem value="orders">{t('providers.sort.most_orders')}</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      <Dialog open={creating} onOpenChange={(open) => { if (!open) closeCreate() }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('providers.create_title')}</DialogTitle>
            <DialogDescription>{t('providers.create_desc')}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block">{t('providers.create_owner')} *</Label>
              <div className="mb-2 inline-flex rounded-lg border bg-muted/40 p-1">
                <button
                  type="button"
                  onClick={() => setOwnerMode('existing')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    ownerMode === 'existing' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('providers.owner_existing')}
                </button>
                <button
                  type="button"
                  onClick={() => setOwnerMode('new')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    ownerMode === 'new' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('providers.owner_new')}
                </button>
              </div>

              {ownerMode === 'existing' ? (
                <>
                  <ProviderOwnerPicker
                    value={createForm.user_id ?? ''}
                    label={ownerLabel}
                    onSelect={(id, label) => {
                      setCreateForm((f) => ({ ...f, user_id: id }))
                      setOwnerLabel(label)
                    }}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">{t('providers.create_owner_hint')}</p>
                </>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="new-owner-name" className="mb-1 block text-xs">{t('users.name')} *</Label>
                    <Input
                      id="new-owner-name"
                      value={newOwner.full_name}
                      onChange={(e) => setNewOwner({ ...newOwner, full_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-owner-email" className="mb-1 block text-xs">{t('users.email')}</Label>
                    <Input
                      id="new-owner-email"
                      type="email"
                      value={newOwner.email}
                      onChange={(e) => setNewOwner({ ...newOwner, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-owner-phone" className="mb-1 block text-xs">{t('users.phone')}</Label>
                    <Input
                      id="new-owner-phone"
                      value={newOwner.phone}
                      onChange={(e) => setNewOwner({ ...newOwner, phone: e.target.value })}
                    />
                  </div>
                  <p className="sm:col-span-2 text-xs text-muted-foreground">{t('providers.owner_new_hint')}</p>
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="new-business-name" className="mb-1.5 block">{t('providers.business_name')} *</Label>
              <Input
                id="new-business-name"
                value={createForm.business_name}
                onChange={(e) => setCreateForm({ ...createForm, business_name: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="new-address" className="mb-1.5 block">{t('providers.address')} *</Label>
              <Input
                id="new-address"
                value={createForm.address}
                onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="new-phone" className="mb-1.5 block">{t('providers.phone')}</Label>
              <Input
                id="new-phone"
                value={createForm.phone ?? ''}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="new-license" className="mb-1.5 block">{t('providers.license')}</Label>
              <Input
                id="new-license"
                value={createForm.license_number ?? ''}
                onChange={(e) => setCreateForm({ ...createForm, license_number: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2">
              <Label className="mb-1.5 block">{t('providers.cancellation_policy')}</Label>
              <Select
                value={createForm.cancellation_policy ?? 'flexible'}
                onValueChange={(v) =>
                  setCreateForm({ ...createForm, cancellation_policy: v as 'flexible' | 'moderate' | 'strict' })
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="flexible">{t('providers.cancellation_policy.flexible')}</SelectItem>
                  <SelectItem value="moderate">{t('providers.cancellation_policy.moderate')}</SelectItem>
                  <SelectItem value="strict">{t('providers.cancellation_policy.strict')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="new-description" className="mb-1.5 block">{t('common.description')}</Label>
              <Textarea
                id="new-description"
                rows={3}
                value={createForm.description ?? ''}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeCreate}>{t('common.cancel')}</Button>
            <Button
              onClick={handleCreate}
              disabled={
                create.isPending ||
                !createForm.business_name.trim() ||
                !createForm.address.trim() ||
                (ownerMode === 'existing' && !createForm.user_id) ||
                (ownerMode === 'new' &&
                  (!newOwner.full_name.trim() ||
                    (!newOwner.email.trim() && !newOwner.phone.trim())))
              }
            >
              {create.isPending ? t('common.processing') : t('providers.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) closeEdit() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('providers.edit_title')}</DialogTitle>
            <DialogDescription>{t('providers.edit_desc')}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="edit-business-name">{t('providers.business_name')}</Label>
              <Input
                id="edit-business-name"
                value={editForm.business_name ?? ''}
                onChange={(e) => setEditForm({ ...editForm, business_name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="edit-address">{t('providers.address')}</Label>
              <Input
                id="edit-address"
                value={editForm.address ?? ''}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone">{t('providers.phone')}</Label>
              <Input
                id="edit-phone"
                value={editForm.phone ?? ''}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-license">{t('providers.license')}</Label>
              <Input
                id="edit-license"
                value={editForm.license_number ?? ''}
                onChange={(e) => setEditForm({ ...editForm, license_number: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t('providers.cancellation_policy')}</Label>
              <Select
                value={editForm.cancellation_policy ?? 'flexible'}
                onValueChange={(v) => setEditForm({ ...editForm, cancellation_policy: v as 'flexible' | 'moderate' | 'strict' })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="flexible">{t('providers.cancellation_policy.flexible')}</SelectItem>
                  <SelectItem value="moderate">{t('providers.cancellation_policy.moderate')}</SelectItem>
                  <SelectItem value="strict">{t('providers.cancellation_policy.strict')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="edit-description">{t('common.description')}</Label>
              <Textarea
                id="edit-description"
                rows={3}
                value={editForm.description ?? ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEdit}>{t('common.cancel')}</Button>
            <Button onClick={handleEditSave} disabled={update.isPending}>
              {update.isPending ? t('common.processing') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={action !== null} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'approved' && t('providers.approve_title')}
              {action === 'rejected' && t('providers.reject_title')}
              {action === 'suspended' && t('providers.suspend_title')}
            </DialogTitle>
            <DialogDescription>
              {action === 'approved' && `${t('providers.approve_confirm')} "${selected?.business_name}"?`}
              {action === 'rejected' && `${t('providers.reject_confirm')} "${selected?.business_name}"?`}
              {action === 'suspended' && `${t('providers.suspend_desc')} — "${selected?.business_name}"`}
            </DialogDescription>
          </DialogHeader>
          <Textarea rows={3} placeholder={t('common.notes_optional')} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t('common.cancel')}</Button>
            <Button
              variant={action === 'approved' ? 'default' : 'destructive'}
              onClick={handleVerify}
              disabled={verify.isPending}
            >
              {verify.isPending
                ? t('common.processing')
                : action === 'approved'
                  ? t('providers.approve_confirm')
                  : action === 'rejected'
                    ? t('providers.reject_confirm')
                    : t('providers.suspend_confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return v
}

function ProviderOwnerPicker({
  value,
  label,
  onSelect,
}: {
  value: string
  label: string
  onSelect: (id: string, label: string) => void
}) {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search, 300)
  const [open, setOpen] = useState(false)
  const { data, isLoading } = useUsers({ page: 1, limit: 8, search: debounced })

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-xs">{(label || '?')[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="flex-1 truncate font-medium">{label || value}</span>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => { onSelect('', ''); setOpen(true); setSearch('') }}
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={t('orders.search_owner')}
          className="pl-8"
        />
      </div>
      {open && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
          {isLoading ? (
            <div className="space-y-1 p-1">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (data?.data ?? []).length === 0 ? (
            <p className="p-3 text-center text-sm text-muted-foreground">{t('orders.no_owner_found')}</p>
          ) : (
            (data?.data ?? []).map((u: Record<string, unknown>) => {
              const lbl = (u.full_name as string) || (u.email as string) || (u.phone as string) || '?'
              const role = (u.role as string) || 'owner'
              return (
                <button
                  key={u.id as string}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => { onSelect(u.id as string, lbl); setOpen(false); setSearch('') }}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">{lbl[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{lbl}</p>
                    {u.email ? <p className="truncate text-xs text-muted-foreground">{u.email as string}</p> : null}
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px]">{t(`role.${role}` as any)}</Badge>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
