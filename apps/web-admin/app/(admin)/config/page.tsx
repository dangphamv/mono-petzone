'use client'

import { useEffect, useState } from 'react'
import { Settings, Percent, Clock, CreditCard, Plus, Trash2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import {
  Button, Input, Label,
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Skeleton, Separator,
} from '@petzone/ui'
import { toast } from 'sonner'
import { useConfig, useUpdateConfig } from '@/lib/hooks/use-admin'

interface CommissionPlan {
  id: string
  name: string
  rate: number
  description: string
  start_date: string
  end_date: string
}

const DEFAULT_PLANS: CommissionPlan[] = [
  {
    id: 'plan-1',
    name: '3 tháng miễn phí',
    rate: 0,
    description: 'Gói khuyến mãi cho đối tác mới đăng ký',
    start_date: '2026-04-01',
    end_date: '2026-06-30',
  },
  {
    id: 'plan-2',
    name: 'Premium Partner',
    rate: 10,
    description: 'Đối tác chiến lược - hoa hồng ưu đãi',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
  },
]

export default function ConfigPage() {
  const { t } = useI18n()
  const { data, isLoading } = useConfig()
  const update = useUpdateConfig()
  const [form, setForm] = useState({ commission_rate: 0.15, auto_confirm_hours: 4, payment_timeout_hours: 24 })
  const [plans, setPlans] = useState<CommissionPlan[]>(DEFAULT_PLANS)

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

  const addPlan = () => {
    setPlans([...plans, {
      id: `plan-${Date.now()}`,
      name: '',
      rate: 15,
      description: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
    }])
  }

  const removePlan = (id: string) => {
    setPlans(plans.filter(p => p.id !== id))
  }

  const updatePlan = (id: string, field: keyof CommissionPlan, value: string | number) => {
    setPlans(plans.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  const savePlans = () => {
    // Persist plans via config update (stores in query cache for dev, API in production)
    update.mutate({ commission_plans: plans } as any, {
      onSuccess: () => toast.success('Commission plans saved successfully'),
      onError: (err) => toast.error(`Error: ${err.message}`),
    })
  }

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

      {/* Commission Rate Plans */}
      <Card className="card-elevated mt-8 max-w-3xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('config.commission_plans')}</CardTitle>
              <CardDescription>{t('config.commission_plans_desc')}</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={addPlan}>
              <Plus size={14} className="mr-1" />
              {t('config.add_plan')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No commission plans configured</p>
          ) : (
            plans.map((plan) => (
              <div key={plan.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                    <div className="space-y-1">
                      <Label className="text-xs">{t('config.plan_name')}</Label>
                      <Input
                        value={plan.name}
                        onChange={(e) => updatePlan(plan.id, 'name', e.target.value)}
                        placeholder="e.g. 3-month free plan"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('config.plan_rate')}</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={plan.rate}
                        onChange={(e) => updatePlan(plan.id, 'rate', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('config.plan_start')}</Label>
                      <Input
                        type="date"
                        value={plan.start_date}
                        onChange={(e) => updatePlan(plan.id, 'start_date', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('config.plan_end')}</Label>
                      <Input
                        type="date"
                        value={plan.end_date}
                        onChange={(e) => updatePlan(plan.id, 'end_date', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs">{t('config.plan_description')}</Label>
                      <Input
                        value={plan.description}
                        onChange={(e) => updatePlan(plan.id, 'description', e.target.value)}
                        placeholder="Description..."
                      />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive ml-2 shrink-0"
                    onClick={() => removePlan(plan.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
        <CardFooter className="border-t bg-muted/30 px-6 py-4">
          <Button onClick={savePlans}>
            {t('config.save')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

function fmtVND(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}
