// ─── Sync Engine ─────────────────────────────────────────────────────────────
// Runs in Electron main process. Periodically flushes the attendance queue
// to the remote server and refreshes the employee cache.
import { getPendingRecords, markSynced, markFailed, replaceEmployeeCache, getPendingCount, getConfig } from '../db'

const SYNC_INTERVAL_MS   = 30_000   // 30 s normal cadence
const RETRY_DELAY_MS     = 5_000    // 5 s after a failed nudge
const HEALTH_URL_SUFFIX  = '/api/health'
const EMPLOYEES_URL_SUFFIX = '/api/employees/cache'
const ATTENDANCE_URL_SUFFIX = '/api/attendance/batch'

export interface SyncStatus {
  online: boolean
  pending: number
  state: 'idle' | 'syncing' | 'error' | 'offline' | 'unknown'
  lastSync: string | null
  lastError: string | null
}

export class SyncEngine {
  private timer: NodeJS.Timeout | null = null
  private _online = false
  private _state: SyncStatus['state'] = 'idle'
  private _lastSync: string | null = null
  private _lastError: string | null = null
  private _running = false

  // ── helpers ──────────────────────────────────────────────────────────────
  private get baseUrl(): string {
    return getConfig('server_url') ?? 'http://localhost:3000'
  }

  private get apiKey(): string {
    return getConfig('api_key') ?? ''
  }

  private get deviceId(): string {
    return getConfig('device_id') ?? 'unknown'
  }

  private headers() {
    return {
      'Content-Type': 'application/json',
      'x-device-id': this.deviceId,
      'x-api-key': this.apiKey,
    }
  }

  // ── lifecycle ─────────────────────────────────────────────────────────────
  start(): void {
    if (this._running) return
    this._running = true
    this._scheduleNext(0)
    console.log('[SyncEngine] started')
  }

  stop(): void {
    this._running = false
    if (this.timer) { clearTimeout(this.timer); this.timer = null }
    console.log('[SyncEngine] stopped')
  }

  /** Trigger an immediate sync cycle (called after a successful check-in) */
  nudge(): void {
    if (!this._running) return
    if (this.timer) { clearTimeout(this.timer); this.timer = null }
    this._scheduleNext(100)
  }

  // ── status (read by IPC handler) ──────────────────────────────────────────
  getStatus(): SyncStatus {
    return {
      online:    this._online,
      pending:   getPendingCount(),
      state:     this._state,
      lastSync:  this._lastSync,
      lastError: this._lastError,
    }
  }

  // ── internal schedule ─────────────────────────────────────────────────────
  private _scheduleNext(delayMs = SYNC_INTERVAL_MS): void {
    if (!this._running) return
    this.timer = setTimeout(() => this._cycle(), delayMs)
  }

  private async _cycle(): Promise<void> {
    try {
      this._online = await this._checkOnline()

      if (this._online) {
        await this._flush()
      } else {
        this._state = 'offline'
      }
    } catch (err) {
      this._state = 'error'
      this._lastError = String(err)
      console.error('[SyncEngine] cycle error:', err)
    } finally {
      this._scheduleNext(this._online ? SYNC_INTERVAL_MS : RETRY_DELAY_MS)
    }
  }

  // ── connectivity check ────────────────────────────────────────────────────
  private async _checkOnline(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}${HEALTH_URL_SUFFIX}`, {
        method: 'GET',
        headers: this.headers(),
        signal: AbortSignal.timeout(5000),
      })
      return res.ok
    } catch {
      return false
    }
  }

  // ── flush pending records ─────────────────────────────────────────────────
  private async _flush(): Promise<void> {
    const records = getPendingRecords(100)
    if (!records.length) {
      this._state = 'idle'
      return
    }

    this._state = 'syncing'
    console.log(`[SyncEngine] flushing ${records.length} record(s)`)

    try {
      const res = await fetch(`${this.baseUrl}${ATTENDANCE_URL_SUFFIX}`, {
        method:  'POST',
        headers: this.headers(),
        body:    JSON.stringify({ records }),
        signal:  AbortSignal.timeout(15000),
      })

      if (res.ok) {
        const { accepted = [], rejected = [] } = await res.json() as {
          accepted: string[]
          rejected: { id: string; error: string }[]
        }

        if (accepted.length) markSynced(accepted)
        if (rejected.length) {
          for (const { id, error } of rejected) markFailed([id], error)
        }

        this._lastSync  = new Date().toISOString()
        this._lastError = null
        this._state     = 'idle'
        console.log(`[SyncEngine] synced ${accepted.length} record(s)`)
      } else {
        const text = await res.text()
        const errMsg = `HTTP ${res.status}: ${text}`
        markFailed(records.map(r => r.id), errMsg)
        this._state     = 'error'
        this._lastError = errMsg
      }
    } catch (err) {
      const errMsg = String(err)
      markFailed(records.map(r => r.id), errMsg)
      this._state     = 'error'
      this._lastError = errMsg
      console.error('[SyncEngine] flush error:', err)
    }
  }

  // ── refresh employee cache from server ────────────────────────────────────
  async refreshEmployeeCache(): Promise<void> {
    const online = await this._checkOnline()
    if (!online) throw new Error('Device is offline')

    const res = await fetch(`${this.baseUrl}${EMPLOYEES_URL_SUFFIX}`, {
      method:  'GET',
      headers: this.headers(),
      signal:  AbortSignal.timeout(15000),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const { employees } = await res.json() as { employees: Parameters<typeof replaceEmployeeCache>[0] }
    replaceEmployeeCache(employees)
    console.log(`[SyncEngine] employee cache refreshed (${employees.length} records)`)
  }
}
