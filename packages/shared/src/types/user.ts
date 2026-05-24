export type UserRole = 'owner' | 'provider' | 'admin' | 'staff'

export type AdminPermission =
  | 'orders:view' | 'orders:manage'
  | 'providers:view' | 'providers:manage'
  | 'disputes:view' | 'disputes:manage'
  | 'reviews:view' | 'reviews:manage'
  | 'users:view' | 'users:manage'
  | 'pets:view' | 'pets:manage'
  | 'dashboard:view'

export type UserStatus = 'active' | 'suspended' | 'banned' | 'pending_verification'

export type SocialProvider = 'google' | 'facebook' | 'apple' | 'zalo'

export interface UserProfile {
  id: string
  phone: string
  email?: string
  full_name: string
  avatar_url?: string
  role: UserRole
  status: UserStatus
  social_provider?: SocialProvider
  notification_preferences: Record<string, boolean>
  created_at: string
  updated_at: string
}
