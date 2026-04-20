import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { defaultLocale, type Locale } from '@/lib/i18n/config'
import { Phone, ShieldCheck, Eye, Heart, Handshake, BadgeCheck, Camera, ClipboardList, MessageSquare, Wallet, Star } from 'lucide-react'

const valueIcons = [ShieldCheck, Eye, Heart, Handshake]
const diffIcons = [BadgeCheck, Camera, ClipboardList, MessageSquare, Wallet, Star]

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
          <div className="mt-6 space-y-4">
            {dict.about.diffs.map((d, i) => {
              const Icon = diffIcons[i] || BadgeCheck
              return (
                <div key={d.text} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" strokeWidth={1.8} />
                  </div>
                  <span className="pt-2 text-text-secondary">{d.text}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Values */}
        <div className="mt-12">
          <h2 className="font-heading text-2xl font-bold text-text">{dict.about.valuesTitle}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {dict.about.values.map((v, i) => {
              const Icon = valueIcons[i] || ShieldCheck
              return (
                <div key={v.text} className="glass-card flex items-start gap-4 rounded-2xl p-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/10">
                    <Icon className="h-6 w-6 text-primary" strokeWidth={1.8} />
                  </div>
                  <p className="pt-2 font-medium text-text">{v.text}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Team */}
        <div className="mt-12">
          <h2 className="font-heading text-2xl font-bold text-text">{dict.about.teamTitle}</h2>
          <p className="mt-4 text-lg leading-relaxed text-text-secondary">{dict.about.teamText}</p>
        </div>

        {/* Hotline */}
        <div className="mt-12 flex items-center gap-4 rounded-2xl bg-primary/5 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Phone className="h-5 w-5 text-primary" strokeWidth={1.8} />
          </div>
          <span className="text-lg font-semibold text-primary">{dict.about.hotline}</span>
        </div>
      </div>
    </div>
  )
}
