import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { defaultLocale, type Locale } from '@/lib/i18n/config'
import { Mail, Phone, MessageCircle, MapPin, Clock, ExternalLink } from 'lucide-react'

const iconMap = {
  mail: Mail,
  phone: Phone,
  'message-circle': MessageCircle,
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params
  const dict = await getDictionary((raw as Locale) || defaultLocale)
  return { title: dict.contactPage.metaTitle, description: dict.contactPage.metaDescription }
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const dict = await getDictionary((raw as Locale) || defaultLocale)

  return (
    <div className="py-20">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-heading text-4xl font-bold text-text">{dict.contactPage.title}</h1>
          <p className="mt-4 text-lg text-text-secondary">{dict.contactPage.subtitle}</p>
        </div>

        {/* Contact Channels */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {dict.contactPage.channels.map((channel) => {
            const Icon = iconMap[channel.icon as keyof typeof iconMap] || Mail
            return (
              <a
                key={channel.label}
                href={channel.link}
                className="glass-card group flex flex-col items-center rounded-2xl p-8 text-center transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-heading text-sm font-semibold uppercase tracking-wider text-text-secondary">{channel.label}</h3>
                <p className="mt-2 text-lg font-semibold text-text group-hover:text-primary transition-colors">{channel.value}</p>
              </a>
            )
          })}
        </div>

        {/* Support Sections */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <div className="glass-card rounded-2xl p-8">
            <h3 className="font-heading text-lg font-bold text-text">{dict.contactPage.ownerTitle}</h3>
            <p className="mt-3 text-text-secondary leading-relaxed">{dict.contactPage.ownerText}</p>
          </div>
          <div className="glass-card rounded-2xl p-8">
            <h3 className="font-heading text-lg font-bold text-text">{dict.contactPage.providerTitle}</h3>
            <p className="mt-3 text-text-secondary leading-relaxed">{dict.contactPage.providerText}</p>
          </div>
        </div>

        {/* Social Links */}
        <div className="mt-12">
          <h2 className="text-center font-heading text-2xl font-bold text-text">{dict.contactPage.socialTitle}</h2>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            {dict.contactPage.socials.map((social) => (
              <a
                key={social.platform}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full border border-gray-200 px-5 py-3 text-sm font-medium text-text-secondary transition-all duration-200 hover:border-primary/30 hover:text-primary"
              >
                {social.platform}
                <span className="text-primary">{social.handle}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>

        {/* Hours & Location */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span><strong className="text-text">{dict.contactPage.hoursTitle}:</strong> {dict.contactPage.hoursText}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span><strong className="text-text">{dict.contactPage.locationTitle}:</strong> {dict.contactPage.locationText}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
