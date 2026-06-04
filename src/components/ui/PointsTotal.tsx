interface PointsTotalProps {
  points: number
  className?: string
}

/** Broadcast-style points chip — label + score split */
export function PointsTotal({ points, className = '' }: PointsTotalProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/75 border border-brand-blue/15 shadow-[0_1px_3px_rgba(13,27,75,0.06)] backdrop-blur-sm ${className}`}
    >
      <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-500 leading-none pt-px">
        PTS
      </span>
      <span className="text-base font-mono font-bold text-brand-navy tabular-nums leading-none">
        {points}
      </span>
    </div>
  )
}
