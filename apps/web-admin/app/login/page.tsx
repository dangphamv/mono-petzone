'use client'

import { useState } from 'react'
import { AlertCircle, PawPrint } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@petzone/ui'
import { useLogin } from '@/lib/hooks/use-auth'

export default function AdminLoginPage() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const login = useLogin()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    login.mutate({ email, password })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0F172A] px-4">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(13,148,136,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(245,158,11,0.08),transparent_50%)]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

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
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{login.error.message}</span>
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
                <label className="text-sm font-medium text-slate-300">{t('login.password')}</label>
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
    </div>
  )
}
