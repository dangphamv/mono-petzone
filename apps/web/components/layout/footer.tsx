import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <h3 className="font-heading text-xl font-bold text-primary">PetZone</h3>
            <p className="mt-2 text-sm text-text-secondary">
              Nền tảng đặt khách sạn thú cưng hàng đầu Việt Nam
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-text">Sản phẩm</h4>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
              <li><Link href="/for-providers" className="hover:text-text">Dành cho đối tác</Link></li>
              <li><Link href="/pricing" className="hover:text-text">Bảng giá</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-text">Công ty</h4>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
              <li><Link href="/about" className="hover:text-text">Về chúng tôi</Link></li>
              <li><Link href="/contact" className="hover:text-text">Liên hệ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-text">Pháp lý</h4>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
              <li><Link href="/terms" className="hover:text-text">Điều khoản sử dụng</Link></li>
              <li><Link href="/privacy" className="hover:text-text">Chính sách bảo mật</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-100 pt-8 text-center text-sm text-text-secondary">
          &copy; {new Date().getFullYear()} PetZone. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
