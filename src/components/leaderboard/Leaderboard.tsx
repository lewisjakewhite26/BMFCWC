import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSpring, useTransform } from 'framer-motion'
import { LeaderboardSkeleton } from '../ui/Skeleton'
import { getLeaderboardRanks } from '../../lib/leaderboard'
import type { LeaderboardEntry } from '../../types'

function AnimatedPoints({ value }: { value: number }) {
  const spring = useSpring(value, { stiffness: 80, damping: 20 })
  const display = useTransform(spring, (v) => Math.round(v).toString())
  const [text, setText] = useState(String(value))

  useEffect(() => {
    spring.set(value)
    return display.on('change', (v) => setText(v))
  }, [value, spring, display])

  return <span className="font-mono tabular-nums">{text}</span>
}

function RankBadge({ rank }: { rank: number }) {
  const styles: Record<number, string> = {
    1: 'bg-[#D4A017] text-white',
    2: 'bg-[#9CA3AF] text-white',
    3: 'bg-[#B87333] text-white',
  }

  const badgeClass = styles[rank]
  if (!badgeClass) {
    return <span className="text-sm font-mono font-bold text-gray-500">{rank}</span>
  }

  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold font-mono ${badgeClass}`}
    >
      {rank}
    </span>
  )
}

const PODIUM_GRADIENTS: Record<number, string> = {
  1: 'linear-gradient(to bottom, #D4A017, #FDE68A)',
  2: 'linear-gradient(to bottom, #9CA3AF, #E5E7EB)',
  3: 'linear-gradient(to bottom, #B87333, #D4A57A)',
}

function Podium({ entries, ranks }: { entries: LeaderboardEntry[]; ranks: Map<string, number> }) {
  const top3 = entries.slice(0, 3)
  if (top3.length === 0) return null

  const order = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3
  const maxPoints = Math.max(...top3.map((e) => e.total_points), 1)
  const minBar = 56
  const maxBar = 112

  return (
    <div className="flex items-end justify-center gap-3 sm:gap-6 mb-6 sm:mb-8 px-2">
      {order.map((entry) => {
        const rank = ranks.get(entry.id) ?? entries.indexOf(entry) + 1
        const barHeight = minBar + (entry.total_points / maxPoints) * (maxBar - minBar)
        const gradient = PODIUM_GRADIENTS[rank]

        return (
          <div key={entry.id} className="flex flex-col items-center flex-1 max-w-[120px]">
            <div className="mb-1">
              <RankBadge rank={rank} />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-brand-navy text-center truncate w-full px-1">
              {entry.display_name}
            </p>
            <p className="text-xs font-mono text-brand-blue font-bold mb-2">{entry.total_points} pts</p>
            <div
              className="w-full rounded-t-2xl border border-brand-blue/10 transition-all duration-500"
              style={{
                height: `${barHeight}px`,
                background: gradient ?? '#E5E7EB',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry
  rank: number
  isCurrentUser?: boolean
}

export function LeaderboardRow({ entry, rank, isCurrentUser }: LeaderboardRowProps) {
  return (
    <div
      className={`
        flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border transition-all
        ${isCurrentUser ? 'bg-brand-blue/8 border-brand-blue/25' : 'bg-white/50 border-brand-blue/10'}
      `}
    >
      <span className="w-8 text-center font-mono font-bold text-gray-500 text-sm">{rank}</span>
      <span className="flex-1 font-semibold text-brand-navy truncate">{entry.display_name}</span>
      <span className="hidden sm:block text-sm text-gray-500 w-14 text-center font-mono">{entry.correct_scores}</span>
      <span className="hidden sm:block text-sm text-gray-500 w-14 text-center font-mono">{entry.correct_results}</span>
      <span className="font-bold text-brand-blue w-14 text-right">
        <AnimatedPoints value={entry.total_points} />
      </span>
    </div>
  )
}

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  loading: boolean
  currentUserId?: string
  compact?: boolean
}

export function Leaderboard({ entries, loading, currentUserId, compact = false }: LeaderboardProps) {
  if (loading) return <LeaderboardSkeleton />

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No predictions yet. Sign up to take part.
      </div>
    )
  }

  const tableEntries = compact ? entries : entries.slice(3)
  const showPodium = !compact && entries.length >= 1
  const ranks = getLeaderboardRanks(entries)

  return (
    <div className="space-y-2">
      {showPodium && <Podium entries={entries} ranks={ranks} />}

      {!compact && entries.length > 3 && (
        <div className="flex items-center gap-3 sm:gap-4 px-4 py-2 text-xs text-gray-500 uppercase tracking-wider font-medium">
          <span className="w-8 text-center">Rank</span>
          <span className="flex-1">Name</span>
          <span className="hidden sm:block w-14 text-center">Exact</span>
          <span className="hidden sm:block w-14 text-center">Result</span>
          <span className="w-14 text-right">Pts</span>
        </div>
      )}

      {compact && (
        <div className="flex items-center gap-3 px-2 py-1 text-xs text-gray-500 uppercase tracking-wider font-medium">
          <span className="w-8 text-center">#</span>
          <span className="flex-1">Name</span>
          <span className="w-14 text-right">Pts</span>
        </div>
      )}

      {(compact ? entries : tableEntries).map((entry) => {
        const rank = ranks.get(entry.id) ?? 0
        return (
          <LeaderboardRow
            key={entry.id}
            entry={entry}
            rank={rank}
            isCurrentUser={entry.id === currentUserId}
          />
        )
      })}

      {compact && (
        <p className="text-center pt-2">
          <Link to="/signup" className="text-sm text-brand-blue font-medium hover:underline">
            Sign up to take part →
          </Link>
        </p>
      )}
    </div>
  )
}
