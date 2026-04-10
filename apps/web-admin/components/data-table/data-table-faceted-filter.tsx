'use client'

import type { Column } from '@tanstack/react-table'
import { Check, ListFilter } from 'lucide-react'
import {
  cn, Badge, Button,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from '@petzone/ui'
import { useI18n } from '@/lib/i18n'

export interface FacetedFilterOption {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
}

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  title: string
  options: FacetedFilterOption[]
  value?: string[]
  onChange?: (values: string[]) => void
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  value: controlledValue,
  onChange,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const { t } = useI18n()

  const selectedValues = controlledValue
    ?? (column?.getFilterValue() as string[] | undefined)
    ?? []

  const toggle = (val: string) => {
    const next = selectedValues.includes(val)
      ? selectedValues.filter((v) => v !== val)
      : [...selectedValues, val]
    if (onChange) {
      onChange(next)
    } else {
      column?.setFilterValue(next.length ? next : undefined)
    }
  }

  const clear = () => {
    if (onChange) onChange([])
    else column?.setFilterValue(undefined)
  }

  const hasSelection = selectedValues.length > 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-8 gap-1.5 cursor-pointer border-dashed font-normal',
            hasSelection && 'border-primary/50 bg-primary/5 text-primary-dark',
          )}
        >
          <ListFilter className="h-3.5 w-3.5" />
          {title}
          {hasSelection && (
            <Badge variant="default" className="ml-0.5 h-[18px] min-w-[18px] rounded-full px-1 text-[10px] font-semibold leading-none">
              {selectedValues.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[180px] bg-card shadow-[var(--shadow-dropdown)]">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          {title}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value)
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={(e) => { e.preventDefault(); toggle(option.value) }}
              className="gap-2.5 py-1.5 cursor-pointer"
            >
              <div
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input bg-card',
                )}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </div>
              {option.icon && <option.icon className="h-4 w-4 text-muted-foreground" />}
              <span className="flex-1 text-sm">{option.label}</span>
            </DropdownMenuItem>
          )
        })}
        {hasSelection && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={clear} className="justify-center text-xs text-muted-foreground cursor-pointer">
              {t('table.clear_filters')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
