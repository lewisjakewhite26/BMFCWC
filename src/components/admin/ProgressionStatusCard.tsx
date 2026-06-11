import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { parseApiResponse } from '../../lib/parseApiResponse'
import { useAuth } from '../../hooks/useAuth'
import type { ProgressionStatus } from '../../types'

function formatRelativeTime(iso: string | null): string {
  if (!iso) return '—'
  const diffMs = Date.now() - new Date(iso).getTime()
  if (diffMs < 0) {
    const futureSec = Math.floor(-diffMs / 1000)
    if (futureSec < 60) return `in ${futureSec}s`
    const futureMin = Math.floor(futureSec / 60)
    if (futureMin < 60) return `in ${futureMin} min${futureMin === 1 ? '' : 's'}`
    const futureHrs = Math.floor(futureMin / 60)
    return `in ${futureHrs} hour${futureHrs === 1 ? '' : 's'}`
  }
  const sec = Math.floor(diffMs / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} min${min === 1 ? '' : 's'} ago`
  const hrs = Math.floor(min / 60)
  return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function eventBadge(event: string): string {
  switch (event) {
    case 'all_scored':
      return 'bg-gray-100 text-gray-600 border-gray-200'
    case 'wait_started':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'teams_discovered':
      return 'bg-brand-gold/10 text-brand-gold border-brand-gold/30'
    case 'matchday_opened':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

function eventLabel(event: string): string {
  switch (event) {
    case 'all_scored':
      return 'All scored'
    case 'wait_started':
      return 'Wait started'
    case 'teams_discovered':
      return 'Teams discovered'
    case 'matchday_opened':
      return 'Matchday opened'
    default:
      return event.replace(/_/g, ' ')
  }
}

function queueStatusBadge(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'processing':
      return 'bg-brand-gold/10 text-brand-gold border-brand-gold/30'
    case 'failed':
      return 'bg-red-50 text-red-600 border-red-200'
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

interface ProgressionStatusCardProps {
  devMode?: boolean
}

export function ProgressionStatusCard({ devMode = false }: ProgressionStatusCardProps) {
  const { user } = useAuth()
  const [status, setStatus] = useState<ProgressionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  const load = useCallback(async () => {
    if (devMode) {
      setStatus({
        log: [
          {
            id: 1,
            game_day: 3,
            event: 'all_scored',
            triggered_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
            details: null,
          },
          {
            id: 2,
            game_day: 4,
            event: 'wait_started',
            triggered_at: new Date(Date.now() - 89 * 60 * 1000).toISOString(),
            details: { scheduled_for: new Date(Date.now() + 30 * 60 * 1000).toISOString() },
          },
        ],
        queue: [
          {
            id: 1,
            game_day: 4,
            scheduled_for: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            status: 'pending',
            created_at: new Date(Date.now() - 89 * 60 * 1000).toISOString(),
            processed_at: null,
          },
        ],
      })
      setLoading(false)
      return
    }

    if (!user) return

    const { data, error } = await supabase.rpc('admin_get_progression_status', {
      p_user_id: user.id,
      p_session_token: user.session_token,
    })

    if (error) {
      console.error(error)
    } else {
      setStatus(data as ProgressionStatus)
    }
    setLoading(false)
  }, [user, devMode])

  useEffect(() => {
    load()
  }, [load])

  const handleProcessNow = async () => {
    if (!user) return

    if (devMode) {
      toast.success('Progression triggered (preview only)')
      return
    }

    setProcessing(true)
    try {
      const res = await fetch('/api/process-progression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: user.id,
          session_token: user.session_token,
        }),
      })

      const { data, text } = await parseApiResponse<{ error?: string; message?: string }>(res)
      if (!res.ok) {
        throw new Error(data?.error ?? (text || 'Process failed'))
      }
      if (!data) throw new Error(text || 'Process failed')

      toast.success(data.message ?? 'Progression processed')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Process failed')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-5 bg-gray-200 rounded w-48 mb-4" />
        <div className="h-3 bg-gray-100 rounded w-full mb-2" />
        <div className="h-24 bg-gray-100 rounded w-full" />
      </div>
    )
  }

  const log = status?.log ?? []
  const queue = status?.queue ?? []

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display text-lg text-brand-navy">Auto Progression</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Matchday completion, knockout discovery, and auto-open · cron every 5 min
        </p>
      </div>

      {queue.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Queue</p>
          {queue.map((job) => (
            <div
              key={job.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl bg-white/50 border border-brand-blue/10 px-3 py-2.5"
            >
              <div>
                <p className="font-medium text-brand-navy text-sm">Matchday {job.game_day}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Due {formatRelativeTime(job.scheduled_for)} · {formatTimestamp(job.scheduled_for)}
                </p>
              </div>
              <span
                className={`self-start text-xs font-medium px-2.5 py-1 rounded-pill border capitalize ${queueStatusBadge(job.status)}`}
              >
                {job.status}
              </span>
            </div>
          ))}
          <button
            type="button"
            onClick={handleProcessNow}
            disabled={processing}
            className="btn-secondary w-full sm:w-auto min-h-[44px] disabled:opacity-50"
          >
            {processing ? 'Processing…' : 'Process Now'}
          </button>
        </div>
      )}

      {queue.length === 0 && (
        <div className="rounded-xl bg-white/40 border border-brand-blue/5 px-3 py-2.5 text-sm text-gray-500">
          No pending progression jobs
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Recent log</p>
        {log.length === 0 ? (
          <p className="text-sm text-gray-500">No progression events yet</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {log.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 rounded-xl bg-white/50 border border-brand-blue/10 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-brand-navy">
                    MD{entry.game_day}
                    <span className="text-gray-400 font-normal mx-1.5">·</span>
                    {formatRelativeTime(entry.triggered_at)}
                  </p>
                </div>
                <span
                  className={`self-start shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-pill border ${eventBadge(entry.event)}`}
                >
                  {eventLabel(entry.event)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
