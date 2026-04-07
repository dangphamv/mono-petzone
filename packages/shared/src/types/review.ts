export interface Review {
  id: string
  order_id: string
  owner_id: string
  provider_id: string
  rating_overall: number
  rating_cleanliness?: number
  rating_care_quality?: number
  rating_communication?: number
  rating_value?: number
  text?: string
  photos: string[]
  provider_response?: string
  provider_responded_at?: string
  is_visible: boolean
  hidden_reason?: string
  hidden_by?: string
  created_at: string
  updated_at: string
}
