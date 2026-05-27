import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Clock, Calendar,
  Umbrella, Timer, BarChart2, Settings, LogOut, ChevronDown,
  Shield, Monitor, Banknote,
} from 'lucide-react'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { getCompanySettings } from '../../lib/db'
import type { UserRole } from '../../types'

interface NavChild { label: string; to: string; end?: boolean }
interface NavItem {
  label: string
  to: string
  icon: React.ElementType
  roles: UserRole[]
  children?: NavChild[]
  section: string
}

const NAV: NavItem[] = [
  // ── OVERVIEW ──
  {
    label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard,
    roles: ['super-admin','hr-admin','payroll-officer','dept-head'], section: 'OVERVIEW',
  },
  {
    label: 'Kiosk', to: '/kiosk', icon: Monitor,
    roles: ['super-admin','hr-admin'], section: 'OVERVIEW',
  },

  // ── WORKFORCE ──
  {
    label: 'Employees', to: '/employees', icon: Users,
    roles: ['super-admin','hr-admin'], section: 'WORKFORCE',
    children: [
      { label: 'Directory',    to: '/employees', end: true },
      { label: 'Add Employee', to: '/employees/new' },
    ],
  },
  {
    label: 'Attendance', to: '/attendance', icon: Clock,
    roles: ['super-admin','hr-admin','payroll-officer'], section: 'WORKFORCE',
    children: [
      { label: "Today's Log",    to: '/attendance',     end: true },
      { label: 'Attendance Log', to: '/attendance/log' },
    ],
  },
  {
    label: 'Leave Management', to: '/leaves', icon: Umbrella,
    roles: ['super-admin','hr-admin','dept-head'], section: 'WORKFORCE',
  },
  {
    label: 'Overtime', to: '/overtime', icon: Timer,
    roles: ['super-admin','hr-admin','dept-head'], section: 'WORKFORCE',
  },
  {
    label: 'Schedules', to: '/schedules', icon: Calendar,
    roles: ['super-admin','hr-admin'], section: 'WORKFORCE',
    children: [
      { label: 'Work Shifts', to: '/schedules/shifts' },
      { label: 'Holidays',    to: '/schedules/holidays' },
    ],
  },

  // ── PAYROLL ──
  {
    label: 'Payroll Runs', to: '/payroll', icon: Banknote,
    roles: ['super-admin','hr-admin','payroll-officer'], section: 'PAYROLL',
    children: [
      { label: 'Pay Runs', to: '/payroll', end: true },
    ],
  },
  {
    label: 'Reports', to: '/reports', icon: BarChart2,
    roles: ['super-admin','hr-admin','payroll-officer'], section: 'PAYROLL',
  },

  // ── SYSTEM ──
  {
    label: 'Audit Logs', to: '/audit-log', icon: Shield,
    roles: ['super-admin'], section: 'SYSTEM',
  },
  {
    label: 'Settings', to: '/settings', icon: Settings,
    roles: ['super-admin'], section: 'SYSTEM',
  },
]

const SECTIONS = ['OVERVIEW', 'WORKFORCE', 'PAYROLL', 'SYSTEM'] as const
const SECTION_LABELS: Record<string, string> = {
  OVERVIEW:  'Overview',
  WORKFORCE: 'Workforce',
  PAYROLL:   'Payroll',
  SYSTEM:    'System',
}

const ROLE_COLORS: Record<string, string> = {
  'super-admin':     '#A78BFA',
  'hr-admin':        '#60A5FA',
  'payroll-officer': '#34D399',
  'dept-head':       '#FDBA74',
  'employee':        '#94A3B8',
}
const ROLE_LABELS: Record<string, string> = {
  'super-admin':     'Super Admin',
  'hr-admin':        'HR Admin',
  'payroll-officer': 'Payroll Officer',
  'dept-head':       'Dept Head',
  'employee':        'Employee',
}

/* ── Sidebar color palette ── */
const SB = {
  BG:         '#0D0E14',
  BORDER:     'rgba(255,255,255,0.06)',
  TEXT:       '#94A3B8',
  TEXT_HOVER: '#CBD5E1',
  TEXT_ACT:   '#E2E8F0',
  HOVER_BG:   'rgba(255,255,255,0.05)',
  ACT_BG:     'rgba(79,70,229,0.12)',
  ACT_BORDER: '#4F46E5',
  SECT:       'rgba(255,255,255,0.25)',
  CHILD:      '#64748B',
  CHILD_H:    '#94A3B8',
  CHILD_A:    '#A5B4FC',  // indigo-300
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

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const company = getCompanySettings()
  const [openMenus, setOpenMenus] = useState<string[]>(['Employees','Attendance','Payroll Runs','Schedules'])

  const visible = NAV.filter(n => user && n.roles.includes(user.role as UserRole))
  const toggle  = (label: string) =>
    setOpenMenus(p => p.includes(label) ? p.filter(l => l !== label) : [...p, label])

  const handleLogout = () => { logout(); navigate('/kiosk') }
  const roleColor = user ? (ROLE_COLORS[user.role] ?? '#94A3B8') : '#94A3B8'
  const roleLabel = user ? (ROLE_LABELS[user.role] ?? user.role) : ''
  const avatarBg  = user ? avatarColor(user.id ?? user.email ?? 'x') : '#4F46E5'

  return (
    <aside
      className={`fixed top-0 left-0 h-screen flex flex-col z-30 transition-all duration-300
        ${collapsed ? 'w-[64px]' : 'w-[240px]'}`}
      style={{ background: SB.BG, borderRight: `1px solid ${SB.BORDER}` }}
    >

      {/* ── Brand ── */}
      <div
        className={`flex items-center flex-shrink-0 h-[56px]
          ${collapsed ? 'justify-center px-0' : 'px-4 gap-3'}`}
        style={{ borderBottom: `1px solid ${SB.BORDER}` }}
      >
        <img
          src="/Veltrix.png"
          alt="TenPayroll"
          style={{ width: 30, height: 30, objectFit: 'contain', flexShrink: 0 }}
        />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p
              className="text-white leading-none truncate"
              style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.03em' }}
            >
              TenPayroll
            </p>
            <p
              className="truncate mt-0.5"
              style={{ fontSize: 10.5, color: SB.SECT, fontWeight: 500, lineHeight: 1.2 }}
            >
              {company.name || 'HR & Payroll System'}
            </p>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: 'none' }}>
        {SECTIONS.map((section, si) => {
          const items = visible.filter(n => n.section === section)
          if (!items.length) return null

          return (
            <div key={section} style={{ marginBottom: 2 }}>
              {/* Section label / divider */}
              {!collapsed ? (
                <p
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: SB.SECT,
                    padding: si === 0 ? '8px 16px 4px' : '14px 16px 4px',
                  }}
                >
                  {SECTION_LABELS[section]}
                </p>
              ) : (
                si > 0 && (
                  <div style={{ margin: '8px 14px 6px', height: 1, background: SB.BORDER }} />
                )
              )}

              <div style={{ padding: '0 8px' }}>
                {items.map(item => {
                  const Icon    = item.icon
                  const hasKids = !!item.children && !collapsed
                  const isOpen  = openMenus.includes(item.label)

                  if (hasKids) {
                    return (
                      <div key={item.label} style={{ marginBottom: 1 }}>
                        {/* Expandable parent */}
                        <button
                          onClick={() => toggle(item.label)}
                          className="w-full flex items-center justify-between"
                          style={{
                            padding: '0 10px',
                            height: 36,
                            borderRadius: 8,
                            fontSize: 13.5,
                            fontWeight: 400,
                            color: SB.TEXT,
                            background: 'transparent',
                            cursor: 'pointer',
                            transition: 'background 0.12s, color 0.12s',
                            letterSpacing: '-0.01em',
                          }}
                          onMouseEnter={e => {
                            const el = e.currentTarget as HTMLElement
                            el.style.background = SB.HOVER_BG
                            el.style.color = SB.TEXT_HOVER
                          }}
                          onMouseLeave={e => {
                            const el = e.currentTarget as HTMLElement
                            el.style.background = 'transparent'
                            el.style.color = SB.TEXT
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Icon style={{ width: 16, height: 16, flexShrink: 0, opacity: 0.55 }} />
                            <span>{item.label}</span>
                          </div>
                          <ChevronDown
                            style={{
                              width: 13, height: 13,
                              color: SB.SECT,
                              flexShrink: 0,
                              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.18s',
                            }}
                          />
                        </button>

                        {/* Animated children */}
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div style={{ paddingBottom: 4 }}>
                                {item.children!.map(child => (
                                  <NavLink
                                    key={child.to}
                                    to={child.to}
                                    end={child.end}
                                    style={{ display: 'block', textDecoration: 'none' }}
                                  >
                                    {({ isActive }) => (
                                      <div
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 8,
                                          padding: '0 10px 0 36px',
                                          height: 32,
                                          borderRadius: 7,
                                          fontSize: 13,
                                          fontWeight: isActive ? 500 : 400,
                                          color: isActive ? SB.CHILD_A : SB.CHILD,
                                          background: isActive ? 'rgba(79,70,229,0.10)' : 'transparent',
                                          cursor: 'pointer',
                                          transition: 'background 0.12s, color 0.12s',
                                          letterSpacing: '-0.01em',
                                        }}
                                        onMouseEnter={e => {
                                          if (!isActive) {
                                            (e.currentTarget as HTMLElement).style.color = SB.CHILD_H
                                            ;(e.currentTarget as HTMLElement).style.background = SB.HOVER_BG
                                          }
                                        }}
                                        onMouseLeave={e => {
                                          if (!isActive) {
                                            (e.currentTarget as HTMLElement).style.color = SB.CHILD
                                            ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                                          }
                                        }}
                                      >
                                        <span
                                          style={{
                                            width: 4, height: 4,
                                            borderRadius: '50%',
                                            background: isActive ? SB.CHILD_A : SB.CHILD,
                                            flexShrink: 0,
                                            opacity: isActive ? 1 : 0.6,
                                          }}
                                        />
                                        {child.label}
                                      </div>
                                    )}
                                  </NavLink>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  }

                  // ── Leaf item ──
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/dashboard'}
                      title={collapsed ? item.label : undefined}
                      style={{ display: 'block', textDecoration: 'none', marginBottom: 1 }}
                    >
                      {({ isActive }) => (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: collapsed ? 0 : 10,
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            padding: collapsed ? '0' : '0 10px',
                            height: 36,
                            borderRadius: 8,
                            fontSize: 13.5,
                            fontWeight: isActive ? 500 : 400,
                            color: isActive ? SB.TEXT_ACT : SB.TEXT,
                            background: isActive ? SB.ACT_BG : 'transparent',
                            cursor: 'pointer',
                            transition: 'background 0.12s, color 0.12s',
                            letterSpacing: '-0.01em',
                            position: 'relative',
                          }}
                          onMouseEnter={e => {
                            if (!isActive) {
                              (e.currentTarget as HTMLElement).style.background = SB.HOVER_BG
                              ;(e.currentTarget as HTMLElement).style.color = SB.TEXT_HOVER
                            }
                          }}
                          onMouseLeave={e => {
                            if (!isActive) {
                              (e.currentTarget as HTMLElement).style.background = 'transparent'
                              ;(e.currentTarget as HTMLElement).style.color = SB.TEXT
                            }
                          }}
                        >
                          {/* Active left border indicator */}
                          {isActive && (
                            <div
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: '20%',
                                bottom: '20%',
                                width: 2,
                                borderRadius: '0 2px 2px 0',
                                background: SB.ACT_BORDER,
                              }}
                            />
                          )}
                          <Icon
                            style={{
                              width: 16, height: 16,
                              flexShrink: 0,
                              color: isActive ? '#A5B4FC' : 'inherit',
                              opacity: isActive ? 1 : 0.55,
                            }}
                          />
                          {!collapsed && <span>{item.label}</span>}
                        </div>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* ── User panel ── */}
      <div style={{ borderTop: `1px solid ${SB.BORDER}`, flexShrink: 0 }}>
        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? 0 : 10,
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '12px 0' : '10px 12px',
            }}
          >
            {/* Avatar */}
            <div
              title={collapsed ? user.name : undefined}
              style={{
                width: 32, height: 32,
                background: avatarBg,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {user.avatarInitials}
            </div>

            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: '#E2E8F0',
                    lineHeight: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {user.name}
                </p>
                <p style={{ fontSize: 10.5, fontWeight: 500, color: roleColor, marginTop: 3, lineHeight: 1 }}>
                  {roleLabel}
                </p>
              </div>
            )}

            {!collapsed && (
              <button
                onClick={handleLogout}
                title="Sign Out"
                style={{
                  width: 28, height: 28,
                  borderRadius: 7,
                  color: SB.SECT,
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'color 0.12s, background 0.12s',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.color = '#EF4444'
                  el.style.background = 'rgba(239,68,68,0.1)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.color = SB.SECT
                  el.style.background = 'transparent'
                }}
              >
                <LogOut style={{ width: 14, height: 14, flexShrink: 0 }} />
              </button>
            )}
          </div>
        )}

        {/* Collapsed sign out */}
        {user && collapsed && (
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="w-full flex justify-center"
            style={{
              padding: '10px 0',
              color: SB.SECT,
              background: 'transparent',
              cursor: 'pointer',
              borderTop: `1px solid ${SB.BORDER}`,
              transition: 'color 0.12s, background 0.12s',
              border: 'none',
              borderTopStyle: 'solid',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.color = '#EF4444'
              el.style.background = 'rgba(239,68,68,0.08)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.color = SB.SECT
              el.style.background = 'transparent'
            }}
          >
            <LogOut style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>
    </aside>
  )
}
