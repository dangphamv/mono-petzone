import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { defaultLocale, type Locale } from '@/lib/i18n/config'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params
  const dict = await getDictionary((raw as Locale) || defaultLocale)
  return { title: dict.forProvidersPage.metaTitle, description: dict.forProvidersPage.metaDescription }
}

export default async function ForProvidersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const dict = await getDictionary((raw as Locale) || defaultLocale)

  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="font-heading text-4xl font-bold text-text">{dict.forProvidersPage.title}</h1>
        <p className="mt-6 text-lg text-text-secondary">{dict.forProvidersPage.subtitle}</p>
        <div className="mt-8 space-y-4">
          {dict.forProvidersPage.features.map((f) => (
            <div key={f.title} className="glass-card rounded-2xl p-6">
              <h3 className="font-heading text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-text-secondary">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
