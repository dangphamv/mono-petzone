import Link from 'next/link'
import { PawPrint, Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="relative border-t border-gray-100 bg-white">
      {/* Top gradient accent line */}
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-heading text-2xl font-bold text-primary">
              <PawPrint className="h-7 w-7" strokeWidth={2.5} />
              PetZone
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-text-secondary">
              Nền tảng đặt khách sạn thú cưng hàng đầu Việt Nam. Kết nối chủ thú cưng với các cơ sở lưu trú uy tín, được xác minh.
            </p>
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <Mail className="h-4 w-4 text-primary" />
                <span>hello@petzone.vn</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <Phone className="h-4 w-4 text-primary" />
                <span>1900 xxxx</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <MapPin className="h-4 w-4 text-primary" />
                <span>TP. Hồ Chí Minh, Việt Nam</span>
              </div>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-text">Sản phẩm</h4>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link href="/for-providers" className="text-text-secondary transition-colors duration-200 hover:text-primary">
                  Dành cho đối tác
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-text-secondary transition-colors duration-200 hover:text-primary">
                  Bảng giá
                </Link>
              </li>
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-text">Công ty</h4>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link href="/about" className="text-text-secondary transition-colors duration-200 hover:text-primary">
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-text-secondary transition-colors duration-200 hover:text-primary">
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-text">Pháp lý</h4>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link href="/terms" className="text-text-secondary transition-colors duration-200 hover:text-primary">
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-text-secondary transition-colors duration-200 hover:text-primary">
                  Chính sách bảo mật
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 sm:flex-row">
          <p className="text-sm text-text-secondary">
            &copy; {new Date().getFullYear()} PetZone. All rights reserved.
          </p>
          <p className="text-xs text-text-secondary/60">
            Made with care for pets in Vietnam
          </p>
        </div>
      </div>
    </footer>
  )
}
