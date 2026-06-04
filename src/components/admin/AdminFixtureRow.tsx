import { useState } from 'react'
import toast from 'react-hot-toast'
import { ScoreInput } from '../match/ScoreInput'
import { CountryFlag } from '../match/CountryFlag'
import { formatKickoffLocal } from '../../lib/scoring'
import type { Fixture } from '../../types'

interface AdminFixtureRowProps {
  fixture: Fixture
  onSubmitResult: (fixtureId: number, home: number, away: number) => Promise<void>
}

export function AdminFixtureRow({ fixture, onSubmitResult }: AdminFixtureRowProps) {
  const [homeScore, setHomeScore] = useState<number | ''>(fixture.home_score ?? '')
  const [awayScore, setAwayScore] = useState<number | ''>(fixture.away_score ?? '')
  const [loading, setLoading] = useState(false)

  const hasResult = fixture.home_score !== null && fixture.away_score !== null

  const handleSubmit = async () => {
    if (homeScore === '' || awayScore === '') {
      toast.error('Enter both scores')
      return
    }

    setLoading(true)
    try {
      await onSubmitResult(fixture.id, homeScore as number, awayScore as number)
      toast.success('Score saved and points updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to confirm score')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${hasResult ? 'ring-1 ring-emerald-300/50' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <CountryFlag flag={fixture.home_flag} name={fixture.home_team} size="sm" />
          <span className="text-gray-400 text-sm">vs</span>
          <CountryFlag flag={fixture.away_flag} name={fixture.away_team} size="sm" />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {formatKickoffLocal(fixture.kickoff_utc)} · {fixture.city}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <ScoreInput value={homeScore} onChange={setHomeScore} />
        <span className="text-gray-400">—</span>
        <ScoreInput value={awayScore} onChange={setAwayScore} />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary text-sm py-2 px-5 disabled:opacity-50"
        >
          {loading ? '...' : hasResult ? 'Update' : 'Confirm Score'}
        </button>
      </div>

      {hasResult && (
        <span className="text-xs text-emerald-600 font-medium shrink-0">✓ Scored</span>
      )}
    </div>
  )
}
