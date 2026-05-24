'use client'

import { useState, useEffect } from 'react'

interface CurrentUser {
  id: string
  email: string
  role: string
  permissions: string[]
  /** admin = superuser (true for any permission); staff = checks granted permissions. */
  can: (perm: string) => boolean
}

function getToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1]
    if (!base64) return null
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function useCurrentUser(): CurrentUser | null {
  const [user, setUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) return
    const payload = decodeJwtPayload(token)
    if (!payload) return
    const appMeta = (payload.app_metadata as Record<string, unknown>) ?? {}
    const role = (appMeta.role as string) || 'admin'
    const permissions = Array.isArray(appMeta.permissions) ? (appMeta.permissions as string[]) : []
    setUser({
      id: (payload.sub as string) || '',
      email: (payload.email as string) || '',
      role,
      permissions,
      can: (perm: string) => role === 'admin' || permissions.includes(perm),
    })
  }, [])

  return user
}
