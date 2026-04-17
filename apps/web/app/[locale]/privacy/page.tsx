import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { defaultLocale, type Locale } from '@/lib/i18n/config'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params
  const dict = await getDictionary((raw as Locale) || defaultLocale)
  return { title: dict.privacyPage.metaTitle }
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const dict = await getDictionary((raw as Locale) || defaultLocale)

  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="font-heading text-4xl font-bold text-text">{dict.privacyPage.title}</h1>
        <p className="mt-2 text-sm text-text-secondary">{dict.privacyPage.lastUpdated}</p>
        <div className="mt-10 space-y-8">
          {dict.privacyPage.sections.map((s) => (
            <div key={s.heading}>
              <h2 className="font-heading text-xl font-bold text-text">{s.heading}</h2>
              <p className="mt-3 leading-relaxed text-text-secondary">{s.content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
