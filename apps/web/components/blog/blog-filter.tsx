'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, Clock, ArrowRight } from 'lucide-react'

type Post = {
  slug: string
  title: string
  excerpt: string
  date: string
  readTime: string
  category: string
  body: readonly string[]
}

type BlogFilterProps = {
  posts: readonly Post[]
  locale: string
  filterAll: string
  readMore: string
  minRead: string
}

export function BlogFilter({ posts, locale, filterAll, readMore, minRead }: BlogFilterProps) {
  const categories = [filterAll, ...Array.from(new Set(posts.map((p) => p.category)))]
  const [active, setActive] = useState(filterAll)

  const filtered = active === filterAll ? posts : posts.filter((p) => p.category === active)

  return (
    <>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
              active === cat
                ? 'bg-primary text-white shadow-md'
                : 'bg-surface-alt text-text-secondary hover:bg-primary/10 hover:text-primary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-6">
        {filtered.map((post) => (
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
                {post.readTime} {minRead}
              </span>
            </div>
            <h2 className="mt-4 font-heading text-xl font-bold text-text group-hover:text-primary transition-colors">
              {post.title}
            </h2>
            <p className="mt-3 text-text-secondary leading-relaxed">{post.excerpt}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              {readMore}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </>
  )
}
