import { useDashboardStats } from '../../hooks/useDashboardStats'

export function UserStatsGrid() {
  const { stats, loading } = useDashboardStats()

  const items = [
    {
      label: 'Total Points',
      value: loading ? '—' : String(stats.total_points),
      highlight: true,
    },
    {
      label: 'League Position',
      value: loading || stats.league_position === null ? '—' : `#${stats.league_position}`,
      highlight: false,
    },
    {
      label: 'Best Matchday',
      value: loading || stats.best_matchday_points === null ? '—' : String(stats.best_matchday_points),
      highlight: false,
    },
    {
      label: 'Points off Top',
      value: loading ? '—' : String(stats.points_off_top),
      highlight: false,
    },
  ]

  return (
    <>
      <div className="sm:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2.5 w-max pb-1">
          {items.map((stat) => (
            <div key={stat.label} className="glass-card px-4 py-3 min-w-[7.5rem] text-center shrink-0">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5 font-medium whitespace-nowrap">
                {stat.label}
              </p>
              <p className={`text-xl font-mono font-bold ${stat.highlight ? 'text-brand-blue' : 'text-brand-navy'}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden sm:grid sm:grid-cols-4 gap-3">
        {items.map((stat) => (
          <div key={stat.label} className="glass-card p-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">{stat.label}</p>
            <p className={`text-2xl font-mono font-bold ${stat.highlight ? 'text-brand-blue' : 'text-brand-navy'}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </>
  )
}
