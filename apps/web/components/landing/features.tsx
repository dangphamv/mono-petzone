import { Search, Zap, Camera, Star } from 'lucide-react'
import type { Dictionary } from '@/lib/i18n/dictionaries/vi'

const icons = [
  { icon: Search, gradient: 'from-primary/20 to-primary/5', iconColor: 'text-primary' },
  { icon: Zap, gradient: 'from-secondary/20 to-secondary/5', iconColor: 'text-secondary-dark' },
  { icon: Camera, gradient: 'from-primary/15 to-secondary/10', iconColor: 'text-primary-dark' },
  { icon: Star, gradient: 'from-secondary/15 to-primary/10', iconColor: 'text-secondary' },
]

export function Features({ dict }: { dict: Dictionary['features'] }) {
  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">{dict.label}</span>
          <h2 className="mt-3 font-heading text-3xl font-bold text-text md:text-4xl lg:text-5xl">
            {dict.title} <span className="text-primary">PetZone</span>?
          </h2>
          <p className="mt-4 text-lg text-text-secondary">{dict.subtitle}</p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {dict.items.map((f, i) => {
            const { icon: Icon, gradient, iconColor } = icons[i]
            return (
              <div
                key={f.title}
                className="glass-card group cursor-default rounded-2xl p-8 text-center transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className={`h-7 w-7 ${iconColor}`} strokeWidth={2} />
                </div>
                <h3 className="mt-6 font-heading text-lg font-bold text-text">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">{f.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
