import {
  GROUP_STAGE_GAME_DAYS,
  getGroupTabLabel,
  getMatchdayTabState,
  type MatchdayTabState,
} from '../../lib/matchdays'
import type { Fixture, GameDay } from '../../types'

interface GroupMatchdayTabsProps {
  gameDays: GameDay[]
  fixturesByDay: Record<number, Fixture[]>
  selectedDay: number
  onSelect: (gameDay: number) => void
}

const TAB_BADGE: Record<MatchdayTabState, { label: string; className: string }> = {
  predict: { label: 'Open', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  closed: { label: 'Closed', className: 'bg-gray-100 text-gray-500 border-gray-200' },
  complete: { label: 'Done', className: 'bg-brand-gold/10 text-brand-gold border-brand-gold/30' },
  locked: { label: 'Locked', className: 'bg-gray-100 text-gray-400 border-gray-200' },
}

export function GroupMatchdayTabs({
  gameDays,
  fixturesByDay,
  selectedDay,
  onSelect,
}: GroupMatchdayTabsProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none"
      role="tablist"
      aria-label="Group stage matchdays"
    >
      {GROUP_STAGE_GAME_DAYS.map((day) => {
        const gameDay = gameDays.find((g) => g.game_day === day)
        const fixtures = fixturesByDay[day] ?? []
        const state = gameDay ? getMatchdayTabState(gameDay, fixtures) : 'locked'
        const badge = TAB_BADGE[state]
        const isSelected = selectedDay === day

        return (
          <button
            key={day}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(day)}
            className={`shrink-0 flex flex-col items-start gap-1.5 rounded-xl border px-3.5 py-2.5 min-w-[7.5rem] transition-colors touch-manipulation ${
              isSelected
                ? 'border-brand-blue/40 bg-brand-blue/[0.08] ring-2 ring-brand-blue/20'
                : 'border-brand-blue/10 bg-white/50 hover:bg-white/80'
            }`}
          >
            <span className={`font-display text-sm ${isSelected ? 'text-brand-navy' : 'text-gray-600'}`}>
              {getGroupTabLabel(day)}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-pill border font-medium ${badge.className}`}>
              {badge.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
