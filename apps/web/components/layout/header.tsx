import Link from 'next/link'
import { Download, PawPrint } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/30 bg-white/60 backdrop-blur-xl">
      <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-heading text-2xl font-bold text-primary">
          <PawPrint className="h-7 w-7" strokeWidth={2.5} />
          PetZone
        </Link>
        <div className="hidden items-center gap-10 md:flex">
          <Link href="/about" className="text-sm font-medium text-text-secondary transition-colors duration-200 hover:text-primary">
            Về chúng tôi
          </Link>
          <Link href="/for-providers" className="text-sm font-medium text-text-secondary transition-colors duration-200 hover:text-primary">
            Dành cho đối tác
          </Link>
          <Link href="/pricing" className="text-sm font-medium text-text-secondary transition-colors duration-200 hover:text-primary">
            Bảng giá
          </Link>
          <Link href="/contact" className="text-sm font-medium text-text-secondary transition-colors duration-200 hover:text-primary">
            Liên hệ
          </Link>
        </div>
        <a
          href="#download"
          className="group flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30"
        >
          <Download className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
          Tải ứng dụng
        </a>
      </nav>
    </header>
  )
}
