import { useState, useEffect, useCallback, useRef } from 'react'
import { MatchScoreLine, type MatchScoreLineHandle } from './MatchScoreLine'
import { PointsBadge } from './PointsBadge'
import { formatKickoffLocal, getStageLabel } from '../../lib/scoring'
import { FixtureLockCountdown } from './FixtureLockCountdown'
import { SaveStatusBadge, SAVE_SUCCESS_MS, type SavePhase } from './SaveFeedback'
import { hapticSaveSuccess } from '../../lib/haptics'
import type { Fixture, Prediction } from '../../types'

interface MatchCardProps {
  fixture: Fixture
  prediction?: Prediction
  locked?: boolean
  onSave?: (fixtureId: number, home: number, away: number) => Promise<void>
  onConfirmChange?: (fixtureId: number, confirmed: boolean) => void
  onRegisterFocus?: (focusHome: () => void) => (() => void) | void
  onAdvanceToNext?: () => void
}

export function MatchCard({
  fixture,
  prediction,
  locked = false,
  onSave,
  onConfirmChange,
  onRegisterFocus,
  onAdvanceToNext,
}: MatchCardProps) {
  const hasResult = fixture.home_score !== null && fixture.away_score !== null
  const editable = !locked && !!onSave && !hasResult

  const [homeScore, setHomeScore] = useState<number | ''>(prediction?.predicted_home ?? '')
  const [awayScore, setAwayScore] = useState<number | ''>(prediction?.predicted_away ?? '')
  const [confirmed, setConfirmed] = useState(() => !!prediction)
  const [savePhase, setSavePhase] = useState<SavePhase>('idle')
  const userHasEdited = useRef(false)
  const saveInFlight = useRef(false)
  const scoreLineRef = useRef<MatchScoreLineHandle>(null)

  useEffect(() => {
    if (!onRegisterFocus || !editable) return
    return onRegisterFocus(() => scoreLineRef.current?.focusHome()) ?? undefined
  }, [onRegisterFocus, editable])

  useEffect(() => {
    if (prediction) {
      setHomeScore(prediction.predicted_home)
      setAwayScore(prediction.predicted_away)
      if (!userHasEdited.current) {
        setConfirmed(true)
      }
    }
  }, [prediction])

  useEffect(() => {
    onConfirmChange?.(fixture.id, confirmed)
  }, [confirmed, fixture.id, onConfirmChange])

  const persist = useCallback(async (home: number, away: number) => {
    if (!onSave) throw new Error('Save unavailable')
    await onSave(fixture.id, home, away)
  }, [fixture.id, onSave])

  const tryAutoSubmit = useCallback(
    async (home: number, away: number) => {
      if (!editable || saveInFlight.current) return

      const unchanged =
        prediction?.predicted_home === home && prediction?.predicted_away === away

      if (unchanged) {
        setConfirmed(true)
        onAdvanceToNext?.()
        return
      }

      saveInFlight.current = true
      setSavePhase('loading')

      try {
        await persist(home, away)
        setSavePhase('success')
        setConfirmed(true)
        userHasEdited.current = false
        hapticSaveSuccess()

        window.setTimeout(() => {
          setSavePhase('idle')
          saveInFlight.current = false
          onAdvanceToNext?.()
        }, SAVE_SUCCESS_MS)
      } catch {
        setSavePhase('error')
        saveInFlight.current = false
        window.setTimeout(() => setSavePhase('idle'), 2200)
      }
    },
    [editable, prediction, persist, onAdvanceToNext]
  )

  const handleHomeChange = (value: number | '') => {
    userHasEdited.current = true
    setConfirmed(false)
    setHomeScore(value)
  }

  const handleAwayChange = (value: number | '') => {
    userHasEdited.current = true
    setConfirmed(false)
    setAwayScore(value)
  }

  useEffect(() => {
    if (!editable || !userHasEdited.current) return
    if (homeScore === '' || awayScore === '') return
    if (saveInFlight.current || savePhase !== 'idle') return

    const timer = window.setTimeout(() => {
      void tryAutoSubmit(homeScore as number, awayScore as number)
    }, 450)

    return () => window.clearTimeout(timer)
  }, [homeScore, awayScore, editable, savePhase, tryAutoSubmit])

  const scoresComplete = homeScore !== '' && awayScore !== ''
  const scoresChanged =
    prediction?.predicted_home !== homeScore || prediction?.predicted_away !== awayScore
  const isLockedIn = confirmed && scoresComplete && !scoresChanged && savePhase === 'idle'
  const isAwaitingPick = editable && !isLockedIn && savePhase === 'idle'
  const isSaving = savePhase === 'loading' || savePhase === 'success'

  const displayHome = editable ? homeScore : (prediction?.predicted_home ?? (homeScore !== '' ? homeScore : ''))
  const displayAway = editable ? awayScore : (prediction?.predicted_away ?? (awayScore !== '' ? awayScore : ''))

  return (
    <div
      className={`
        relative p-4 sm:p-5 rounded-2xl
        transition-[background-color,border-color,box-shadow,opacity] duration-300
        ${locked && !hasResult ? 'opacity-75 glass-card' : ''}
        ${!locked || hasResult ? (
          isLockedIn
            ? 'glass-card ring-1 ring-emerald-200/80'
            : isAwaitingPick || isSaving
              ? 'bg-gradient-to-r from-brand-gold/[0.07] to-white/65 border border-brand-gold/25 shadow-sm ring-1 ring-brand-gold/10'
              : 'glass-card'
        ) : ''}
      `}
    >
      {isAwaitingPick && (
        <div
          className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-brand-gold/45"
          aria-hidden
        />
      )}
      {isLockedIn && editable && (
        <div
          className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-emerald-500/70"
          aria-hidden
        />
      )}

      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-[11px] sm:text-xs text-gray-500 uppercase tracking-wider font-medium leading-snug">
          {getStageLabel(fixture.stage)}
          {fixture.group_name && ` · Group ${fixture.group_name}`}
        </span>
        <div className="flex items-center justify-end gap-1.5 shrink-0 min-h-[1.75rem]">
          <div className="w-7 h-7 flex items-center justify-center shrink-0">
            <SaveStatusBadge phase={savePhase} />
          </div>
          <div className="min-w-[5.5rem] flex justify-end">
            {savePhase === 'idle' && isAwaitingPick && !scoresComplete && (
              <span className="text-[10px] sm:text-xs font-medium text-brand-gold/90 bg-brand-gold/10 border border-brand-gold/20 px-2 py-0.5 rounded-pill whitespace-nowrap">
                Not yet entered
              </span>
            )}
            {savePhase === 'idle' && isLockedIn && editable && (
              <span className="text-[10px] sm:text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-pill whitespace-nowrap">
                Submitted
              </span>
            )}
          </div>
          {prediction && hasResult && <PointsBadge points={prediction.points_awarded} size="sm" />}
          {locked && !hasResult && (
            <span className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-1 whitespace-nowrap">
              <span aria-hidden>🔒</span> Locked
            </span>
          )}
        </div>
      </div>

      <MatchScoreLine
        ref={scoreLineRef}
        homeFlag={fixture.home_flag}
        homeTeam={fixture.home_team}
        awayFlag={fixture.away_flag}
        awayTeam={fixture.away_team}
        homeScore={displayHome}
        awayScore={displayAway}
        editable={editable}
        disabled={savePhase === 'loading'}
        awaiting={isAwaitingPick}
        onHomeChange={editable ? handleHomeChange : undefined}
        onAwayChange={editable ? handleAwayChange : undefined}
      />

      {editable && <FixtureLockCountdown kickoffUtc={fixture.kickoff_utc} />}

      <p className="text-center text-[11px] sm:text-xs text-gray-500 mt-3 leading-relaxed">
        {formatKickoffLocal(fixture.kickoff_utc)} · {fixture.city}
      </p>

      {hasResult && (
        <p className="text-center text-sm text-brand-blue font-medium mt-2 font-mono">
          Result: {fixture.home_score} — {fixture.away_score}
        </p>
      )}
    </div>
  )
}
