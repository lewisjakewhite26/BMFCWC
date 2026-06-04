import { MatchScoreLine } from './MatchScoreLine'
import { PointsBadge } from './PointsBadge'
import { formatKickoffLocal, getStageLabel } from '../../lib/scoring'
import type { Fixture, Prediction } from '../../types'

interface HistoryMatchCardProps {
  fixture: Fixture
  prediction?: Prediction
}

function outcomeStyles(points: number | undefined, scored: boolean) {
  if (!scored || points === undefined) {
    return {
      card: 'glass-card',
      accent: '',
      label: null as string | null,
      labelClass: '',
    }
  }
  if (points === 10) {
    return {
      card: 'bg-emerald-50/95 border border-emerald-200/80 ring-1 ring-emerald-100 shadow-sm',
      accent: 'bg-emerald-500',
      label: 'Exact score',
      labelClass: 'text-emerald-700 bg-emerald-100/80 border-emerald-200',
    }
  }
  if (points === 5) {
    return {
      card: 'bg-brand-blue/[0.04] border border-brand-blue/15 ring-1 ring-brand-blue/[0.06]',
      accent: 'bg-brand-blue/45',
      label: 'Correct result',
      labelClass: 'text-brand-blue bg-brand-blue/10 border-brand-blue/20',
    }
  }
  return {
    card: 'bg-gray-50/70 border border-gray-200/90 opacity-90',
    accent: 'bg-gray-300/50',
    label: 'No points',
    labelClass: 'text-gray-400 bg-gray-100/40 border-gray-200/60',
  }
}

export function HistoryMatchCard({ fixture, prediction }: HistoryMatchCardProps) {
  const hasResult = fixture.home_score !== null && fixture.away_score !== null
  const scored = hasResult && !!prediction
  const points = scored ? prediction.points_awarded : undefined
  const style = outcomeStyles(points, scored)

  const stageLabel = getStageLabel(fixture.stage)
  const fullStageLabel = fixture.group_name
    ? `${stageLabel} · Group ${fixture.group_name}`
    : stageLabel
  const mobileStageLabel = fixture.group_name ? `Group ${fixture.group_name}` : stageLabel

  return (
    <div className={`relative p-4 sm:p-5 rounded-2xl transition-all duration-300 ${style.card}`}>
      {style.accent && (
        <div
          className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${style.accent}`}
          aria-hidden
        />
      )}

      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="min-w-0 flex-1 text-[11px] sm:text-xs text-gray-500 uppercase tracking-wider font-medium leading-snug">
          <span className="sm:hidden">{mobileStageLabel}</span>
          <span className="hidden sm:inline">{fullStageLabel}</span>
        </span>
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {style.label && (
            <span className={`text-[9px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-pill border whitespace-nowrap ${style.labelClass}`}>
              {style.label}
            </span>
          )}
          {scored && <PointsBadge points={prediction.points_awarded} size="xs" />}
        </div>
      </div>

      <MatchScoreLine
        homeFlag={fixture.home_flag}
        homeTeam={fixture.home_team}
        awayFlag={fixture.away_flag}
        awayTeam={fixture.away_team}
        homeScore={prediction?.predicted_home ?? ''}
        awayScore={prediction?.predicted_away ?? ''}
      />

      {hasResult && (
        <p className="text-center text-xs text-brand-blue font-medium mt-3 font-mono">
          Result: {fixture.home_score} — {fixture.away_score}
        </p>
      )}

      <p className="text-center text-[11px] sm:text-xs text-gray-500 mt-2 leading-relaxed">
        {formatKickoffLocal(fixture.kickoff_utc)}
      </p>

      {!prediction && hasResult && (
        <p className="text-center text-xs text-gray-400 mt-2 italic">No prediction entered</p>
      )}
    </div>
  )
}
