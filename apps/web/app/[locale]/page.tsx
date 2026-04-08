import { Hero } from '@/components/landing/hero'
import { Features } from '@/components/landing/features'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Stats } from '@/components/landing/stats'
import { Cta } from '@/components/landing/cta'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { defaultLocale, type Locale } from '@/lib/i18n/config'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = (raw as Locale) || defaultLocale
  const dict = await getDictionary(locale)

  return (
    <>
      <Hero dict={dict.hero} locale={locale} />
      <Features dict={dict.features} />
      <HowItWorks dict={dict.howItWorks} />
      <Stats dict={dict.stats} />
      <Cta dict={dict.cta} />
    </>
  )
}
