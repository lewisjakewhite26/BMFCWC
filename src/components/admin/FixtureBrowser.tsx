import { useMemo, useState } from 'react'
import { CountryFlag } from '../match/CountryFlag'
import { formatKickoffLocal } from '../../lib/scoring'
import { fixtureHasPlaceholderTeams } from '../../lib/knockoutFixtures'
import type { Fixture, GameDay } from '../../types'

interface FixtureBrowserProps {
  fixtures: Fixture[]
  gameDays: GameDay[]
}

function scoreLabel(fixture: Fixture): string {
  if (fixture.home_score !== null && fixture.away_score !== null) {
    return `${fixture.home_score}–${fixture.away_score}`
  }
  return '—'
}

export function FixtureBrowser({ fixtures, gameDays }: FixtureBrowserProps) {
  const [matchday, setMatchday] = useState<number | 'all'>('all')
  const [placeholdersOnly, setPlaceholdersOnly] = useState(false)

  const filtered = useMemo(() => {
    let list = [...fixtures].sort(
      (a, b) => new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime()
    )
    if (matchday !== 'all') {
      list = list.filter((f) => f.game_day === matchday)
    }
    if (placeholdersOnly) {
      list = list.filter(fixtureHasPlaceholderTeams)
    }
    return list
  }, [fixtures, matchday, placeholdersOnly])

  const placeholderCount = fixtures.filter(fixtureHasPlaceholderTeams).length

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <select
          value={matchday}
          onChange={(e) => {
            const v = e.target.value
            setMatchday(v === 'all' ? 'all' : Number(v))
          }}
          className="input-field text-sm py-2 flex-1"
        >
          <option value="all">All matchdays</option>
          {gameDays.map((gd) => (
            <option key={gd.id} value={gd.game_day}>
              {gd.label.replace(/Game Day/gi, 'Matchday')}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 shrink-0 cursor-pointer">
          <input
            type="checkbox"
            checked={placeholdersOnly}
            onChange={(e) => setPlaceholdersOnly(e.target.checked)}
            className="rounded border-brand-blue/30"
          />
          Knockout placeholders only
          {placeholderCount > 0 && (
            <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-pill">
              {placeholderCount}
            </span>
          )}
        </label>
      </div>

      <p className="text-xs text-gray-500">
        {filtered.length} fixture{filtered.length === 1 ? '' : 's'}
        {matchday === 'all' ? ' across the tournament' : ''}
      </p>

      {filtered.length === 0 ? (
        <div className="admin-inner-card p-6 text-center text-gray-500 text-sm">
          No fixtures match this filter.
        </div>
      ) : (
        <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
          {filtered.map((fixture) => {
            const hasPlaceholder = fixtureHasPlaceholderTeams(fixture)
            const scored = fixture.home_score !== null && fixture.away_score !== null

            return (
              <div
                key={fixture.id}
                className={`admin-inner-card px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm min-w-0 ${
                  hasPlaceholder ? 'ring-1 ring-amber-200/80' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <CountryFlag flag={fixture.home_flag} name={fixture.home_team} size="sm" />
                  <span className="text-gray-400 text-xs shrink-0">vs</span>
                  <CountryFlag flag={fixture.away_flag} name={fixture.away_team} size="sm" />
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 sm:justify-end">
                  <span className="font-mono font-semibold text-brand-navy tabular-nums">
                    {scoreLabel(fixture)}
                  </span>
                  <span>{formatKickoffLocal(fixture.kickoff_utc)}</span>
                  <span className="hidden sm:inline">· {fixture.venue}</span>
                  <span className="capitalize">
                    MD{fixture.game_day}
                    {fixture.group_name ? ` · Grp ${fixture.group_name}` : ''}
                  </span>
                  {hasPlaceholder && (
                    <span className="text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-pill font-medium">
                      Placeholder
                    </span>
                  )}
                  {scored && !hasPlaceholder && (
                    <span className="text-emerald-600 font-medium">Scored</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
