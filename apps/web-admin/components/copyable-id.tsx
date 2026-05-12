'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@petzone/ui'

type Size = 'xs' | 'sm' | 'md'

const SIZE_CLASS: Record<Size, string> = {
  xs: 'px-1.5 py-0.5 text-[10px] gap-1',
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-sm gap-1.5',
}

const ICON_SIZE: Record<Size, number> = { xs: 10, sm: 11, md: 13 }

interface Props {
  value: string | null | undefined
  /** Text rendered in the chip. Defaults to `value`. Use to show a truncated form while still copying the full value. */
  displayValue?: string
  size?: Size
  /** @deprecated icon is always reserved now */
  showIcon?: boolean
  className?: string
}

export function CopyableId({ value, displayValue, size = 'sm', className }: Props) {
  const [copied, setCopied] = useState(false)
  if (!value) return <span className="text-muted-foreground">-</span>

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success(`Copied: ${value}`)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Click to copy: ${value}`}
      className={cn(
        'group inline-flex max-w-full items-center whitespace-nowrap rounded-md border bg-muted font-mono text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground',
        SIZE_CLASS[size],
        className,
      )}
    >
      <span className="truncate">{displayValue ?? value}</span>
      <span className="shrink-0">
        {copied
          ? <Check size={ICON_SIZE[size]} className="text-emerald-600" />
          : <Copy size={ICON_SIZE[size]} className="opacity-30 group-hover:opacity-70 transition-opacity" />
        }
      </span>
    </button>
  )
}
