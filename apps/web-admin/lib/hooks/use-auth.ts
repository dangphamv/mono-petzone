'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { api, setAuthCookies, clearAuthCookies } from '../api'

interface LoginSession {
  access_token: string
  refresh_token: string
  user: { id: string; email: string; full_name: string; role: string }
}

interface LoginResponse {
  data: LoginSession
}

export function useLogin() {
  const router = useRouter()

  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (res) => {
      setAuthCookies(res.data.access_token, res.data.refresh_token)
      router.push('/dashboard')
    },
  })
}

export function useLogout() {
  return () => {
    clearAuthCookies()
    window.location.href = '/login'
  }
}
