import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { defaultLocale, type Locale } from '@/lib/i18n/config'
import { ArrowRight, Users, Smartphone, CreditCard, Award, HeadphonesIcon, ChevronDown } from 'lucide-react'

const featureIcons = [Users, Smartphone, CreditCard, Award, HeadphonesIcon]

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params
  const dict = await getDictionary((raw as Locale) || defaultLocale)
  return { title: dict.forProvidersPage.metaTitle, description: dict.forProvidersPage.metaDescription }
}

export default async function ForProvidersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const dict = await getDictionary((raw as Locale) || defaultLocale)

  return (
    <div className="py-20">
      <div className="mx-auto max-w-4xl px-4">
        {/* Hero */}
        <div className="text-center">
          <h1 className="font-heading text-4xl font-bold text-text md:text-5xl">{dict.forProvidersPage.title}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary">{dict.forProvidersPage.subtitle}</p>
          <div className="mt-8">
            <a href="#" className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl">
              {dict.forProvidersPage.ctaText}
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
            <p className="mt-3 text-sm text-text-secondary">{dict.forProvidersPage.ctaSubtext}</p>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-20 space-y-6">
          {dict.forProvidersPage.features.map((f, i) => {
            const Icon = featureIcons[i] || Users
            return (
              <div key={f.title} className="glass-card flex items-start gap-5 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/10">
                  <Icon className="h-6 w-6 text-primary" strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-text">{f.title}</h3>
                  <p className="mt-2 text-text-secondary leading-relaxed">{f.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* How it works */}
        <div className="mt-20">
          <h2 className="text-center font-heading text-2xl font-bold text-text">{dict.forProvidersPage.howTitle}</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {dict.forProvidersPage.howSteps.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark text-xl font-bold text-white shadow-lg shadow-primary/20">
                  {i + 1}
                </div>
                <h3 className="mt-4 font-heading text-lg font-bold text-text">{step.title}</h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="mt-20 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 p-8 text-center">
          <h2 className="font-heading text-2xl font-bold text-text">{dict.forProvidersPage.pricingTitle}</h2>
          <div className="mt-4">
            <span className="font-heading text-5xl font-bold text-primary">{dict.forProvidersPage.pricingRate}</span>
          </div>
          <p className="mt-3 text-text-secondary">{dict.forProvidersPage.pricingDesc}</p>
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="text-center font-heading text-2xl font-bold text-text">{dict.forProvidersPage.faqTitle}</h2>
          <div className="mt-8 space-y-3">
            {dict.forProvidersPage.faqs.map((faq) => (
              <details key={faq.q} className="glass-card group rounded-2xl">
                <summary className="flex cursor-pointer items-center justify-between p-6 font-heading font-semibold text-text">
                  {faq.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-text-secondary transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-6 text-text-secondary leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <a href="#" className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl">
            {dict.forProvidersPage.ctaText}
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </a>
          <p className="mt-3 text-sm text-text-secondary">{dict.forProvidersPage.ctaSubtext}</p>
        </div>
      </div>
    </div>
  )
}
