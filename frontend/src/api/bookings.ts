import { apiClient } from './client'
import type { Booking, BookingStatus, Location, Message, Review } from '../types'

export interface BookingCreateInput {
  technician_id: string
  category_id: string
  description: string
  photo_urls?: string[]
  address_label: string
  location: Location
  scheduled_at?: string | null
}

export const bookingsApi = {
  async create(payload: BookingCreateInput): Promise<Booking> {
    const { data } = await apiClient.post<Booking>('/bookings', payload)
    return data
  },
  async listMine(): Promise<Booking[]> {
    const { data } = await apiClient.get<Booking[]>('/bookings')
    return data
  },
  async getById(id: string): Promise<Booking> {
    const { data } = await apiClient.get<Booking>(`/bookings/${id}`)
    return data
  },
  async submitQuote(id: string, quoted_price: number): Promise<Booking> {
    const { data } = await apiClient.post<Booking>(`/bookings/${id}/quote`, { quoted_price })
    return data
  },
  async updateStatus(id: string, status: BookingStatus, cancellation_reason?: string): Promise<Booking> {
    const { data } = await apiClient.patch<Booking>(`/bookings/${id}/status`, { status, cancellation_reason })
    return data
  },
  async listMessages(id: string): Promise<Message[]> {
    const { data } = await apiClient.get<Message[]>(`/bookings/${id}/messages`)
    return data
  },
  async sendMessage(id: string, body: string): Promise<Message> {
    const { data } = await apiClient.post<Message>(`/bookings/${id}/messages`, { body })
    return data
  },
  async leaveReview(id: string, rating: number, comment?: string): Promise<Review> {
    const { data } = await apiClient.post<Review>(`/bookings/${id}/reviews`, { rating, comment })
    return data
  },
}
