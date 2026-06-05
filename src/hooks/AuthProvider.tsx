import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getAuthErrorMessage } from '../lib/authErrors'
import { DEV_USER, DEV_ADMIN, isDevBypassEnabled, isDevBypassSession } from '../lib/devBypass'
import type { User } from '../types'
import { AuthContext, loadSession, saveSession } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(loadSession)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const session = loadSession()
    if (!session) {
      setUser(null)
      return
    }

    if (isDevBypassSession(session)) {
      setUser(session)
      return
    }

    const { data, error } = await supabase.rpc('get_session_user', {
      p_user_id: session.id,
      p_session_token: session.session_token,
    })

    if (error || !data) {
      saveSession(null)
      setUser(null)
      return
    }

    const updated = data as User
    saveSession(updated)
    setUser(updated)
  }, [])

  useEffect(() => {
    refreshUser().finally(() => setLoading(false))
  }, [refreshUser])

  const login = async (username: string, passcode: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Sign-in is unavailable — Supabase is not configured for this deployment.')
    }

    const { data, error } = await supabase.rpc('login_user', {
      p_username: username,
      p_passcode: passcode,
    })

    if (error) {
      throw new Error(getAuthErrorMessage(error, 'Invalid username or passcode'))
    }
    if (!data) throw new Error('Invalid username or passcode')

    const userData = data as User
    saveSession(userData)
    setUser(userData)
  }

  const signup = async (username: string, displayName: string, passcode: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Sign-up is unavailable — Supabase is not configured for this deployment.')
    }

    const { data, error } = await supabase.rpc('register_user', {
      p_username: username,
      p_display_name: displayName,
      p_passcode: passcode,
    })

    if (error) {
      throw new Error(getAuthErrorMessage(error, 'Signup failed'))
    }
    if (!data) throw new Error('Signup failed — no account was returned')

    const userData = data as User
    saveSession(userData)
    setUser(userData)
  }

  const logout = () => {
    saveSession(null)
    setUser(null)
    navigate('/', { replace: true })
  }

  const devBypassLogin = (asAdmin = false) => {
    if (!isDevBypassEnabled()) return
    const devUser = asAdmin ? DEV_ADMIN : DEV_USER
    saveSession(devUser)
    setUser(devUser)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, devBypassLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}
