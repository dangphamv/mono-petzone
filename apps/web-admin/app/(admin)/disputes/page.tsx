'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Plus } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Badge, Button, Input,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Textarea, Label,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@petzone/ui'
import { useI18n } from '@/lib/i18n'
import { useDisputes, useResolveDispute, useCreateDispute } from '@/lib/hooks/use-admin'
import { useTableParams } from '@/lib/hooks/use-table-params'
import { DataTable, DataTableColumnHeader, DataTableFacetedFilter } from '@/components/data-table'
import { CopyableId } from '@/components/copyable-id'

type Dispute = Record<string, unknown>

const STATUS_VARIANT: Record<string, 'warning' | 'info' | 'success' | 'muted'> = {
  open: 'warning',
  investigating: 'info',
  resolved: 'success',
  closed: 'muted',
}
const ROLE_CLASS: Record<string, string> = {
  owner: 'bg-violet-50 text-violet-700',
  provider: 'bg-cyan-50 text-cyan-700',
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function DisputesPage() {
  const { t } = useI18n()
  const router = useRouter()
  const table = useTableParams()
  const { data, isLoading } = useDisputes({
    page: table.page,
    limit: table.pageSize,
    search: table.debouncedSearch,
    filters: table.filters,
  })
  const resolve = useResolveDispute()
  const createDispute = useCreateDispute()
  const [selected, setSelected] = useState<Dispute | null>(null)
  const [resolution, setResolution] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({
    order_id: '',
    opened_by_role: 'owner' as 'owner' | 'provider',
    description: '',
  })

  const handleResolve = () => {
    if (!selected || !resolution) return
    resolve.mutate(
      { id: selected.id as string, resolution, refund_amount: refundAmount ? Number(refundAmount) : undefined },
      { onSuccess: () => { setSelected(null); setResolution(''); setRefundAmount('') } },
    )
  }
  const closeModal = () => { setSelected(null); setResolution(''); setRefundAmount('') }

  const handleCreate = () => {
    if (!form.order_id.trim() || !form.description.trim()) return
    createDispute.mutate(
      { order_id: form.order_id.trim(), opened_by_role: form.opened_by_role, description: form.description.trim() },
      {
        onSuccess: () => {
          setCreateOpen(false)
          setForm({ order_id: '', opened_by_role: 'owner', description: '' })
        },
      },
    )
  }
  const closeCreate = () => {
    setCreateOpen(false)
    setForm({ order_id: '', opened_by_role: 'owner', description: '' })
  }

  const columns = useMemo<ColumnDef<Dispute, unknown>[]>(() => [
    {
      accessorKey: 'id',
      header: t('disputes.id'),
      enableSorting: false,
      cell: ({ row }) => {
        const v = row.original.id as string
        return <CopyableId value={v} displayValue={v ? `${v.slice(0, 8)}…` : undefined} />
      },
    },
    {
      accessorKey: 'order_id',
      header: t('disputes.order'),
      enableSorting: false,
      cell: ({ row }) => {
        const v = row.original.order_id as string
        return <CopyableId value={v} displayValue={v ? `${v.slice(0, 8)}…` : undefined} />
      },
    },
    {
      accessorKey: 'opened_by_role',
      header: t('disputes.opened_by'),
      enableSorting: false,
      cell: ({ row }) => {
        const role = row.original.opened_by_role as string
        const key = `role.${role}` as any
        return <Badge variant="outline" className={ROLE_CLASS[role] || 'bg-violet-50 text-violet-700'}>{t(key)}</Badge>
      },
    },
    {
      accessorKey: 'description',
      header: t('common.description'),
      enableSorting: false,
      cell: ({ row }) => (
        <span className="block max-w-[250px] truncate text-muted-foreground">
          {(row.original.description as string) || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: t('common.status'),
      enableSorting: false,
      filterFn: 'multiValue' as any,
      cell: ({ row }) => {
        const status = row.original.status as string
        const variant = STATUS_VARIANT[status] || 'warning'
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
        if (row.original.status !== 'open') return null
        return (
          <Button size="sm" onClick={(e) => { e.stopPropagation(); setSelected(row.original) }}>
            {t('disputes.resolve')}
          </Button>
        )
      },
    },
  ], [t])

  const statusOptions = useMemo(() => [
    { label: t('status.open'), value: 'open' },
    { label: t('status.investigating'), value: 'investigating' },
    { label: t('status.resolved'), value: 'resolved' },
    { label: t('status.closed'), value: 'closed' },
  ], [t])

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="stat-icon bg-red-50 text-red-600"><AlertTriangle size={20} /></div>
          <div>
            <h1 className="page-header">{t('disputes.title')}</h1>
            <p className="page-description">{t('disputes.subtitle')}</p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          {t('common.create')}
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
        searchPlaceholder={`${t('common.search')} ID, ${t('disputes.order').toLowerCase()}...`}
        activeFilters={table.filters}
        isLoading={isLoading}
        emptyIcon={AlertTriangle}
        emptyMessage={t('disputes.empty')}
        onRowClick={(row) => router.push(`/disputes/${row.id}`)}
        toolbarContent={
          <DataTableFacetedFilter
            title={t('common.status')}
            options={statusOptions}
            value={table.filters.status ?? []}
            onChange={(v) => table.setFilter('status', v)}
          />
        }
      />

      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) closeCreate() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('disputes.create_title')}</DialogTitle>
            <DialogDescription>{t('disputes.create_desc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t('disputes.order')} *</Label>
              <Input
                value={form.order_id}
                onChange={(e) => setForm((f) => ({ ...f, order_id: e.target.value }))}
                placeholder="550e8400-e29b-41d4-a716-446655440000"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('disputes.opened_by')} *</Label>
              <Select
                value={form.opened_by_role}
                onValueChange={(v) => setForm((f) => ({ ...f, opened_by_role: v as 'owner' | 'provider' }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">{t('role.owner')}</SelectItem>
                  <SelectItem value="provider">{t('role.provider')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('common.description')} *</Label>
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder={t('disputes.create_desc_placeholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeCreate}>{t('common.cancel')}</Button>
            <Button
              onClick={handleCreate}
              disabled={createDispute.isPending || !form.order_id.trim() || !form.description.trim()}
            >
              {createDispute.isPending ? t('common.processing') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) closeModal() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('disputes.resolve_title')}</DialogTitle>
            <DialogDescription>{t('disputes.resolve_desc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t('disputes.resolution')} *</Label>
              <Textarea rows={3} placeholder={t('disputes.resolution_placeholder')} value={resolution} onChange={(e) => setResolution(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('disputes.refund_amount')}</Label>
              <Input type="number" placeholder="0" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>{t('common.cancel')}</Button>
            <Button onClick={handleResolve} disabled={resolve.isPending || !resolution}>
              {resolve.isPending ? t('common.processing') : t('disputes.confirm_resolve')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
