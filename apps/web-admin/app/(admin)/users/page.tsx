'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Users as UsersIcon } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Button, Badge,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Textarea, Label, Checkbox,
} from '@petzone/ui'
import { useI18n } from '@/lib/i18n'
import { useUsers, useSuspendUser } from '@/lib/hooks/use-admin'
import { useTableParams } from '@/lib/hooks/use-table-params'
import { DataTable, DataTableColumnHeader, DataTableFacetedFilter } from '@/components/data-table'
import { displayId } from '@/lib/display-id'

type User = Record<string, unknown>

const ROLE_CLASS: Record<string, string> = {
  owner: 'bg-violet-50 text-violet-700',
  provider: 'bg-cyan-50 text-cyan-700',
  admin: 'bg-slate-100 text-slate-700',
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

  const columns = useMemo<ColumnDef<User, unknown>[]>(() => [
    {
      accessorKey: 'display_id',
      header: 'ID',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{displayId(row.original, 'U')}</span>
      ),
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
        const role = row.original.role as string
        const key = `role.${role}` as any
        return <Badge variant="outline" className={ROLE_CLASS[role] || 'bg-violet-50 text-violet-700'}>{t(key)}</Badge>
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
        if (row.original.status !== 'active') return null
        return (
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => setSelected(row.original)}
          >
            {t('users.suspend')}
          </Button>
        )
      },
    },
  ], [t])

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
      <div className="flex items-center gap-3 mb-8">
        <div className="stat-icon bg-blue-50 text-blue-600"><UsersIcon size={20} /></div>
        <div>
          <h1 className="page-header">{t('users.title')}</h1>
          <p className="page-description">{t('users.subtitle')}</p>
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
        searchPlaceholder={`${t('common.search')} ${t('users.name').toLowerCase()}, ${t('users.email').toLowerCase()}...`}
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
