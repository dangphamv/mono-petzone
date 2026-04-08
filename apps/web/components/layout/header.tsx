'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Download, PawPrint, Globe } from 'lucide-react'
import type { Dictionary } from '@/lib/i18n/dictionaries/vi'
import type { Locale } from '@/lib/i18n/config'

export function Header({ dict, locale }: { dict: Dictionary['header']; locale: Locale }) {
  const pathname = usePathname()

  const switchLocale = locale === 'vi' ? 'en' : 'vi'
  const switchPath = pathname.replace(`/${locale}`, `/${switchLocale}`)

  const localePath = (path: string) => `/${locale}${path}`
  const isActive = (path: string) => pathname === localePath(path)

  const navLinks = [
    { path: '/about', label: dict.about },
    { path: '/for-providers', label: dict.forProviders },
    { path: '/pricing', label: dict.pricing },
    { path: '/contact', label: dict.contact },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-white/30 bg-white/60 backdrop-blur-xl">
      <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6">
        <Link href={localePath('/')} className="flex items-center gap-2 font-heading text-2xl font-bold text-primary">
          <PawPrint className="h-7 w-7" strokeWidth={2.5} />
          PetZone
        </Link>
        <div className="hidden items-center gap-10 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={localePath(link.path)}
              className={`relative text-sm font-medium transition-colors duration-200 ${
                isActive(link.path)
                  ? 'text-primary'
                  : 'text-text-secondary hover:text-primary'
              }`}
            >
              {link.label}
              {isActive(link.path) && (
                <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={switchPath}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-text-secondary transition-all duration-200 hover:border-primary/30 hover:text-primary"
          >
            <Globe className="h-3.5 w-3.5" />
            {switchLocale.toUpperCase()}
          </Link>
          <a
            href="#download"
            className="group flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30"
          >
            <Download className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
            {dict.download}
          </a>
        </div>
      </nav>
    </header>
  )
}
