import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { isEditableKnockoutFixture } from '../../lib/knockoutFixtures'
import type { Fixture } from '../../types'

interface KnockoutFixtureEditorProps {
  fixtures: Fixture[]
  devMode?: boolean
  onSaved?: () => void
}

export function KnockoutFixtureEditor({ fixtures, devMode = false, onSaved }: KnockoutFixtureEditorProps) {
  const { user } = useAuth()
  const knockoutFixtures = fixtures.filter(isEditableKnockoutFixture)

  if (knockoutFixtures.length === 0) {
    return (
      <div className="admin-inner-card p-6 text-center text-gray-500 text-sm">
        No open knockout fixtures to edit. Either teams are already set or the matchday has started.
      </div>
    )
  }

  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
      {knockoutFixtures.map((fixture) => (
        <KnockoutFixtureRow
          key={fixture.id}
          fixture={fixture}
          devMode={devMode}
          onSaved={onSaved}
          userId={user?.id}
          sessionToken={user?.session_token}
        />
      ))}
    </div>
  )
}

function KnockoutFixtureRow({
  fixture,
  devMode,
  onSaved,
  userId,
  sessionToken,
}: {
  fixture: Fixture
  devMode?: boolean
  onSaved?: () => void
  userId?: string
  sessionToken?: string
}) {
  const [homeTeam, setHomeTeam] = useState(fixture.home_team)
  const [awayTeam, setAwayTeam] = useState(fixture.away_team)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setHomeTeam(fixture.home_team)
    setAwayTeam(fixture.away_team)
  }, [fixture.home_team, fixture.away_team])

  const changed = homeTeam !== fixture.home_team || awayTeam !== fixture.away_team

  const handleSave = async () => {
    if (!userId || !sessionToken) return
    if (!homeTeam.trim() || !awayTeam.trim()) {
      toast.error('Enter both team names before saving')
      return
    }

    setSaving(true)
    try {
      if (devMode) {
        toast.success('Teams updated (preview only)')
        onSaved?.()
        return
      }

      const { error } = await supabase.rpc('admin_update_fixture_teams', {
        p_user_id: userId,
        p_session_token: sessionToken,
        p_fixture_id: fixture.id,
        p_home_team: homeTeam.trim(),
        p_away_team: awayTeam.trim(),
      })

      if (error) throw error
      toast.success('Fixture teams updated')
      onSaved?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-inner-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
          Matchday {fixture.game_day} · {fixture.stage.replace(/_/g, ' ')}
        </p>
        <p className="text-[11px] text-gray-400 font-mono shrink-0">#{fixture.id}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Home team</label>
          <input
            type="text"
            value={homeTeam}
            onChange={(e) => setHomeTeam(e.target.value)}
            className="input-field text-sm py-2.5"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Away team</label>
          <input
            type="text"
            value={awayTeam}
            onChange={(e) => setAwayTeam(e.target.value)}
            className="input-field text-sm py-2.5"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={!changed || saving}
        className="btn-secondary text-sm py-2.5 px-5 min-h-[44px] disabled:opacity-40"
      >
        {saving ? 'Saving…' : 'Save teams'}
      </button>
    </div>
  )
}
