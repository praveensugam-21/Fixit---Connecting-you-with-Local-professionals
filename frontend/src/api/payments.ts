import { apiClient } from './client'

export interface PaymentOrder {
  order_id: string
  amount: number
  currency: string
  key_id: string
  booking_id: string
}

export interface Payment {
  id: string
  booking_id: string
  provider: string
  provider_ref: string | null
  amount: number
  currency: string
  status: 'pending' | 'authorized' | 'captured' | 'refunded' | 'failed'
  captured_at: string | null
  created_at: string
}

export interface VerifyPayload {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export const paymentsApi = {
  async createOrder(bookingId: string): Promise<PaymentOrder> {
    const { data } = await apiClient.post<PaymentOrder>(`/payments/${bookingId}/order`)
    return data
  },
  async verify(bookingId: string, payload: VerifyPayload): Promise<Payment> {
    const { data } = await apiClient.post<Payment>(`/payments/${bookingId}/verify`, payload)
    return data
  },
  async get(bookingId: string): Promise<Payment | null> {
    const { data } = await apiClient.get<Payment | null>(`/payments/${bookingId}`)
    return data
  },
}
