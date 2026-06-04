interface PointsBadgeProps {
  points: number
  size?: 'xs' | 'sm' | 'md'
}

export function PointsBadge({ points, size = 'md' }: PointsBadgeProps) {
  const config = {
    10: { label: '10 pts', className: 'bg-brand-gold text-white' },
    5: { label: '5 pts', className: 'bg-brand-blue text-white' },
    0: { label: '0 pts', className: 'bg-gray-200 text-gray-500' },
  }[points as 0 | 5 | 10] ?? { label: `${points} pts`, className: 'bg-gray-200 text-gray-500' }

  const sizeClass =
    size === 'xs' ? 'text-[10px] px-1.5 py-0.5' :
    size === 'sm' ? 'text-xs px-2.5 py-0.5' :
    'text-sm px-3 py-1'

  return (
    <span className={`inline-flex items-center rounded-pill font-semibold font-mono ${config.className} ${sizeClass}`}>
      {config.label}
    </span>
  )
}
