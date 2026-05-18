'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '../api'
import { MOCK_DISPUTES, MOCK_REVIEWS } from '../mock-data'

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

export interface TopInvoice {
  id: string
  order_number: string
  total_price: number
  status: string
  created_at: string
  provider_name?: string | null
  owner_name?: string | null
}

export interface TopSellingProvider {
  id: string
  business_name: string
  revenue: number
  order_count: number
}

export interface TopReviewedProvider {
  id: string
  business_name: string
  rating_average: number
  rating_count: number
}

interface AnalyticsData {
  period: { month: string | null }
  orders_by_status: { status: string; count: number }[]
  total_revenue: number
  top_providers: { id: string; business_name: string; rating_average: number; rating_count: number }[]
  top_invoices: TopInvoice[]
  top_selling_providers: TopSellingProvider[]
  top_reviewed_providers: TopReviewedProvider[]
}

interface ConfigData {
  commission_rate: number
  commission_rate_v1?: number
  auto_confirm_hours: number
  payment_timeout_hours: number
  payments_v2_enabled?: boolean
  vietqr_enabled?: boolean
  momo_enabled?: boolean
  cash_enabled?: boolean
}

export interface TableQueryParams {
  page?: number
  limit?: number
  search?: string
  filters?: Record<string, string[]>
  enabled?: boolean
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

function pickQueryParams({ enabled: _e, ...rest }: TableQueryParams): TableQueryParams {
  return rest
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
    mutationFn: async ({ id, ...body }: { id: string; status: string; notes?: string }) => {
      try {
        return await api(`/admin/providers/${id}/verify`, { method: 'PATCH', body: JSON.stringify(body) })
      } catch (err: any) {
        // If API is not available, simulate success for development
        if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
          return { success: true, mock: true }
        }
        throw err
      }
    },
    onSuccess: () => {
      toast.success('Provider verification updated')
      qc.invalidateQueries({ queryKey: ['admin', 'providers'] })
      qc.invalidateQueries({ queryKey: ['admin', 'provider'] })
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
    onError: (err: Error) => {
      toast.error(`Error: ${err.message}`)
    },
  })
}

export interface CreateProviderBody {
  user_id?: string
  new_owner?: {
    full_name: string
    email?: string
    phone?: string
  }
  business_name: string
  address: string
  description?: string
  license_number?: string
  phone?: string
  latitude?: number
  longitude?: number
  accepted_species?: ('dog' | 'cat' | 'other')[]
  weight_limit_min_kg?: number
  weight_limit_max_kg?: number
  cancellation_policy?: 'flexible' | 'moderate' | 'strict'
}

export function useCreateProvider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateProviderBody) =>
      api<{ data: Record<string, unknown> }>('/admin/providers', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success('Provider created')
      qc.invalidateQueries({ queryKey: ['admin', 'providers'] })
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  })
}

export interface UpdateProviderBody {
  business_name?: string
  description?: string
  license_number?: string
  address?: string
  phone?: string
  accepted_species?: ('dog' | 'cat' | 'other')[]
  weight_limit_min_kg?: number | null
  weight_limit_max_kg?: number | null
  cancellation_policy?: 'flexible' | 'moderate' | 'strict'
  is_active?: boolean
}

export function useUpdateProvider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & UpdateProviderBody) =>
      api(`/admin/providers/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success('Provider updated')
      qc.invalidateQueries({ queryKey: ['admin', 'providers'] })
      qc.invalidateQueries({ queryKey: ['admin', 'provider'] })
    },
    onError: (err: Error) => {
      toast.error(`Error: ${err.message}`)
    },
  })
}

export function useOrders(params: TableQueryParams = {}) {
  const queryParams = pickQueryParams(params)
  return useQuery<PaginatedResponse<Record<string, unknown>>>({
    queryKey: ['admin', 'orders', queryParams],
    queryFn: () => api(buildQuery('/admin/orders', queryParams)),
    enabled: params.enabled !== false,
  })
}

export function useOrderDetail(id: string) {
  return useQuery<Record<string, unknown>>({
    queryKey: ['admin', 'order', id],
    queryFn: async () => (await api<{ data: Record<string, unknown> }>(`/admin/orders/${id}`)).data,
    enabled: !!id,
  })
}

export interface CreateOrderBody {
  owner_id: string
  provider_id: string
  room_type_id: string
  pet_ids: string[]
  check_in_date: string
  check_out_date: string
  add_on_ids: string[]
  special_notes?: string
  daily_status_report: boolean
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateOrderBody) =>
      api<{ data: Record<string, unknown> }>('/admin/orders', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] })
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })
}

export function useCancelOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api(`/admin/orders/${id}/cancel`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
    onSuccess: (_data, { id }) => {
      toast.success('Order cancelled')
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] })
      qc.invalidateQueries({ queryKey: ['admin', 'order', id] })
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
    onError: (err: Error) => {
      toast.error(`Cancel failed: ${err.message}`)
    },
  })
}

export function useSendOrderMessage() {
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      api(`/admin/orders/${id}/message`, { method: 'POST', body: JSON.stringify({ message }) }),
  })
}

export function useProviderRooms(providerId: string | undefined) {
  return useQuery<Record<string, unknown>[]>({
    queryKey: ['admin', 'provider-rooms', providerId],
    queryFn: async () => (await api<{ data: Record<string, unknown>[] }>(`/admin/providers/${providerId}/rooms`)).data,
    enabled: !!providerId,
  })
}

export function useProviderAddOns(providerId: string | undefined) {
  return useQuery<Record<string, unknown>[]>({
    queryKey: ['admin', 'provider-addons', providerId],
    queryFn: async () => (await api<{ data: Record<string, unknown>[] }>(`/admin/providers/${providerId}/addons`)).data,
    enabled: !!providerId,
  })
}

export function useDisputes(params: TableQueryParams = {}) {
  return useQuery<PaginatedResponse<Record<string, unknown>>>({
    queryKey: ['admin', 'disputes', params],
    queryFn: async () => {
      try {
        return await api(buildQuery('/admin/disputes', params))
      } catch {
        // Return mock data if API is not available
        const { page = 1, limit = 20, search, filters } = params
        let filtered = [...MOCK_DISPUTES]
        if (search) {
          const q = search.toLowerCase()
          filtered = filtered.filter(d =>
            d.id.toLowerCase().includes(q) ||
            d.order_number.toLowerCase().includes(q) ||
            d.description.toLowerCase().includes(q)
          )
        }
        if (filters?.status?.length) {
          filtered = filtered.filter(d => filters.status.includes(d.status))
        }
        const start = (page - 1) * limit
        return {
          data: filtered.slice(start, start + limit),
          meta: { total: filtered.length, page, limit, totalPages: Math.ceil(filtered.length / limit) },
        }
      }
    },
  })
}

export function useCreateDispute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: {
      order_id: string
      opened_by_role: 'owner' | 'provider'
      description: string
      evidence_photos?: string[]
    }) => api('/admin/disputes', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success('Dispute created')
      qc.invalidateQueries({ queryKey: ['admin', 'disputes'] })
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
    onError: (err: Error) => {
      toast.error(`Error: ${err.message}`)
    },
  })
}

export function useResolveDispute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; resolution: string; refund_amount?: number }) => {
      try {
        return await api(`/admin/disputes/${id}/resolve`, { method: 'PATCH', body: JSON.stringify(body) })
      } catch (err: any) {
        if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
          return { success: true, mock: true }
        }
        throw err
      }
    },
    onSuccess: () => {
      toast.success('Dispute resolved successfully')
      qc.invalidateQueries({ queryKey: ['admin', 'disputes'] })
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
    onError: (err: Error) => {
      toast.error(`Error: ${err.message}`)
    },
  })
}

export function useUsers(params: TableQueryParams = {}) {
  return useQuery<PaginatedResponse<Record<string, unknown>>>({
    queryKey: ['admin', 'users', params],
    queryFn: () => api(buildQuery('/admin/users', params)),
  })
}

export function useUserDetail(id: string) {
  return useQuery<Record<string, unknown>>({
    queryKey: ['admin', 'user', id],
    queryFn: async () => (await api<{ data: Record<string, unknown> }>(`/admin/users/${id}`)).data,
    enabled: !!id,
  })
}

export function useSuspendUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; reason: string; is_permanent: boolean }) => {
      try {
        return await api(`/admin/users/${id}/suspend`, { method: 'PATCH', body: JSON.stringify(body) })
      } catch (err: any) {
        if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
          return { success: true, mock: true }
        }
        throw err
      }
    },
    onSuccess: () => {
      toast.success('User suspended successfully')
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      qc.invalidateQueries({ queryKey: ['admin', 'user'] })
    },
  })
}

export function useReactivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      api(`/admin/users/${id}/reactivate`, {
        method: 'PATCH',
        body: JSON.stringify({ note }),
      }),
    onSuccess: () => {
      toast.success('User reactivated')
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      qc.invalidateQueries({ queryKey: ['admin', 'user'] })
    },
    onError: (err: Error) => {
      toast.error(`Error: ${err.message}`)
    },
  })
}

export function usePets(params: TableQueryParams = {}) {
  return useQuery<PaginatedResponse<Record<string, unknown>>>({
    queryKey: ['admin', 'pets', params],
    queryFn: () => api(buildQuery('/admin/pets', params)),
  })
}

export interface CreatePetBody {
  owner_id: string
  name: string
  species: 'dog' | 'cat' | 'other'
  gender: 'male' | 'female' | 'unknown'
  breed?: string
  date_of_birth?: string
  weight_kg?: number
  color?: string
  photos?: string[]
  is_neutered?: 'yes' | 'no' | 'unknown'
  temperament?: 'friendly' | 'shy' | 'aggressive' | 'normal'
  sociable_with_others?: 'yes' | 'no' | 'depends'
  special_needs_notes?: string
}

export type UpdatePetBody = Partial<Omit<CreatePetBody, 'owner_id'>> & { is_active?: boolean }

export function useCreatePet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreatePetBody) =>
      api<{ data: Record<string, unknown> }>('/admin/pets', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success('Pet created')
      qc.invalidateQueries({ queryKey: ['admin', 'pets'] })
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  })
}

export function useUpdatePet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & UpdatePetBody) =>
      api(`/admin/pets/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success('Pet updated')
      qc.invalidateQueries({ queryKey: ['admin', 'pets'] })
      qc.invalidateQueries({ queryKey: ['admin', 'pet'] })
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  })
}

export function usePetDetail(id: string) {
  return useQuery<Record<string, unknown>>({
    queryKey: ['admin', 'pet', id],
    queryFn: async () => (await api<{ data: Record<string, unknown> }>(`/admin/pets/${id}`)).data,
    enabled: !!id,
  })
}

export function useOwnerPets(ownerId: string | undefined) {
  return useQuery<PaginatedResponse<Record<string, unknown>>>({
    queryKey: ['admin', 'pets', 'by-owner', ownerId],
    queryFn: () => api(`/admin/pets?owner_id=${ownerId}&page=1&limit=100`),
    enabled: !!ownerId,
  })
}

export function useReviews(params: TableQueryParams = {}) {
  return useQuery<PaginatedResponse<Record<string, unknown>>>({
    queryKey: ['admin', 'reviews', params],
    queryFn: async () => {
      try {
        return await api(buildQuery('/admin/reviews/flagged', params))
      } catch {
        // Return mock data if API is not available
        const { page = 1, limit = 20, search, filters } = params
        let filtered = [...MOCK_REVIEWS] as Record<string, unknown>[]
        if (search) {
          const q = search.toLowerCase()
          filtered = filtered.filter(r =>
            (r.text as string)?.toLowerCase().includes(q) ||
            (r.provider_name as string)?.toLowerCase().includes(q)
          )
        }
        if (filters?.visibility?.length) {
          filtered = filtered.filter(r => {
            const vis = r.is_visible ? 'visible' : 'hidden'
            return filters.visibility.includes(vis)
          })
        }
        const start = (page - 1) * limit
        return {
          data: filtered.slice(start, start + limit),
          meta: { total: filtered.length, page, limit, totalPages: Math.ceil(filtered.length / limit) },
        }
      }
    },
  })
}

export function useModerateReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; action: string; reason?: string }) => {
      try {
        return await api(`/admin/reviews/${id}/moderate`, { method: 'PATCH', body: JSON.stringify(body) })
      } catch (err: any) {
        if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
          return { success: true, mock: true }
        }
        throw err
      }
    },
    onSuccess: () => {
      toast.success('Review moderated successfully')
      qc.invalidateQueries({ queryKey: ['admin', 'reviews'] })
    },
    onError: (err: Error) => {
      toast.error(`Error: ${err.message}`)
    },
  })
}

export function useAnalytics(params: { month?: string } = {}) {
  const { month } = params
  return useQuery<AnalyticsData>({
    queryKey: ['admin', 'analytics', month ?? 'lifetime'],
    queryFn: async () => {
      const path = month ? `/admin/analytics?month=${encodeURIComponent(month)}` : '/admin/analytics'
      return (await api<{ data: AnalyticsData }>(path)).data
    },
    staleTime: 300_000,
  })
}

export function useConfig() {
  return useQuery<ConfigData>({
    queryKey: ['admin', 'config'],
    queryFn: async () => {
      try {
        return (await api<{ data: ConfigData }>('/admin/config')).data
      } catch {
        // Return default config if API is not available
        return { commission_rate: 0.15, auto_confirm_hours: 4, payment_timeout_hours: 24, payments_v2_enabled: false }
      }
    },
    staleTime: 600_000,
  })
}

export function useUpdateConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Partial<ConfigData>) => {
      try {
        return await api('/admin/config', { method: 'PUT', body: JSON.stringify(body) })
      } catch (err: any) {
        if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
          // Simulate saving by updating the query cache directly
          qc.setQueryData(['admin', 'config'], (old: ConfigData | undefined) => ({
            ...old,
            ...body,
          }))
          return { success: true, mock: true }
        }
        throw err
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'config'] })
    },
    onError: (err: Error) => {
      // Surface field-specific Zod errors instead of generic "Validation failed"
      const e = err as Error & { errors?: Record<string, string[]> }
      if (e.errors && typeof e.errors === 'object') {
        const detail = Object.entries(e.errors)
          .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
          .join(' | ')
        toast.error(`${err.message} — ${detail}`)
      } else {
        toast.error(err.message)
      }
    },
  })
}

// ─────────────────────────── Bank transactions (reconciliation) ───────────────────────────

export interface BankTransactionRow {
  id: string
  source: string
  source_event_id: string | null
  bank_brand: string | null
  account_number: string
  amount: number | string
  content: string
  reference_code: string | null
  transfer_type: 'in' | 'out'
  occurred_at: string
  matched_payment_id: string | null
  matched_order_number: string | null
  matched_at: string | null
  raw_payload: Record<string, unknown>
  created_at: string
}

export function useUnmatchedBankTransactions(page = 1, limit = 20) {
  return useQuery<{ data: BankTransactionRow[]; pagination: { total: number; page: number; limit: number; total_pages: number } }>({
    queryKey: ['admin', 'bank-transactions', 'unmatched', page, limit],
    queryFn: async () => {
      return await api<{ data: BankTransactionRow[]; pagination: { total: number; page: number; limit: number; total_pages: number } }>(
        `/admin/payments/bank-transactions/unmatched?page=${page}&limit=${limit}`,
      )
    },
    staleTime: 30_000,
  })
}

export function useMatchBankTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ bankTxId, paymentId }: { bankTxId: string; paymentId: string }) => {
      return await api(`/admin/payments/bank-transactions/${bankTxId}/match`, {
        method: 'POST',
        body: JSON.stringify({ payment_id: paymentId }),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'bank-transactions'] })
      toast.success('Đã match giao dịch ngân hàng')
    },
    onError: (err: Error) => toast.error(`Lỗi: ${err.message}`),
  })
}

export function useRecordManualRefund() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      paymentId, amount, reason, proofUrl, note,
    }: { paymentId: string; amount: number; reason: string; proofUrl?: string; note?: string }) => {
      return await api(`/admin/payments/${paymentId}/record-manual-refund`, {
        method: 'POST',
        body: JSON.stringify({ amount, reason, proof_url: proofUrl, note }),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] })
      toast.success('Đã ghi nhận refund thủ công')
    },
    onError: (err: Error) => toast.error(`Lỗi: ${err.message}`),
  })
}
