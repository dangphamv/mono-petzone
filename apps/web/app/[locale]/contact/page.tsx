import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { defaultLocale, type Locale } from '@/lib/i18n/config'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params
  const dict = await getDictionary((raw as Locale) || defaultLocale)
  return { title: dict.contactPage.metaTitle, description: dict.contactPage.metaDescription }
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const dict = await getDictionary((raw as Locale) || defaultLocale)

  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="font-heading text-4xl font-bold text-text">{dict.contactPage.title}</h1>
        <p className="mt-6 text-lg text-text-secondary">{dict.contactPage.subtitle}</p>
        <div className="mt-8 space-y-4 text-text-secondary">
          <p>Email: hello@petzone.vn</p>
          <p>Hotline: 1900-PETZONE</p>
        </div>
      </div>
    </section>
  )
}
