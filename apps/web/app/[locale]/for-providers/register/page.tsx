import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { defaultLocale, type Locale } from '@/lib/i18n/config'
import { PartnerRegisterForm } from '@/components/partner/partner-register-form'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params
  const dict = await getDictionary((raw as Locale) || defaultLocale)
  return { title: dict.partnerRegister.metaTitle, description: dict.partnerRegister.metaDescription }
}

export default async function PartnerRegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = (raw as Locale) || defaultLocale
  const dict = await getDictionary(locale)

  return (
    <section className="py-20">
      <div className="mx-auto max-w-2xl px-4">
        <div className="text-center">
          <h1 className="font-heading text-4xl font-bold text-text">{dict.partnerRegister.title}</h1>
          <p className="mt-4 text-lg text-text-secondary">{dict.partnerRegister.subtitle}</p>
        </div>

        <PartnerRegisterForm dict={dict.partnerRegister} />

        {/* Or contact us */}
        <div className="mt-8 rounded-2xl bg-surface-alt p-6 text-center">
          <h3 className="font-heading font-semibold text-text">{dict.partnerRegister.orContactLabel}</h3>
          <p className="mt-2 text-sm text-text-secondary">{dict.partnerRegister.orContactText}</p>
        </div>
      </div>
    </section>
  )
}
