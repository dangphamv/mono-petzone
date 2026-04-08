import { ArrowRight, Sparkles, Star } from 'lucide-react'
import type { Dictionary } from '@/lib/i18n/dictionaries/vi'
import type { Locale } from '@/lib/i18n/config'

export function Hero({ dict, locale }: { dict: Dictionary['hero']; locale: Locale }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-white to-primary/5 py-28 md:py-36">
      {/* Decorative elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-br from-primary/20 to-secondary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-gradient-to-tr from-secondary/15 to-primary/10 blur-3xl" />
        <div className="absolute left-[15%] top-[20%] animate-sparkle">
          <Star className="h-4 w-4 text-secondary/60" fill="currentColor" />
        </div>
        <div className="absolute right-[20%] top-[30%] animate-sparkle" style={{ animationDelay: '0.7s' }}>
          <Star className="h-3 w-3 text-primary/50" fill="currentColor" />
        </div>
        <div className="absolute bottom-[25%] left-[25%] animate-sparkle" style={{ animationDelay: '1.4s' }}>
          <Star className="h-3.5 w-3.5 text-secondary/40" fill="currentColor" />
        </div>
        <div className="absolute bottom-[35%] right-[12%] animate-sparkle" style={{ animationDelay: '0.3s' }}>
          <Sparkles className="h-5 w-5 text-primary/30" />
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 text-center">
        <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-sm font-medium text-primary-dark">
          <Sparkles className="h-4 w-4" />
          {dict.badge}
        </div>

        <h1 className="animate-slide-up font-heading text-4xl font-bold leading-tight tracking-tight text-text md:text-6xl lg:text-7xl">
          {dict.titleLine1}
          <br />
          <span className="shimmer-text">{dict.titleLine2}</span>
        </h1>

        <p className="mx-auto mt-8 max-w-2xl animate-fade-in text-lg leading-relaxed text-text-secondary md:text-xl">
          {dict.subtitle}
        </p>

        <div className="mt-12 flex animate-fade-in flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#download"
            className="group flex cursor-pointer items-center gap-3 rounded-full bg-gradient-to-r from-primary to-primary-dark px-10 py-4 text-lg font-semibold text-white shadow-xl shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-primary/30"
          >
            {dict.ctaPrimary}
            <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
          </a>
          <a
            href={`/${locale}/for-providers`}
            className="gradient-border cursor-pointer rounded-full bg-white/80 px-10 py-4 text-lg font-semibold text-text backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
          >
            {dict.ctaSecondary}
          </a>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 text-secondary" fill="currentColor" />
              ))}
            </div>
            <span className="font-medium">{dict.rating}</span>
          </div>
          <div className="h-4 w-px bg-gray-300" />
          <span><strong className="text-text">10,000+</strong> {dict.petServed}</span>
          <div className="h-4 w-px bg-gray-300" />
          <span><strong className="text-text">500+</strong> {dict.partnerHotels}</span>
        </div>
      </div>
    </section>
  )
}
