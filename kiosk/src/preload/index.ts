// ─── Kiosk Preload — contextBridge IPC Bridge ─────────────────────────────────
import { contextBridge, ipcRenderer } from 'electron'

export type CheckinResult = {
  success: boolean
  type?: 'time-in' | 'time-out'
  employee?: { fullName: string; department: string | null; position: string | null }
  message?: string
  error?: string
}

export type RecentCheckin = {
  id: string
  employee_id: string
  full_name: string
  department: string | null
  type: 'time-in' | 'time-out'
  timestamp: string
}

export type SyncStatus = {
  online: boolean
  pending: number
  state: 'idle' | 'syncing' | 'error' | 'offline' | 'unknown'
  lastSync: string | null
  lastError: string | null
}

const kioskAPI = {
  // Check in/out via PIN
  pinCheckin: (pin: string): Promise<CheckinResult> =>
    ipcRenderer.invoke('kiosk:pin-checkin', pin),

  // Check in/out via RFID
  rfidCheckin: (rfid: string): Promise<CheckinResult> =>
    ipcRenderer.invoke('kiosk:rfid-checkin', rfid),

  // Get recent check-ins for idle screen
  recentCheckins: (): Promise<RecentCheckin[]> =>
    ipcRenderer.invoke('kiosk:recent-checkins'),

  // Get sync status
  syncStatus: (): Promise<SyncStatus> =>
    ipcRenderer.invoke('kiosk:sync-status'),

  // Refresh employee cache from server
  refreshEmployees: (): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('kiosk:refresh-employees'),

  // Exit kiosk mode (admin escape)
  exit: (): Promise<void> =>
    ipcRenderer.invoke('kiosk:exit'),

  // Listen for RFID scan events pushed from main process
  onRfidScan: (cb: (rfid: string) => void) => {
    ipcRenderer.on('rfid:scan', (_event, rfid: string) => cb(rfid))
    return () => ipcRenderer.removeAllListeners('rfid:scan')
  },
}

contextBridge.exposeInMainWorld('kiosk', kioskAPI)

// Type augmentation for renderer
declare global {
  interface Window {
    kiosk: typeof kioskAPI
  }
}
