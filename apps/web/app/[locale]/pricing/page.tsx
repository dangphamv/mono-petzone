import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { defaultLocale, type Locale } from '@/lib/i18n/config'
import { Check, Sparkles } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params
  const dict = await getDictionary((raw as Locale) || defaultLocale)
  return { title: dict.pricingPage.metaTitle, description: dict.pricingPage.metaDescription }
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const dict = await getDictionary((raw as Locale) || defaultLocale)

  return (
    <div className="py-20">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-heading text-4xl font-bold text-text">{dict.pricingPage.title}</h1>
          <p className="mt-4 text-lg text-text-secondary">{dict.pricingPage.subtitle}</p>
        </div>

        {/* Pricing Cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Owner Card */}
          <div className="glass-card rounded-2xl p-8 ring-2 ring-primary/20">
            <h3 className="font-heading text-lg font-semibold text-text-secondary">{dict.pricingPage.ownerTitle}</h3>
            <p className="mt-1 text-sm text-text-secondary">{dict.pricingPage.ownerSubtitle}</p>
            <div className="mt-6">
              <span className="font-heading text-5xl font-bold text-primary">{dict.pricingPage.ownerFree}</span>
            </div>
            <ul className="mt-8 space-y-3">
              {dict.pricingPage.ownerFeatures.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={2} />
                  <span className="text-text-secondary">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Provider Card */}
          <div className="glass-card rounded-2xl p-8">
            <h3 className="font-heading text-lg font-semibold text-text-secondary">{dict.pricingPage.providerTitle}</h3>
            <p className="mt-1 text-sm text-text-secondary">{dict.pricingPage.providerSubtitle}</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="font-heading text-5xl font-bold text-text">{dict.pricingPage.commission}</span>
            </div>
            <p className="mt-2 text-sm text-text-secondary">{dict.pricingPage.commissionDesc}</p>
            <ul className="mt-8 space-y-3">
              {dict.pricingPage.providerFeatures.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={2} />
                  <span className="text-text-secondary">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Launch Offer */}
        <div className="mt-8 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 p-6 text-center">
          <Sparkles className="h-5 w-5 text-secondary" />
          <div>
            <span className="font-heading font-bold text-text">{dict.pricingPage.launchOffer}</span>
            <span className="ml-2 text-text-secondary">{dict.pricingPage.launchOfferDesc}</span>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mt-16">
          <h2 className="text-center font-heading text-2xl font-bold text-text">{dict.pricingPage.comparisonTitle}</h2>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  {dict.pricingPage.comparisonHeaders.map((h, i) => (
                    <th key={i} className={`pb-4 pr-4 font-heading font-semibold ${i === 0 ? 'text-text' : i === 2 ? 'text-primary' : 'text-text-secondary'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dict.pricingPage.comparisonRows.map((row) => (
                  <tr key={row.feature} className="border-b border-gray-100">
                    <td className="py-4 pr-4 font-medium text-text">{row.feature}</td>
                    <td className="py-4 pr-4 text-text-secondary">{row.traditional}</td>
                    <td className="py-4 pr-4 font-medium text-primary">{row.petzone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
