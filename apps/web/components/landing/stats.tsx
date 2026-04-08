import { Building2, Heart, Star, TrendingUp } from 'lucide-react'
import type { Dictionary } from '@/lib/i18n/dictionaries/vi'

const statIcons = [Building2, Heart, Star, TrendingUp]

export function Stats({ dict }: { dict: Dictionary['stats'] }) {
  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-dark to-primary p-px shadow-2xl shadow-primary/20">
          <div className="rounded-3xl bg-gradient-to-br from-primary/95 via-primary-dark/95 to-primary/90 px-8 py-16 backdrop-blur-sm md:px-16">
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
              {dict.items.map((s, i) => {
                const Icon = statIcons[i]
                return (
                  <div key={s.label} className="group text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/25">
                      <Icon className="h-6 w-6 text-white/90" strokeWidth={1.8} />
                    </div>
                    <div className="font-heading text-4xl font-bold text-white md:text-5xl">{s.value}</div>
                    <div className="mt-2 text-sm font-medium text-white/70">{s.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
