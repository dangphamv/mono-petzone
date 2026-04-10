'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useRef, useState, useEffect, useMemo } from 'react'

interface UseTableParamsOptions {
  defaultPageSize?: number
  debounceMs?: number
}

const RESERVED_KEYS = new Set(['page', 'limit', 'search'])

export function useTableParams({
  defaultPageSize = 20,
  debounceMs = 400,
}: UseTableParamsOptions = {}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // ── Read state from URL ──
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('limit')) || defaultPageSize
  const urlSearch = searchParams.get('search') || ''

  const filters = useMemo(() => {
    const f: Record<string, string[]> = {}
    searchParams.forEach((value, key) => {
      if (!RESERVED_KEYS.has(key) && value) f[key] = value.split(',')
    })
    return f
  }, [searchParams])

  // ── Local search input for immediate typing feedback ──
  const [searchInput, setSearchInput] = useState(urlSearch)

  // Sync back when URL changes externally (browser back/forward)
  useEffect(() => { setSearchInput(urlSearch) }, [urlSearch])

  // ── URL helper ──
  const updateUrl = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') params.delete(key)
      else params.set(key, value)
    }
    if (params.get('page') === '1') params.delete('page')
    if (params.get('limit') === String(defaultPageSize)) params.delete('limit')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [searchParams, router, pathname, defaultPageSize])

  // Keep a ref so the debounce timer always calls the latest version
  const updateUrlRef = useRef(updateUrl)
  updateUrlRef.current = updateUrl

  // ── Debounce search input → URL ──
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    // Skip on initial load or browser-back when input already matches URL
    if (searchInput === urlSearch) return
    timerRef.current = setTimeout(() => {
      updateUrlRef.current({ search: searchInput || null, page: null })
    }, debounceMs)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [searchInput, urlSearch, debounceMs])

  // ── Setters ──
  const setPage = useCallback(
    (p: number) => updateUrl({ page: String(p) }),
    [updateUrl],
  )

  const setPageSize = useCallback(
    (size: number) => updateUrl({ limit: String(size), page: null }),
    [updateUrl],
  )

  const setSearch = useCallback((value: string) => setSearchInput(value), [])

  const setFilter = useCallback(
    (key: string, values: string[]) => {
      updateUrl({ [key]: values.length ? values.join(',') : null, page: null })
    },
    [updateUrl],
  )

  const resetFilters = useCallback(() => {
    setSearchInput('')
    router.replace(pathname, { scroll: false })
  }, [router, pathname])

  return {
    page,
    pageSize,
    search: searchInput,       // immediate value for toolbar input
    debouncedSearch: urlSearch, // debounced value for API queries
    filters,
    setPage,
    setPageSize,
    setSearch,
    setFilter,
    resetFilters,
  }
}
