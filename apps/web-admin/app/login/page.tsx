'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, PawPrint, Globe, CheckCircle2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Label,
} from '@petzone/ui'
import { useLogin, useForgotPassword } from '@/lib/hooks/use-auth'

export default function AdminLoginPage() {
  const { t, locale, setLocale } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const login = useLogin()

  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const forgot = useForgotPassword()

  useEffect(() => {
    if (forgotOpen) setForgotEmail(email)
    else forgot.reset()
  }, [forgotOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    login.mutate({ email, password })
  }

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) return
    const redirect = typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined
    forgot.mutate({ email: forgotEmail, redirect_to: redirect })
  }

  const toggleLocale = () => {
    setLocale(locale === 'vi' ? 'en' : 'vi')
  }

  // Better error message based on error type
  const getErrorMessage = () => {
    if (!login.isError) return null
    const msg = login.error.message?.toLowerCase() || ''
    if (msg.includes('unauthorized') || msg.includes('invalid') || msg.includes('401')) {
      return t('login.error_credentials')
    }
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('econnrefused')) {
      return t('login.error_network')
    }
    return login.error.message
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0F172A] px-4">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(13,148,136,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(245,158,11,0.08),transparent_50%)]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      {/* Language Toggle */}
      <button
        type="button"
        onClick={toggleLocale}
        className="absolute top-4 right-4 flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 transition-colors"
      >
        <Globe size={14} />
        {locale === 'vi' ? 'EN' : 'VI'}
      </button>

      <div className="relative w-full max-w-[420px] animate-[scale-in_0.3s_ease-out]">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
            <PawPrint className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white">{t('login.title')}</h1>
          <p className="mt-1 text-sm text-slate-400">{t('login.subtitle')}</p>
        </div>

        <Card className="border-white/10 bg-white/[0.03] shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6">
              {login.isError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{getErrorMessage()}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">{t('login.email')}</label>
                <input
                  type="email"
                  placeholder="admin@petzone.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary/50"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">{t('login.password')}</label>
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    {t('login.forgot_password')}
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary/50"
                />
              </div>
            </CardContent>
            <CardFooter className="pb-6">
              <Button type="submit" className="w-full h-10 shadow-lg shadow-primary/20" disabled={login.isPending}>
                {login.isPending ? t('login.submitting') : t('login.submit')}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="mt-6 text-center text-xs text-slate-500">
          PetZone &copy; 2026. {t('common.all_rights')}
        </p>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('login.forgot_title')}</DialogTitle>
            <DialogDescription>{t('login.forgot_desc')}</DialogDescription>
          </DialogHeader>

          {forgot.isSuccess ? (
            <div className="flex items-start gap-3 rounded-lg border border-success/20 bg-success/5 p-4 text-sm">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-success mt-0.5" />
              <p>{t('login.forgot_sent')}</p>
            </div>
          ) : (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              {forgot.isError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{(forgot.error as Error)?.message}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email">{t('login.email')}</Label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="admin@petzone.vn"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setForgotOpen(false)}>
                  {t('login.forgot_back')}
                </Button>
                <Button type="submit" disabled={forgot.isPending || !forgotEmail}>
                  {forgot.isPending ? t('login.forgot_sending') : t('login.forgot_submit')}
                </Button>
              </DialogFooter>
            </form>
          )}

          {forgot.isSuccess && (
            <DialogFooter>
              <Button type="button" onClick={() => setForgotOpen(false)}>
                {t('login.forgot_back')}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
