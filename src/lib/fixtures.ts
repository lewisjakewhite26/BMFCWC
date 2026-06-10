import { supabase } from './supabase'
import {
  isDevBypassSession,
  MOCK_GAME_DAYS,
  MOCK_FIXTURES,
  getMockFixturesByGameDay,
} from './devBypass'
import { GROUP_STAGE_GAME_DAYS } from './matchdays'
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

export async function fetchGroupStageGameDays(): Promise<GameDay[]> {
  if (inDevBypass()) {
    return MOCK_GAME_DAYS.filter((g) => GROUP_STAGE_GAME_DAYS.includes(g.game_day as 1 | 2 | 3))
  }

  const { data, error } = await supabase
    .from('game_days')
    .select('*')
    .in('game_day', [...GROUP_STAGE_GAME_DAYS])
    .order('game_day')

  if (error) throw error
  return data ?? []
}

/** Open knockout matchday (4+), if any. Group stage uses fetchGroupStageGameDays. */
export async function fetchOpenGameDay(): Promise<GameDay | null> {
  if (inDevBypass()) {
    const knockout = MOCK_GAME_DAYS.find((g) => g.status === 'open' && g.game_day > 3)
    return knockout ?? null
  }

  const { data, error } = await supabase
    .from('game_days')
    .select('*')
    .eq('status', 'open')
    .gt('game_day', 3)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function fetchOpenGameDayNumbers(): Promise<number[]> {
  if (inDevBypass()) {
    return MOCK_GAME_DAYS.filter((g) => g.status === 'open').map((g) => g.game_day)
  }

  const { data, error } = await supabase
    .from('game_days')
    .select('game_day')
    .eq('status', 'open')
    .order('game_day')

  if (error) throw error
  return (data ?? []).map((row) => row.game_day)
}

export async function lockExpiredFixtures(): Promise<void> {
  if (inDevBypass()) return
  await supabase.rpc('lock_expired_fixtures')
}
