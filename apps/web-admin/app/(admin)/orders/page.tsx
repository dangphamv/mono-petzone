'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ClipboardList, Plus, MoreHorizontal, Eye, MessageSquare, Ban } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Badge, Button,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Textarea, Label,
} from '@petzone/ui'
import { useI18n } from '@/lib/i18n'
import { useOrders, useCancelOrder, useSendOrderMessage } from '@/lib/hooks/use-admin'
import { useTableParams } from '@/lib/hooks/use-table-params'
import { DataTable, DataTableColumnHeader, DataTableFacetedFilter } from '@/components/data-table'
import { CopyableId } from '@/components/copyable-id'

type Order = Record<string, unknown>

const CANCELLABLE_STATUSES = new Set(['pending_payment', 'pending', 'confirmed'])

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

  const cancelOrder = useCancelOrder()
  const sendMessage = useSendOrderMessage()

  const [cancelTarget, setCancelTarget] = useState<Order | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [messageTarget, setMessageTarget] = useState<Order | null>(null)
  const [messageText, setMessageText] = useState('')

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

  const handleCancel = () => {
    if (!cancelTarget || !cancelReason.trim()) return
    cancelOrder.mutate(
      { id: cancelTarget.id as string, reason: cancelReason.trim() },
      {
        onSuccess: () => {
          setCancelTarget(null)
          setCancelReason('')
        },
      },
    )
  }

  const handleSendMessage = () => {
    if (!messageTarget || !messageText.trim()) return
    sendMessage.mutate(
      { id: messageTarget.id as string, message: messageText.trim() },
      {
        onSuccess: () => {
          setMessageTarget(null)
          setMessageText('')
        },
      },
    )
  }

  const closeCancel = () => { setCancelTarget(null); setCancelReason('') }
  const closeMessage = () => { setMessageTarget(null); setMessageText('') }

  const columns = useMemo<ColumnDef<Order, unknown>[]>(() => [
    {
      accessorKey: 'order_number',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('orders.order_number')} />,
      cell: ({ row }) => <CopyableId value={row.original.order_number as string} size="sm" className="font-medium" />,
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
    {
      id: 'actions',
      size: 60,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const status = row.original.status as string
        const canCancel = CANCELLABLE_STATUSES.has(status)
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t('orders.actions')}>
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onSelect={() => router.push(`/orders/${row.original.id}`)}>
                  <Eye size={14} className="mr-2" />
                  {t('orders.view_detail')}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setMessageTarget(row.original)}>
                  <MessageSquare size={14} className="mr-2" />
                  {t('orders.send_message')}
                </DropdownMenuItem>
                {canCancel && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => setCancelTarget(row.original)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Ban size={14} className="mr-2" />
                      {t('orders.cancel_order')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ], [t, router])

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
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="stat-icon bg-violet-50 text-violet-600">
            <ClipboardList size={20} />
          </div>
          <div>
            <h1 className="page-header">{t('orders.title')}</h1>
            <p className="page-description">{t('orders.subtitle')}</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/orders/new">
            <Plus size={16} />
            {t('orders.create')}
          </Link>
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
        searchPlaceholder={t('orders.search_placeholder')}
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

      {/* Cancel dialog */}
      <Dialog open={cancelTarget !== null} onOpenChange={(open) => { if (!open) closeCancel() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('orders.cancel_title')}</DialogTitle>
            <DialogDescription>
              {t('orders.cancel_desc')} <strong>{cancelTarget?.order_number as string}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>{t('common.reason')} *</Label>
            <Textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={t('orders.cancel_reason')}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeCancel}>{t('common.cancel')}</Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelOrder.isPending || !cancelReason.trim()}
            >
              {cancelOrder.isPending ? t('common.processing') : t('orders.cancel_confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send message dialog */}
      <Dialog open={messageTarget !== null} onOpenChange={(open) => { if (!open) closeMessage() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('orders.send_message_title')}</DialogTitle>
            <DialogDescription>
              {t('orders.send_message_desc')}{' '}
              <strong>{messageTarget?.order_number as string}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>{t('common.note')} *</Label>
            <Textarea
              rows={4}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={t('orders.send_message_placeholder')}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeMessage}>{t('common.cancel')}</Button>
            <Button
              onClick={handleSendMessage}
              disabled={sendMessage.isPending || !messageText.trim()}
            >
              {sendMessage.isPending ? t('common.processing') : t('orders.send_message')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
