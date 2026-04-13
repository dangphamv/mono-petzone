'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

interface PaginatedResponse<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

interface DashboardData {
  total_users: number
  total_providers: number
  pending_verifications: number
  active_orders: number
  open_disputes: number
}

interface AnalyticsData {
  orders_by_status: { status: string; count: number }[]
  total_revenue: number
  top_providers: { id: string; business_name: string; rating_average: number; rating_count: number }[]
}

interface ConfigData {
  commission_rate: number
  auto_confirm_hours: number
  payment_timeout_hours: number
}

export interface TableQueryParams {
  page?: number
  limit?: number
  search?: string
  filters?: Record<string, string[]>
}

function buildQuery(base: string, params: TableQueryParams = {}): string {
  const { page = 1, limit = 20, search, filters } = params
  const qs = new URLSearchParams()
  qs.set('page', String(page))
  qs.set('limit', String(limit))
  if (search) qs.set('search', search)
  if (filters) {
    Object.entries(filters).forEach(([key, values]) => {
      if (values.length) qs.set(key, values.join(','))
    })
  }
  return `${base}?${qs.toString()}`
}

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => (await api<{ data: DashboardData }>('/admin/dashboard')).data,
  })
}

export function useProviders(params: TableQueryParams = {}) {
  return useQuery<PaginatedResponse<Record<string, unknown>>>({
    queryKey: ['admin', 'providers', params],
    queryFn: () => api(buildQuery('/admin/providers', params)),
  })
}

export function useVerifyProvider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; status: string; notes?: string }) =>
      api(`/admin/providers/${id}/verify`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'providers'] })
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })
}

export function useOrders(params: TableQueryParams = {}) {
  return useQuery<PaginatedResponse<Record<string, unknown>>>({
    queryKey: ['admin', 'orders', params],
    queryFn: () => api(buildQuery('/admin/orders', params)),
  })
}

export function useDisputes(params: TableQueryParams = {}) {
  return useQuery<PaginatedResponse<Record<string, unknown>>>({
    queryKey: ['admin', 'disputes', params],
    queryFn: () => api(buildQuery('/admin/disputes', params)),
  })
}

export function useResolveDispute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; resolution: string; refund_amount?: number }) =>
      api(`/admin/disputes/${id}/resolve`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'disputes'] })
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })
}

export function useUsers(params: TableQueryParams = {}) {
  return useQuery<PaginatedResponse<Record<string, unknown>>>({
    queryKey: ['admin', 'users', params],
    queryFn: () => api(buildQuery('/admin/users', params)),
  })
}

export function useSuspendUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; reason: string; is_permanent: boolean }) =>
      api(`/admin/users/${id}/suspend`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export function useReviews(params: TableQueryParams = {}) {
  return useQuery<PaginatedResponse<Record<string, unknown>>>({
    queryKey: ['admin', 'reviews', params],
    queryFn: () => api(buildQuery('/admin/reviews/flagged', params)),
  })
}

export function useModerateReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; action: string; reason?: string }) =>
      api(`/admin/reviews/${id}/moderate`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reviews'] }),
  })
}

export function useAnalytics() {
  return useQuery<AnalyticsData>({
    queryKey: ['admin', 'analytics'],
    queryFn: async () => (await api<{ data: AnalyticsData }>('/admin/analytics')).data,
    staleTime: 300_000,
  })
}

export function useConfig() {
  return useQuery<ConfigData>({
    queryKey: ['admin', 'config'],
    queryFn: async () => (await api<{ data: ConfigData }>('/admin/config')).data,
    staleTime: 600_000,
  })
}

export function useUpdateConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<ConfigData>) =>
      api('/admin/config', { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'config'] }),
  })
}
