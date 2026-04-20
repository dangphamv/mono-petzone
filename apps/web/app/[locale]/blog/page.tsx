import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { defaultLocale, type Locale } from '@/lib/i18n/config'
import { BlogFilter } from '@/components/blog/blog-filter'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params
  const dict = await getDictionary((raw as Locale) || defaultLocale)
  return { title: dict.blogPage.metaTitle, description: dict.blogPage.metaDescription }
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = (raw as Locale) || defaultLocale
  const dict = await getDictionary(locale)

  return (
    <section className="py-20">
      <div className="mx-auto max-w-4xl px-4">
        <div className="text-center">
          <h1 className="font-heading text-4xl font-bold text-text">{dict.blogPage.title}</h1>
          <p className="mt-4 text-lg text-text-secondary">{dict.blogPage.subtitle}</p>
        </div>

        <BlogFilter
          posts={dict.blogPage.posts}
          locale={locale}
          filterAll={dict.blogPage.filterAll}
          readMore={dict.blogPage.readMore}
          minRead={dict.blogPage.minRead}
        />
      </div>
    </section>
  )
}
