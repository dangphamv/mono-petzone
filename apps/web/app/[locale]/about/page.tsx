import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { defaultLocale, type Locale } from '@/lib/i18n/config'
import { Phone } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params
  const dict = await getDictionary((raw as Locale) || defaultLocale)
  return { title: dict.about.metaTitle, description: dict.about.metaDescription }
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const dict = await getDictionary((raw as Locale) || defaultLocale)

  return (
    <div className="py-20">
      <div className="mx-auto max-w-3xl px-4">
        {/* Title */}
        <h1 className="font-heading text-4xl font-bold text-text">{dict.about.title}</h1>

        {/* Story */}
        <div className="mt-12">
          <h2 className="font-heading text-2xl font-bold text-text">{dict.about.storyTitle}</h2>
          <div className="mt-4 space-y-4 text-lg leading-relaxed text-text-secondary">
            {dict.about.storyText.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>

        {/* Mission */}
        <div className="mt-12">
          <h2 className="font-heading text-2xl font-bold text-text">{dict.about.missionTitle}</h2>
          <p className="mt-4 text-lg leading-relaxed text-text-secondary">{dict.about.missionText}</p>
        </div>

        {/* What makes us different */}
        <div className="mt-12">
          <h2 className="font-heading text-2xl font-bold text-text">{dict.about.diffTitle}</h2>
          <div className="mt-6 space-y-3">
            {dict.about.diffs.map((d) => (
              <div key={d.text} className="flex items-start gap-3">
                <span className="text-xl">{d.icon}</span>
                <span className="text-text-secondary">{d.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="mt-12">
          <h2 className="font-heading text-2xl font-bold text-text">{dict.about.valuesTitle}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {dict.about.values.map((v) => (
              <div key={v.text} className="glass-card rounded-2xl p-6">
                <span className="text-2xl">{v.icon}</span>
                <p className="mt-2 font-medium text-text">{v.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="mt-12">
          <h2 className="font-heading text-2xl font-bold text-text">{dict.about.teamTitle}</h2>
          <p className="mt-4 text-lg leading-relaxed text-text-secondary">{dict.about.teamText}</p>
        </div>

        {/* Hotline */}
        <div className="mt-12 flex items-center gap-3 rounded-2xl bg-primary/5 p-6">
          <Phone className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold text-primary">{dict.about.hotline}</span>
        </div>
      </div>
    </div>
  )
}
