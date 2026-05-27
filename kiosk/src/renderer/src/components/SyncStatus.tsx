import { useState, useEffect } from 'react'
import { Wifi, WifiOff, CloudUpload, AlertCircle, CheckCircle2 } from 'lucide-react'

type SyncStatus = {
  online: boolean
  pending: number
  state: 'idle' | 'syncing' | 'error' | 'offline' | 'unknown'
  lastSync: string | null
  lastError: string | null
}

export function SyncStatus() {
  const [status, setStatus] = useState<SyncStatus | null>(null)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      if (cancelled) return
      try {
        const s = await window.kiosk.syncStatus()
        if (!cancelled) setStatus(s)
      } catch { /* ignore */ }
      if (!cancelled) setTimeout(poll, 5000)
    }

    poll()
    return () => { cancelled = true }
  }, [])

  if (!status) return null

  const isOnline  = status.online
  const isSyncing = status.state === 'syncing'
  const isError   = status.state === 'error'
  const pending   = status.pending

  return (
    <div className="flex items-center gap-2 text-xs font-medium">
      {/* Connectivity dot */}
      <span className={`flex items-center gap-1 px-2 py-1 rounded-full ${
        isOnline
          ? 'bg-emerald-500/20 text-emerald-300'
          : 'bg-red-500/20 text-red-300'
      }`}>
        {isOnline
          ? <Wifi size={12} />
          : <WifiOff size={12} />
        }
        {isOnline ? 'Online' : 'Offline'}
      </span>

      {/* Sync indicator */}
      {isSyncing && (
        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300 animate-pulse">
          <CloudUpload size={12} />
          Syncing…
        </span>
      )}

      {isError && !isSyncing && (
        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-300">
          <AlertCircle size={12} />
          Sync error
        </span>
      )}

      {/* Pending count */}
      {pending > 0 && !isSyncing && (
        <span className="px-2 py-1 rounded-full bg-slate-700 text-slate-300">
          {pending} pending
        </span>
      )}

      {pending === 0 && !isSyncing && isOnline && (
        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
          <CheckCircle2 size={12} />
          Synced
        </span>
      )}
    </div>
  )
}
