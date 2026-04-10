'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardList } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@petzone/ui'
import { useI18n } from '@/lib/i18n'
import { useOrders } from '@/lib/hooks/use-admin'
import { useTableParams } from '@/lib/hooks/use-table-params'
import { DataTable, DataTableColumnHeader, DataTableFacetedFilter } from '@/components/data-table'

type Order = Record<string, unknown>

function fmtDate(d: string | null | undefined) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function fmtVND(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

export default function OrdersPage() {
  const { t } = useI18n()
  const router = useRouter()
  const table = useTableParams()
  const { data, isLoading } = useOrders({
    page: table.page,
    limit: table.pageSize,
    search: table.debouncedSearch,
    filters: table.filters,
  })

  const STATUS_MAP: Record<string, { variant: 'default' | 'warning' | 'info' | 'success' | 'destructive'; key: string }> = {
    pending: { variant: 'warning', key: 'status.pending' },
    confirmed: { variant: 'default', key: 'status.confirmed' },
    checked_in: { variant: 'info', key: 'status.checked_in' },
    in_progress: { variant: 'info', key: 'status.in_progress' },
    check_out: { variant: 'info', key: 'status.check_out' },
    completed: { variant: 'success', key: 'status.completed' },
    cancelled: { variant: 'destructive', key: 'status.cancelled' },
    disputed: { variant: 'destructive', key: 'status.disputed' },
  }

  const columns = useMemo<ColumnDef<Order, unknown>[]>(() => [
    {
      accessorKey: 'order_number',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('orders.order_number')} />,
      cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.original.order_number as string}</span>,
    },
    {
      id: 'provider',
      header: t('orders.provider'),
      enableSorting: false,
      cell: ({ row }) => {
        const p = row.original.providers as Record<string, unknown> | Record<string, unknown>[] | null
        const name = p ? (Array.isArray(p) ? p[0]?.business_name : p?.business_name) as string || '-' : '-'
        return <span>{name}</span>
      },
    },
    {
      accessorKey: 'status',
      header: t('common.status'),
      enableSorting: false,
      filterFn: 'multiValue' as any,
      cell: ({ row }) => {
        const status = row.original.status as string
        const cfg = STATUS_MAP[status] ?? { variant: 'default' as const, key: status }
        return <Badge variant={cfg.variant}>{t(cfg.key as any)}</Badge>
      },
    },
    {
      accessorKey: 'check_in_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('orders.check_in')} />,
      cell: ({ row }) => <span className="text-muted-foreground">{fmtDate(row.original.check_in_date as string)}</span>,
    },
    {
      accessorKey: 'check_out_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('orders.check_out')} />,
      cell: ({ row }) => <span className="text-muted-foreground">{fmtDate(row.original.check_out_date as string)}</span>,
    },
    {
      accessorKey: 'total_price',
      header: ({ column }) => (
        <div className="text-right">
          <DataTableColumnHeader column={column} title={t('orders.total_price')} />
        </div>
      ),
      cell: ({ row }) => (
        <span className="block text-right font-medium">
          {row.original.total_price ? fmtVND(row.original.total_price as number) : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('common.created_at')} />,
      cell: ({ row }) => <span className="text-muted-foreground">{fmtDate(row.original.created_at as string)}</span>,
    },
  ], [t])

  const statusOptions = useMemo(() => [
    { label: t('status.pending'), value: 'pending' },
    { label: t('status.confirmed'), value: 'confirmed' },
    { label: t('status.checked_in'), value: 'checked_in' },
    { label: t('status.in_progress'), value: 'in_progress' },
    { label: t('status.completed'), value: 'completed' },
    { label: t('status.cancelled'), value: 'cancelled' },
    { label: t('status.disputed'), value: 'disputed' },
  ], [t])

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center gap-3 mb-8">
        <div className="stat-icon bg-violet-50 text-violet-600">
          <ClipboardList size={20} />
        </div>
        <div>
          <h1 className="page-header">{t('orders.title')}</h1>
          <p className="page-description">{t('orders.subtitle')}</p>
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
        searchPlaceholder={`${t('common.search')} ${t('orders.order_number').toLowerCase()}...`}
        activeFilters={table.filters}
        isLoading={isLoading}
        emptyIcon={ClipboardList}
        emptyMessage={t('orders.empty')}
        onRowClick={(row) => router.push(`/orders/${row.id}`)}
        toolbarContent={
          <DataTableFacetedFilter
            title={t('common.status')}
            options={statusOptions}
            value={table.filters.status ?? []}
            onChange={(v) => table.setFilter('status', v)}
          />
        }
      />
    </div>
  )
}
