import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: {
    default: 'PetZone - Nền tảng đặt khách sạn thú cưng',
    template: '%s | PetZone',
  },
  description:
    'Tìm và đặt khách sạn thú cưng uy tín tại Việt Nam. Theo dõi thú cưng theo thời gian thực, thanh toán an toàn.',
  keywords: ['pet hotel', 'khách sạn thú cưng', 'pet boarding', 'chăm sóc thú cưng', 'Vietnam'],
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
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
