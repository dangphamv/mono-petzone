'use client'

import { useState, useMemo } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Skeleton,
} from '@petzone/ui'
import { DataTablePagination } from './data-table-pagination'
import { DataTableToolbar } from './data-table-toolbar'
import { useI18n } from '@/lib/i18n'

// Filter: row value is one of the selected values
const multiValueFilter: FilterFn<any> = (row, columnId, filterValue: string[]) => {
  if (!filterValue || filterValue.length === 0) return true
  const cellValue = String(row.getValue(columnId) ?? '')
  return filterValue.includes(cellValue)
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  totalItems?: number
  page?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  toolbarContent?: React.ReactNode
  /** Active filters from URL — applied client-side as fallback */
  activeFilters?: Record<string, string[]>
  isLoading?: boolean
  emptyIcon?: LucideIcon
  emptyMessage?: string
  onRowClick?: (row: TData) => void
  skeletonRows?: number
}

export function DataTable<TData, TValue>({
  columns,
  data,
  totalItems = 0,
  page = 1,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  toolbarContent,
  activeFilters,
  isLoading = false,
  emptyIcon: EmptyIcon,
  emptyMessage,
  onRowClick,
  skeletonRows = 5,
}: DataTableProps<TData, TValue>) {
  const { t } = useI18n()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  // Convert activeFilters Record to TanStack ColumnFiltersState
  const columnFilters: ColumnFiltersState = useMemo(() => {
    if (!activeFilters) return []
    return Object.entries(activeFilters)
      .filter(([, values]) => values.length > 0)
      .map(([id, value]) => ({ id, value }))
  }, [activeFilters])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    manualFiltering: true,
    filterFns: { multiValue: multiValueFilter },
  })

  const colCount = columns.length
  const filteredRows = table.getRowModel().rows
  const empty = !isLoading && filteredRows.length === 0
  const msg = emptyMessage || t('common.no_data')
  const hasToolbar = onSearchChange !== undefined || toolbarContent

  return (
    <div>
      {hasToolbar && (
        <DataTableToolbar
          searchValue={searchValue ?? ''}
          onSearchChange={onSearchChange ?? (() => {})}
          searchPlaceholder={searchPlaceholder}
        >
          {toolbarContent}
        </DataTableToolbar>
      )}

      <div className="table-wrapper">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-11 px-5 text-left font-semibold" style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="border-b border-border/40 hover:bg-transparent">
                  {Array.from({ length: colCount }).map((_, j) => (
                    <TableCell key={j} className="px-5 py-4">
                      <Skeleton className="h-5 w-full rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : empty ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={colCount} className="py-20 text-center">
                  {EmptyIcon && <EmptyIcon className="mx-auto h-10 w-10 text-muted-foreground/30" />}
                  <p className="mt-2 text-sm text-muted-foreground">{msg}</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row, idx) => (
                <TableRow
                  key={row.id}
                  className={[
                    'border-b border-border/40',
                    idx % 2 === 1 ? 'bg-muted/30' : '',
                  ].join(' ')}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isActions = cell.column.id === 'actions'
                    return (
                      <TableCell
                        key={cell.id}
                        className={['px-5 py-4', !isActions && onRowClick ? 'cursor-pointer' : ''].join(' ')}
                        onClick={!isActions && onRowClick ? () => onRowClick(row.original) : undefined}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {onPageChange && (
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          totalPages={Math.max(1, Math.ceil(totalItems / pageSize))}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange ?? (() => {})}
        />
      )}
    </div>
  )
}
