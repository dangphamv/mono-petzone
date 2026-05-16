'use client'

import { useEffect, useState } from 'react'
import { Settings, Percent, Clock, CreditCard, Zap, QrCode, Smartphone, Banknote } from 'lucide-react'
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
  const [form, setForm] = useState({
    commission_rate: 0.15,
    commission_rate_v1: 0,
    auto_confirm_hours: 4,
    payment_timeout_hours: 24,
    payments_v2_enabled: false,
    vietqr_enabled: true,
    momo_enabled: true,
    cash_enabled: true,
  })

  useEffect(() => {
    if (data) setForm({
      commission_rate: data.commission_rate,
      commission_rate_v1: data.commission_rate_v1 ?? 0,
      auto_confirm_hours: data.auto_confirm_hours,
      payment_timeout_hours: data.payment_timeout_hours,
      payments_v2_enabled: Boolean(data.payments_v2_enabled),
      vietqr_enabled: data.vietqr_enabled ?? true,
      momo_enabled: data.momo_enabled ?? true,
      cash_enabled: data.cash_enabled ?? true,
    })
  }, [data])

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
    form.commission_rate_v1 !== (data.commission_rate_v1 ?? 0) ||
    form.auto_confirm_hours !== data.auto_confirm_hours ||
    form.payment_timeout_hours !== data.payment_timeout_hours ||
    form.payments_v2_enabled !== Boolean(data.payments_v2_enabled) ||
    form.vietqr_enabled !== (data.vietqr_enabled ?? true) ||
    form.momo_enabled !== (data.momo_enabled ?? true) ||
    form.cash_enabled !== (data.cash_enabled ?? true)
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

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="commission_v1" className="flex items-center gap-2">
                <Percent size={14} className="text-muted-foreground" />
                Commission rate v1 (VietQR/MoMo)
              </Label>
              <Input
                id="commission_v1"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={form.commission_rate_v1}
                onChange={(e) => setForm({ ...form, commission_rate_v1: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Hiện tại: <strong>{(form.commission_rate_v1 * 100).toFixed(0)}%</strong>.
                Áp dụng cho payout request từ v1 (MoMo escrow flow). VietQR direct
                không qua payout nên rate này chỉ dùng khi mở rộng tính năng hóa đơn commission
                sau giai đoạn trial 0%.
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <QrCode size={14} className="text-muted-foreground" />
                VietQR (trực tiếp tới provider)
              </Label>
              <div className="flex items-center gap-3">
                <input
                  id="vietqr_enabled"
                  type="checkbox"
                  className="size-4 rounded border-input"
                  checked={form.vietqr_enabled}
                  onChange={(e) => setForm({ ...form, vietqr_enabled: e.target.checked })}
                />
                <Label htmlFor="vietqr_enabled" className="cursor-pointer font-normal">
                  {form.vietqr_enabled ? 'Enabled — owner có thể chọn thanh toán VietQR' : 'Disabled — tắt VietQR khẩn cấp (SePay sập, đổi bank...)'}
                </Label>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Banknote size={14} className="text-muted-foreground" />
                Tiền mặt khi check-in
              </Label>
              <div className="flex items-center gap-3">
                <input
                  id="cash_enabled"
                  type="checkbox"
                  className="size-4 rounded border-input"
                  checked={form.cash_enabled}
                  onChange={(e) => setForm({ ...form, cash_enabled: e.target.checked })}
                />
                <Label htmlFor="cash_enabled" className="cursor-pointer font-normal">
                  {form.cash_enabled ? 'Enabled — owner trả tiền mặt cho provider tại check-in' : 'Disabled — tạm tắt cash'}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Provider tự xác nhận đã nhận tiền qua nút "Đã nhận tiền mặt" trong app provider.
                Lưu ý: rủi ro owner no-show cao hơn các phương thức online.
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Smartphone size={14} className="text-muted-foreground" />
                MoMo
              </Label>
              <div className="flex items-center gap-3">
                <input
                  id="momo_enabled"
                  type="checkbox"
                  className="size-4 rounded border-input"
                  checked={form.momo_enabled}
                  onChange={(e) => setForm({ ...form, momo_enabled: e.target.checked })}
                />
                <Label htmlFor="momo_enabled" className="cursor-pointer font-normal">
                  {form.momo_enabled ? 'Enabled — owner có thể chọn thanh toán MoMo' : 'Disabled — tắt MoMo'}
                </Label>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Zap size={14} className="text-muted-foreground" />
                Payments v2 (9Pay PSP)
              </Label>
              <div className="flex items-center gap-3">
                <input
                  id="payments_v2"
                  type="checkbox"
                  className="size-4 rounded border-input"
                  checked={form.payments_v2_enabled}
                  onChange={(e) => setForm({ ...form, payments_v2_enabled: e.target.checked })}
                />
                <Label htmlFor="payments_v2" className="cursor-pointer font-normal">
                  {form.payments_v2_enabled ? 'Enabled — new orders use 9Pay escrow + split payout' : 'Disabled — new orders use legacy v1'}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                When enabled, new orders are created with <code>payment_version=2</code> and routed to the v2 endpoints
                (<code>/api/v2/payments/initiate</code>). Existing orders retain their payment version. Provider bank info
                must be filled and verified before they can receive v2 payouts (note: bank info cũng cần cho VietQR v1).
              </p>
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
