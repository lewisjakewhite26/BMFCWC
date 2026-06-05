import { createContext, useContext } from 'react'
import type { User } from '../types'

export interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, passcode: string) => Promise<void>
  signup: (username: string, displayName: string, passcode: string) => Promise<void>
  devBypassLogin: (asAdmin?: boolean) => void
  logout: () => void
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

export const STORAGE_KEY = 'bmfc_session'

export function loadSession(): User | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored) as User
  } catch {
    return null
  }
}

export function saveSession(user: User | null) {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
