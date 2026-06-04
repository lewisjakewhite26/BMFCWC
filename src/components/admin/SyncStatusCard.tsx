import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { ApiSyncStatus } from '../../types'

const MAX_REQUESTS = 80

function formatRelativeTime(iso: string | null): string {
  if (!iso) return 'Never'
  const diffMs = Date.now() - new Date(iso).getTime()
  if (diffMs < 0) return 'Just now'
  const sec = Math.floor(diffMs / 1000)
  if (sec < 10) return 'Just now'
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} min${min === 1 ? '' : 's'} ago`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function statusBadge(status: string) {
  switch (status) {
    case 'success':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'error':
      return 'bg-red-50 text-red-600 border-red-200'
    case 'skipped':
    case 'idle':
      return 'bg-gray-100 text-gray-600 border-gray-200'
    default:
      return 'bg-brand-gold/10 text-brand-gold border-brand-gold/30'
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'success': return 'Success'
    case 'error': return 'Error'
    case 'idle': return 'No fixtures'
    case 'skipped': return 'Skipped'
    default: return 'Pending'
  }
}

interface SyncStatusCardProps {
  devMode?: boolean
}

export function SyncStatusCard({ devMode = false }: SyncStatusCardProps) {
  const { user } = useAuth()
  const [status, setStatus] = useState<ApiSyncStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const load = useCallback(async () => {
    if (devMode) {
      setStatus({
        date: new Date().toISOString().split('T')[0],
        request_count: 14,
        max_requests: MAX_REQUESTS,
        last_request_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        last_sync_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        last_sync_status: 'success',
        last_sync_message: 'Updated 3 fixtures',
      })
      setLoading(false)
      return
    }

    if (!user) return

    const { data, error } = await supabase.rpc('admin_get_sync_status', {
      p_user_id: user.id,
      p_session_token: user.session_token,
    })

    if (error) {
      console.error(error)
    } else {
      setStatus(data as ApiSyncStatus)
    }
    setLoading(false)
  }, [user, devMode])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (devMode || !user) return

    const channel = supabase
      .channel('api_request_log_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'api_request_log' },
        () => { load() }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, devMode, load])

  const handleManualSync = async () => {
    if (!user) return

    if (devMode) {
      toast.success('Manual sync triggered (preview only)')
      return
    }

    setSyncing(true)
    try {
      const res = await fetch('/api/sync-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: user.id,
          session_token: user.session_token,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Sync failed')

      if (data.skipped) {
        toast(data.reason ?? 'Sync skipped', { icon: 'ℹ️' })
      } else {
        toast.success(data.updated > 0 ? `Synced — ${data.updated} fixture(s) updated` : 'Sync complete — no new results')
      }
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Manual sync failed')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
        <div className="h-3 bg-gray-100 rounded w-full mb-2" />
        <div className="h-10 bg-gray-100 rounded w-full" />
      </div>
    )
  }

  const count = status?.request_count ?? 0
  const pct = Math.min(100, Math.round((count / MAX_REQUESTS) * 100))
  const barColor = count > 60 ? 'bg-brand-gold' : 'bg-brand-blue'

  return (
    <div className="glass-card p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h3 className="font-display text-lg text-brand-navy">API Sync Status</h3>
          <p className="text-sm text-gray-500 mt-0.5">API-Football · polls every 15 min during match windows</p>
        </div>
        <span className={`self-start text-xs font-medium px-2.5 py-1 rounded-pill border capitalize ${statusBadge(status?.last_sync_status ?? 'pending')}`}>
          {statusLabel(status?.last_sync_status ?? 'pending')}
        </span>
      </div>

      <div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Today&apos;s API requests</span>
          <span className="font-mono font-bold text-brand-navy">
            {count} / {MAX_REQUESTS}
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-brand-blue/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-white/50 border border-brand-blue/10 px-3 py-2.5">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Last synced</p>
          <p className="font-medium text-brand-navy mt-0.5">
            {formatRelativeTime(status?.last_sync_at ?? null)}
          </p>
        </div>
        <div className="rounded-xl bg-white/50 border border-brand-blue/10 px-3 py-2.5">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Last API call</p>
          <p className="font-medium text-brand-navy mt-0.5">
            {formatRelativeTime(status?.last_request_at ?? null)}
          </p>
        </div>
      </div>

      {status?.last_sync_message && (
        <p className="text-sm text-gray-600 bg-white/40 rounded-xl px-3 py-2 border border-brand-blue/5">
          {status.last_sync_message}
        </p>
      )}

      <button
        type="button"
        onClick={handleManualSync}
        disabled={syncing || count >= MAX_REQUESTS}
        className="btn-primary w-full sm:w-auto min-h-[48px] disabled:opacity-50"
      >
        {syncing ? 'Syncing…' : 'Manual Sync'}
      </button>
      {count >= MAX_REQUESTS && (
        <p className="text-xs text-amber-600">Daily request limit reached. Sync will resume from midnight.</p>
      )}
    </div>
  )
}
