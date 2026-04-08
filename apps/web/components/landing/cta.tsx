import { Apple, Sparkles, Star, Play } from 'lucide-react'
import type { Dictionary } from '@/lib/i18n/dictionaries/vi'

export function Cta({ dict }: { dict: Dictionary['cta'] }) {
  return (
    <section id="download" className="relative overflow-hidden py-24 md:py-32">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-dark via-primary to-primary-dark" />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute left-[10%] top-[20%] animate-sparkle">
          <Star className="h-3 w-3 text-white/30" fill="currentColor" />
        </div>
        <div className="absolute right-[15%] top-[25%] animate-sparkle" style={{ animationDelay: '1s' }}>
          <Star className="h-4 w-4 text-secondary/30" fill="currentColor" />
        </div>
        <div className="absolute bottom-[20%] left-[20%] animate-sparkle" style={{ animationDelay: '0.5s' }}>
          <Sparkles className="h-5 w-5 text-white/20" />
        </div>
      </div>

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-medium text-white/90">
          <Sparkles className="h-4 w-4" />
          {dict.badge}
        </div>

        <h2 className="font-heading text-3xl font-bold text-white md:text-5xl lg:text-6xl">
          {dict.title}
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/75 md:text-xl">
          {dict.subtitle}
        </p>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#"
            className="group flex cursor-pointer items-center gap-3 rounded-full bg-white px-8 py-4 text-base font-semibold text-primary-dark shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
          >
            <Apple className="h-6 w-6" />
            <div className="text-left">
              <div className="text-xs font-normal text-text-secondary">{dict.downloadOn}</div>
              <div>App Store</div>
            </div>
          </a>
          <a
            href="#"
            className="group flex cursor-pointer items-center gap-3 rounded-full bg-white px-8 py-4 text-base font-semibold text-primary-dark shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
          >
            <Play className="h-6 w-6" fill="currentColor" />
            <div className="text-left">
              <div className="text-xs font-normal text-text-secondary">{dict.downloadOn}</div>
              <div>Google Play</div>
            </div>
          </a>
        </div>
      </div>
    </section>
  )
}
