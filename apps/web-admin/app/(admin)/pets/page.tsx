'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { PawPrint } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@petzone/ui'
import { useI18n } from '@/lib/i18n'
import { usePets } from '@/lib/hooks/use-admin'
import { useTableParams } from '@/lib/hooks/use-table-params'
import { DataTable, DataTableColumnHeader, DataTableFacetedFilter } from '@/components/data-table'

type Pet = Record<string, unknown>

const SPECIES_CLASS: Record<string, string> = {
  dog: 'bg-amber-50 text-amber-700',
  cat: 'bg-violet-50 text-violet-700',
  other: 'bg-slate-100 text-slate-700',
}

function ageFromDob(dob: string | null | undefined): string {
  if (!dob) return '-'
  const birth = new Date(dob)
  const now = new Date()
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  if (months < 0) return '-'
  if (months < 12) return `${months}m`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem === 0 ? `${years}y` : `${years}y ${rem}m`
}

export default function PetsPage() {
  const { t } = useI18n()
  const router = useRouter()
  const table = useTableParams()
  const { data, isLoading } = usePets({
    page: table.page,
    limit: table.pageSize,
    search: table.debouncedSearch,
    filters: table.filters,
  })

  const columns = useMemo<ColumnDef<Pet, unknown>[]>(() => [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('pets.name')} />,
      cell: ({ row }) => <span className="font-medium">{row.original.name as string}</span>,
    },
    {
      accessorKey: 'species',
      header: t('pets.species'),
      enableSorting: false,
      filterFn: 'multiValue' as any,
      cell: ({ row }) => {
        const s = row.original.species as string
        const key = `pets.species.${s}` as any
        return <Badge variant="outline" className={SPECIES_CLASS[s] || 'bg-slate-100 text-slate-700'}>{t(key)}</Badge>
      },
    },
    {
      accessorKey: 'breed',
      header: t('pets.breed'),
      enableSorting: false,
      cell: ({ row }) => <span className="text-muted-foreground">{(row.original.breed as string) || '-'}</span>,
    },
    {
      accessorKey: 'gender',
      header: t('pets.gender'),
      enableSorting: false,
      cell: ({ row }) => {
        const g = row.original.gender as string
        const key = `pets.gender.${g}` as any
        return <span className="text-muted-foreground">{t(key)}</span>
      },
    },
    {
      id: 'age',
      header: t('pets.age'),
      enableSorting: false,
      cell: ({ row }) => <span className="text-muted-foreground">{ageFromDob(row.original.date_of_birth as string)}</span>,
    },
    {
      accessorKey: 'weight_kg',
      header: t('pets.weight'),
      enableSorting: false,
      cell: ({ row }) => {
        const w = row.original.weight_kg
        return <span className="text-muted-foreground">{w != null ? `${w}kg` : '-'}</span>
      },
    },
    {
      id: 'owner',
      header: t('pets.owner'),
      enableSorting: false,
      cell: ({ row }) => {
        const u = row.original.users as Record<string, unknown> | Record<string, unknown>[] | null
        const user = u ? (Array.isArray(u) ? u[0] : u) : null
        const name = (user?.full_name as string) || (user?.email as string) || '-'
        return <span className="text-muted-foreground">{name}</span>
      },
    },
    {
      accessorKey: 'is_active',
      header: t('pets.is_active'),
      enableSorting: false,
      cell: ({ row }) => {
        const active = row.original.is_active as boolean
        return <Badge variant={active ? 'success' : 'destructive'}>{t(active ? 'pets.active' : 'pets.inactive')}</Badge>
      },
    },
  ], [t])

  const speciesOptions = useMemo(() => [
    { label: t('pets.species.dog'), value: 'dog' },
    { label: t('pets.species.cat'), value: 'cat' },
    { label: t('pets.species.other'), value: 'other' },
  ], [t])

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center gap-3 mb-8">
        <div className="stat-icon bg-amber-50 text-amber-600">
          <PawPrint size={20} />
        </div>
        <div>
          <h1 className="page-header">{t('pets.title')}</h1>
          <p className="page-description">{t('pets.subtitle')}</p>
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
        searchPlaceholder={`${t('common.search')} ${t('pets.name').toLowerCase()}...`}
        activeFilters={table.filters}
        isLoading={isLoading}
        emptyIcon={PawPrint}
        emptyMessage={t('pets.empty')}
        onRowClick={(row) => router.push(`/pets/${row.id}`)}
        toolbarContent={
          <DataTableFacetedFilter
            title={t('pets.species')}
            options={speciesOptions}
            value={table.filters.species ?? []}
            onChange={(v) => table.setFilter('species', v)}
          />
        }
      />
    </div>
  )
}
