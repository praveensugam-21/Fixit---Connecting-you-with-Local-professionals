import { apiClient } from './client'
import type { AuthTokens, User, UserRole } from '../types'

export interface SignupPayload {
  email: string
  full_name: string
  phone?: string
  password: string
  role: UserRole
}

export interface LoginPayload {
  email: string
  password: string
}

export const authApi = {
  async signup(payload: SignupPayload): Promise<AuthTokens> {
    const { data } = await apiClient.post<AuthTokens>('/auth/signup', payload)
    return data
  },
  async login(payload: LoginPayload): Promise<AuthTokens> {
    const { data } = await apiClient.post<AuthTokens>('/auth/login', payload)
    return data
  },
  async loginWithGoogle(idToken: string): Promise<AuthTokens> {
    const { data } = await apiClient.post<AuthTokens>('/auth/google', { id_token: idToken })
    return data
  },
  async me(): Promise<User> {
    const { data } = await apiClient.get<User>('/users/me')
    return data
  },
}
