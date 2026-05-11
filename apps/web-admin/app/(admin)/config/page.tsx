'use client'

import { useEffect, useState } from 'react'
import { Settings, Percent, Clock, CreditCard } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import {
  Button, Input, Label,
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Skeleton, Separator,
} from '@petzone/ui'
import { toast } from 'sonner'
import { useConfig, useUpdateConfig } from '@/lib/hooks/use-admin'

export default function ConfigPage() {
  const { t } = useI18n()
  const { data, isLoading } = useConfig()
  const update = useUpdateConfig()
  const [form, setForm] = useState({ commission_rate: 0.15, auto_confirm_hours: 4, payment_timeout_hours: 24 })

  useEffect(() => { if (data) setForm(data) }, [data])

  if (isLoading) {
    return (
      <div className="animate-[fade-in_0.3s_ease-out]">
        <div className="flex items-center gap-3">
          <div className="stat-icon bg-gray-100 text-gray-600"><Settings size={20} /></div>
          <div>
            <h1 className="page-header">{t('config.title')}</h1>
            <p className="page-description">{t('config.subtitle')}</p>
          </div>
        </div>
        <Card className="card-elevated mt-8 max-w-xl">
          <CardContent className="space-y-6 p-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-10 w-full" /></div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    update.mutate(form, {
      onSuccess: () => toast.success(t('config.saved')),
      onError: (err) => toast.error(`Lỗi: ${err.message}`),
    })
  }

  const hasChanges = data && (
    form.commission_rate !== data.commission_rate ||
    form.auto_confirm_hours !== data.auto_confirm_hours ||
    form.payment_timeout_hours !== data.payment_timeout_hours
  )

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center gap-3">
        <div className="stat-icon bg-gray-100 text-gray-600"><Settings size={20} /></div>
        <div>
          <h1 className="page-header">{t('config.title')}</h1>
          <p className="page-description">{t('config.subtitle')}</p>
        </div>
      </div>

      {/* General Settings */}
      <form onSubmit={handleSubmit}>
        <Card className="card-elevated mt-8 max-w-xl">
          <CardHeader>
            <CardTitle>{t('config.general')}</CardTitle>
            <CardDescription>{t('config.general_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="commission" className="flex items-center gap-2">
                <Percent size={14} className="text-muted-foreground" />
                {t('config.commission_rate')}
              </Label>
              <Input id="commission" type="number" step="0.01" min="0" max="1" value={form.commission_rate} onChange={(e) => setForm({ ...form, commission_rate: Number(e.target.value) })} />
              <p className="text-xs text-muted-foreground">
                {t('config.current')}: <strong>{(form.commission_rate * 100).toFixed(0)}%</strong> — {t('config.commission_desc', { amount: fmtVND(1_000_000 * form.commission_rate) })}
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="confirm" className="flex items-center gap-2">
                <Clock size={14} className="text-muted-foreground" />
                {t('config.auto_confirm')}
              </Label>
              <Input id="confirm" type="number" min="1" max="48" value={form.auto_confirm_hours} onChange={(e) => setForm({ ...form, auto_confirm_hours: Number(e.target.value) })} />
              <p className="text-xs text-muted-foreground">{t('config.auto_confirm_desc')}</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="payment" className="flex items-center gap-2">
                <CreditCard size={14} className="text-muted-foreground" />
                {t('config.payment_timeout')}
              </Label>
              <Input id="payment" type="number" min="1" max="72" value={form.payment_timeout_hours} onChange={(e) => setForm({ ...form, payment_timeout_hours: Number(e.target.value) })} />
              <p className="text-xs text-muted-foreground">{t('config.payment_timeout_desc')}</p>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/30 px-6 py-4">
            <Button type="submit" disabled={update.isPending || !hasChanges}>
              {update.isPending ? t('config.saving') : t('config.save')}
            </Button>
          </CardFooter>
        </Card>
      </form>

    </div>
  )
}

function fmtVND(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}
