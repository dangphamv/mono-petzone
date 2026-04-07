import type { Metadata } from 'next'
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
      <body className="bg-background font-body text-text antialiased">{children}</body>
    </html>
  )
}
