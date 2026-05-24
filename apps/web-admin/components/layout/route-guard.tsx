'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useCurrentUser } from '@/lib/hooks/use-current-user'

// Maps a route prefix → permission needed. null = admin-only. UX layer only; the API enforces.
const ROUTE_PERMS: { prefix: string; perm: string | null }[] = [
  { prefix: '/dashboard', perm: 'dashboard:view' },
  { prefix: '/analytics', perm: 'dashboard:view' },
  { prefix: '/providers', perm: 'providers:view' },
  { prefix: '/orders/new', perm: 'orders:manage' },
  { prefix: '/orders', perm: 'orders:view' },
  { prefix: '/disputes', perm: 'disputes:view' },
  { prefix: '/users', perm: 'users:view' },
  { prefix: '/pets', perm: 'pets:view' },
  { prefix: '/reviews', perm: 'reviews:view' },
  { prefix: '/config', perm: null },
  { prefix: '/payments', perm: null },
  { prefix: '/bank-transactions', perm: null },
]

function allowed(user: ReturnType<typeof useCurrentUser>, perm: string | null): boolean {
  if (!user) return true // not resolved yet — don't redirect prematurely
  return perm === null ? user.role === 'admin' : user.can(perm)
}

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!user) return
    const match = ROUTE_PERMS.find((r) => pathname.startsWith(r.prefix))
    if (!match) return
    if (allowed(user, match.perm)) return
    // Redirect to the first route this user is allowed to see.
    const fallback = ROUTE_PERMS.find((r) => allowed(user, r.perm))
    router.replace(fallback ? fallback.prefix : '/dashboard')
  }, [user, pathname, router])

  return <>{children}</>
}
