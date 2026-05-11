'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ClipboardList, Search, X, Check } from 'lucide-react'
import {
  Button,
  Card, CardHeader, CardTitle, CardContent,
  Input,
  Label,
  Textarea,
  Checkbox,
  Badge,
  Skeleton,
  Avatar, AvatarImage, AvatarFallback,
} from '@petzone/ui'
import { useI18n } from '@/lib/i18n'
import {
  useUsers, useProviders, useOwnerPets, useProviderRooms, useProviderAddOns, useCreateOrder,
} from '@/lib/hooks/use-admin'

type Row = Record<string, unknown>

function fmtVND(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

function todayISO(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

export default function CreateOrderPage() {
  const { t } = useI18n()
  const router = useRouter()
  const create = useCreateOrder()

  // ── Owner search ──
  const [ownerSearch, setOwnerSearch] = useState('')
  const debouncedOwner = useDebounced(ownerSearch, 300)
  const [selectedOwner, setSelectedOwner] = useState<Row | null>(null)

  const { data: ownerSearchData } = useUsers({
    page: 1,
    limit: 10,
    search: debouncedOwner,
    filters: { role: ['owner'] },
  })

  // ── Provider search ──
  const [providerSearch, setProviderSearch] = useState('')
  const debouncedProvider = useDebounced(providerSearch, 300)
  const [selectedProvider, setSelectedProvider] = useState<Row | null>(null)

  const { data: providerSearchData } = useProviders({
    page: 1,
    limit: 10,
    search: debouncedProvider,
    filters: { status: ['approved'] },
  })

  // ── Dependent data ──
  const { data: pets = [], isLoading: petsLoading } = useOwnerPetsList(selectedOwner?.id as string | undefined)
  const { data: rooms = [], isLoading: roomsLoading } = useProviderRooms(selectedProvider?.id as string | undefined)
  const { data: addons = [], isLoading: addonsLoading } = useProviderAddOns(selectedProvider?.id as string | undefined)

  // ── Form state ──
  const [petIds, setPetIds] = useState<string[]>([])
  const [roomId, setRoomId] = useState('')
  const [addonIds, setAddonIds] = useState<string[]>([])
  const [checkIn, setCheckIn] = useState(todayISO(1))
  const [checkOut, setCheckOut] = useState(todayISO(2))
  const [specialNotes, setSpecialNotes] = useState('')
  const [dailyReport, setDailyReport] = useState(true)

  // Reset dependent fields when owner/provider changes
  useEffect(() => { setPetIds([]) }, [selectedOwner?.id])
  useEffect(() => { setRoomId(''); setAddonIds([]) }, [selectedProvider?.id])

  // ── Price preview ──
  const pricePreview = useMemo(() => {
    if (!roomId || !checkIn || !checkOut) return null
    const room = rooms.find((r) => r.id === roomId)
    if (!room) return null
    const nights = Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    if (nights < 1) return null
    const roomTotal = (room.price_per_night as number) * nights
    const addonItems = addonIds
      .map((id) => addons.find((a) => a.id === id))
      .filter((a): a is Row => !!a)
      .map((a) => {
        const price = a.price as number
        const type = a.price_type as string
        const subtotal =
          type === 'per_night' ? price * nights : type === 'per_pet' ? price * petIds.length : price
        return { id: a.id as string, name: a.name as string, type, subtotal }
      })
    const addonTotal = addonItems.reduce((s, x) => s + x.subtotal, 0)
    return { nights, roomTotal, addonItems, addonTotal, total: roomTotal + addonTotal }
  }, [roomId, rooms, addonIds, addons, petIds.length, checkIn, checkOut])

  // ── Submit ──
  const canSubmit =
    !!selectedOwner && !!selectedProvider && !!roomId && petIds.length > 0 &&
    !!checkIn && !!checkOut && new Date(checkOut) > new Date(checkIn)

  const handleSubmit = () => {
    if (!canSubmit) return
    create.mutate(
      {
        owner_id: selectedOwner!.id as string,
        provider_id: selectedProvider!.id as string,
        room_type_id: roomId,
        pet_ids: petIds,
        check_in_date: checkIn,
        check_out_date: checkOut,
        add_on_ids: addonIds,
        special_notes: specialNotes || undefined,
        daily_status_report: dailyReport,
      },
      {
        onSuccess: (res) => {
          const id = (res as { data?: { id?: string } }).data?.id
          router.push(id ? `/orders/${id}` : '/orders')
        },
      },
    )
  }

  const ownerOptions = (ownerSearchData?.data ?? []) as Row[]
  const providerOptions = (providerSearchData?.data ?? []) as Row[]

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <Link href="/orders" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft size={16} /> {t('common.back_to_list')}
      </Link>

      <div className="mt-4 mb-8 flex items-center gap-3">
        <div className="stat-icon bg-violet-50 text-violet-600">
          <ClipboardList size={20} />
        </div>
        <div>
          <h1 className="page-header">{t('orders.create_title')}</h1>
          <p className="page-description">{t('orders.create_subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Owner */}
          <Card>
            <CardHeader>
              <CardTitle>{t('orders.select_owner')}</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedOwner ? (
                <SelectedRow
                  avatar={selectedOwner.avatar_url as string}
                  fallback={(selectedOwner.full_name as string) || (selectedOwner.email as string) || '?'}
                  title={(selectedOwner.full_name as string) || '-'}
                  subtitle={[(selectedOwner.email as string) || '-', (selectedOwner.phone as string) || '-'].filter(Boolean).join(' · ')}
                  onClear={() => { setSelectedOwner(null); setOwnerSearch('') }}
                />
              ) : (
                <SearchPicker
                  search={ownerSearch}
                  onSearchChange={setOwnerSearch}
                  placeholder={t('orders.search_owner')}
                  options={ownerOptions}
                  emptyText={t('orders.no_owner_found')}
                  onSelect={(row) => { setSelectedOwner(row); setOwnerSearch('') }}
                  renderOption={(row) => (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={row.avatar_url as string} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {((row.full_name as string) || '?')[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{(row.full_name as string) || '-'}</div>
                        <div className="truncate text-xs text-muted-foreground">{(row.email as string) || (row.phone as string) || '-'}</div>
                      </div>
                    </div>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Pets */}
          {selectedOwner && (
            <Card>
              <CardHeader>
                <CardTitle>{t('orders.select_pets')}</CardTitle>
              </CardHeader>
              <CardContent>
                {petsLoading ? (
                  <SkeletonList />
                ) : pets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('orders.no_pets_for_owner')}</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {pets.map((p) => {
                      const id = p.id as string
                      const checked = petIds.includes(id)
                      return (
                        <label
                          key={id}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                            checked ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                          }`}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) =>
                              setPetIds((prev) => (c === true ? [...prev, id] : prev.filter((x) => x !== id)))
                            }
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium text-sm">{p.name as string}</div>
                            <div className="truncate text-xs text-muted-foreground">
                              {t(`pets.species.${p.species as string}` as any)}
                              {p.breed ? ` · ${p.breed as string}` : ''}
                              {p.weight_kg != null ? ` · ${p.weight_kg}kg` : ''}
                            </div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Provider */}
          <Card>
            <CardHeader>
              <CardTitle>{t('orders.select_provider')}</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedProvider ? (
                <SelectedRow
                  fallback={(selectedProvider.business_name as string) || '?'}
                  title={selectedProvider.business_name as string}
                  subtitle={(selectedProvider.address as string) || '-'}
                  onClear={() => { setSelectedProvider(null); setProviderSearch('') }}
                />
              ) : (
                <SearchPicker
                  search={providerSearch}
                  onSearchChange={setProviderSearch}
                  placeholder={t('orders.search_provider')}
                  options={providerOptions}
                  emptyText={t('orders.no_provider_found')}
                  hint={t('orders.only_approved')}
                  onSelect={(row) => { setSelectedProvider(row); setProviderSearch('') }}
                  renderOption={(row) => (
                    <div className="min-w-0">
                      <div className="truncate font-medium">{row.business_name as string}</div>
                      <div className="truncate text-xs text-muted-foreground">{(row.address as string) || '-'}</div>
                    </div>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Rooms */}
          {selectedProvider && (
            <Card>
              <CardHeader>
                <CardTitle>{t('orders.select_room')}</CardTitle>
              </CardHeader>
              <CardContent>
                {roomsLoading ? (
                  <SkeletonList />
                ) : rooms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('orders.no_rooms')}</p>
                ) : (
                  <div className="space-y-2">
                    {rooms.map((r) => {
                      const id = r.id as string
                      const selected = roomId === id
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setRoomId(id)}
                          className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${
                            selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                          }`}
                        >
                          <div
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              selected ? 'border-primary bg-primary' : 'border-input'
                            }`}
                          >
                            {selected && <Check size={12} className="text-primary-foreground" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <span className="truncate font-medium">{r.name as string}</span>
                              <span className="shrink-0 font-semibold text-primary">
                                {fmtVND(r.price_per_night as number)}
                                <span className="text-xs font-normal text-muted-foreground">{t('orders.price_per_night')}</span>
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {t('orders.capacity')}: {r.capacity as number}
                              {r.description ? ` · ${r.description as string}` : ''}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Add-ons */}
          {selectedProvider && (
            <Card>
              <CardHeader>
                <CardTitle>{t('orders.select_addons')}</CardTitle>
              </CardHeader>
              <CardContent>
                {addonsLoading ? (
                  <SkeletonList />
                ) : addons.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('orders.no_addons')}</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {addons.map((a) => {
                      const id = a.id as string
                      const checked = addonIds.includes(id)
                      const priceTypeKey = `orders.price_${a.price_type as string}` as any
                      return (
                        <label
                          key={id}
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 transition-colors ${
                            checked ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                          }`}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) =>
                              setAddonIds((prev) => (c === true ? [...prev, id] : prev.filter((x) => x !== id)))
                            }
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium text-sm">{a.name as string}</div>
                            <div className="text-xs text-muted-foreground">
                              {fmtVND(a.price as number)}
                              <span>{t(priceTypeKey)}</span>
                            </div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Dates & notes */}
          <Card>
            <CardHeader>
              <CardTitle>{t('orders.dates')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t('orders.check_in')}</Label>
                  <Input type="date" value={checkIn} min={todayISO(0)} onChange={(e) => setCheckIn(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('orders.check_out')}</Label>
                  <Input type="date" value={checkOut} min={checkIn || todayISO(1)} onChange={(e) => setCheckOut(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{t('orders.special_notes')}</Label>
                <Textarea rows={3} value={specialNotes} onChange={(e) => setSpecialNotes(e.target.value)} />
              </div>

              <label className="flex items-center gap-2">
                <Checkbox checked={dailyReport} onCheckedChange={(c) => setDailyReport(c === true)} />
                <div>
                  <div className="text-sm font-medium">{t('orders.daily_status_report')}</div>
                  <div className="text-xs text-muted-foreground">{t('orders.daily_status_report_desc')}</div>
                </div>
              </label>
            </CardContent>
          </Card>
        </div>

        {/* Summary sidebar */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>{t('orders.summary')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <SummaryRow label={t('orders.select_owner')} value={(selectedOwner?.full_name as string) || '-'} />
              <SummaryRow label={t('orders.select_pets')} value={petIds.length ? `${petIds.length}` : '-'} />
              <SummaryRow label={t('orders.select_provider')} value={(selectedProvider?.business_name as string) || '-'} />
              <SummaryRow
                label={t('orders.select_room')}
                value={(rooms.find((r) => r.id === roomId)?.name as string) || '-'}
              />
              <SummaryRow
                label={t('orders.dates')}
                value={pricePreview ? `${pricePreview.nights} ${t('orders.nights')}` : '-'}
              />

              {pricePreview && (
                <>
                  <div className="my-2 border-t border-border" />
                  <SummaryRow label={t('orders.select_room')} value={fmtVND(pricePreview.roomTotal)} />
                  {pricePreview.addonItems.map((a) => (
                    <SummaryRow key={a.id} label={a.name} value={fmtVND(a.subtotal)} muted />
                  ))}
                  <div className="my-2 border-t border-border" />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{t('orders.total_price')}</span>
                    <span className="text-lg font-bold text-primary">{fmtVND(pricePreview.total)}</span>
                  </div>
                </>
              )}

              {create.error && (
                <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                  {(create.error as Error).message}
                </div>
              )}

              <Button className="w-full" disabled={!canSubmit || create.isPending} onClick={handleSubmit}>
                {create.isPending ? t('orders.creating') : t('orders.submit')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Wraps useOwnerPets and unwraps the paginated `data` field for ergonomic use.
function useOwnerPetsList(ownerId: string | undefined) {
  const q = useOwnerPets(ownerId)
  return { data: q.data?.data ?? [], isLoading: q.isLoading }
}

interface SearchPickerProps {
  search: string
  onSearchChange: (v: string) => void
  placeholder: string
  options: Row[]
  emptyText: string
  hint?: string
  onSelect: (row: Row) => void
  renderOption: (row: Row) => React.ReactNode
}

function SearchPicker({ search, onSearchChange, placeholder, options, emptyText, hint, onSelect, renderOption }: SearchPickerProps) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {search.trim().length > 0 && (
        <div className="max-h-72 overflow-auto rounded-lg border border-border">
          {options.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">{emptyText}</p>
          ) : (
            options.map((row) => (
              <button
                key={row.id as string}
                type="button"
                onClick={() => onSelect(row)}
                className="block w-full border-b border-border/40 px-3 py-2 text-left transition-colors last:border-0 hover:bg-muted/50"
              >
                {renderOption(row)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

interface SelectedRowProps {
  avatar?: string
  fallback: string
  title: string
  subtitle: string
  onClear: () => void
}

function SelectedRow({ avatar, fallback, title, subtitle, onClear }: SelectedRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
      <Avatar className="h-10 w-10">
        {avatar && <AvatarImage src={avatar} />}
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{fallback[0]}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
      </div>
      <Badge variant="success" className="shrink-0">
        <Check size={12} />
      </Badge>
      <Button variant="ghost" size="icon" onClick={onClear} aria-label="Clear">
        <X size={16} />
      </Button>
    </div>
  )
}

function SummaryRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={muted ? 'text-xs text-muted-foreground' : 'text-muted-foreground'}>{label}</span>
      <span className={muted ? 'text-xs' : 'font-medium'}>{value}</span>
    </div>
  )
}

function SkeletonList() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}
