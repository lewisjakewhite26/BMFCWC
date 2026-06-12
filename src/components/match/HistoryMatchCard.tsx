import { PointsBadge } from './PointsBadge'
import type { Fixture, Prediction } from '../../types'

interface HistoryMatchCardProps {
  fixture: Fixture
  prediction?: Prediction
}

function outcomeStyles(points: number | undefined, scored: boolean) {
  if (!scored || points === undefined) {
    return { card: 'bg-white/60 border border-gray-200/80', accent: '' }
  }
  if (points === 10) {
    return {
      card: 'bg-emerald-50/90 border border-emerald-200/70',
      accent: 'bg-emerald-500',
    }
  }
  if (points === 5) {
    return {
      card: 'bg-brand-blue/[0.05] border border-brand-blue/15',
      accent: 'bg-brand-blue/45',
    }
  }
  return {
    card: 'bg-gray-50/80 border border-gray-200/80',
    accent: 'bg-gray-300/60',
  }
}

export function HistoryMatchCard({ fixture, prediction }: HistoryMatchCardProps) {
  const hasResult = fixture.home_score !== null && fixture.away_score !== null
  const scored = hasResult && !!prediction
  const points = scored ? prediction.points_awarded : undefined
  const style = outcomeStyles(points, scored)

  const predicted =
    prediction != null ? `${prediction.predicted_home}–${prediction.predicted_away}` : '–'
  const actual = hasResult ? `${fixture.home_score}–${fixture.away_score}` : null

  return (
    <div className={`relative px-2.5 py-2 rounded-lg ${style.card}`}>
      {style.accent && (
        <div
          className={`absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full ${style.accent}`}
          aria-hidden
        />
      )}

      <div className="flex items-center gap-2 min-w-0 pl-1">
        <div className="min-w-0 flex-1 flex items-center gap-1 text-xs text-brand-navy leading-tight">
          <span className="truncate font-medium">{fixture.home_team}</span>
          <span className="font-mono font-bold tabular-nums shrink-0 text-[11px]">{predicted}</span>
          <span className="truncate font-medium">{fixture.away_team}</span>
        </div>

        {actual && (
          <span className="text-[10px] text-gray-500 font-mono tabular-nums shrink-0">{actual}</span>
        )}

        {scored ? (
          <PointsBadge points={prediction.points_awarded} size="xs" />
        ) : !prediction && hasResult ? (
          <span className="text-[10px] text-gray-400 italic shrink-0">No pick</span>
        ) : null}
      </div>
    </div>
  )
}
