'use client'

import type { Column } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, EyeOff } from 'lucide-react'
import { cn, Button, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@petzone/ui'
import { useI18n } from '@/lib/i18n'

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const { t } = useI18n()

  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>
  }

  const sorted = column.getIsSorted()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            '-ml-3 h-8 gap-1 cursor-pointer font-semibold text-muted-foreground hover:text-foreground data-[state=open]:bg-muted',
            sorted && 'text-foreground',
            className,
          )}
        >
          {title}
          {sorted === 'desc' ? (
            <ArrowDown className="h-3.5 w-3.5" />
          ) : sorted === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[140px] bg-card shadow-[var(--shadow-dropdown)]">
        <DropdownMenuItem onClick={() => column.toggleSorting(false)} className="gap-2 py-1.5 cursor-pointer">
          <ArrowUp className="h-3.5 w-3.5 text-muted-foreground" />
          {t('table.sort_asc')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => column.toggleSorting(true)} className="gap-2 py-1.5 cursor-pointer">
          <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
          {t('table.sort_desc')}
        </DropdownMenuItem>
        {column.getCanHide() && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => column.toggleVisibility(false)} className="gap-2 py-1.5 cursor-pointer">
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
              {t('table.hide_column')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
