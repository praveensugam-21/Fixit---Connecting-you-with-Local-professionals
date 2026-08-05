export type UserRole = 'customer' | 'technician' | 'admin'

export interface User {
  id: string
  email: string
  full_name: string
  phone: string | null
  role: UserRole
  is_active: boolean
  phone_verified: boolean
  created_at: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface Location {
  lat: number
  lng: number
}

export type VerificationStatus = 'pending' | 'approved' | 'rejected'

export interface ServiceCategory {
  id: string
  name: string
  slug: string
  icon: string | null
}

export interface RateCard {
  id: string
  category_id: string
  call_out_fee: number
  hourly_rate: number
  currency: string
  category: ServiceCategory
}

export interface TechnicianProfile {
  id: string
  user_id: string
  full_name: string
  bio: string | null
  years_experience: number | null
  service_radius_km: number
  address_label: string | null
  verification_status: VerificationStatus
  avg_rating: number
  rating_count: number
  location: Location | null
  rate_cards: RateCard[]
}

export interface TechnicianNearby {
  id: string
  full_name: string
  avg_rating: number
  rating_count: number
  verification_status: VerificationStatus
  service_radius_km: number
  distance_km: number
  location: Location
}

export type BookingStatus =
  | 'requested'
  | 'accepted'
  | 'quoted'
  | 'quote_approved'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed'

export interface Booking {
  id: string
  customer_id: string
  technician_id: string
  category_id: string
  status: BookingStatus
  description: string
  photo_urls: string[]
  address_label: string
  location: Location
  scheduled_at: string | null
  quoted_price: number | null
  final_price: number | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  booking_id: string
  customer_id: string
  technician_id: string
  rating: number
  comment: string | null
  created_at: string
}

export interface Message {
  id: string
  booking_id: string
  sender_id: string
  body: string
  created_at: string
}
