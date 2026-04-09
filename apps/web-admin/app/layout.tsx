import type { Metadata } from 'next'
import { TooltipProvider } from '@petzone/ui'
import { Toaster } from 'sonner'
import { QueryProvider } from '@/lib/query-provider'
import { I18nProvider } from '@/lib/i18n'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'PetZone Admin', template: '%s | PetZone Admin' },
  description: 'PetZone administration dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&family=DM+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background font-body text-text antialiased">
        <QueryProvider>
          <I18nProvider>
            <TooltipProvider delayDuration={0}>
              {children}
              <Toaster richColors position="top-right" />
            </TooltipProvider>
          </I18nProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
