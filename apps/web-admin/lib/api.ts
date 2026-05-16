const API_URL = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3001/api'

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function getToken(): string | null {
  return readCookie('access_token')
}

function getRefreshToken(): string | null {
  return readCookie('refresh_token')
}

export function setAuthCookies(accessToken: string, refreshToken: string) {
  const maxAge = 60 * 60 * 24 * 30
  document.cookie = `access_token=${encodeURIComponent(accessToken)}; path=/; max-age=${maxAge}; SameSite=Lax`
  document.cookie = `refresh_token=${encodeURIComponent(refreshToken)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

export function clearAuthCookies() {
  document.cookie = 'access_token=; path=/; max-age=0'
  document.cookie = 'refresh_token=; path=/; max-age=0'
}

let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      if (!res.ok) return false
      const body = await res.json().catch(() => null) as { data?: { access_token?: string; refresh_token?: string } } | null
      const access = body?.data?.access_token
      const refresh = body?.data?.refresh_token
      if (!access || !refresh) return false
      setAuthCookies(access, refresh)
      return true
    } catch {
      return false
    }
  })()
  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

function redirectToLogin() {
  clearAuthCookies()
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

async function fetchWithAuth(path: string, options: RequestInit): Promise<Response> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return fetch(`${API_URL}${path}`, { ...options, headers })
}

export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const isAuthEndpoint = path.startsWith('/auth/')
  let res = await fetchWithAuth(path, options)

  if (res.status === 401 && !isAuthEndpoint) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      res = await fetchWithAuth(path, options)
    } else {
      redirectToLogin()
      throw new Error('Unauthorized')
    }
  }

  if (res.status === 401) {
    if (!isAuthEndpoint) redirectToLogin()
    const body = await res.json().catch(() => ({})) as { message?: string }
    throw new Error(body.message || 'Unauthorized')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = new Error(body.message || `API error ${res.status}`) as Error & { errors?: Record<string, string[]>; status?: number }
    if (body.errors) err.errors = body.errors
    err.status = res.status
    throw err
  }

  if (res.status === 204) return undefined as T
  return res.json()
}
