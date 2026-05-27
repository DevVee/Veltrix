import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, ArrowRight, ChevronDown, Check, Shield, Zap, Globe } from 'lucide-react'
import { apiLogin } from '../../lib/db'
import { useAuthStore } from '../../store/authStore'

const DEFAULT_EMAIL = 'admin@acme.ph'
const DEFAULT_PASS  = 'admin123'

const DEMO_ACCOUNTS = [
  { label: 'Super Admin',     email: 'admin@acme.ph',          pass: 'admin123',   tag: 'Full access',          color: '#7C3AED' },
  { label: 'HR Admin',        email: 'maria.santos@acme.ph',   pass: 'hr123',      tag: 'HR & employees',       color: '#4F46E5' },
  { label: 'Payroll Officer', email: 'ana.mendoza@acme.ph',    pass: 'payroll123', tag: 'Payroll processing',   color: '#0891B2' },
  { label: 'Dept Head',       email: 'eduardo.torres@acme.ph', pass: 'dept123',    tag: 'Department oversight', color: '#059669' },
]

const FEATURES = [
  { icon: Shield, text: '100% PH Compliant' },
  { icon: Zap,    text: 'Automated Payroll' },
  { icon: Globe,  text: 'RFID Attendance' },
]

export function Login() {
  const navigate  = useNavigate()
  const login     = useAuthStore(s => s.login)
  const [form,     setForm]     = useState({ email: DEFAULT_EMAIL, password: DEFAULT_PASS })
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
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh', display: 'flex' }}>

      <style>{`
        .login-input {
          width: 100%; height: 44px; padding: 0 14px;
          border: 1.5px solid #E2E8F0; border-radius: 8px;
          font-size: 14px; color: #0F172A; background: #FAFAFA;
          box-sizing: border-box; outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .login-input:focus {
          border-color: #4F46E5 !important;
          box-shadow: 0 0 0 3px rgba(79,70,229,0.12) !important;
          background: #fff;
        }
        .login-input:hover:not(:focus) { border-color: #CBD5E1; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%,100%{opacity:0.6} 50%{opacity:1} }
      `}</style>

      {/* ══ LEFT — Dark branding panel ══════════════════════════════════════ */}
      <div
        className="hidden lg:flex flex-col"
        style={{
          width: '58%',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          background: 'radial-gradient(ellipse at 30% 60%, #1E1B4B 0%, #0D0E14 55%, #050508 100%)',
        }}
      >
        {/* Dashboard screenshot */}
        <img
          src="/dashboard.png"
          alt="TenPayroll Dashboard"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'top left',
            filter: 'brightness(0.25) saturate(0.8)',
          }}
        />

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(105deg, transparent 0%, rgba(13,14,20,0.35) 50%, rgba(13,14,20,0.97) 100%)',
        }} />

        {/* Indigo glow from bottom left */}
        <div style={{
          position: 'absolute', bottom: -100, left: -80,
          width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(79,70,229,0.18) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        {/* Content over panel */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: '44px 48px' }}>

          {/* Logo + kiosk link */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
              onClick={() => navigate('/')}
            >
              <img src="/TenPayroll.png" alt="TenPayroll" style={{ width: 34, height: 34, objectFit: 'contain' }} />
              <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.035em', color: '#F8FAFC' }}>
                TenPayroll
              </span>
            </div>
            <button
              onClick={() => navigate('/kiosk')}
              style={{
                fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.35)',
                background: 'transparent', border: 'none', cursor: 'pointer',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)')}
            >
              ← Employee Kiosk
            </button>
          </div>

          {/* Center content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 500 }}>

            {/* Live demo badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'rgba(79,70,229,0.15)',
              border: '1px solid rgba(79,70,229,0.4)',
              borderRadius: 999, padding: '6px 14px',
              marginBottom: 28, alignSelf: 'flex-start',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%', background: '#22C55E',
                animation: 'pulse-dot 2s infinite',
              }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#A5B4FC' }}>
                Live demo — full data included
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(30px, 3.2vw, 46px)',
              fontWeight: 900,
              letterSpacing: '-0.045em',
              color: '#F8FAFC',
              lineHeight: 1.05,
              marginBottom: 20,
            }}>
              Philippine HR &amp; Payroll<br />
              <span style={{ color: '#818CF8' }}>built for your team.</span>
            </h1>

            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.42)', lineHeight: 1.75, marginBottom: 36 }}>
              Employees, attendance, payroll runs, payslips, leave management — all in one place, built for Filipino businesses.
            </p>

            {/* Feature list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                'SSS 2024 · PhilHealth 5% · Pag-IBIG 2% · BIR TRAIN compliant',
                'RFID card attendance kiosk — zero manual entry needed',
                'Role-based access for HR, Payroll, Managers & Employees',
              ].map((text, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: 'rgba(79,70,229,0.25)',
                    border: '1px solid rgba(79,70,229,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 1,
                  }}>
                    <Check style={{ width: 9, height: 9, color: '#A5B4FC' }} />
                  </div>
                  <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom floating stat cards */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { val: '₱2.4M', label: 'Simulated payroll' },
              { val: '20',    label: 'Demo employees' },
              { val: '4',     label: 'Access roles' },
            ].map(s => (
              <div key={s.val} style={{
                padding: '10px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 10,
                backdropFilter: 'blur(8px)',
              }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: '#E2E8F0', letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {s.val}
                </p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3, fontWeight: 500 }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ RIGHT — Login form ═══════════════════════════════════════════════ */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(32px,5vw,56px) clamp(24px,5vw,56px)',
        background: '#fff',
        overflowY: 'auto',
      }}>

        {/* Mobile logo */}
        <div
          className="lg:hidden"
          style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 36, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <img src="/TenPayroll.png" alt="TenPayroll" style={{ width: 30, height: 30, objectFit: 'contain' }} />
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.03em', color: '#0F172A' }}>TenPayroll</span>
        </div>

        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{
              fontSize: 28, fontWeight: 700,
              letterSpacing: '-0.03em', color: '#0F172A', marginBottom: 6,
            }}>
              Welcome back
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.5 }}>
              Sign in to TenPayroll
            </p>
          </div>

          {/* Demo banner */}
          <div style={{
            padding: '12px 16px', borderRadius: 10,
            background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
            border: '1.5px solid #C7D2FE',
            marginBottom: 24,
            display: 'flex', alignItems: 'flex-start', gap: 12,
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: '#4F46E5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginTop: 1,
            }}>
              <Check style={{ width: 11, height: 11, color: '#fff' }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#4338CA', marginBottom: 2 }}>
                Demo credentials pre-filled
              </p>
              <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.4 }}>
                Super Admin access · Just hit <strong style={{ color: '#4F46E5' }}>Sign In</strong> to explore the full system
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: '#FEF2F2', border: '1.5px solid #FECACA',
              borderRadius: 10, padding: '12px 14px', marginBottom: 18,
            }}>
              <AlertCircle style={{ width: 15, height: 15, color: '#DC2626', flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13, color: '#991B1B', lineHeight: 1.4 }}>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#475569', marginBottom: 7, letterSpacing: '-0.01em' }}>
                Email address
              </label>
              <input
                type="email"
                className="login-input"
                autoComplete="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#475569', marginBottom: 7, letterSpacing: '-0.01em' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  className="login-input"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                  style={{ paddingRight: 44 } as React.CSSProperties}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  tabIndex={-1}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: '#94A3B8', display: 'flex', alignItems: 'center', padding: 0,
                    transition: 'color 0.12s',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#475569')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#94A3B8')}
                >
                  {showPw
                    ? <EyeOff style={{ width: 16, height: 16 }} />
                    : <Eye    style={{ width: 16, height: 16 }} />
                  }
                </button>
              </div>
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                height: 46, borderRadius: 9, border: 'none',
                background: loading
                  ? 'linear-gradient(135deg, #818CF8, #A5B4FC)'
                  : 'linear-gradient(135deg, #4F46E5, #4338CA)',
                color: '#fff', fontWeight: 600, fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 4,
                transition: 'all 0.15s',
                boxShadow: '0 1px 2px rgba(79,70,229,0.3)',
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={e => {
                if (!loading) {
                  (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #4338CA, #3730A3)'
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(79,70,229,0.4)'
                }
              }}
              onMouseLeave={e => {
                if (!loading) {
                  (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #4F46E5, #4338CA)'
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = '0 1px 2px rgba(79,70,229,0.3)'
                }
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 16, height: 16,
                    border: '2.5px solid rgba(255,255,255,0.35)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                    flexShrink: 0,
                  }} />
                  Signing in…
                </>
              ) : (
                <>Continue <ArrowRight style={{ width: 16, height: 16 }} /></>
              )}
            </button>
          </form>

          {/* Feature badges */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 20, marginBottom: 4 }}>
            {FEATURES.map(f => (
              <div key={f.text} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 99,
                background: '#F8FAFC', border: '1px solid #E2E8F0',
                fontSize: 11.5, fontWeight: 500, color: '#64748B',
              }}>
                <f.icon style={{ width: 11, height: 11, color: '#4F46E5' }} />
                {f.text}
              </div>
            ))}
          </div>

          {/* Try a different role */}
          <div style={{ marginTop: 16, borderRadius: 10, border: '1.5px solid #E2E8F0', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setShowDemo(v => !v)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '11px 16px', background: '#F8FAFC', border: 'none', cursor: 'pointer',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#F1F5F9')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#F8FAFC')}
            >
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#64748B', letterSpacing: '-0.01em' }}>
                Try a different role
              </span>
              <ChevronDown style={{
                width: 14, height: 14, color: '#94A3B8',
                transform: showDemo ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s',
                flexShrink: 0,
              }} />
            </button>

            {showDemo && (
              <div style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {DEMO_ACCOUNTS.map(a => (
                  <button
                    key={a.email}
                    type="button"
                    onClick={() => { setForm({ email: a.email, password: a.pass }); setError(''); setShowDemo(false) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                      padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8,
                      background: '#fff', cursor: 'pointer', transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = a.color
                      el.style.background = `${a.color}0C`
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = '#E2E8F0'
                      el.style.background = '#fff'
                    }}
                  >
                    <div style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: `${a.color}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 1, letterSpacing: '-0.01em' }}>
                        {a.label}
                      </p>
                      <p style={{ fontSize: 11, color: '#94A3B8' }}>{a.tag}</p>
                    </div>
                    <span style={{
                      fontSize: 10.5, fontWeight: 600,
                      color: a.color, background: `${a.color}15`,
                      padding: '3px 9px', borderRadius: 999,
                      flexShrink: 0,
                    }}>
                      Select
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 11.5, color: '#CBD5E1' }}>
              All data stored locally in your browser · nothing sent to a server
            </p>
            <p style={{ fontSize: 11.5, color: '#CBD5E1', marginTop: 4 }}>
              © {new Date().getFullYear()} TenPayroll · Built for Filipino businesses
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
