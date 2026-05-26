import { useNavigate } from 'react-router-dom'
import {
  Users, Clock, Banknote, BarChart2,
  CheckCircle2, CreditCard, ArrowRight, Zap, Shield,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const FEATURES = [
  {
    icon: Users,
    title: 'Employee Management',
    desc: 'Full lifecycle — hiring, transfers, contracts, separation. RFID kiosk attendance built in.',
    color: '#7C3AED',
    bg: '#F5F3FF',
  },
  {
    icon: Banknote,
    title: 'Philippine Payroll',
    desc: 'Automatic SSS 2024, PhilHealth 5%, Pag-IBIG, and BIR TRAIN Law withholding computation.',
    color: '#2563EB',
    bg: '#EFF6FF',
  },
  {
    icon: Clock,
    title: 'Time & Attendance',
    desc: 'RFID card reader support. Grace periods, late deductions, overtime and night differential.',
    color: '#059669',
    bg: '#ECFDF5',
  },
  {
    icon: BarChart2,
    title: 'Reports & Payslips',
    desc: 'Generate payslips, government remittance reports, and analytics — one click.',
    color: '#D97706',
    bg: '#FFFBEB',
  },
]

const COMPLIANCE = [
  { label: 'SSS 2024 Tables',   desc: 'Updated monthly contribution schedule' },
  { label: 'PhilHealth 5%',     desc: 'Employee & employer share computation' },
  { label: 'Pag-IBIG 2%',       desc: 'HDMF Fund contributions auto-computed' },
  { label: 'BIR TRAIN Law',     desc: 'Tax table + withholding tax deductions' },
]

export function Landing() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#fff', color: '#111827', minHeight: '100vh' }}>

      {/* ─── Navbar ─────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid #E5E7EB',
        padding: '0 max(32px, calc((100vw - 1100px) / 2))',
        height: 62,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 14, color: '#fff', letterSpacing: '-0.02em',
          }}>V</div>
          <span style={{ fontWeight: 800, fontSize: 16.5, letterSpacing: '-0.035em', color: '#111827' }}>
            Veltrix
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '7px 18px', borderRadius: 7,
                background: '#2563EB', color: '#fff',
                fontWeight: 600, fontSize: 13.5, border: 'none', cursor: 'pointer',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#1D4ED8')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#2563EB')}
            >
              Go to Dashboard <ArrowRight style={{ width: 13, height: 13 }} />
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/kiosk')}
                style={{
                  padding: '7px 16px', borderRadius: 7, border: 'none',
                  background: 'transparent', color: '#6B7280',
                  fontWeight: 500, fontSize: 13.5, cursor: 'pointer',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F3F4F6'; (e.currentTarget as HTMLElement).style.color = '#111827' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#6B7280' }}
              >Kiosk</button>
              <button
                onClick={() => navigate('/login')}
                style={{
                  padding: '7px 18px', borderRadius: 7, border: 'none',
                  background: '#111827', color: '#fff',
                  fontWeight: 600, fontSize: 13.5, cursor: 'pointer',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#1F2937')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#111827')}
              >Sign in</button>
            </>
          )}
        </div>
      </nav>

      {/* ─── Hero ───────────────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(170deg, #060B18 0%, #0D1730 55%, #0F1E3A 100%)',
        padding: 'clamp(64px,8vw,108px) max(32px, calc((100vw - 1100px) / 2)) 0',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }} />
        {/* glow blobs */}
        <div style={{ position: 'absolute', top: -160, left: '15%', width: 700, height: 700, background: 'radial-gradient(circle, rgba(37,99,235,0.13) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 40, right: '10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'rgba(37,99,235,0.14)', border: '1px solid rgba(37,99,235,0.28)',
            borderRadius: 999, padding: '5px 14px', marginBottom: 36,
          }}>
            <CreditCard style={{ width: 12, height: 12, color: '#60A5FA' }} />
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#93C5FD', letterSpacing: '0.015em' }}>
              RFID Card Attendance · Now Available
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(38px, 5.5vw, 76px)',
            fontWeight: 900, lineHeight: 1.04,
            letterSpacing: '-0.045em', color: '#F8FAFC',
            maxWidth: 780, marginBottom: 26,
          }}>
            Payroll that{' '}
            <span style={{
              background: 'linear-gradient(135deg, #60A5FA 10%, #A78BFA 90%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              actually works
            </span>
            {' '}for Filipino businesses.
          </h1>

          <p style={{ fontSize: 'clamp(15px,1.6vw,18px)', color: '#8B95B8', lineHeight: 1.7, maxWidth: 580, marginBottom: 44 }}>
            Veltrix automates your Philippine payroll — SSS, PhilHealth, Pag-IBIG, BIR TRAIN Law.
            RFID attendance. Payslips. Government remittances. One platform that does it right.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 64 }}>
            <button
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '13px 26px', borderRadius: 8,
                background: '#2563EB', color: '#fff',
                fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#1D4ED8')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#2563EB')}
            >
              {user ? 'Go to Dashboard' : 'Get started'} <ArrowRight style={{ width: 15, height: 15 }} />
            </button>
            <button
              onClick={() => navigate('/kiosk')}
              style={{
                padding: '13px 26px', borderRadius: 8,
                background: 'rgba(255,255,255,0.05)', color: '#B8C0D0',
                fontWeight: 600, fontSize: 15,
                border: '1px solid rgba(255,255,255,0.11)', cursor: 'pointer',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.09)'; (e.currentTarget as HTMLElement).style.color = '#E2E8F0' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#B8C0D0' }}
            >
              View Kiosk
            </button>
          </div>

          {/* compliance stats */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px 48px', marginBottom: 56, paddingBottom: 40, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { n: '100%',       l: 'Philippine compliant' },
              { n: 'SSS 2024',   l: 'Latest tables' },
              { n: 'TRAIN Law',  l: 'BIR withholding' },
              { n: 'RFID',       l: 'Card attendance' },
            ].map(s => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: '#E2E8F0', letterSpacing: '-0.03em' }}>{s.n}</span>
                <span style={{ fontSize: 12, color: '#4B5563', fontWeight: 500 }}>{s.l}</span>
              </div>
            ))}
          </div>

          {/* ── Dashboard preview ── */}
          <div style={{
            background: '#111827', borderRadius: '12px 12px 0 0',
            border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none',
            overflow: 'hidden',
            boxShadow: '0 -16px 80px rgba(0,0,0,0.5), 0 -4px 20px rgba(37,99,235,0.12)',
          }}>
            {/* browser bar */}
            <div style={{ height: 36, background: '#1A2035', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {['#EF4444', '#F59E0B', '#10B981'].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />)}
              </div>
              <div style={{ flex: 1, margin: '0 14px', background: 'rgba(255,255,255,0.05)', borderRadius: 4, height: 20, display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                <span style={{ fontSize: 10, color: '#3D4A5C' }}>app.veltrix.ph/dashboard</span>
              </div>
            </div>

            {/* content */}
            <div style={{ display: 'flex', height: 'clamp(220px,28vw,320px)' }}>
              {/* sidebar mock */}
              <div style={{ width: 170, background: '#0D1117', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '14px 10px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 18 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#2563EB,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#fff' }}>V</div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#E2E8F0', letterSpacing: '-0.025em' }}>Veltrix</span>
                </div>
                {[['Dashboard', true], ['Employees', false], ['Attendance', false], ['Leave Mgmt', false], ['Payroll Runs', false]].map(([item, active]) => (
                  <div key={item as string} style={{ padding: '5px 8px', borderRadius: 5, marginBottom: 2, background: active ? '#2563EB' : 'transparent', fontSize: 10.5, fontWeight: active ? 600 : 400, color: active ? '#fff' : '#4B5563' }}>
                    {item as string}
                  </div>
                ))}
              </div>

              {/* main content mock */}
              <div style={{ flex: 1, padding: 16, background: '#0F1729', overflow: 'hidden' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 12, letterSpacing: '-0.01em' }}>
                  Good morning, Admin 👋
                </div>
                {/* KPI row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
                  {[{ l: 'Employees', v: '148', c: '#7C3AED' }, { l: 'Present', v: '132', c: '#059669' }, { l: 'Pending', v: '5', c: '#D97706' }, { l: 'Payroll', v: '₱2.4M', c: '#2563EB' }].map(k => (
                    <div key={k.l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 7, padding: '9px 10px', border: '1px solid rgba(255,255,255,0.055)' }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${k.c}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 7 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: k.c }} />
                      </div>
                      <div style={{ fontSize: 'clamp(12px,1.5vw,17px)', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.03em' }}>{k.v}</div>
                      <div style={{ fontSize: 8.5, color: '#374151', marginTop: 1 }}>{k.l}</div>
                    </div>
                  ))}
                </div>
                {/* table + chart row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 8 }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 7, border: '1px solid rgba(255,255,255,0.055)', padding: 10 }}>
                    <div style={{ fontSize: 9.5, fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Today's Attendance</div>
                    {[{ n: 'Juan Dela Cruz', d: 'Engineering', s: 'Present', c: '#10B981' }, { n: 'Maria Santos', d: 'HR', s: 'Late', c: '#F59E0B' }, { n: 'Eduardo Torres', d: 'Finance', s: 'Present', c: '#10B981' }].map(r => (
                      <div key={r.n} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{r.n[0]}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 9, fontWeight: 500, color: '#CBD5E1' }}>{r.n}</div>
                          <div style={{ fontSize: 8, color: '#374151' }}>{r.d}</div>
                        </div>
                        <div style={{ fontSize: 8, fontWeight: 600, color: r.c }}>{r.s}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 7, border: '1px solid rgba(255,255,255,0.055)', padding: 10 }}>
                    <div style={{ fontSize: 9.5, fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Attendance</div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                      <div style={{ width: 64, height: 64, borderRadius: '50%', border: '8px solid rgba(37,99,235,0.2)', borderTopColor: '#2563EB', borderRightColor: '#10B981', transform: 'rotate(-30deg)' }} />
                    </div>
                    {[{ l: 'Present', c: '#10B981', v: '89%' }, { l: 'Late', c: '#F59E0B', v: '7%' }, { l: 'Absent', c: '#EF4444', v: '4%' }].map(d => (
                      <div key={d.l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: d.c }} />
                          <span style={{ fontSize: 8.5, color: '#4B5563' }}>{d.l}</span>
                        </div>
                        <span style={{ fontSize: 8.5, fontWeight: 600, color: d.c }}>{d.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ───────────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(64px,7vw,96px) max(32px, calc((100vw - 1100px) / 2))', background: '#F8FAFC' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ maxWidth: 540, marginBottom: 52 }}>
            <p style={{ fontSize: 11.5, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Platform</p>
            <h2 style={{ fontSize: 'clamp(26px,3.5vw,44px)', fontWeight: 800, letterSpacing: '-0.035em', color: '#111827', lineHeight: 1.1, marginBottom: 16 }}>
              Everything your HR team needs
            </h2>
            <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.65 }}>
              From hiring to payslip, Veltrix covers the full employee lifecycle with Philippine-specific compliance baked in from day one.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '26px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'box-shadow 0.15s, transform 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.09)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <Icon style={{ width: 19, height: 19, color: f.color }} />
                  </div>
                  <h3 style={{ fontSize: 14.5, fontWeight: 700, color: '#111827', marginBottom: 7 }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── PH Compliance ──────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(64px,7vw,88px) max(32px, calc((100vw - 1100px) / 2))', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(40px,6vw,88px)', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 11.5, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Compliance</p>
            <h2 style={{ fontSize: 'clamp(24px,3.2vw,40px)', fontWeight: 800, letterSpacing: '-0.035em', color: '#111827', lineHeight: 1.1, marginBottom: 16 }}>
              Built for the Philippines.<br />100% compliant.
            </h2>
            <p style={{ fontSize: 15.5, color: '#6B7280', lineHeight: 1.7, marginBottom: 32 }}>
              Veltrix automatically computes all mandatory Philippine government contributions and withholding tax — no manual tables, no calculation errors, no compliance risk.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {COMPLIANCE.map(c => (
                <div key={c.label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <CheckCircle2 style={{ width: 12, height: 12, color: '#16A34A' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{c.label}</div>
                    <div style={{ fontSize: 12.5, color: '#9CA3AF', marginTop: 1 }}>{c.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* payslip card */}
          <div style={{ background: 'linear-gradient(145deg, #060B18 0%, #0D1730 100%)', borderRadius: 16, padding: 28, border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Sample Payslip · May 2026</p>
              <p style={{ fontSize: 17, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.025em' }}>Juan Dela Cruz</p>
              <p style={{ fontSize: 12, color: '#4B5563', marginTop: 2 }}>Software Engineer · Engineering</p>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 14, marginBottom: 14 }}>
              {[
                { l: 'Basic Salary',        v: '₱35,000',   t: 'income' },
                { l: 'Overtime Pay',         v: '+₱2,800',  t: 'income' },
                { l: 'SSS Contribution',     v: '−₱1,400',  t: 'deduct' },
                { l: 'PhilHealth 5%',        v: '−₱875',    t: 'deduct' },
                { l: 'Pag-IBIG 2%',         v: '−₱200',    t: 'deduct' },
                { l: 'Withholding Tax',      v: '−₱3,240',  t: 'deduct' },
              ].map(r => (
                <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12.5, color: '#4B5563' }}>{r.l}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: r.t === 'deduct' ? '#F87171' : '#CBD5E1' }}>{r.v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.24)', borderRadius: 9, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#93C5FD' }}>Net Pay</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#60A5FA', letterSpacing: '-0.04em' }}>₱32,085</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── RFID feature callout ────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px,6vw,80px) max(32px, calc((100vw - 1100px) / 2))', background: '#F8FAFC', borderTop: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 'clamp(32px,5vw,72px)', alignItems: 'center' }}>
          <div style={{ flex: '1 1 340px' }}>
            <p style={{ fontSize: 11.5, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>RFID Attendance</p>
            <h2 style={{ fontSize: 'clamp(24px,3vw,38px)', fontWeight: 800, letterSpacing: '-0.035em', color: '#111827', lineHeight: 1.1, marginBottom: 16 }}>
              Tap to clock in.<br />No PIN to remember.
            </h2>
            <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.7, marginBottom: 24 }}>
              Your employees just tap their ID card on the RFID reader. Veltrix handles the rest — late detection, grace periods, overtime computation — automatically.
            </p>
            <button
              onClick={() => navigate('/kiosk')}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 7, background: '#7C3AED', color: '#fff', fontWeight: 600, fontSize: 13.5, border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#6D28D9')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#7C3AED')}
            >
              See the Kiosk <ArrowRight style={{ width: 13, height: 13 }} />
            </button>
          </div>

          <div style={{ flex: '1 1 280px', display: 'flex', justifyContent: 'center' }}>
            {/* kiosk preview card */}
            <div style={{ width: 260, background: '#0D1117', borderRadius: 16, padding: 28, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', textAlign: 'center' }}>
              {/* pulsing rings */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, height: 110 }}>
                <div style={{ position: 'absolute', width: 110, height: 110, borderRadius: '50%', border: '1.5px solid rgba(37,99,235,0.25)', animation: 'ping 2s infinite' }} />
                <div style={{ position: 'absolute', width: 86, height: 86, borderRadius: '50%', border: '1.5px solid rgba(37,99,235,0.15)', animation: 'ping 2s 0.5s infinite' }} />
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(37,99,235,0.12)', border: '1.5px solid rgba(37,99,235,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard style={{ width: 30, height: 30, color: '#60A5FA' }} />
                </div>
              </div>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em', marginBottom: 6 }}>Tap Your RFID Card</p>
              <p style={{ fontSize: 11.5, color: '#374151', lineHeight: 1.5 }}>Hold your ID near the reader to record attendance</p>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
                <span style={{ fontSize: 10, color: '#374151', fontWeight: 500 }}>Reader active</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Security strip ──────────────────────────────────────────────────── */}
      <section style={{ padding: '32px max(32px, calc((100vw - 1100px) / 2))', background: '#fff', borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield style={{ width: 16, height: 16, color: '#059669' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Data stays in the browser</span>
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>— No server, no cloud upload</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 28px' }}>
            {['🇵🇭 PH Compliant', 'SSS 2024', 'PhilHealth 5%', 'Pag-IBIG 2%', 'TRAIN Law BIR'].map(t => (
              <span key={t} style={{ fontSize: 12.5, fontWeight: 500, color: '#6B7280' }}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(64px,8vw,100px) max(32px, calc((100vw - 1100px) / 2))',
        background: 'linear-gradient(145deg, #060B18 0%, #0D1730 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -120, right: -80, width: 500, height: 500, background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: '20%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(37,99,235,0.10) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 24 }}>
            <Zap style={{ width: 14, height: 14, color: '#FBBF24' }} />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Streamline your HR today</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,54px)', fontWeight: 900, letterSpacing: '-0.045em', color: '#F8FAFC', lineHeight: 1.04, marginBottom: 20 }}>
            Start managing payroll the right way
          </h2>
          <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.7, marginBottom: 40 }}>
            Built specifically for Filipino businesses. Veltrix takes care of compliance so your team can focus on people.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 8, background: '#2563EB', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#1D4ED8')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#2563EB')}
            >
              {user ? 'Go to Dashboard' : 'Sign in to Veltrix'} <ArrowRight style={{ width: 15, height: 15 }} />
            </button>
            <button
              onClick={() => navigate('/kiosk')}
              style={{ padding: '14px 28px', borderRadius: 8, background: 'transparent', color: '#9CA3AF', fontWeight: 600, fontSize: 15, border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = '#fff' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#9CA3AF' }}
            >
              View Employee Kiosk
            </button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────────────── */}
      <footer style={{ background: '#0D1117', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '22px max(32px, calc((100vw - 1100px) / 2))', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#2563EB,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#fff' }}>V</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', letterSpacing: '-0.025em' }}>Veltrix</span>
        </div>
        <p style={{ fontSize: 12, color: '#374151' }}>© {new Date().getFullYear()} Veltrix · Built for Filipino businesses</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px' }}>
          {['🇵🇭 PH Compliant', 'SSS 2024', 'PhilHealth', 'TRAIN Law'].map(t => (
            <span key={t} style={{ fontSize: 11, color: '#374151', fontWeight: 500 }}>{t}</span>
          ))}
        </div>
      </footer>
    </div>
  )
}
