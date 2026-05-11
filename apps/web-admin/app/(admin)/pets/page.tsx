'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PawPrint, Plus, Pencil, Search, X, Check } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Badge, Button, Input, Label, Textarea, Skeleton,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Avatar, AvatarFallback,
} from '@petzone/ui'
import { useI18n } from '@/lib/i18n'
import {
  usePets, useUsers, useCreatePet, useUpdatePet,
  type CreatePetBody, type UpdatePetBody,
} from '@/lib/hooks/use-admin'
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

function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return v
}

type FormState = {
  owner_id: string
  name: string
  species: 'dog' | 'cat' | 'other'
  gender: 'male' | 'female' | 'unknown'
  breed: string
  date_of_birth: string
  weight_kg: string
  color: string
  is_neutered: 'yes' | 'no' | 'unknown'
  temperament: 'friendly' | 'shy' | 'aggressive' | 'normal'
  sociable_with_others: 'yes' | 'no' | 'depends'
  special_needs_notes: string
}

const DEFAULT_FORM: FormState = {
  owner_id: '',
  name: '',
  species: 'dog',
  gender: 'unknown',
  breed: '',
  date_of_birth: '',
  weight_kg: '',
  color: '',
  is_neutered: 'unknown',
  temperament: 'normal',
  sociable_with_others: 'depends',
  special_needs_notes: '',
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

  const createPet = useCreatePet()
  const updatePet = useUpdatePet()

  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Pet | null>(null)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [ownerLabel, setOwnerLabel] = useState('')

  const openCreate = () => {
    setEditing(null)
    setForm(DEFAULT_FORM)
    setOwnerLabel('')
    setDialogMode('create')
  }

  const openEdit = (pet: Pet) => {
    setEditing(pet)
    setForm({
      owner_id: (pet.owner_id as string) || '',
      name: (pet.name as string) || '',
      species: ((pet.species as FormState['species']) || 'dog'),
      gender: ((pet.gender as FormState['gender']) || 'unknown'),
      breed: (pet.breed as string) || '',
      date_of_birth: (pet.date_of_birth as string) || '',
      weight_kg: pet.weight_kg != null ? String(pet.weight_kg) : '',
      color: (pet.color as string) || '',
      is_neutered: ((pet.is_neutered as FormState['is_neutered']) || 'unknown'),
      temperament: ((pet.temperament as FormState['temperament']) || 'normal'),
      sociable_with_others: ((pet.sociable_with_others as FormState['sociable_with_others']) || 'depends'),
      special_needs_notes: (pet.special_needs_notes as string) || '',
    })
    const u = pet.users as Record<string, unknown> | Record<string, unknown>[] | null
    const owner = u ? (Array.isArray(u) ? u[0] : u) : null
    setOwnerLabel((owner?.full_name as string) || (owner?.email as string) || '')
    setDialogMode('edit')
  }

  const closeDialog = () => {
    setDialogMode(null)
    setEditing(null)
    setOwnerLabel('')
  }

  const handleSubmit = () => {
    const payload = {
      name: form.name.trim(),
      species: form.species,
      gender: form.gender,
      breed: form.breed.trim() || undefined,
      date_of_birth: form.date_of_birth || undefined,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
      color: form.color.trim() || undefined,
      is_neutered: form.is_neutered,
      temperament: form.temperament,
      sociable_with_others: form.sociable_with_others,
      special_needs_notes: form.special_needs_notes.trim() || undefined,
    }

    if (dialogMode === 'create') {
      if (!form.owner_id || !payload.name) return
      createPet.mutate(
        { owner_id: form.owner_id, ...payload } as CreatePetBody,
        { onSuccess: closeDialog },
      )
    } else if (dialogMode === 'edit' && editing) {
      const diff: UpdatePetBody = {}
      Object.entries(payload).forEach(([k, v]) => {
        const original = (editing as any)[k]
        const normalized = original == null ? undefined : original
        if (v !== normalized) (diff as any)[k] = v
      })
      if (Object.keys(diff).length === 0) {
        closeDialog()
        return
      }
      updatePet.mutate(
        { id: editing.id as string, ...diff },
        { onSuccess: closeDialog },
      )
    }
  }

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
    {
      id: 'actions',
      size: 100,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => openEdit(row.original)}>
            <Pencil size={12} />
            {t('common.edit')}
          </Button>
        </div>
      ),
    },
  ], [t])

  const speciesOptions = useMemo(() => [
    { label: t('pets.species.dog'), value: 'dog' },
    { label: t('pets.species.cat'), value: 'cat' },
    { label: t('pets.species.other'), value: 'other' },
  ], [t])

  const submitting = createPet.isPending || updatePet.isPending
  const canSubmit = dialogMode === 'edit'
    ? !!form.name.trim()
    : !!form.owner_id && !!form.name.trim()

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="stat-icon bg-amber-50 text-amber-600">
            <PawPrint size={20} />
          </div>
          <div>
            <h1 className="page-header">{t('pets.title')}</h1>
            <p className="page-description">{t('pets.subtitle')}</p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-1">
          <Plus size={16} />
          {t('pets.create')}
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

      <Dialog open={dialogMode !== null} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogMode === 'edit' ? t('pets.edit') : t('pets.create')}</DialogTitle>
            <DialogDescription>
              {dialogMode === 'edit'
                ? `${t('pets.owner')}: ${ownerLabel || '-'}`
                : t('pets.select_owner')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {dialogMode === 'create' && (
              <div className="sm:col-span-2">
                <Label className="mb-1.5 block">{t('pets.select_owner')} *</Label>
                <OwnerPicker
                  value={form.owner_id}
                  label={ownerLabel}
                  onSelect={(id, label) => {
                    setForm((f) => ({ ...f, owner_id: id }))
                    setOwnerLabel(label)
                  }}
                />
              </div>
            )}

            <div>
              <Label htmlFor="pet-name" className="mb-1.5 block">{t('pets.name')} *</Label>
              <Input
                id="pet-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">{t('pets.species')} *</Label>
              <Select value={form.species} onValueChange={(v) => setForm({ ...form, species: v as FormState['species'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dog">{t('pets.species.dog')}</SelectItem>
                  <SelectItem value="cat">{t('pets.species.cat')}</SelectItem>
                  <SelectItem value="other">{t('pets.species.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 block">{t('pets.gender')} *</Label>
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as FormState['gender'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t('pets.gender.male')}</SelectItem>
                  <SelectItem value="female">{t('pets.gender.female')}</SelectItem>
                  <SelectItem value="unknown">{t('pets.gender.unknown')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pet-breed" className="mb-1.5 block">{t('pets.breed')}</Label>
              <Input
                id="pet-breed"
                value={form.breed}
                onChange={(e) => setForm({ ...form, breed: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="pet-dob" className="mb-1.5 block">{t('pets.dob')}</Label>
              <Input
                id="pet-dob"
                type="date"
                value={form.date_of_birth}
                onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="pet-weight" className="mb-1.5 block">{t('pets.weight_kg')}</Label>
              <Input
                id="pet-weight"
                type="number"
                step="0.1"
                min="0"
                value={form.weight_kg}
                onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="pet-color" className="mb-1.5 block">{t('pets.color')}</Label>
              <Input
                id="pet-color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">{t('pets.is_neutered')}</Label>
              <Select value={form.is_neutered} onValueChange={(v) => setForm({ ...form, is_neutered: v as FormState['is_neutered'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">{t('pets.neutered.yes')}</SelectItem>
                  <SelectItem value="no">{t('pets.neutered.no')}</SelectItem>
                  <SelectItem value="unknown">{t('pets.neutered.unknown')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 block">{t('pets.temperament')}</Label>
              <Select value={form.temperament} onValueChange={(v) => setForm({ ...form, temperament: v as FormState['temperament'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">{t('pets.temperament.friendly')}</SelectItem>
                  <SelectItem value="normal">{t('pets.temperament.normal')}</SelectItem>
                  <SelectItem value="shy">{t('pets.temperament.shy')}</SelectItem>
                  <SelectItem value="aggressive">{t('pets.temperament.aggressive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">{t('pets.sociable_with_others')}</Label>
              <Select value={form.sociable_with_others} onValueChange={(v) => setForm({ ...form, sociable_with_others: v as FormState['sociable_with_others'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">{t('pets.sociable.yes')}</SelectItem>
                  <SelectItem value="no">{t('pets.sociable.no')}</SelectItem>
                  <SelectItem value="depends">{t('pets.sociable.depends')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="pet-notes" className="mb-1.5 block">{t('pets.special_notes')}</Label>
              <Textarea
                id="pet-notes"
                rows={3}
                value={form.special_needs_notes}
                onChange={(e) => setForm({ ...form, special_needs_notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} disabled={submitting || !canSubmit}>
              {submitting ? t('common.processing') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function OwnerPicker({
  value,
  label,
  onSelect,
}: {
  value: string
  label: string
  onSelect: (id: string, label: string) => void
}) {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search, 300)
  const [open, setOpen] = useState(false)
  const { data, isLoading } = useUsers({
    page: 1,
    limit: 8,
    search: debounced,
    filters: { role: ['owner'] },
  })

  return (
    <div className="relative">
      {value ? (
        <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">{(label || '?')[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="flex-1 truncate font-medium">{label || value}</span>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => { onSelect('', ''); setOpen(true); setSearch('') }}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
              onFocus={() => setOpen(true)}
              placeholder={t('pets.search_owner')}
              className="pl-8"
            />
          </div>
          {open && (
            <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
              {isLoading ? (
                <div className="space-y-1 p-1">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (data?.data ?? []).length === 0 ? (
                <p className="p-3 text-center text-sm text-muted-foreground">{t('orders.no_owner_found')}</p>
              ) : (
                (data?.data ?? []).map((u: Record<string, unknown>) => {
                  const lbl = (u.full_name as string) || (u.email as string) || (u.phone as string) || '?'
                  return (
                    <button
                      key={u.id as string}
                      type="button"
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                      onClick={() => { onSelect(u.id as string, lbl); setOpen(false); setSearch('') }}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">{lbl[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{lbl}</p>
                        {u.email ? <p className="truncate text-xs text-muted-foreground">{u.email as string}</p> : null}
                      </div>
                      {value === u.id && <Check size={14} className="text-primary" />}
                    </button>
                  )
                })
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
