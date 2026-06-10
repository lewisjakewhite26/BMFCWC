import toast from 'react-hot-toast'
import { isGroupStageGameDay } from '../../lib/matchdays'
import type { GameDay } from '../../types'

interface GameDayManagerProps {
  gameDays: GameDay[]
  onOpen: (gameDay: number) => Promise<void>
  onComplete: (gameDay: number) => Promise<void>
  incompleteFixtures: Record<number, number>
}

export function GameDayManager({ gameDays, onOpen, onComplete, incompleteFixtures }: GameDayManagerProps) {
  const handleOpen = async (gd: number) => {
    try {
      await onOpen(gd)
      toast.success(`Matchday ${gd} opened`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to open matchday')
    }
  }

  const handleComplete = async (gd: number) => {
    try {
      await onComplete(gd)
      toast.success(`Matchday ${gd} marked complete`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to complete matchday')
    }
  }

  const statusColors = {
    open: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    locked: 'bg-gray-100 text-gray-500 border-gray-200',
    completed: 'bg-brand-gold/10 text-brand-gold border-brand-gold/30',
  }

  return (
    <div className="space-y-3">
      {gameDays.map((gd) => {
        const canOpen = gd.status === 'locked' && (
          isGroupStageGameDay(gd.game_day) ||
          gameDays.find((g) => g.game_day === gd.game_day - 1)?.status === 'completed'
        )
        const incomplete = incompleteFixtures[gd.game_day] ?? 0
        const canComplete = gd.status === 'open' && incomplete === 0
        const label = gd.label.replace(/Game Day/gi, 'Matchday')

        return (
          <div key={gd.id} className="admin-inner-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display text-brand-navy">{label}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-pill border capitalize font-medium ${statusColors[gd.status]}`}>
                  {gd.status}
                </span>
              </div>
              {gd.status === 'open' && incomplete > 0 && (
                <p className="text-xs text-amber-600 mt-1">{incomplete} fixture(s) need results</p>
              )}
            </div>

            <div className="flex gap-2">
              {canOpen && (
                <button onClick={() => handleOpen(gd.game_day)} className="btn-primary text-sm py-2 px-5">
                  Open
                </button>
              )}
              {gd.status === 'open' && (
                <button
                  onClick={() => handleComplete(gd.game_day)}
                  disabled={!canComplete}
                  className="btn-secondary text-sm py-2 px-5 disabled:opacity-40"
                >
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
