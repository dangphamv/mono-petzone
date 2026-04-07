export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

export type CancellationPolicy = 'flexible' | 'moderate' | 'strict'

export interface Provider {
  id: string
  user_id: string
  business_name: string
  description?: string
  license_number?: string
  license_photos: string[]
  address: string
  latitude: number
  longitude: number
  phone?: string
  facility_photos: string[]
  certification_photos: string[]
  accepted_species: string[]
  weight_limit_min_kg?: number
  weight_limit_max_kg?: number
  cancellation_policy: CancellationPolicy
  verification_status: VerificationStatus
  rating_average: number
  rating_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RoomType {
  id: string
  provider_id: string
  name: string
  description?: string
  capacity: number
  price_per_night: number
  photos: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AddOnService {
  id: string
  provider_id: string
  name: string
  description?: string
  price: number
  price_type: 'per_night' | 'per_booking' | 'per_pet'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProviderAvailability {
  id: string
  provider_id: string
  room_type_id: string
  date: string
  available_slots: number
  booked_slots: number
  is_blocked: boolean
}
