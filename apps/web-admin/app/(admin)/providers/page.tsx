'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Plus } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Button, Badge,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Textarea,
} from '@petzone/ui'
import { useI18n } from '@/lib/i18n'
import { useProviders, useVerifyProvider } from '@/lib/hooks/use-admin'
import { useTableParams } from '@/lib/hooks/use-table-params'
import { DataTable, DataTableColumnHeader, DataTableFacetedFilter } from '@/components/data-table'

type Provider = Record<string, unknown>

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive'> = {
  approved: 'success', rejected: 'destructive', pending: 'warning',
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
  const [selected, setSelected] = useState<Provider | null>(null)
  const [action, setAction] = useState<'approved' | 'rejected' | null>(null)
  const [notes, setNotes] = useState('')

  const handleVerify = () => {
    if (!selected || !action) return
    verify.mutate(
      { id: selected.id as string, status: action, notes: notes || undefined },
      { onSuccess: () => { setSelected(null); setAction(null); setNotes('') } },
    )
  }
  const closeDialog = () => { setAction(null); setSelected(null); setNotes('') }

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
      size: 160,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const status = row.original.verification_status as string
        if (status !== 'pending') return null
        return (
          <div className="flex gap-1.5">
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
          </div>
        )
      },
    },
  ], [t])

  const statusOptions = useMemo(() => [
    { label: t('status.pending'), value: 'pending' },
    { label: t('status.approved'), value: 'approved' },
    { label: t('status.rejected'), value: 'rejected' },
  ], [t])

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="stat-icon bg-teal-50 text-teal-600">
            <Building2 size={20} />
          </div>
          <div>
            <h1 className="page-header">{t('providers.title')}</h1>
            <p className="page-description">{t('providers.subtitle')}</p>
          </div>
        </div>
        <Button size="sm" className="gap-1">
          <Plus size={14} />
          {t('providers.add')}
        </Button>
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
            value={table.filters.verification_status ?? []}
            onChange={(v) => table.setFilter('verification_status', v)}
          />
        }
      />

      <Dialog open={action !== null} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === 'approved' ? t('providers.approve_title') : t('providers.reject_title')}</DialogTitle>
            <DialogDescription>
              {action === 'approved'
                ? `${t('providers.approve_confirm')} "${selected?.business_name}"?`
                : `${t('providers.reject_confirm')} "${selected?.business_name}"?`}
            </DialogDescription>
          </DialogHeader>
          <Textarea rows={3} placeholder={t('common.notes_optional')} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t('common.cancel')}</Button>
            <Button variant={action === 'approved' ? 'default' : 'destructive'} onClick={handleVerify} disabled={verify.isPending}>
              {verify.isPending ? t('common.processing') : action === 'approved' ? t('providers.approve_confirm') : t('providers.reject_confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
