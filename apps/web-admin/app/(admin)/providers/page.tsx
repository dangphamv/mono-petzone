'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Pencil, Ban } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Button, Badge, Input, Label,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Textarea,
} from '@petzone/ui'
import { useI18n } from '@/lib/i18n'
import { useProviders, useVerifyProvider, useUpdateProvider, type UpdateProviderBody } from '@/lib/hooks/use-admin'
import { useTableParams } from '@/lib/hooks/use-table-params'
import { DataTable, DataTableColumnHeader, DataTableFacetedFilter } from '@/components/data-table'

type Provider = Record<string, unknown>

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive'> = {
  approved: 'success', rejected: 'destructive', pending: 'warning', suspended: 'destructive',
}

export default function ProvidersPage() {
  const { t } = useI18n()
  const router = useRouter()
  const table = useTableParams()
  const { data, isLoading } = useProviders({
    page: table.page,
    limit: table.pageSize,
    search: table.debouncedSearch,
    filters: table.filters,
  })
  const verify = useVerifyProvider()
  const update = useUpdateProvider()
  const [selected, setSelected] = useState<Provider | null>(null)
  const [action, setAction] = useState<'approved' | 'rejected' | 'suspended' | null>(null)
  const [notes, setNotes] = useState('')
  const [editing, setEditing] = useState<Provider | null>(null)
  const [editForm, setEditForm] = useState<UpdateProviderBody>({})

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

  const columns = useMemo<ColumnDef<Provider, unknown>[]>(() => [
    {
      accessorKey: 'business_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('providers.business_name')} />,
      cell: ({ row }) => <span className="font-medium">{row.original.business_name as string}</span>,
    },
    {
      id: 'owner',
      header: t('providers.owner'),
      enableSorting: false,
      cell: ({ row }) => {
        const u = row.original.users as Record<string, unknown> | Record<string, unknown>[] | null
        const user = u ? (Array.isArray(u) ? u[0] : u) : null
        const name = (user?.full_name as string) || (user?.email as string) || '-'
        return <span className="text-muted-foreground">{name}</span>
      },
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
      id: 'actions',
      size: 260,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const status = row.original.verification_status as string
        return (
          <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            {status === 'pending' && (
              <>
                <Button size="sm" onClick={() => { setSelected(row.original); setAction('approved') }}>
                  {t('providers.approve')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => { setSelected(row.original); setAction('rejected') }}
                >
                  {t('providers.reject')}
                </Button>
              </>
            )}
            {status === 'approved' && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-destructive hover:text-destructive"
                onClick={() => { setSelected(row.original); setAction('suspended') }}
              >
                <Ban size={12} />
                {t('providers.suspend')}
              </Button>
            )}
            {status === 'suspended' && (
              <Button
                size="sm"
                onClick={() => { setSelected(row.original); setAction('approved') }}
              >
                {t('providers.approve')}
              </Button>
            )}
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setEditing(row.original)}>
              <Pencil size={12} />
              {t('common.edit')}
            </Button>
          </div>
        )
      },
    },
  ], [t])

  const statusOptions = useMemo(() => [
    { label: t('status.pending'), value: 'pending' },
    { label: t('status.approved'), value: 'approved' },
    { label: t('status.rejected'), value: 'rejected' },
    { label: t('status.suspended'), value: 'suspended' },
  ], [t])

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center gap-3 mb-8">
        <div className="stat-icon bg-teal-50 text-teal-600">
          <Building2 size={20} />
        </div>
        <div>
          <h1 className="page-header">{t('providers.title')}</h1>
          <p className="page-description">{t('providers.subtitle')}</p>
        </div>
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
        searchPlaceholder={`${t('common.search')} ${t('providers.business_name').toLowerCase()}...`}
        activeFilters={table.filters}
        isLoading={isLoading}
        emptyIcon={Building2}
        emptyMessage={t('providers.empty')}
        onRowClick={(row) => router.push(`/providers/${row.id}`)}
        toolbarContent={
          <DataTableFacetedFilter
            title={t('common.status')}
            options={statusOptions}
            value={table.filters.status ?? []}
            onChange={(v) => table.setFilter('status', v)}
          />
        }
      />

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
