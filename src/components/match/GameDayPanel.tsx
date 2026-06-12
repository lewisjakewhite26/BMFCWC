import { useState, useMemo, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MatchCard } from './MatchCard'
import { HistoryMatchCard } from './HistoryMatchCard'
import { isFixturePredictionsLocked } from '../../lib/scoring'
import type { Fixture, Prediction, GameDay } from '../../types'

interface GameDayPanelProps {
  gameDay: GameDay
  fixtures: Fixture[]
  predictions: Map<number, Prediction>
  onSave?: (fixtureId: number, home: number, away: number) => Promise<void>
  defaultOpen?: boolean
  isCurrent?: boolean
  isHistory?: boolean
  onConfirmChange?: (fixtureId: number, confirmed: boolean) => void
}

export function GameDayPanel({
  gameDay,
  fixtures,
  predictions,
  onSave,
  defaultOpen = false,
  isCurrent = false,
  isHistory = false,
  onConfirmChange,
}: GameDayPanelProps) {
  const [open, setOpen] = useState(defaultOpen || isCurrent)

  const dayPoints = useMemo(() => {
    if (!isHistory) return 0
    return fixtures.reduce((sum, f) => sum + (predictions.get(f.id)?.points_awarded ?? 0), 0)
  }, [fixtures, predictions, isHistory])

  const statusColors = {
    open: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    locked: 'bg-gray-100 text-gray-500 border-gray-200',
    completed: 'bg-brand-gold/10 text-brand-gold border-brand-gold/30',
  }

  const label = gameDay.label.replace(/Game Day/gi, 'Matchday')
  const matchdayOpen = gameDay.status === 'open' && isCurrent
  const focusRegistry = useRef<Map<number, () => void>>(new Map())

  const focusNextEditable = useCallback(
    (fromIndex: number) => {
      for (let i = fromIndex + 1; i < fixtures.length; i++) {
        const next = fixtures[i]
        if (matchdayOpen && onSave && !isFixturePredictionsLocked(next, true)) {
          focusRegistry.current.get(next.id)?.()
          return
        }
      }
    },
    [fixtures, matchdayOpen, onSave]
  )

  const fixtureList = (
    <div className={`space-y-3 ${isCurrent ? '' : 'p-4 sm:p-5 pt-0 border-t border-brand-blue/10'}`}>
      {fixtures.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">No fixtures</p>
      ) : isHistory ? (
        fixtures.map((fixture) => (
          <HistoryMatchCard
            key={fixture.id}
            fixture={fixture}
            prediction={predictions.get(fixture.id)}
          />
        ))
      ) : (
        fixtures.map((fixture, index) => {
          const fixtureLocked = !matchdayOpen || isFixturePredictionsLocked(fixture, true)
          const canEditFixture = matchdayOpen && !!onSave && !fixtureLocked

          return (
            <MatchCard
              key={fixture.id}
              fixture={fixture}
              prediction={predictions.get(fixture.id)}
              locked={!canEditFixture}
              onSave={canEditFixture ? onSave : undefined}
              onConfirmChange={canEditFixture ? onConfirmChange : undefined}
              onRegisterFocus={
                canEditFixture
                  ? (focusHome) => {
                      focusRegistry.current.set(fixture.id, focusHome)
                      return () => focusRegistry.current.delete(fixture.id)
                    }
                  : undefined
              }
              onAdvanceToNext={canEditFixture ? () => focusNextEditable(index) : undefined}
            />
          )
        })
      )}
    </div>
  )

  if (isCurrent) {
    return (
      <div className="glass-card overflow-hidden ring-2 ring-brand-blue/20">
        <div className="p-4 sm:p-5 border-b border-brand-blue/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-display text-base sm:text-lg text-brand-navy">{label}</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-pill border capitalize font-medium ${statusColors[gameDay.status]}`}>
              {gameDay.status}
            </span>
          </div>
        </div>
        <div className="p-4 sm:p-5">{fixtureList}</div>
      </div>
    )
  }

  return (
    <div className="glass-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 min-h-[56px] hover:bg-white/40 active:bg-white/60 transition-colors touch-manipulation"
      >
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="font-display text-sm sm:text-lg text-brand-navy">{label}</span>
          <span className={`text-xs px-2.5 py-0.5 rounded-pill border capitalize font-medium ${statusColors[gameDay.status]}`}>
            {gameDay.status}
          </span>
          {isHistory && fixtures.length > 0 && (
            <span className="text-xs font-mono font-medium text-brand-navy bg-brand-gold/15 border border-brand-gold/25 px-2 py-0.5 rounded-pill">
              {dayPoints} pts
            </span>
          )}
        </div>
        <span className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {fixtureList}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

