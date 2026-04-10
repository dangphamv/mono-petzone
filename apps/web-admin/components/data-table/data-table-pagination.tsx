'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface DataTablePaginationProps {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
}

function PageButton({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-input bg-card text-sm shadow-sm transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none cursor-pointer disabled:cursor-default"
    >
      {children}
    </button>
  )
}

export function DataTablePagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: DataTablePaginationProps) {
  const { t } = useI18n()
  const computedTotalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)
  const isFirst = page <= 1
  const isLast = page >= computedTotalPages

  return (
    <div className="flex items-center justify-between gap-4 border-t border-border/60 px-1 pt-4 mt-4">
      <p className="text-sm text-muted-foreground tabular-nums">
        {t('table.showing_results', { from: String(from), to: String(to), total: String(totalItems) })}
      </p>

      <div className="flex items-center gap-5">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">{t('table.rows_per_page')}</span>
          <div className="relative">
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 w-[68px] appearance-none rounded-lg border border-input bg-card pl-3 pr-7 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* Page indicator */}
        <span className="text-sm font-medium tabular-nums whitespace-nowrap">
          {t('table.page_of', { page: String(page), total: String(computedTotalPages) })}
        </span>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <PageButton disabled={isFirst} onClick={() => onPageChange(1)}>
            <ChevronsLeft className="h-4 w-4" />
          </PageButton>
          <PageButton disabled={isFirst} onClick={() => onPageChange(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </PageButton>
          <PageButton disabled={isLast} onClick={() => onPageChange(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </PageButton>
          <PageButton disabled={isLast} onClick={() => onPageChange(computedTotalPages)}>
            <ChevronsRight className="h-4 w-4" />
          </PageButton>
        </div>
      </div>
    </div>
  )
}
