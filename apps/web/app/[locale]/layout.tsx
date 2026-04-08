import type { Metadata } from 'next'
import '../globals.css'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config'

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary((locale as Locale) || defaultLocale)
  return {
    title: { default: dict.metadata.title, template: `%s | PetZone` },
    description: dict.metadata.description,
    keywords: ['pet hotel', 'khách sạn thú cưng', 'pet boarding', 'chăm sóc thú cưng', 'Vietnam'],
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale = (rawLocale as Locale) || defaultLocale
  const dict = await getDictionary(locale)

  return (
    <html lang={locale}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&family=DM+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-screen flex-col bg-background font-body text-text antialiased">
        <Header dict={dict.header} locale={locale} />
        <main className="flex-1">{children}</main>
        <Footer dict={dict.footer} locale={locale} />
      </body>
    </html>
  )
}
