'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, PawPrint } from 'lucide-react'
import {
  Badge,
  Card, CardHeader, CardTitle, CardContent,
  Skeleton,
  Avatar, AvatarFallback,
  Separator,
} from '@petzone/ui'
import { usePetDetail } from '@/lib/hooks/use-admin'
import { useI18n } from '@/lib/i18n'
import { displayId } from '@/lib/display-id'

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

function formatDate(d: string | undefined | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useI18n()
  const { id } = use(params)
  const { data: pet, isLoading } = usePetDetail(id)

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-5 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
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
  const photos = (pet.photos as string[]) || []
  const allergies = (pet.allergies as string[]) || []
  const chronicConditions = (pet.chronic_conditions as string[]) || []
  const species = pet.species as string
  const isActive = pet.is_active as boolean

  return (
    <div>
      <Link href="/pets" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft size={16} /> {t('common.back_to_list')}
      </Link>

      <div className="mt-4 flex items-start gap-4">
        <Avatar className="h-16 w-16 text-xl">
          <AvatarFallback className="bg-amber-50 text-amber-600">
            <PawPrint size={28} />
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold">{pet.name as string}</h1>
            <span className="rounded-md border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
              {displayId(pet, 'T')}
            </span>
          </div>
          <div className="mt-1 flex gap-2">
            <Badge variant="outline" className={SPECIES_CLASS[species] || 'bg-slate-100 text-slate-700'}>
              {t(`pets.species.${species}` as any)}
            </Badge>
            <Badge variant={isActive ? 'success' : 'destructive'}>
              {t(isActive ? 'pets.active' : 'pets.inactive')}
            </Badge>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('pets.basic_info')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow label={t('pets.species')} value={t(`pets.species.${species}` as any)} />
            <Separator />
            <InfoRow label={t('pets.breed')} value={pet.breed as string} />
            <Separator />
            <InfoRow label={t('pets.gender')} value={t(`pets.gender.${pet.gender as string}` as any)} />
            <Separator />
            <InfoRow label={t('pets.age')} value={ageFromDob(pet.date_of_birth as string)} />
            <Separator />
            <InfoRow label={t('pets.weight')} value={pet.weight_kg != null ? `${pet.weight_kg}kg` : '-'} />
            <Separator />
            <InfoRow label={t('pets.color')} value={pet.color as string} />
            <Separator />
            <InfoRow label={t('common.created_at')} value={formatDate(pet.created_at as string)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('pets.health_info')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow label={t('pets.is_neutered')} value={t(`pets.neutered.${pet.is_neutered as string}` as any)} />
            <Separator />
            <InfoRow label={t('pets.allergies')} value={allergies.length ? allergies.join(', ') : '-'} />
            <Separator />
            <InfoRow label={t('pets.chronic_conditions')} value={chronicConditions.length ? chronicConditions.join(', ') : '-'} />
            <Separator />
            <InfoRow label={t('pets.special_needs')} value={pet.special_needs_notes as string} />
            <Separator />
            <InfoRow
              label={t('pets.emergency_vet')}
              value={
                pet.emergency_vet_name
                  ? `${pet.emergency_vet_name as string}${pet.emergency_vet_phone ? ` — ${pet.emergency_vet_phone as string}` : ''}`
                  : '-'
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('pets.behavior_info')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow label={t('pets.temperament')} value={t(`pets.temperament.${pet.temperament as string}` as any)} />
            <Separator />
            <InfoRow label={t('pets.sociable_with_others')} value={t(`pets.sociable.${pet.sociable_with_others as string}` as any)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('pets.owner_info')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {owner ? (
              <>
                <InfoRow label={t('users.name')} value={owner.full_name as string} />
                <Separator />
                <InfoRow label={t('users.email')} value={owner.email as string} />
                <Separator />
                <InfoRow label={t('users.phone')} value={owner.phone as string} />
                <Separator />
                <Link href={`/users/${owner.id}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  {t('common.view_detail')} →
                </Link>
              </>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </CardContent>
        </Card>
      </div>

      {photos.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t('pets.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {photos.map((url, i) => (
                <img key={i} src={url} alt={`${pet.name as string} ${i + 1}`} className="h-32 w-full rounded-lg object-cover" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | undefined | null }) {
  return (
    <div className="flex gap-2">
      <dt className="w-32 shrink-0 text-muted-foreground">{label}</dt>
      <dd>{value || '-'}</dd>
    </div>
  )
}
