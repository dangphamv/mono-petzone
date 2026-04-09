const API_URL = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3001/api'

function getToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

export function setAuthCookies(accessToken: string, refreshToken: string) {
  const maxAge = 60 * 60 * 24 * 7
  document.cookie = `access_token=${encodeURIComponent(accessToken)}; path=/; max-age=${maxAge}; SameSite=Lax`
  document.cookie = `refresh_token=${encodeURIComponent(refreshToken)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

export function clearAuthCookies() {
  document.cookie = 'access_token=; path=/; max-age=0'
  document.cookie = 'refresh_token=; path=/; max-age=0'
}

export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    clearAuthCookies()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `API error ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}
