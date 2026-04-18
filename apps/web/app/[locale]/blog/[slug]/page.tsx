import type { Metadata } from 'next'
import Link from 'next/link'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { defaultLocale, type Locale } from '@/lib/i18n/config'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const dict = await getDictionary((raw as Locale) || defaultLocale)
  const post = dict.blogPage.posts.find((p) => p.slug === slug)
  return {
    title: post?.title || 'Blog',
    description: post?.excerpt || dict.blogPage.metaDescription,
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params
  const locale = (raw as Locale) || defaultLocale
  const dict = await getDictionary(locale)
  const post = dict.blogPage.posts.find((p) => p.slug === slug)

  if (!post) {
    return (
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="font-heading text-4xl font-bold text-text">404</h1>
          <p className="mt-4 text-text-secondary">Post not found.</p>
          <Link href={`/${locale}/blog`} className="mt-6 inline-flex items-center gap-2 text-primary font-semibold">
            <ArrowLeft className="h-4 w-4" /> Back to blog
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4">
        <Link href={`/${locale}/blog`} className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> Blog
        </Link>

        <div className="mt-8">
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

          <h1 className="mt-6 font-heading text-3xl font-bold text-text md:text-4xl">{post.title}</h1>
          <p className="mt-6 text-lg leading-relaxed text-text-secondary">{post.excerpt}</p>

          <div className="mt-8 prose prose-lg max-w-none">
            {post.body.map((paragraph, i) => (
              <div key={i} className="whitespace-pre-line">
                {paragraph.split('\n\n').map((p, j) => (
                  <p key={j} className={j === 0 && paragraph.includes('\n\n') ? 'font-heading text-xl font-bold text-text mt-8' : 'mt-4 text-text-secondary leading-relaxed'}>
                    {p}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
