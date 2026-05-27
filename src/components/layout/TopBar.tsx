import { Menu, LogOut, Monitor, ChevronDown, Search } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useNavigate, useLocation } from 'react-router-dom'

const ROLE_LABELS: Record<string, string> = {
  'super-admin':     'Super Admin',
  'hr-admin':        'HR Admin',
  'payroll-officer': 'Payroll Officer',
  'dept-head':       'Dept Head',
  'employee':        'Employee',
}

const ROLE_PILL_COLORS: Record<string, { bg: string; text: string }> = {
  'super-admin':     { bg: '#F5F3FF', text: '#7C3AED' },
  'hr-admin':        { bg: '#EFF6FF', text: '#2563EB' },
  'payroll-officer': { bg: '#ECFDF5', text: '#059669' },
  'dept-head':       { bg: '#FFFBEB', text: '#D97706' },
  'employee':        { bg: '#F1F5F9', text: '#64748B' },
}

function getPageTitle(pathname: string): { section?: string; title: string } {
  const map: Record<string, { section?: string; title: string }> = {
    '/dashboard':          { title: 'Dashboard' },
    '/employees':          { section: 'Workforce', title: 'Employee Directory' },
    '/employees/new':      { section: 'Employees', title: 'New Employee' },
    '/attendance':         { section: 'Workforce', title: "Today's Attendance" },
    '/attendance/log':     { section: 'Attendance', title: 'Attendance Log' },
    '/leaves':             { section: 'Workforce', title: 'Leave Management' },
    '/overtime':           { section: 'Workforce', title: 'Overtime Requests' },
    '/schedules/shifts':   { section: 'Schedules', title: 'Work Shifts' },
    '/schedules/holidays': { section: 'Schedules', title: 'Holidays' },
    '/payroll':            { section: 'Payroll', title: 'Payroll Runs' },
    '/reports':            { section: 'Payroll', title: 'Reports & Analytics' },
    '/audit-log':          { section: 'System', title: 'Audit Logs' },
    '/settings':           { section: 'System', title: 'Settings' },
  }
  if (map[pathname]) return map[pathname]
  if (pathname.startsWith('/employees/') && pathname.endsWith('/edit'))
    return { section: 'Employees', title: 'Edit Employee' }
  if (pathname.startsWith('/employees/'))
    return { section: 'Employees', title: 'Employee Profile' }
  if (pathname.startsWith('/payroll/') && pathname.includes('/payslip/'))
    return { section: 'Payroll', title: 'Payslip' }
  if (pathname.startsWith('/payroll/'))
    return { section: 'Payroll', title: 'Payroll Detail' }
  return { title: 'TenPayroll' }
}

function avatarColor(id: string) {
  const PALETTE = [
    '#4F46E5','#7C3AED','#059669','#D97706',
    '#DC2626','#0891B2','#BE185D','#0D9488',
    '#2563EB','#B45309','#16A34A','#9333EA',
  ]
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

export function TopBar({ onToggle }: { onToggle: () => void; collapsed?: boolean }) {
  const { user, logout } = useAuthStore()
  const navigate   = useNavigate()
  const location   = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/kiosk'); setMenuOpen(false) }
  const page = getPageTitle(location.pathname)
  const rolePill = user ? (ROLE_PILL_COLORS[user.role] ?? { bg: '#F1F5F9', text: '#64748B' }) : { bg: '#F1F5F9', text: '#64748B' }
  const avatarBg = user ? avatarColor(user.id ?? user.email ?? 'x') : '#4F46E5'

  return (
    <header
      className="no-print flex items-center gap-3 px-5 flex-shrink-0 z-20 bg-white"
      style={{ height: 56, borderBottom: '1px solid #E2E8F0' }}
    >
      {/* ── Sidebar toggle ── */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center transition-all rounded-lg flex-shrink-0"
        style={{ width: 32, height: 32, color: '#94A3B8', background: 'transparent' }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = '#F1F5F9'
          ;(e.currentTarget as HTMLElement).style.color = '#475569'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = 'transparent'
          ;(e.currentTarget as HTMLElement).style.color = '#94A3B8'
        }}
        aria-label="Toggle sidebar"
      >
        <Menu style={{ width: 16, height: 16 }} />
      </button>

      {/* ── Page breadcrumb + title ── */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {page.section && (
          <>
            <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, letterSpacing: '-0.01em' }}
              className="hidden sm:inline select-none">
              {page.section}
            </span>
            <span style={{ color: '#CBD5E1', fontSize: 14 }} className="hidden sm:inline select-none">/</span>
          </>
        )}
        <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', letterSpacing: '-0.02em' }}>
          {page.title}
        </span>
      </div>

      {/* ── Center: Search bar ── */}
      <div className="flex-1 hidden md:flex justify-center px-4">
        <div
          className="relative flex items-center"
          style={{ width: '100%', maxWidth: 320 }}
        >
          <Search
            style={{
              position: 'absolute', left: 11, width: 14, height: 14,
              color: '#94A3B8', pointerEvents: 'none', flexShrink: 0,
            }}
          />
          <input
            type="text"
            placeholder="Search… ⌘K"
            readOnly
            style={{
              width: '100%',
              height: 34,
              paddingLeft: 34,
              paddingRight: 12,
              background: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
              borderRadius: 8,
              fontSize: 13,
              color: '#94A3B8',
              outline: 'none',
              cursor: 'pointer',
              letterSpacing: '-0.01em',
            }}
          />
        </div>
      </div>

      {/* ── Right controls ── */}
      <div className="flex-shrink-0 flex items-center gap-2 ml-auto">

        {/* ── Kiosk shortcut ── */}
        <button
          onClick={() => navigate('/kiosk')}
          className="hidden sm:flex items-center gap-1.5 transition-all"
          style={{
            height: 30,
            padding: '0 12px',
            background: '#EEF2FF',
            color: '#4F46E5',
            borderRadius: 8,
            border: '1.5px solid #C7D2FE',
            fontSize: 12.5,
            fontWeight: 500,
            flexShrink: 0,
            letterSpacing: '-0.01em',
          }}
          title="Open Attendance Kiosk"
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = '#E0E7FF'
            ;(e.currentTarget as HTMLElement).style.borderColor = '#A5B4FC'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = '#EEF2FF'
            ;(e.currentTarget as HTMLElement).style.borderColor = '#C7D2FE'
          }}
        >
          <Monitor style={{ width: 13, height: 13 }} />
          <span>Kiosk</span>
        </button>

        {/* ── Divider ── */}
        <div style={{ width: 1, height: 20, background: '#E2E8F0', flexShrink: 0, marginLeft: 2 }} />

        {/* ── User dropdown ── */}
        {user && (
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="flex items-center gap-2 transition-all rounded-lg"
              style={{ padding: '4px 8px 4px 4px' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#F8FAFC')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
            >
              {/* Avatar */}
              <div
                className="flex-shrink-0 flex items-center justify-center text-white font-bold"
                style={{
                  width: 30, height: 30,
                  background: avatarBg,
                  borderRadius: '50%',
                  fontSize: 10,
                  letterSpacing: '-0.01em',
                  fontWeight: 700,
                }}
              >
                {user.avatarInitials}
              </div>
              <div className="hidden sm:block text-left">
                <p style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A', lineHeight: 1, letterSpacing: '-0.01em' }}>
                  {user.name}
                </p>
                <p style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2, lineHeight: 1 }}>
                  {ROLE_LABELS[user.role] ?? user.role}
                </p>
              </div>
              <ChevronDown
                style={{ width: 12, height: 12, color: '#CBD5E1' }}
                className="hidden sm:block flex-shrink-0"
              />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div
                  className="absolute right-0 top-full mt-1.5 bg-white z-50"
                  style={{
                    width: 210,
                    border: '1px solid #E2E8F0',
                    borderRadius: 12,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                  }}
                >
                  {/* User info */}
                  <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #F1F5F9' }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="flex-shrink-0 flex items-center justify-center text-white font-bold"
                        style={{
                          width: 36, height: 36,
                          background: avatarBg,
                          borderRadius: '50%',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {user.avatarInitials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', lineHeight: 1, letterSpacing: '-0.01em' }}>
                          {user.name}
                        </p>
                        <div style={{ marginTop: 4 }}>
                          <span style={{
                            display: 'inline-block',
                            fontSize: 10.5,
                            fontWeight: 500,
                            padding: '2px 8px',
                            borderRadius: 99,
                            background: rolePill.bg,
                            color: rolePill.text,
                          }}>
                            {ROLE_LABELS[user.role] ?? user.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div style={{ padding: '6px 0' }}>
                    <button
                      onClick={() => { navigate('/kiosk'); setMenuOpen(false) }}
                      className="flex items-center gap-2.5 w-full transition-colors"
                      style={{ padding: '8px 16px', fontSize: 13, color: '#475569', fontWeight: 500 }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#F8FAFC')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                    >
                      <Monitor style={{ width: 14, height: 14, color: '#94A3B8', flexShrink: 0 }} />
                      Open Kiosk
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full transition-colors"
                      style={{ padding: '8px 16px', fontSize: 13, color: '#DC2626', fontWeight: 500 }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#FEF2F2')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                    >
                      <LogOut style={{ width: 14, height: 14, flexShrink: 0 }} />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
