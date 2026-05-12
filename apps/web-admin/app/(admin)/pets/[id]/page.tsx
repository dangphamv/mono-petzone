'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, PawPrint, Cake, Scale, Palette, Stethoscope, Heart,
  CheckCircle2, XCircle, AlertTriangle, Phone, Mail, User, Calendar,
  Image as ImageIcon, BadgeAlert, Smile,
} from 'lucide-react'
import {
  Badge,
  Card, CardHeader, CardTitle, CardContent,
  Skeleton,
  Avatar, AvatarImage, AvatarFallback,
  Separator,
} from '@petzone/ui'
import { usePetDetail } from '@/lib/hooks/use-admin'
import { useI18n } from '@/lib/i18n'
import { displayId } from '@/lib/display-id'
import { CopyableId } from '@/components/copyable-id'

const TONE: Record<string, { bg: string; text: string; border: string }> = {
  teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
}

const SPECIES_TONE: Record<string, keyof typeof TONE> = {
  dog: 'amber', cat: 'violet', other: 'teal',
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

function formatDate(d: string | undefined | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useI18n()
  const { id } = use(params)
  const { data: pet, isLoading } = usePetDetail(id)
  const [lightbox, setLightbox] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="lg:col-span-2 h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!pet) {
    return (
      <div>
        <Link href="/pets" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft size={16} /> {t('common.back')}
        </Link>
        <p className="mt-4 text-muted-foreground">{t('pets.not_found')}</p>
      </div>
    )
  }

  const u = pet.users as Record<string, unknown> | Record<string, unknown>[] | null
  const owner = u ? (Array.isArray(u) ? u[0] : u) : null
  const ownerName = (owner?.full_name as string) || (owner?.email as string) || '-'
  const ownerInitial = ownerName?.[0]?.toUpperCase() || '?'
  const ownerEmail = owner?.email as string | undefined
  const ownerPhone = owner?.phone as string | undefined

  const photos = (pet.photos as string[]) || []
  const coverPhoto = photos[0]
  const allergies = (pet.allergies as string[]) || []
  const chronicConditions = (pet.chronic_conditions as string[]) || []
  const species = pet.species as string
  const breed = pet.breed as string | undefined
  const color = pet.color as string | undefined
  const gender = pet.gender as string | undefined
  const isActive = pet.is_active as boolean
  const weight = pet.weight_kg as number | undefined
  const dob = pet.date_of_birth as string | undefined
  const age = ageFromDob(dob)
  const isNeutered = pet.is_neutered as string | undefined
  const emergencyVetName = pet.emergency_vet_name as string | undefined
  const emergencyVetPhone = pet.emergency_vet_phone as string | undefined
  const specialNeeds = pet.special_needs_notes as string | undefined
  const temperament = pet.temperament as string | undefined
  const sociable = pet.sociable_with_others as string | undefined

  const speciesTone = TONE[SPECIES_TONE[species] || 'teal']

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <Link href="/pets" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft size={16} /> {t('common.back_to_list')}
      </Link>

      {/* Header */}
      <Card className="mt-3">
        <CardContent className="flex flex-wrap items-start gap-4 p-5">
          {coverPhoto ? (
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border">
              <img src={coverPhoto} alt={pet.name as string} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className={`h-20 w-20 shrink-0 rounded-xl border ${speciesTone.bg} flex items-center justify-center ${speciesTone.text}`}>
              <PawPrint size={32} />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('pets.basic_info')}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-bold first-letter:uppercase">{pet.name as string}</h1>
              <CopyableId value={displayId(pet, 'T')} showIcon />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={`gap-1 ${speciesTone.border} ${speciesTone.bg} ${speciesTone.text} first-letter:uppercase`}>
                <PawPrint size={12} />
                {t(`pets.species.${species}` as any) || species}
              </Badge>
              <Badge variant={isActive ? 'success' : 'destructive'} className="gap-1">
                {isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                {t(isActive ? 'pets.active' : 'pets.inactive')}
              </Badge>
              {breed && (
                <span className="text-xs text-muted-foreground first-letter:uppercase">{breed}</span>
              )}
              {gender && (
                <span className="text-xs text-muted-foreground first-letter:uppercase">
                  · {t(`pets.gender.${gender}` as any) || gender}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stat tiles */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Cake} label={t('pets.age')} value={age} tone="amber" />
        <StatTile icon={Scale} label={t('pets.weight')} value={weight != null ? `${weight}kg` : '-'} tone="violet" />
        <StatTile icon={Palette} label={t('pets.color')} value={color || '-'} tone="rose" />
        <StatTile icon={Calendar} label={t('common.created_at')} value={formatDate(pet.created_at as string)} tone="teal" />
      </div>

      {/* About + Owner */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${speciesTone.bg} ${speciesTone.text}`}>
                <PawPrint size={14} />
              </span>
              {t('pets.basic_info')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldBlock icon={PawPrint} label={t('pets.species')}>
                <Badge variant="outline" className={`${speciesTone.border} ${speciesTone.bg} ${speciesTone.text} first-letter:uppercase`}>
                  {t(`pets.species.${species}` as any) || species}
                </Badge>
              </FieldBlock>
              <FieldBlock icon={PawPrint} label={t('pets.breed')}>
                <span className="text-sm font-medium first-letter:uppercase">{breed || '-'}</span>
              </FieldBlock>
              <FieldBlock icon={User} label={t('pets.gender')}>
                <span className="text-sm font-medium first-letter:uppercase">
                  {gender ? t(`pets.gender.${gender}` as any) || gender : '-'}
                </span>
              </FieldBlock>
              <FieldBlock icon={Calendar} label={t('pets.age')}>
                <span className="text-sm font-medium tabular-nums">
                  {age}
                  {dob ? <span className="ml-1.5 text-xs font-normal text-muted-foreground">({formatDate(dob)})</span> : null}
                </span>
              </FieldBlock>
              <FieldBlock icon={Scale} label={t('pets.weight')}>
                <span className="text-sm font-medium tabular-nums">{weight != null ? `${weight} kg` : '-'}</span>
              </FieldBlock>
              <FieldBlock icon={Palette} label={t('pets.color')}>
                <span className="text-sm font-medium first-letter:uppercase">{color || '-'}</span>
              </FieldBlock>
            </div>

            <Separator className="my-5" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldBlock icon={Smile} label={t('pets.temperament')}>
                {temperament ? (
                  <Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-700 first-letter:uppercase">
                    {t(`pets.temperament.${temperament}` as any) || temperament}
                  </Badge>
                ) : <span className="text-sm text-muted-foreground">-</span>}
              </FieldBlock>
              <FieldBlock icon={Heart} label={t('pets.sociable_with_others')}>
                {sociable ? (
                  <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-700 first-letter:uppercase">
                    {t(`pets.sociable.${sociable}` as any) || sociable}
                  </Badge>
                ) : <span className="text-sm text-muted-foreground">-</span>}
              </FieldBlock>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-700">
                <User size={14} />
              </span>
              {t('pets.owner_info')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {owner ? (
              <>
                <Link href={`/users/${owner.id}`} className="flex items-start gap-4 group">
                  <Avatar className="h-14 w-14 border">
                    {(owner.avatar_url as string) ? <AvatarImage src={owner.avatar_url as string} alt={ownerName} /> : null}
                    <AvatarFallback className="bg-amber-50 text-amber-700 font-medium">{ownerInitial}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-base font-semibold first-letter:uppercase group-hover:text-primary transition-colors">
                      {ownerName}
                    </p>
                    {owner.id ? (
                      <div className="mt-0.5"><CopyableId value={displayId(owner, 'U')} size="xs" /></div>
                    ) : null}
                  </div>
                </Link>

                <div className="mt-4 space-y-2 text-sm">
                  {ownerEmail && (
                    <a href={`mailto:${ownerEmail}`} className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 hover:bg-muted/60 transition-colors">
                      <Mail size={14} className="text-muted-foreground" />
                      <span className="truncate">{ownerEmail}</span>
                    </a>
                  )}
                  {ownerPhone && (
                    <a href={`tel:${ownerPhone}`} className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 hover:bg-muted/60 transition-colors">
                      <Phone size={14} className="text-muted-foreground" />
                      <span className="truncate font-medium">{ownerPhone}</span>
                    </a>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">-</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Health */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-rose-50 text-rose-700">
              <Stethoscope size={14} />
            </span>
            {t('pets.health_info')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldBlock icon={CheckCircle2} label={t('pets.is_neutered')}>
              {isNeutered ? (
                <Badge variant="outline" className={
                  isNeutered === 'yes' ? 'border-green-200 bg-green-50 text-green-700' :
                  isNeutered === 'no' ? 'border-rose-200 bg-rose-50 text-rose-700' :
                  'border-slate-200 bg-slate-50 text-slate-700'
                }>
                  {t(`pets.neutered.${isNeutered}` as any) || isNeutered}
                </Badge>
              ) : <span className="text-sm text-muted-foreground">-</span>}
            </FieldBlock>

            <FieldBlock icon={Phone} label={t('pets.emergency_vet')}>
              {emergencyVetName ? (
                <div className="text-sm">
                  <p className="font-medium first-letter:uppercase">{emergencyVetName}</p>
                  {emergencyVetPhone && (
                    <a href={`tel:${emergencyVetPhone}`} className="text-primary hover:underline tabular-nums">
                      {emergencyVetPhone}
                    </a>
                  )}
                </div>
              ) : <span className="text-sm text-muted-foreground">-</span>}
            </FieldBlock>

            <FieldBlock icon={AlertTriangle} label={t('pets.allergies')}>
              {allergies.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {allergies.map((a) => (
                    <Badge key={a} variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 first-letter:uppercase">
                      {a}
                    </Badge>
                  ))}
                </div>
              ) : <span className="text-sm text-muted-foreground">-</span>}
            </FieldBlock>

            <FieldBlock icon={BadgeAlert} label={t('pets.chronic_conditions')}>
              {chronicConditions.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {chronicConditions.map((c) => (
                    <Badge key={c} variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 first-letter:uppercase">
                      {c}
                    </Badge>
                  ))}
                </div>
              ) : <span className="text-sm text-muted-foreground">-</span>}
            </FieldBlock>
          </div>

          {specialNeeds && (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
              <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-amber-800">
                <AlertTriangle size={12} />
                {t('pets.special_needs')}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/80 first-letter:uppercase">{specialNeeds}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo gallery */}
      {photos.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-violet-50 text-violet-700">
                <ImageIcon size={14} />
              </span>
              {t('pets.title')}
              <span className="text-xs font-normal text-muted-foreground">({photos.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {photos.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                  onClick={() => setLightbox(url)}
                >
                  <img src={url} alt={`${pet.name as string} ${i + 1}`} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/15" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lightbox */}
      {lightbox && (
        <button
          type="button"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-[fade-in_0.15s_ease-out]"
          onClick={() => setLightbox(null)}
          aria-label="Close"
        >
          <img src={lightbox} alt="Pet full view" className="max-h-full max-w-full rounded-xl" />
        </button>
      )}
    </div>
  )
}

function StatTile({ icon: Icon, label, value, tone }: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: string
  tone: keyof typeof TONE
}) {
  const c = TONE[tone]
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${c.bg} ${c.text}`}>
        <Icon size={16} />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate font-heading text-base font-semibold first-letter:uppercase">{value || '-'}</p>
    </div>
  )
}

function FieldBlock({ icon: Icon, label, children }: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon size={12} />
        {label}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}
