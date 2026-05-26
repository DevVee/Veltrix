import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, ChevronDown, CheckCircle2, CreditCard, Banknote, Users } from 'lucide-react'
import { apiLogin } from '../../lib/db'
import { useAuthStore } from '../../store/authStore'

const DEMO_ACCOUNTS = [
  { label: 'Super Admin',     email: 'admin@acme.ph',          pass: 'admin123',   color: '#7C3AED' },
  { label: 'HR Admin',        email: 'maria.santos@acme.ph',   pass: 'hr123',      color: '#2563EB' },
  { label: 'Payroll Officer', email: 'ana.mendoza@acme.ph',    pass: 'payroll123', color: '#0891B2' },
  { label: 'Dept Head',       email: 'eduardo.torres@acme.ph', pass: 'dept123',    color: '#059669' },
]

const HERO_FEATURES = [
  { icon: Users,    label: 'Employee Management', desc: 'Full lifecycle HR — contracts, transfers, separation' },
  { icon: CreditCard, label: 'RFID Attendance',  desc: 'Tap your card. No PIN required.' },
  { icon: Banknote, label: 'Philippine Payroll',  desc: 'SSS, PhilHealth, Pag-IBIG, BIR auto-computed' },
]

export function Login() {
  const navigate  = useNavigate()
  const login     = useAuthStore(s => s.login)
  const [form,     setForm]     = useState({ email: '', password: '' })
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [showDemo, setShowDemo] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) { setError('Please enter your email and password.'); return }
    setLoading(true)
    try {
      const user = await apiLogin(form.email, form.password)
      login(user)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* ── Left: Hero panel ─────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col"
        style={{
          width: '54%', flexShrink: 0,
          background: 'linear-gradient(155deg, #060B18 0%, #0C1628 55%, #0F1E3A 100%)',
          padding: '0',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Background grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        {/* Glow */}
        <div style={{ position: 'absolute', top: -100, left: -80, width: 600, height: 600, background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 400, height: 400, background: 'radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 65%)', pointerEvents: 'none' }} />

        {/* Content wrapper */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: '44px 52px' }}>

          {/* Top: logo + back */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 64 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 15, color: '#fff', letterSpacing: '-0.02em',
              }}>V</div>
              <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.035em', color: '#F8FAFC' }}>Veltrix</span>
            </div>
            <button
              onClick={() => navigate('/kiosk')}
              style={{ fontSize: 12, fontWeight: 500, color: '#374151', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#9CA3AF')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#374151')}
            >
              ← Employee Kiosk
            </button>
          </div>

          {/* Middle: headline + features */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={{ fontSize: 11.5, fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>
              HR & Payroll System
            </p>
            <h1 style={{
              fontSize: 'clamp(30px,3.5vw,48px)',
              fontWeight: 900, letterSpacing: '-0.04em',
              color: '#F8FAFC', lineHeight: 1.07, marginBottom: 20,
            }}>
              The HR system your team{' '}
              <span style={{
                background: 'linear-gradient(135deg, #60A5FA 10%, #A78BFA 90%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                will actually use.
              </span>
            </h1>
            <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.7, marginBottom: 40, maxWidth: 440 }}>
              Automates Philippine payroll compliance, RFID attendance, leave management, and reporting — all in one place.
            </p>

            {/* Feature bullets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {HERO_FEATURES.map(f => {
                const Icon = f.icon
                return (
                  <div key={f.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: 'rgba(37,99,235,0.12)',
                      border: '1px solid rgba(37,99,235,0.22)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon style={{ width: 16, height: 16, color: '#60A5FA' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F0', marginBottom: 2 }}>{f.label}</p>
                      <p style={{ fontSize: 12.5, color: '#4B5563', lineHeight: 1.5 }}>{f.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bottom: compliance badges */}
          <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Philippine Compliance</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['SSS 2024', 'PhilHealth 5%', 'Pag-IBIG 2%', 'BIR TRAIN Law'].map(t => (
                <div key={t} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 999,
                  background: 'rgba(16,163,74,0.10)',
                  border: '1px solid rgba(16,163,74,0.22)',
                }}>
                  <CheckCircle2 style={{ width: 10, height: 10, color: '#4ADE80', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#4ADE80' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Login form panel ───────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col"
        style={{ background: '#FAFAFA', minHeight: '100vh' }}
      >
        {/* Mobile-only top bar */}
        <div
          className="lg:hidden flex items-center justify-between flex-shrink-0"
          style={{ height: 56, padding: '0 24px', background: '#fff', borderBottom: '1px solid #E5E7EB' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#2563EB,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, color: '#fff' }}>V</div>
            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.03em', color: '#111827' }}>Veltrix</span>
          </div>
          <button onClick={() => navigate('/kiosk')} style={{ fontSize: 12, color: '#9CA3AF', background: 'transparent', border: 'none', cursor: 'pointer' }}>← Kiosk</button>
        </div>

        {/* Form area — centered */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(32px,5vw,56px) clamp(20px,5vw,56px)' }}>
          <div style={{ width: '100%', maxWidth: 380 }}>

            {/* Header */}
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#111827', marginBottom: 6 }}>
                Welcome back
              </h2>
              <p style={{ fontSize: 14, color: '#6B7280' }}>
                Sign in to your Veltrix workspace
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                background: '#FEF2F2', border: '1px solid #FECACA',
                borderRadius: 7, padding: '10px 13px', marginBottom: 18,
              }}>
                <AlertCircle style={{ width: 14, height: 14, color: '#DC2626', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: '#991B1B' }}>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Email address
                </label>
                <input
                  type="email"
                  autoFocus
                  autoComplete="email"
                  placeholder="you@company.ph"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  style={{
                    width: '100%', height: 40, padding: '0 13px',
                    border: '1.5px solid #D1D5DB', borderRadius: 7,
                    fontSize: 14, color: '#111827', background: '#fff',
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#2563EB')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#D1D5DB')}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    autoComplete="current-password"
                    style={{
                      width: '100%', height: 40, padding: '0 40px 0 13px',
                      border: '1.5px solid #D1D5DB', borderRadius: 7,
                      fontSize: 14, color: '#111827', background: '#fff',
                      outline: 'none', boxSizing: 'border-box',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#2563EB')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#D1D5DB')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    tabIndex={-1}
                    style={{
                      position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: '#9CA3AF', display: 'flex', alignItems: 'center',
                    }}
                  >
                    {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  height: 42, borderRadius: 7, border: 'none',
                  background: loading ? '#93C5FD' : '#2563EB',
                  color: '#fff', fontWeight: 700, fontSize: 14,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: 4, transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#1D4ED8' }}
                onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#2563EB' }}
              >
                {loading ? (
                  <>
                    <span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                    Signing in…
                  </>
                ) : 'Sign In'}
              </button>
            </form>

            {/* Demo accounts */}
            <div style={{ marginTop: 24, borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setShowDemo(v => !v)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 14px', background: '#F9FAFB', border: 'none', cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 11.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#9CA3AF' }}>
                  Demo Accounts
                </span>
                <ChevronDown style={{
                  width: 13, height: 13, color: '#9CA3AF',
                  transform: showDemo ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s',
                }} />
              </button>

              {showDemo && (
                <div style={{ padding: '6px 10px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                  {DEMO_ACCOUNTS.map(a => (
                    <button
                      key={a.email}
                      type="button"
                      onClick={() => { setForm({ email: a.email, password: a.pass }); setError(''); setShowDemo(false) }}
                      style={{
                        textAlign: 'left', padding: '9px 11px',
                        border: '1.5px solid #E5E7EB', borderRadius: 6,
                        background: '#fff', cursor: 'pointer', transition: 'all 0.12s',
                      }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = a.color; el.style.background = `${a.color}10` }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#E5E7EB'; el.style.background = '#fff' }}
                    >
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.color, marginBottom: 5 }} />
                      <p style={{ fontSize: 11.5, fontWeight: 700, color: '#111827', marginBottom: 1 }}>{a.label}</p>
                      <p style={{ fontSize: 10.5, color: '#9CA3AF', fontFamily: 'monospace' }}>{a.pass}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <p style={{ marginTop: 24, textAlign: 'center', fontSize: 11.5, color: '#D1D5DB' }}>
              © {new Date().getFullYear()} Veltrix · 🇵🇭 Built for Filipino businesses
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
