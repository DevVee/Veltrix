import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { IdleScreen }    from './screens/IdleScreen'
import { PINScreen }     from './screens/PINScreen'
import { RFIDScreen }    from './screens/RFIDScreen'
import { ResultScreen }  from './screens/ResultScreen'

// ─── Screen state machine ─────────────────────────────────────────────────────
export type Screen = 'idle' | 'pin' | 'rfid' | 'result'

export type ResultData = {
  success: boolean
  type?: 'time-in' | 'time-out'
  employee?: { fullName: string; department: string | null; position: string | null }
  message?: string
  error?: string
}

const IDLE_TIMEOUT_MS = 30_000   // return to idle after 30 s of inactivity
const RESULT_HOLD_MS  = 4_000   // show result for 4 s then go back to idle

export default function App() {
  const [screen, setScreen] = useState<Screen>('idle')
  const [result, setResult] = useState<ResultData | null>(null)
  const [idleTimer, setIdleTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  // ── idle timeout ──────────────────────────────────────────────────────────
  const resetIdleTimer = useCallback(() => {
    if (idleTimer) clearTimeout(idleTimer)
    if (screen !== 'idle') {
      const t = setTimeout(() => setScreen('idle'), IDLE_TIMEOUT_MS)
      setIdleTimer(t)
    }
  }, [screen, idleTimer])

  useEffect(() => {
    resetIdleTimer()
    return () => { if (idleTimer) clearTimeout(idleTimer) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen])

  // ── RFID listener (push from main process) ────────────────────────────────
  useEffect(() => {
    const unsub = window.kiosk.onRfidScan(async (rfid: string) => {
      setScreen('rfid')
      const res = await window.kiosk.rfidCheckin(rfid)
      setResult(res)
      setScreen('result')
      setTimeout(() => setScreen('idle'), RESULT_HOLD_MS)
    })
    return unsub
  }, [])

  // ── admin escape: Ctrl+Alt+Q ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key === 'q') window.kiosk.exit()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ── handlers ──────────────────────────────────────────────────────────────
  const handlePINComplete = async (pin: string) => {
    const res = await window.kiosk.pinCheckin(pin)
    setResult(res)
    setScreen('result')
    setTimeout(() => setScreen('idle'), RESULT_HOLD_MS)
  }

  const goIdle = () => setScreen('idle')

  return (
    <div className="h-screen w-screen overflow-hidden" onMouseMove={resetIdleTimer} onKeyDown={resetIdleTimer}>
      <AnimatePresence mode="wait">
        {screen === 'idle' && (
          <IdleScreen
            key="idle"
            onPINMode={() => setScreen('pin')}
            onRFIDMode={() => setScreen('rfid')}
          />
        )}
        {screen === 'pin' && (
          <PINScreen
            key="pin"
            onComplete={handlePINComplete}
            onCancel={goIdle}
          />
        )}
        {screen === 'rfid' && (
          <RFIDScreen
            key="rfid"
            onCancel={goIdle}
          />
        )}
        {screen === 'result' && result && (
          <ResultScreen
            key="result"
            data={result}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
