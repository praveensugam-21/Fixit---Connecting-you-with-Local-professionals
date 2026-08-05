import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi, type LoginPayload, type SignupPayload } from '../api/auth'
import { tokenStorage } from '../api/tokenStorage'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<void>
  signup: (payload: SignupPayload) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    if (!tokenStorage.accessToken) {
      setUser(null)
      return
    }
    try {
      const me = await authApi.me()
      setUser(me)
    } catch {
      tokenStorage.clear()
      setUser(null)
    }
  }, [])

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false))
  }, [refreshUser])

  const login = useCallback(async (payload: LoginPayload) => {
    const tokens = await authApi.login(payload)
    tokenStorage.save(tokens)
    await refreshUser()
  }, [refreshUser])

  const signup = useCallback(async (payload: SignupPayload) => {
    const tokens = await authApi.signup(payload)
    tokenStorage.save(tokens)
    await refreshUser()
  }, [refreshUser])

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, login, signup, logout, refreshUser }),
    [user, isLoading, login, signup, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
