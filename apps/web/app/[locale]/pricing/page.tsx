import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { defaultLocale, type Locale } from '@/lib/i18n/config'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params
  const dict = await getDictionary((raw as Locale) || defaultLocale)
  return { title: dict.pricingPage.metaTitle, description: dict.pricingPage.metaDescription }
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const dict = await getDictionary((raw as Locale) || defaultLocale)

  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="font-heading text-4xl font-bold text-text">{dict.pricingPage.title}</h1>
        <p className="mt-6 text-lg text-text-secondary">{dict.pricingPage.subtitle}</p>
        <div className="mt-8 glass-card rounded-2xl p-8">
          <h3 className="font-heading text-2xl font-semibold text-primary">{dict.pricingPage.commission}</h3>
          <p className="mt-2 text-text-secondary">{dict.pricingPage.commissionDesc}</p>
        </div>
      </div>
    </section>
  )
}
