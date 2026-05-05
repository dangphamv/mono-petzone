'use client'

import { useState } from 'react'
import { Send, CheckCircle } from 'lucide-react'

type PartnerRegisterDict = {
  nameLabel: string; namePlaceholder: string
  phoneLabel: string; phonePlaceholder: string
  emailLabel: string; emailPlaceholder: string
  propertyNameLabel: string; propertyNamePlaceholder: string
  addressLabel: string; addressPlaceholder: string
  servicesLabel: string; servicesOptions: readonly string[]
  roomsLabel: string; roomsPlaceholder: string
  messageLabel: string; messagePlaceholder: string
  submitBtn: string
  successTitle: string; successText: string
}

export function PartnerRegisterForm({ dict }: { dict: PartnerRegisterDict }) {
  const [submitted, setSubmitted] = useState(false)
  const [selectedServices, setSelectedServices] = useState<string[]>([])

  function toggleService(service: string) {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // TODO: integrate with backend API
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl bg-gradient-to-r from-primary/5 to-secondary/5 p-12 text-center">
        <CheckCircle className="h-16 w-16 text-primary" />
        <h2 className="font-heading text-2xl font-bold text-text">{dict.successTitle}</h2>
        <p className="text-text-secondary">{dict.successText}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-12 space-y-6">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-text">{dict.nameLabel}</label>
        <input
          type="text"
          required
          placeholder={dict.namePlaceholder}
          className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-text placeholder:text-text-secondary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Phone & Email */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-text">{dict.phoneLabel}</label>
          <input
            type="tel"
            required
            placeholder={dict.phonePlaceholder}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-text placeholder:text-text-secondary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text">{dict.emailLabel}</label>
          <input
            type="email"
            required
            placeholder={dict.emailPlaceholder}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-text placeholder:text-text-secondary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Property Name */}
      <div>
        <label className="block text-sm font-medium text-text">{dict.propertyNameLabel}</label>
        <input
          type="text"
          required
          placeholder={dict.propertyNamePlaceholder}
          className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-text placeholder:text-text-secondary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-text">{dict.addressLabel}</label>
        <input
          type="text"
          required
          placeholder={dict.addressPlaceholder}
          className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-text placeholder:text-text-secondary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Services */}
      <div>
        <label className="block text-sm font-medium text-text">{dict.servicesLabel}</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {dict.servicesOptions.map((service) => (
            <button
              key={service}
              type="button"
              onClick={() => toggleService(service)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                selectedServices.includes(service)
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 text-text-secondary hover:bg-primary/10 hover:text-primary'
              }`}
            >
              {service}
            </button>
          ))}
        </div>
      </div>

      {/* Rooms */}
      <div>
        <label className="block text-sm font-medium text-text">{dict.roomsLabel}</label>
        <input
          type="text"
          placeholder={dict.roomsPlaceholder}
          className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-text placeholder:text-text-secondary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-medium text-text">{dict.messageLabel}</label>
        <textarea
          rows={3}
          placeholder={dict.messagePlaceholder}
          className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-text placeholder:text-text-secondary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 font-heading font-semibold text-white shadow-lg transition-all duration-200 hover:bg-primary/90 hover:-translate-y-0.5"
      >
        <Send className="h-5 w-5" />
        {dict.submitBtn}
      </button>
    </form>
  )
}
