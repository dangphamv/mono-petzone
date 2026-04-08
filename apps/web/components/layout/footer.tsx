import Link from 'next/link'
import { PawPrint, Mail, Phone, MapPin } from 'lucide-react'
import type { Dictionary } from '@/lib/i18n/dictionaries/vi'
import type { Locale } from '@/lib/i18n/config'

export function Footer({ dict, locale }: { dict: Dictionary['footer']; locale: Locale }) {
  const localePath = (path: string) => `/${locale}${path}`

  return (
    <footer className="relative border-t border-gray-100 bg-white">
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href={localePath('/')} className="flex items-center gap-2 font-heading text-2xl font-bold text-primary">
              <PawPrint className="h-7 w-7" strokeWidth={2.5} />
              PetZone
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-text-secondary">
              {dict.description}
            </p>
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <Mail className="h-4 w-4 text-primary" />
                <span>hello@petzone.vn</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <Phone className="h-4 w-4 text-primary" />
                <span>1900 xxxx</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{dict.location}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-text">{dict.product}</h4>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link href={localePath('/for-providers')} className="text-text-secondary transition-colors duration-200 hover:text-primary">
                  {dict.forProviders}
                </Link>
              </li>
              <li>
                <Link href={localePath('/pricing')} className="text-text-secondary transition-colors duration-200 hover:text-primary">
                  {dict.pricing}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-text">{dict.company}</h4>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link href={localePath('/about')} className="text-text-secondary transition-colors duration-200 hover:text-primary">
                  {dict.about}
                </Link>
              </li>
              <li>
                <Link href={localePath('/contact')} className="text-text-secondary transition-colors duration-200 hover:text-primary">
                  {dict.contact}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-text">{dict.legal}</h4>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link href={localePath('/terms')} className="text-text-secondary transition-colors duration-200 hover:text-primary">
                  {dict.terms}
                </Link>
              </li>
              <li>
                <Link href={localePath('/privacy')} className="text-text-secondary transition-colors duration-200 hover:text-primary">
                  {dict.privacy}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 sm:flex-row">
          <p className="text-sm text-text-secondary">
            &copy; {new Date().getFullYear()} PetZone. All rights reserved.
          </p>
          <p className="text-xs text-text-secondary/60">
            {dict.madeWith}
          </p>
        </div>
      </div>
    </footer>
  )
}
