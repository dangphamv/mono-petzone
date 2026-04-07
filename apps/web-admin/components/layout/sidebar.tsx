import Link from 'next/link'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/providers', label: 'Đối tác', icon: '🏨' },
  { href: '/orders', label: 'Đơn hàng', icon: '📋' },
  { href: '/disputes', label: 'Tranh chấp', icon: '⚠️' },
  { href: '/users', label: 'Người dùng', icon: '👤' },
  { href: '/reviews', label: 'Đánh giá', icon: '⭐' },
  { href: '/analytics', label: 'Thống kê', icon: '📈' },
  { href: '/config', label: 'Cấu hình', icon: '⚙️' },
]

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <span className="font-heading text-xl font-bold text-primary">PetZone Admin</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-gray-100 hover:text-text"
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
