import Link from 'next/link'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="font-heading text-2xl font-bold text-primary">
          PetZone
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <Link href="/about" className="text-sm font-medium text-text-secondary hover:text-text">
            Về chúng tôi
          </Link>
          <Link href="/for-providers" className="text-sm font-medium text-text-secondary hover:text-text">
            Dành cho đối tác
          </Link>
          <Link href="/pricing" className="text-sm font-medium text-text-secondary hover:text-text">
            Bảng giá
          </Link>
          <Link href="/contact" className="text-sm font-medium text-text-secondary hover:text-text">
            Liên hệ
          </Link>
        </div>
        <a
          href="#download"
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          Tải ứng dụng
        </a>
      </nav>
    </header>
  )
}
