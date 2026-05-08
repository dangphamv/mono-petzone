'use client'

import { useState, useMemo } from 'react'
import { Star } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Button, Badge,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Textarea, Label,
} from '@petzone/ui'
import { useI18n } from '@/lib/i18n'
import { useReviews, useModerateReview } from '@/lib/hooks/use-admin'
import { useTableParams } from '@/lib/hooks/use-table-params'
import { DataTable, DataTableColumnHeader, DataTableFacetedFilter } from '@/components/data-table'

type Review = Record<string, unknown>

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={14} className={i < value ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
      ))}
    </div>
  )
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function ReviewsPage() {
  const { t } = useI18n()
  const table = useTableParams()
  const { data, isLoading } = useReviews({
    page: table.page,
    limit: table.pageSize,
    search: table.debouncedSearch,
    filters: table.filters,
  })
  const moderate = useModerateReview()
  const [selected, setSelected] = useState<Review | null>(null)
  const [action, setAction] = useState<'hide' | 'show' | null>(null)
  const [reason, setReason] = useState('')

  const handleModerate = () => {
    if (!selected || !action) return
    moderate.mutate(
      { id: selected.id as string, action, reason: reason || undefined },
      { onSuccess: () => { setSelected(null); setAction(null); setReason('') } },
    )
  }
  const closeDialog = () => { setAction(null); setSelected(null); setReason('') }

  const columns = useMemo<ColumnDef<Review, unknown>[]>(() => [
    {
      accessorKey: 'rating_overall',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('reviews.rating')} />,
      cell: ({ row }) => <StarRating value={row.original.rating_overall as number} />,
    },
    {
      accessorKey: 'text',
      header: t('reviews.content'),
      enableSorting: false,
      cell: ({ row }) => (
        <span className="block max-w-[200px] truncate text-muted-foreground">
          {(row.original.text as string) || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'order_number',
      header: t('reviews.order_number'),
      enableSorting: false,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {(row.original.order_number as string) || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'provider_name',
      header: t('reviews.provider_name'),
      enableSorting: false,
      cell: ({ row }) => <span>{(row.original.provider_name as string) || '-'}</span>,
    },
    {
      id: 'visibility',
      accessorFn: (row) => row.is_visible ? 'visible' : 'hidden',
      header: t('reviews.visibility'),
      enableSorting: false,
      filterFn: 'multiValue' as any,
      cell: ({ row }) => (
        <Badge variant={row.original.is_visible ? 'success' : 'destructive'}>
          {row.original.is_visible ? t('status.visible') : t('status.hidden')}
        </Badge>
      ),
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
        if (row.original.is_visible) {
          return (
            <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => { setSelected(row.original); setAction('hide') }}>
              {t('reviews.hide')}
            </Button>
          )
        }
        return (
          <Button size="sm" onClick={() => { setSelected(row.original); setAction('show') }}>
            {t('reviews.show')}
          </Button>
        )
      },
    },
  ], [t])

  const visibilityOptions = useMemo(() => [
    { label: t('status.visible'), value: 'visible' },
    { label: t('status.hidden'), value: 'hidden' },
  ], [t])

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center gap-3 mb-8">
        <div className="stat-icon bg-amber-50 text-amber-600"><Star size={20} /></div>
        <div>
          <h1 className="page-header">{t('reviews.title')}</h1>
          <p className="page-description">{t('reviews.subtitle')}</p>
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
        searchPlaceholder={`${t('common.search')} ${t('reviews.content').toLowerCase()}...`}
        activeFilters={table.filters}
        isLoading={isLoading}
        emptyIcon={Star}
        emptyMessage={t('reviews.empty')}
        toolbarContent={
          <DataTableFacetedFilter
            title={t('reviews.visibility')}
            options={visibilityOptions}
            value={table.filters.visibility ?? []}
            onChange={(v) => table.setFilter('visibility', v)}
          />
        }
      />

      <Dialog open={action !== null} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === 'hide' ? t('reviews.hide_title') : t('reviews.show_title')}</DialogTitle>
            <DialogDescription>{action === 'hide' ? t('reviews.hide_desc') : t('reviews.show_desc')}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/50 p-4">
                <StarRating value={selected.rating_overall as number} />
                <p className="mt-2 text-sm leading-relaxed">{(selected.text as string) || t('reviews.no_content')}</p>
              </div>
              {action === 'hide' && (
                <div className="space-y-1.5">
                  <Label>{t('reviews.hide_reason')}</Label>
                  <Textarea rows={2} placeholder={t('reviews.hide_reason_placeholder')} value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t('common.cancel')}</Button>
            <Button variant={action === 'hide' ? 'destructive' : 'default'} onClick={handleModerate} disabled={moderate.isPending}>
              {moderate.isPending ? t('common.processing') : t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
