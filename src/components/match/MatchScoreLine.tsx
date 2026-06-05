import { useRef } from 'react'
import { CountryFlag } from './CountryFlag'
import { ScoreInput } from './ScoreInput'

interface MatchScoreLineProps {
  homeFlag: string | null
  homeTeam: string
  awayFlag: string | null
  awayTeam: string
  homeScore: number | ''
  awayScore: number | ''
  editable?: boolean
  awaiting?: boolean
  onHomeChange?: (value: number | '') => void
  onAwayChange?: (value: number | '') => void
}

function ScoreDisplay({ score }: { score: number | '' }) {
  return (
    <span className="w-7 sm:w-9 text-center text-xl sm:text-3xl font-mono font-bold text-brand-navy tabular-nums">
      {score !== '' ? score : '—'}
    </span>
  )
}

export function MatchScoreLine({
  homeFlag,
  homeTeam,
  awayFlag,
  awayTeam,
  homeScore,
  awayScore,
  editable = false,
  awaiting = false,
  onHomeChange,
  onAwayChange,
}: MatchScoreLineProps) {
  const homeInputRef = useRef<HTMLInputElement>(null)
  const awayInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex items-center gap-1 sm:gap-3 py-1">
      <div className="flex-1 min-w-[4.25rem] sm:min-w-0 overflow-hidden">
        <CountryFlag flag={homeFlag} name={homeTeam} size="sm" card />
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0 px-0.5">
        {editable && onHomeChange && onAwayChange ? (
          <>
            <ScoreInput
              ref={homeInputRef}
              value={homeScore}
              onChange={onHomeChange}
              onAdvance={() => awayInputRef.current?.focus({ preventScroll: true })}
              awaiting={awaiting}
              ariaLabel={`Predicted score for ${homeTeam}`}
            />
            <span className={`font-light text-lg sm:text-xl select-none ${awaiting ? 'text-brand-gold/40' : 'text-gray-400'}`}>
              —
            </span>
            <ScoreInput
              ref={awayInputRef}
              value={awayScore}
              onChange={onAwayChange}
              awaiting={awaiting}
              ariaLabel={`Predicted score for ${awayTeam}`}
            />
          </>
        ) : (
          <>
            <ScoreDisplay score={homeScore} />
            <span className="text-gray-400 font-light text-lg sm:text-xl select-none">—</span>
            <ScoreDisplay score={awayScore} />
          </>
        )}
      </div>

      <div className="flex-1 min-w-[4.25rem] sm:min-w-0 overflow-hidden flex justify-end">
        <CountryFlag flag={awayFlag} name={awayTeam} size="sm" align="right" card />
      </div>
    </div>
  )
}
