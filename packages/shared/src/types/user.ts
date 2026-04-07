export type UserRole = 'owner' | 'provider' | 'admin'

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
