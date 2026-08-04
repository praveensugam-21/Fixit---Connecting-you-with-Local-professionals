import type { AuthTokens } from '../types'

const ACCESS_KEY = 'fixit.access_token'
const REFRESH_KEY = 'fixit.refresh_token'

export const tokenStorage = {
  get accessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY)
  },
  get refreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY)
  },
  save(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_KEY, tokens.access_token)
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token)
  },
  clear(): void {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}
