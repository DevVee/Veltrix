import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, ChevronDown, Lock } from 'lucide-react'
import { apiLogin } from '../../lib/db'
import { useAuthStore } from '../../store/authStore'

const DEMO_ACCOUNTS = [
  { label: 'Super Admin',     email: 'admin@acme.ph',          pass: 'admin123',   role: 'Full system access',       color: '#7C3AED' },
  { label: 'HR Admin',        email: 'maria.santos@acme.ph',   pass: 'hr123',      role: 'HR & employee management', color: '#1a56db' },
  { label: 'Payroll Officer', email: 'ana.mendoza@acme.ph',    pass: 'payroll123', role: 'Payroll processing',       color: '#0891B2' },
  { label: 'Dept Head',       email: 'eduardo.torres@acme.ph', pass: 'dept123',    role: 'Department oversight',     color: '#059669' },
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
    if (!form.email || !form.password) { setError('Enter your email and password.'); return }
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
    <div className="min-h-screen flex flex-col" style={{ background: '#F0F2F6' }}>

      {/* ── Top navigation bar ── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-6"
        style={{
          height: 52,
          background: '#fff',
          borderBottom: '1px solid #E4E7EC',
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center font-black text-white flex-shrink-0"
            style={{ width: 28, height: 28, background: '#1a56db', borderRadius: 5, fontSize: 13, letterSpacing: '-0.02em' }}
          >
            T
          </div>
          <div>
            <p
              className="font-extrabold text-gray-900 leading-none"
              style={{ fontSize: 13.5, letterSpacing: '-0.025em' }}
            >
              TenPayroll
            </p>
            <p
              className="mt-0.5"
              style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.13em', color: '#B0B8C4' }}
            >
              HR & Payroll System
            </p>
          </div>
        </div>

        {/* Kiosk link */}
        <button
          onClick={() => navigate('/kiosk')}
          style={{ fontSize: 11.5, fontWeight: 500, color: '#9CA3AF', transition: 'color 0.15s' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#374151')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#9CA3AF')}
        >
          ← Employee Kiosk
        </button>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div style={{ width: '100%', maxWidth: 392 }}>

          {/* ── Login card ── */}
          <div
            className="bg-white overflow-hidden"
            style={{
              border: '1px solid #E2E5EB',
              borderRadius: 8,
              boxShadow: '0 2px 20px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.02)',
            }}
          >

            {/* ── Card header ── */}
            <div style={{ padding: '26px 30px 22px', borderBottom: '1px solid #F0F2F5' }}>
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 28, height: 28,
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: 6,
                  }}
                >
                  <Lock size={12} color="#1a56db" strokeWidth={2.5} />
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#1a56db',
                  }}
                >
                  Secure Admin Access
                </span>
              </div>

              <h1
                className="font-bold text-gray-900 leading-tight"
                style={{ fontSize: 19, letterSpacing: '-0.025em', marginBottom: 4 }}
              >
                Sign in to your workspace
              </h1>
              <p style={{ fontSize: 12.5, color: '#9CA3AF' }}>
                TenPayroll · ACME Corporation
              </p>
            </div>

            {/* ── Card body (form) ── */}
            <div style={{ padding: '22px 30px' }}>
              {error && (
                <div
                  className="flex items-start gap-2.5"
                  style={{
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 5,
                    padding: '9px 12px',
                    marginBottom: 16,
                  }}
                >
                  <AlertCircle
                    style={{ width: 14, height: 14, color: '#DC2626', flexShrink: 0, marginTop: 1 }}
                  />
                  <span style={{ fontSize: 12.5, color: '#991B1B' }}>{error}</span>
                </div>
              )}

              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="form-label">Email address</label>
                  <input
                    type="email"
                    autoFocus
                    autoComplete="email"
                    className="input-base"
                    placeholder="you@company.ph"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="form-label">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      className="input-base pr-10"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    height: 38,
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 5,
                    marginTop: 2,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? (
                    <>
                      <span
                        style={{
                          width: 15, height: 15,
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#fff',
                          borderRadius: '50%',
                          animation: 'spin 0.7s linear infinite',
                          flexShrink: 0,
                        }}
                      />
                      Signing in…
                    </>
                  ) : 'Sign In'}
                </button>
              </form>
            </div>

            {/* ── Demo accounts ── */}
            <div style={{ borderTop: '1px solid #F0F2F5' }}>
              <button
                type="button"
                onClick={() => setShowDemo(v => !v)}
                className="w-full flex items-center justify-between transition-colors"
                style={{ padding: '11px 30px', background: 'transparent' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#F7F8FA')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
              >
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#B0B8C4',
                  }}
                >
                  Demo Accounts
                </span>
                <ChevronDown
                  style={{
                    width: 14, height: 14,
                    color: '#B0B8C4',
                    transform: showDemo ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s ease',
                    flexShrink: 0,
                  }}
                />
              </button>

              {showDemo && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 7,
                    padding: '2px 16px 16px',
                  }}
                >
                  {DEMO_ACCOUNTS.map(a => (
                    <button
                      key={a.email}
                      type="button"
                      onClick={() => {
                        setForm({ email: a.email, password: a.pass })
                        setError('')
                        setShowDemo(false)
                      }}
                      className="text-left transition-all"
                      style={{
                        padding: '10px 12px',
                        border: '1px solid #E4E7EC',
                        borderRadius: 5,
                        background: 'transparent',
                      }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement
                        el.style.borderColor = '#93C5FD'
                        el.style.background  = '#EFF6FF'
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement
                        el.style.borderColor = '#E4E7EC'
                        el.style.background  = 'transparent'
                      }}
                    >
                      <p
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.07em',
                          color: a.color,
                          marginBottom: 3,
                        }}
                      >
                        {a.label}
                      </p>
                      <p style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.3 }}>{a.role}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{ marginTop: 18, textAlign: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '3px 14px',
                marginBottom: 8,
              }}
            >
              {['🇵🇭 PH Compliant', 'SSS 2024', 'PhilHealth 5%', 'TRAIN Law BIR'].map(t => (
                <span key={t} style={{ fontSize: 10.5, fontWeight: 500, color: '#B0B8C4' }}>{t}</span>
              ))}
            </div>
            <p style={{ fontSize: 10, color: '#C8CDD8' }}>
              © {new Date().getFullYear()} TenPayroll — Built for Filipino businesses
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
