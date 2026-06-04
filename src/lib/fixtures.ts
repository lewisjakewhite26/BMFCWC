import { supabase } from './supabase'
import {
  isDevBypassSession,
  MOCK_GAME_DAYS,
  MOCK_FIXTURES,
  getMockFixturesByGameDay,
  getMockOpenGameDay,
} from './devBypass'
import type { User, Fixture, GameDay } from '../types'

const STORAGE_KEY = 'bmfc_session'

function getSessionUser(): User | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored) as User
  } catch {
    return null
  }
}

function inDevBypass(): boolean {
  return isDevBypassSession(getSessionUser())
}

export async function fetchGameDays(): Promise<GameDay[]> {
  if (inDevBypass()) return MOCK_GAME_DAYS

  const { data, error } = await supabase
    .from('game_days')
    .select('*')
    .order('game_day')

  if (error) throw error
  return data ?? []
}

export async function fetchFixturesByGameDay(gameDay: number): Promise<Fixture[]> {
  if (inDevBypass()) return getMockFixturesByGameDay(gameDay)

  const { data, error } = await supabase
    .from('fixtures')
    .select('*')
    .eq('game_day', gameDay)
    .order('kickoff_utc')

  if (error) throw error
  return data ?? []
}

export async function fetchAllFixtures(): Promise<Fixture[]> {
  if (inDevBypass()) return MOCK_FIXTURES

  const { data, error } = await supabase
    .from('fixtures')
    .select('*')
    .order('kickoff_utc')

  if (error) throw error
  return data ?? []
}

export async function fetchOpenGameDay(): Promise<GameDay | null> {
  if (inDevBypass()) return getMockOpenGameDay()

  const { data, error } = await supabase
    .from('game_days')
    .select('*')
    .eq('status', 'open')
    .maybeSingle()

  if (error) throw error
  return data
}

export async function lockExpiredFixtures(): Promise<void> {
  if (inDevBypass()) return
  await supabase.rpc('lock_expired_fixtures')
}
