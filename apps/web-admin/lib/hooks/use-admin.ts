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

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api('/admin/dashboard'),
  })
}

export function useProviders(page = 1) {
  return useQuery<PaginatedResponse<Record<string, unknown>>>({
    queryKey: ['admin', 'providers', page],
    queryFn: () => api(`/admin/providers?page=${page}&limit=20`),
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

export function useOrders(page = 1) {
  return useQuery<PaginatedResponse<Record<string, unknown>>>({
    queryKey: ['admin', 'orders', page],
    queryFn: () => api(`/admin/orders?page=${page}&limit=20`),
  })
}

export function useDisputes(page = 1) {
  return useQuery<PaginatedResponse<Record<string, unknown>>>({
    queryKey: ['admin', 'disputes', page],
    queryFn: () => api(`/admin/disputes?page=${page}&limit=20`),
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

export function useUsers(page = 1) {
  return useQuery<PaginatedResponse<Record<string, unknown>>>({
    queryKey: ['admin', 'users', page],
    queryFn: () => api(`/admin/users?page=${page}&limit=20`),
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

export function useReviews(page = 1) {
  return useQuery<PaginatedResponse<Record<string, unknown>>>({
    queryKey: ['admin', 'reviews', page],
    queryFn: () => api(`/admin/reviews/flagged?page=${page}&limit=20`),
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
    queryFn: () => api('/admin/analytics'),
    staleTime: 300_000,
  })
}

export function useConfig() {
  return useQuery<ConfigData>({
    queryKey: ['admin', 'config'],
    queryFn: () => api('/admin/config'),
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
