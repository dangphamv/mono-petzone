'use client'

import { Search, X } from 'lucide-react'
import { cn } from '@petzone/ui'
import { useI18n } from '@/lib/i18n'

interface DataTableToolbarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  children?: React.ReactNode
}

export function DataTableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  children,
}: DataTableToolbarProps) {
  const { t } = useI18n()
  const placeholder = searchPlaceholder || t('common.search') + '...'

  return (
    <div className="flex items-center gap-2 pb-4">
      {/* Search input */}
      <div className="relative max-w-xs flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'flex h-8 w-full rounded-lg border border-input bg-card pl-9 pr-8 text-sm shadow-sm transition-colors',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filter slots */}
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  )
}
