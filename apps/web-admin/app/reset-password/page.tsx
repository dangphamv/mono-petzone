'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AlertCircle, PawPrint, CheckCircle2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { Button, Card, CardContent, CardFooter, Label } from '@petzone/ui'
import { useResetPassword } from '@/lib/hooks/use-auth'

function ResetPasswordInner() {
  const { t } = useI18n()
  const router = useRouter()
  const token = useSearchParams().get('token') ?? ''
  const reset = useResetPassword()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const tooShort = password.length > 0 && password.length < 8
  const mismatch = confirm.length > 0 && password !== confirm
  const canSubmit = !!token && password.length >= 8 && password === confirm && !reset.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    reset.mutate({ token, password })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0F172A] px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(13,148,136,0.15),transparent_50%)]" />
      <div className="relative w-full max-w-[420px] animate-[scale-in_0.3s_ease-out]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
            <PawPrint className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white">{t('reset.title')}</h1>
          <p className="mt-1 text-sm text-slate-400">{t('reset.subtitle')}</p>
        </div>

        <Card className="border-white/10 bg-white/[0.03] shadow-2xl backdrop-blur-xl">
          {reset.isSuccess ? (
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-start gap-3 rounded-lg border border-success/20 bg-success/10 p-4 text-sm text-success">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <p>{t('reset.success')}</p>
              </div>
              <Button className="w-full" onClick={() => router.push('/login')}>{t('reset.back_to_login')}</Button>
            </CardContent>
          ) : !token ? (
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{t('reset.no_token')}</span>
              </div>
              <Button variant="outline" className="w-full" onClick={() => router.push('/login')}>{t('reset.back_to_login')}</Button>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-6">
                {reset.isError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{(reset.error as Error)?.message || t('reset.error')}</span>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-slate-300">{t('reset.new_password')}</Label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="flex h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                  {tooShort && <p className="text-xs text-red-400">{t('reset.too_short')}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">{t('reset.confirm_password')}</Label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="flex h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                  {mismatch && <p className="text-xs text-red-400">{t('reset.mismatch')}</p>}
                </div>
              </CardContent>
              <CardFooter className="pb-6">
                <Button type="submit" className="w-full h-10 shadow-lg shadow-primary/20" disabled={!canSubmit}>
                  {reset.isPending ? t('reset.submitting') : t('reset.submit')}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  )
}
