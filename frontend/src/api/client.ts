import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { AuthTokens } from '../types'
import { tokenStorage } from './tokenStorage'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.refreshToken
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }
  const { data } = await axios.post<AuthTokens>(
    `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
    { refresh_token: refreshToken },
  )
  tokenStorage.save(data)
  return data.access_token
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retried) {
      throw error
    }
    if (originalRequest.url?.includes('/auth/')) {
      throw error
    }

    originalRequest._retried = true
    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })
      const newAccessToken = await refreshPromise
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      tokenStorage.clear()
      window.location.assign('/login')
      throw refreshError
    }
  },
)
