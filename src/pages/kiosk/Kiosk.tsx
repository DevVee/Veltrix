import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, LogOut, Delete, Settings2, AlertCircle, CalendarX, CheckCircle2 } from 'lucide-react'
import { apiKioskPIN, apiGetTodayHoliday, getCompanySettings } from '../../lib/db'
import type { Employee, Holiday } from '../../types'

type Phase =
  | { kind: 'idle' }
  | { kind: 'pin'; digits: string }
  | { kind: 'processing' }
  | { kind: 'success'; type: 'time-in' | 'time-out'; employee: Employee; time: string }
  | { kind: 'error'; message: string }

const AUTO_DISMISS = 5000
const NUMPAD = ['1','2','3','4','5','6','7','8','9','','0','⌫']

export function Kiosk() {
  const navigate   = useNavigate()
  const [time,     setTime]     = useState(new Date())
  const [phase,    setPhase]    = useState<Phase>({ kind: 'idle' })
  const [holiday,  setHoliday]  = useState<Holiday | null>(null)
  const dismissRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const company    = getCompanySettings()

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => { apiGetTodayHoliday().then(setHoliday) }, [])

  const schedDismiss = (ms = AUTO_DISMISS) => {
    if (dismissRef.current) clearTimeout(dismissRef.current)
    dismissRef.current = setTimeout(() => setPhase({ kind: 'idle' }), ms)
  }

  const handleKey = useCallback(async (key: string) => {
    if (phase.kind === 'processing' || phase.kind === 'success') return
    if (holiday && (holiday.type === 'regular' || holiday.type === 'special-non-working')) return

    setPhase(prev => {
      const digits = prev.kind === 'pin' ? prev.digits : ''
      if (key === '⌫') {
        const next = digits.slice(0, -1)
        return next.length === 0 ? { kind: 'idle' } : { kind: 'pin', digits: next }
      }
      if (key === 'CANCEL') return { kind: 'idle' }
      const next = digits + key
      return { kind: 'pin', digits: next }
    })
  }, [phase.kind, holiday])

  // Auto-submit at 4 digits
  useEffect(() => {
    if (phase.kind !== 'pin' || phase.digits.length !== 4) return
    const submit = async () => {
      setPhase({ kind: 'processing' })
      try {
        const res = await apiKioskPIN(phase.digits)
        setPhase({ kind: 'success', type: res.type, employee: res.employee, time: new Date().toISOString() })
        schedDismiss(AUTO_DISMISS)
      } catch (err) {
        setPhase({ kind: 'error', message: err instanceof Error ? err.message : 'System error. Try again.' })
        schedDismiss(3000)
      }
    }
    submit()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleKey(e.key)
      else if (e.key === 'Backspace')    handleKey('⌫')
      else if (e.key === 'Escape')       handleKey('CANCEL')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleKey])

  const timeStr   = time.toLocaleTimeString('en-PH', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true })
  const dateStr   = time.toLocaleDateString('en-PH', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
  const isBlocked = holiday && (holiday.type === 'regular' || holiday.type === 'special-non-working')

  return (
    <div
      className="min-h-screen flex flex-col select-none overflow-hidden"
      style={{ background: '#0D1117' }}
    >
      {/* ── Header ── */}
      <header
        className="flex items-center justify-between px-8 pt-5 pb-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 flex items-center justify-center font-black text-white text-base"
            style={{ background: '#1565C0', borderRadius: '6px' }}
          >
            T
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">{company.name}</p>
            <p className="text-[10px] mt-0.5 font-medium uppercase tracking-widest" style={{ color: '#3D4452' }}>
              Attendance Kiosk
            </p>
          </div>
        </div>

        {/* Clock — centered */}
        <div className="absolute left-1/2 -translate-x-1/2 text-center">
          <p
            className="text-white font-bold tabular-nums leading-none"
            style={{ fontSize: '38px', letterSpacing: '-0.02em' }}
          >
            {timeStr}
          </p>
          <p className="text-[11px] mt-1.5 font-medium" style={{ color: '#4B5563' }}>{dateStr}</p>
        </div>

        {/* Admin link */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-colors"
          style={{ color: '#3D4452', borderRadius: '5px' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#3D4452' }}
        >
          <Settings2 className="w-3.5 h-3.5" />
          Admin Login
        </button>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">

        {/* HOLIDAY BLOCKED */}
        {isBlocked && (
          <div className="flex flex-col items-center text-center animate-slide-in">
            <div
              className="w-20 h-20 flex items-center justify-center mb-6"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '12px',
              }}
            >
              <CalendarX className="w-10 h-10 text-red-400" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-3">No Work Today</p>
            <p className="text-white font-bold mb-2" style={{ fontSize: '32px' }}>{holiday.name}</p>
            <p className="text-base capitalize" style={{ color: '#4B5563' }}>
              {holiday.type.replace(/-/g, ' ')} · Attendance suspended
            </p>
          </div>
        )}

        {/* IDLE */}
        {!isBlocked && phase.kind === 'idle' && (
          <div className="flex flex-col items-center text-center w-full max-w-[320px] animate-slide-in">
            <div
              className="w-14 h-14 flex items-center justify-center mb-6"
              style={{
                background: 'rgba(21,101,192,0.12)',
                border: '1px solid rgba(21,101,192,0.25)',
                borderRadius: '12px',
              }}
            >
              <LogIn className="w-7 h-7" style={{ color: '#1976D2' }} />
            </div>
            <p className="text-white font-bold text-2xl mb-1 leading-tight">Time In / Time Out</p>
            <p className="text-sm mb-8" style={{ color: '#4B5563' }}>Enter your 4-digit PIN to record attendance</p>

            {/* PIN dots */}
            <div className="flex gap-3 mb-8">
              {[0,1,2,3].map(i => (
                <div
                  key={i}
                  className="w-12 h-12 flex items-center justify-center"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.15)' }}
                  />
                </div>
              ))}
            </div>

            <NumPad onKey={handleKey} />
          </div>
        )}

        {/* PIN ENTRY */}
        {!isBlocked && phase.kind === 'pin' && (
          <div className="flex flex-col items-center text-center w-full max-w-[320px] animate-slide-in">
            <p className="text-white font-bold text-2xl mb-1">Enter PIN</p>
            <p className="text-sm mb-8" style={{ color: '#4B5563' }}>
              {phase.digits.length} of 4 digits entered
            </p>

            {/* PIN dots */}
            <div className="flex gap-3 mb-8">
              {[0,1,2,3].map(i => (
                <div
                  key={i}
                  className="w-12 h-12 flex items-center justify-center transition-all duration-100"
                  style={{
                    background: i < phase.digits.length ? 'rgba(21,101,192,0.25)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${i < phase.digits.length ? 'rgba(21,101,192,0.6)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '8px',
                  }}
                >
                  {i < phase.digits.length && (
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: '#1976D2' }}
                    />
                  )}
                </div>
              ))}
            </div>

            <NumPad onKey={handleKey} />

            <button
              onClick={() => setPhase({ kind: 'idle' })}
              className="mt-5 text-xs font-medium transition-colors px-4 py-2"
              style={{ color: '#374151', borderRadius: '4px' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#9CA3AF')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#374151')}
            >
              Cancel
            </button>
          </div>
        )}

        {/* PROCESSING */}
        {!isBlocked && phase.kind === 'processing' && (
          <div className="flex flex-col items-center text-center animate-slide-in">
            <div
              className="w-14 h-14 border-2 border-t-brand rounded-full animate-spin mb-6"
              style={{ borderColor: 'rgba(255,255,255,0.1)', borderTopColor: '#1565C0' }}
            />
            <p className="text-white font-bold text-xl">Verifying PIN…</p>
            <p className="text-sm mt-1" style={{ color: '#4B5563' }}>Please wait</p>
          </div>
        )}

        {/* SUCCESS */}
        {!isBlocked && phase.kind === 'success' && (
          <div className="flex flex-col items-center text-center animate-slide-in">
            <div
              className="w-20 h-20 flex items-center justify-center mb-5"
              style={{
                background: phase.type === 'time-in' ? 'rgba(34,197,94,0.1)' : 'rgba(59,130,246,0.1)',
                border: `1px solid ${phase.type === 'time-in' ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.3)'}`,
                borderRadius: '12px',
              }}
            >
              {phase.type === 'time-in'
                ? <CheckCircle2 className="w-10 h-10 text-green-400" />
                : <LogOut        className="w-10 h-10 text-blue-400" />
              }
            </div>

            <p
              className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${
                phase.type === 'time-in' ? 'text-green-400' : 'text-blue-400'
              }`}
            >
              {phase.type === 'time-in' ? '● Time In Recorded' : '● Time Out Recorded'}
            </p>

            <p
              className="text-white font-bold mb-1 leading-tight"
              style={{ fontSize: '28px' }}
            >
              {phase.employee.fullName}
            </p>
            <p className="text-sm mb-5" style={{ color: '#4B5563' }}>
              {phase.employee.position} · {phase.employee.department}
            </p>

            {/* Timestamp */}
            <div
              className="px-8 py-3 mb-6"
              style={{
                background: phase.type === 'time-in' ? 'rgba(34,197,94,0.08)' : 'rgba(59,130,246,0.08)',
                border: `1px solid ${phase.type === 'time-in' ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)'}`,
                borderRadius: '8px',
              }}
            >
              <p
                className={`text-2xl font-bold tabular-nums ${
                  phase.type === 'time-in' ? 'text-green-400' : 'text-blue-400'
                }`}
              >
                {new Date(phase.time).toLocaleTimeString('en-PH', {
                  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
                })}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-48 h-0.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '999px' }}>
              <div
                className="h-full animate-shrink"
                style={{
                  background: phase.type === 'time-in' ? '#22C55E' : '#3B82F6',
                  borderRadius: '999px',
                }}
              />
            </div>
            <p className="text-[10px] mt-1.5" style={{ color: '#374151' }}>
              Returning to idle in 5 seconds…
            </p>
          </div>
        )}

        {/* ERROR */}
        {!isBlocked && phase.kind === 'error' && (
          <div className="flex flex-col items-center text-center animate-slide-in">
            <div
              className="w-20 h-20 flex items-center justify-center mb-5"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '12px',
              }}
            >
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-red-400 mb-3">Error</p>
            <p className="text-white text-lg font-semibold mb-6 max-w-xs">
              {phase.kind === 'error' ? phase.message : ''}
            </p>
            <button
              onClick={() => setPhase({ kind: 'idle' })}
              className="px-6 py-3 text-sm font-semibold text-white transition-all"
              style={{
                background: '#1565C0',
                borderRadius: '6px',
                border: '1px solid #1565C0',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#1251A0')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#1565C0')}
            >
              Try Again
            </button>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer
        className="flex items-center justify-between px-8 pb-5 pt-3 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <p className="text-[10px]" style={{ color: '#1F2937' }}>
          © {new Date().getFullYear()} TenPayroll
        </p>
        <p className="text-[10px]" style={{ color: '#1F2937' }}>
          {time.toLocaleDateString('en-PH',{year:'numeric',month:'long',day:'numeric'})}
        </p>
      </footer>
    </div>
  )
}

// ── Numpad component ──────────────────────────────────────────────────────────
function NumPad({ onKey }: { onKey: (k: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2.5 w-full max-w-[264px]">
      {NUMPAD.map((k, i) => {
        if (k === '') return <div key={i} />

        const isBack = k === '⌫'
        return (
          <button
            key={i}
            onClick={() => onKey(k)}
            className="kiosk-key h-[60px] text-xl font-semibold"
            style={{
              background: isBack ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: isBack ? '#6B7280' : '#E5E7EB',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = isBack
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(21,101,192,0.2)'
              if (!isBack) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(21,101,192,0.4)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background = isBack ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.07)'
              el.style.borderColor = 'rgba(255,255,255,0.09)'
            }}
          >
            {isBack ? <Delete className="w-5 h-5 mx-auto" /> : k}
          </button>
        )
      })}
    </div>
  )
}
