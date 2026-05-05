import type { Metadata } from 'next'
import Link from 'next/link'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { defaultLocale, type Locale } from '@/lib/i18n/config'
import { ChevronDown, ArrowRight, Phone } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params
  const dict = await getDictionary((raw as Locale) || defaultLocale)
  return { title: dict.faqPage.metaTitle, description: dict.faqPage.metaDescription }
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = (raw as Locale) || defaultLocale
  const dict = await getDictionary(locale)

  const ownerItems = dict.faqPage.items.filter((item) => item.category === 'owner')
  const providerItems = dict.faqPage.items.filter((item) => item.category === 'provider')

  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4">
        <div className="text-center">
          <h1 className="font-heading text-4xl font-bold text-text">{dict.faqPage.title}</h1>
          <p className="mt-4 text-lg text-text-secondary">{dict.faqPage.subtitle}</p>
        </div>

        <div className="mt-12">
          <h2 className="font-heading text-2xl font-bold text-primary">{dict.faqPage.ownerLabel}</h2>
          <div className="mt-6 space-y-4">
            {ownerItems.map((item) => (
              <details key={item.question} className="glass-card group rounded-2xl">
                <summary className="flex cursor-pointer items-center justify-between p-6 font-heading font-semibold text-text">
                  {item.question}
                  <ChevronDown className="h-5 w-5 shrink-0 text-text-secondary transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-6 text-text-secondary leading-relaxed">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="font-heading text-2xl font-bold text-primary">{dict.faqPage.providerLabel}</h2>
          <div className="mt-6 space-y-4">
            {providerItems.map((item) => (
              <details key={item.question} className="glass-card group rounded-2xl">
                <summary className="flex cursor-pointer items-center justify-between p-6 font-heading font-semibold text-text">
                  {item.question}
                  <ChevronDown className="h-5 w-5 shrink-0 text-text-secondary transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-6 text-text-secondary leading-relaxed">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>

          {/* Become a Partner CTA */}
          <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl bg-gradient-to-r from-primary/5 to-secondary/5 p-8 text-center">
            <Link
              href={`/${locale}/for-providers/register`}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-heading font-semibold text-white shadow-lg transition-all duration-200 hover:bg-primary/90 hover:-translate-y-0.5"
            >
              {dict.faqPage.becomePartnerBtn}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="tel:19900999"
              className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4" />
              {dict.faqPage.orContactUs}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
