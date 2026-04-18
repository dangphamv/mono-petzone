import type { Metadata } from 'next'
import Link from 'next/link'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { defaultLocale, type Locale } from '@/lib/i18n/config'
import { Calendar, Clock, ArrowRight } from 'lucide-react'

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

        <div className="mt-12 space-y-6">
          {dict.blogPage.posts.map((post) => (
            <Link
              key={post.slug}
              href={`/${locale}/blog/${post.slug}`}
              className="glass-card group block rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center gap-4 text-sm text-text-secondary">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {post.category}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {post.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {post.readTime} {dict.blogPage.minRead}
                </span>
              </div>
              <h2 className="mt-4 font-heading text-xl font-bold text-text group-hover:text-primary transition-colors">
                {post.title}
              </h2>
              <p className="mt-3 text-text-secondary leading-relaxed">{post.excerpt}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                {dict.blogPage.readMore}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
