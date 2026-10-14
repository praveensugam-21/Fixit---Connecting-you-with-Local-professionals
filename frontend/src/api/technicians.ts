import { apiClient } from './client'
import type {
  EarningsSummary,
  Location,
  RateCard,
  Review,
  TechnicianNearby,
  TechnicianProfile,
  VerificationStatus,
} from '../types'

export interface TechnicianProfileInput {
  bio?: string
  years_experience?: number
  service_radius_km?: number
  address_label?: string
  location: Location
}

export interface RateCardInput {
  category_id: string
  call_out_fee: number
  hourly_rate: number
  currency?: string
}

export const techniciansApi = {
  async nearby(params: {
    lat: number
    lng: number
    radius_km?: number
    category_id?: string
  }): Promise<TechnicianNearby[]> {
    const { data } = await apiClient.get<TechnicianNearby[]>('/technicians/nearby', { params })
    return data
  },
  async getById(id: string): Promise<TechnicianProfile> {
    const { data } = await apiClient.get<TechnicianProfile>(`/technicians/${id}`)
    return data
  },
  async getMyProfile(): Promise<TechnicianProfile> {
    const { data } = await apiClient.get<TechnicianProfile>('/technicians/me')
    return data
  },
  async myEarnings(): Promise<EarningsSummary> {
    const { data } = await apiClient.get<EarningsSummary>('/technicians/me/earnings')
    return data
  },
  async createMyProfile(payload: TechnicianProfileInput): Promise<TechnicianProfile> {
    const { data } = await apiClient.post<TechnicianProfile>('/technicians/me', payload)
    return data
  },
  async updateMyProfile(payload: Partial<TechnicianProfileInput>): Promise<TechnicianProfile> {
    const { data } = await apiClient.patch<TechnicianProfile>('/technicians/me', payload)
    return data
  },
  async addRateCard(payload: RateCardInput): Promise<RateCard> {
    const { data } = await apiClient.post<RateCard>('/technicians/me/rate-cards', payload)
    return data
  },
  async reviews(technicianId: string): Promise<Review[]> {
    const { data } = await apiClient.get<Review[]>(`/technicians/${technicianId}/reviews`)
    return data
  },
  async listPending(): Promise<TechnicianProfile[]> {
    const { data } = await apiClient.get<TechnicianProfile[]>('/technicians/pending')
    return data
  },
  async setVerification(
    technicianId: string,
    verification_status: VerificationStatus,
  ): Promise<TechnicianProfile> {
    const { data } = await apiClient.patch<TechnicianProfile>(
      `/technicians/${technicianId}/verification`,
      null,
      { params: { verification_status } },
    )
    return data
  },
}
