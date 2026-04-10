'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn, Avatar, AvatarFallback } from '@petzone/ui'
import {
  LayoutDashboard, Building2, ClipboardList, AlertTriangle,
  Users, Star, BarChart3, Settings, LogOut, Globe,
} from 'lucide-react'
import { useLogout } from '@/lib/hooks/use-auth'
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

const navItems: { href: string; labelKey: TranslationKey; icon: typeof LayoutDashboard }[] = [
  { href: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/providers', labelKey: 'nav.providers', icon: Building2 },
  { href: '/orders', labelKey: 'nav.orders', icon: ClipboardList },
  { href: '/disputes', labelKey: 'nav.disputes', icon: AlertTriangle },
  { href: '/users', labelKey: 'nav.users', icon: Users },
  { href: '/reviews', labelKey: 'nav.reviews', icon: Star },
  { href: '/analytics', labelKey: 'nav.analytics', icon: BarChart3 },
  { href: '/config', labelKey: 'nav.config', icon: Settings },
]

function NavSection({ items, label }: { items: typeof navItems; label: string }) {
  const pathname = usePathname()
  const { t } = useI18n()

  return (
    <>
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">{label}</p>
      {items.map((item) => {
        const active = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150',
              active
                ? 'bg-sidebar-active text-sidebar-active-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-hover hover:text-white',
            )}
          >
            <item.icon size={18} strokeWidth={active ? 2 : 1.5} className="shrink-0" />
            {t(item.labelKey)}
            {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
          </Link>
        )
      })}
    </>
  )
}

export function Sidebar() {
  const { t, locale, setLocale } = useI18n()
  const logout = useLogout()
  const user = useCurrentUser()

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'AD'
  const displayName = user?.email?.split('@')[0] || 'Admin'
  const displayEmail = user?.email || 'admin@petzone.vn'
  const displayRole = user?.role || 'admin'

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-[260px] flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <span className="text-sm font-bold text-white">P</span>
        </div>
        <div>
          <span className="text-[15px] font-bold tracking-tight text-white">PetZone</span>
          <span className="ml-1.5 rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary-light tracking-wider uppercase">Admin</span>
        </div>
      </div>

      <div className="mx-4 h-px bg-sidebar-border" />

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        <NavSection items={navItems.slice(0, 5)} label={t('nav.menu')} />
        <div className="pb-1 pt-4" />
        <NavSection items={navItems.slice(5)} label={t('nav.system')} />
      </nav>

      <div className="mx-4 h-px bg-sidebar-border" />

      {/* Language switcher */}
      <div className="flex items-center gap-1 px-4 py-2">
        <Globe size={14} className="text-sidebar-muted" />
        <div className="flex gap-1 rounded-md bg-sidebar-hover p-0.5">
          <button
            onClick={() => setLocale('vi')}
            className={cn(
              'rounded px-2 py-0.5 text-[11px] font-medium transition-all',
              locale === 'vi' ? 'bg-primary text-white' : 'text-sidebar-muted hover:text-white',
            )}
          >
            VI
          </button>
          <button
            onClick={() => setLocale('en')}
            className={cn(
              'rounded px-2 py-0.5 text-[11px] font-medium transition-all',
              locale === 'en' ? 'bg-primary text-white' : 'text-sidebar-muted hover:text-white',
            )}
          >
            EN
          </button>
        </div>
      </div>

      <div className="mx-4 h-px bg-sidebar-border" />

      {/* User */}
      <div className="p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <Avatar className="h-8 w-8 ring-2 ring-sidebar-border">
            <AvatarFallback className="bg-primary/20 text-xs font-bold text-primary-light">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium text-white text-[13px] leading-tight capitalize">{displayName}</p>
            <p className="truncate text-[11px] text-sidebar-muted">{displayEmail}</p>
          </div>
          <button
            onClick={logout}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sidebar-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
            title={t('nav.logout')}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
