import { Search, CalendarCheck, Camera, HeartHandshake } from 'lucide-react'
import type { Dictionary } from '@/lib/i18n/dictionaries/vi'

const stepIcons = [Search, CalendarCheck, Camera, HeartHandshake]

export function HowItWorks({ dict }: { dict: Dictionary['howItWorks'] }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-primary/3 to-background py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute bottom-0 left-1/2 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">{dict.label}</span>
          <h2 className="mt-3 font-heading text-3xl font-bold text-text md:text-4xl lg:text-5xl">
            {dict.title}
          </h2>
          <p className="mt-4 text-lg text-text-secondary">{dict.subtitle}</p>
        </div>

        <div className="relative mt-16">
          <div className="absolute left-0 right-0 top-14 hidden h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent lg:block" />

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {dict.steps.map((s, i) => {
              const Icon = stepIcons[i]
              return (
                <div key={i} className="group relative text-center">
                  <div className="relative mx-auto mb-6">
                    <div className="relative z-10 mx-auto flex h-28 w-28 items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 transition-all duration-500 group-hover:from-primary/20 group-hover:to-secondary/20" />
                      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark shadow-lg shadow-primary/20 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/30">
                        <Icon className="h-8 w-8 text-white" strokeWidth={1.8} />
                      </div>
                    </div>
                    <div className="absolute -right-1 -top-1 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-white shadow-md">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-text">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">{s.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
