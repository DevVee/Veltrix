import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Clock, Umbrella, Timer,
  CheckCircle, XCircle, Banknote, BarChart2,
  ChevronRight, RefreshCw, Bell, UserPlus,
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  apiGetEmployees, apiGetTodayAttendance, apiGetPayrollPeriods,
  apiGetLeaves, apiGetOvertime,
} from '../../lib/db'
import { useAuthStore } from '../../store/authStore'
import { formatPeso } from '../../lib/payrollEngine'
import { KPICard } from '../../components/ui/KPICard'
import type { Employee, AttendanceRecord, PayrollPeriod, LeaveRequest, OvertimeRequest } from '../../types'

/* ── Avatar color ── */
const PALETTE = [
  '#4F46E5','#7C3AED','#059669','#D97706',
  '#DC2626','#0891B2','#BE185D','#0D9488',
  '#2563EB','#B45309','#16A34A','#9333EA',
]
function avatarColor(id: string) {
  let h = 0; for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h)
  return PALETTE[Math.abs(h) % PALETTE.length]
}

/* ── Status configs ── */
const ATT_STATUS: Record<string, { pill: string; label: string }> = {
  present:    { pill: 'pill pill-green',  label: 'Present'  },
  late:       { pill: 'pill pill-yellow', label: 'Late'     },
  absent:     { pill: 'pill pill-red',    label: 'Absent'   },
  'on-leave': { pill: 'pill pill-purple', label: 'On Leave' },
  'half-day': { pill: 'pill pill-orange', label: 'Half-Day' },
  'rest-day': { pill: 'pill pill-gray',   label: 'Rest Day' },
  holiday:    { pill: 'pill pill-blue',   label: 'Holiday'  },
}

const PAYROLL_STATUS: Record<string, { pill: string; label: string }> = {
  draft:    { pill: 'pill pill-gray',   label: 'Draft'        },
  reviewed: { pill: 'pill pill-yellow', label: 'For Approval' },
  approved: { pill: 'pill pill-indigo', label: 'Approved'     },
  paid:     { pill: 'pill pill-green',  label: 'Paid'         },
}

/* ── Quick action ── */
function QuickAction({ icon: Icon, label, color, onClick }: {
  icon: React.ElementType; label: string; color: string; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-3 transition-all duration-150"
      style={{ borderRadius: 10, background: 'transparent' }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
    >
      <div
        className="icon-circle"
        style={{ width: 38, height: 38, background: `${color}15` }}
      >
        <Icon style={{ width: 16, height: 16, color }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 500, color: '#64748B', textAlign: 'center', lineHeight: 1.3 }}>
        {label}
      </span>
    </button>
  )
}

/* ══════════════════════════════════════════════════════════════════════════ */
export function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [employees, setEmployees] = useState<Employee[]>([])
  const [todayAtt,  setTodayAtt]  = useState<AttendanceRecord[]>([])
  const [periods,   setPeriods]   = useState<PayrollPeriod[]>([])
  const [leaves,    setLeaves]    = useState<LeaveRequest[]>([])
  const [otReqs,    setOtReqs]    = useState<OvertimeRequest[]>([])
  const [loading,   setLoading]   = useState(true)

  const load = () => {
    setLoading(true)
    Promise.all([
      apiGetEmployees({ status: 'active' }),
      apiGetTodayAttendance(),
      apiGetPayrollPeriods(),
      apiGetLeaves({ status: 'pending' }),
      apiGetOvertime({ status: 'pending' }),
    ]).then(([emps, att, pds, lv, ot]) => {
      setEmployees(emps); setTodayAtt(att); setPeriods(pds)
      setLeaves(lv); setOtReqs(ot); setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  /* ── Greeting ── */
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  /* ── Date string ── */
  const today   = new Date()
  const dateStr = today.toLocaleDateString('en-PH', {
    month: 'long', day: 'numeric', year: 'numeric', weekday: 'short',
  })

  /* ── Attendance calculations ── */
  const working   = todayAtt.filter(a => a.status !== 'rest-day' && a.status !== 'holiday')
  const present   = working.filter(a => a.status === 'present' || a.status === 'late').length
  const late      = working.filter(a => a.status === 'late').length
  const absent    = working.filter(a => a.status === 'absent').length
  const onLeave   = working.filter(a => a.status === 'on-leave').length
  const attPct    = working.length > 0 ? Math.round((present / working.length) * 100) : 0

  /* ── Payroll ── */
  const lastPeriod      = periods[0]
  const pendingPayrolls = periods.filter(p => p.status === 'draft' || p.status === 'reviewed').length
  const totalPending    = leaves.length + otReqs.length + pendingPayrolls

  /* ── Dept breakdown ── */
  const deptMap = employees.reduce<Record<string, number>>((acc, e) => {
    acc[e.department] = (acc[e.department] ?? 0) + 1; return acc
  }, {})

  /* ── Donut chart ── */
  const donutData = [
    { name: 'Present',  value: present - late, color: '#059669' },
    { name: 'Late',     value: late,           color: '#D97706' },
    { name: 'Absent',   value: absent,         color: '#DC2626' },
    { name: 'On Leave', value: onLeave,        color: '#4F46E5' },
  ].filter(d => d.value > 0)
  const donutTotal = working.length

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="spinner" />
    </div>
  )

  return (
    <div className="space-y-6">

      {/* ── Greeting header ── */}
      <motion.div
        className="flex items-start justify-between gap-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div>
          <h1
            className="font-bold leading-tight"
            style={{ fontSize: 22, letterSpacing: '-0.03em', color: '#0F172A' }}
          >
            {greeting}, {firstName}! 👋
          </h1>
          <p style={{ fontSize: 13.5, color: '#94A3B8', marginTop: 4 }}>
            Here's what's happening in your organization today.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Date badge */}
          <div
            className="hidden md:flex items-center gap-2"
            style={{
              padding: '6px 14px',
              background: 'var(--color-indigo-light)',
              border: '1px solid var(--color-indigo-medium)',
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--color-indigo)',
              letterSpacing: '-0.01em',
            }}
          >
            <Clock style={{ width: 13, height: 13 }} />
            {dateStr}
          </div>

          {/* Pending items */}
          {totalPending > 0 && (
            <button
              onClick={() => navigate('/leaves')}
              className="flex items-center gap-2 transition-colors"
              style={{
                padding: '6px 14px',
                background: '#FFFBEB',
                border: '1.5px solid #FDE68A',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 600,
                color: '#92400E',
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#FDE68A')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#FFFBEB')}
            >
              <Bell style={{ width: 13, height: 13 }} />
              {totalPending} pending item{totalPending !== 1 ? 's' : ''}
            </button>
          )}

          {/* Refresh */}
          <button
            onClick={load}
            className="flex items-center justify-center transition-all"
            style={{
              width: 34, height: 34, borderRadius: 8,
              color: '#94A3B8', background: 'white',
              border: '1.5px solid #E2E8F0',
            }}
            title="Refresh"
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = '#F1F5F9'
              ;(e.currentTarget as HTMLElement).style.color = '#475569'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'white'
              ;(e.currentTarget as HTMLElement).style.color = '#94A3B8'
            }}
          >
            <RefreshCw style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </motion.div>

      {/* ── KPI Cards ── */}
      <motion.div
        className="grid grid-cols-2 xl:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.05 }}
      >
        <KPICard
          label="Active Employees"
          value={employees.length}
          sub={`${Object.keys(deptMap).length} department${Object.keys(deptMap).length !== 1 ? 's' : ''}`}
          badge="+3 this month"
          iconColor="#7C3AED"
          icon={Users}
          onClick={() => navigate('/employees')}
        />
        <KPICard
          label="Present Today"
          value={`${present} / ${working.length}`}
          sub={`${late > 0 ? `${late} late · ` : ''}${absent} absent`}
          badge={`${attPct}%`}
          iconColor="#059669"
          icon={CheckCircle}
          onClick={() => navigate('/attendance')}
        />
        <KPICard
          label="Pending Approvals"
          value={leaves.length + otReqs.length}
          sub={`${leaves.length} leave · ${otReqs.length} overtime`}
          iconColor="#D97706"
          icon={Bell}
          onClick={() => navigate('/leaves')}
        />
        <KPICard
          label="Payroll Pending"
          value={pendingPayrolls}
          sub={lastPeriod
            ? `${lastPeriod.frequency} · ${lastPeriod.startDate} – ${lastPeriod.endDate}`
            : 'No pay runs yet'
          }
          badge={pendingPayrolls > 0 ? 'Review' : undefined}
          iconColor="#4F46E5"
          icon={Banknote}
          onClick={() => navigate('/payroll')}
        />
      </motion.div>

      {/* ── Main grid ── */}
      <motion.div
        className="grid grid-cols-1 xl:grid-cols-[2.5fr_1.5fr] gap-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.1 }}
      >

        {/* ── Left: Today's Attendance table ── */}
        <div className="card overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center gap-3">
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
                Today's Attendance
              </h2>
              <span
                style={{
                  fontSize: 11.5, fontWeight: 600, color: 'var(--color-indigo)',
                  background: 'var(--color-indigo-light)',
                  padding: '3px 10px', borderRadius: 9999,
                  border: '1px solid var(--color-indigo-medium)',
                }}
              >
                {today.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <button
              onClick={() => navigate('/attendance/log')}
              className="flex items-center gap-1 font-semibold transition-colors"
              style={{ fontSize: 12.5, color: 'var(--color-indigo)', letterSpacing: '-0.01em' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-indigo-hover)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-indigo)')}
            >
              View all logs
              <ChevronRight style={{ width: 13, height: 13 }} />
            </button>
          </div>

          <div style={{ overflowX: 'auto', maxHeight: 350, overflowY: 'auto' }}>
            <table className="table-base w-full">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th className="hidden sm:table-cell">Department</th>
                  <th>Time In</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {working.slice(0, 15).map(a => {
                  const emp      = employees.find(e => e.id === a.employeeId)
                  const sc       = ATT_STATUS[a.status] ?? ATT_STATUS['rest-day']
                  const initials = a.employeeName.split(' ')
                    .filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                  const aColor   = avatarColor(a.employeeId ?? a.id)

                  return (
                    <tr key={a.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar avatar-sm avatar-round flex-shrink-0" style={{ background: aColor }}>
                            {initials}
                          </div>
                          <div>
                            <p style={{ fontSize: 13.5, fontWeight: 600, color: '#0F172A', lineHeight: 1, letterSpacing: '-0.01em' }}>
                              {a.employeeName}
                            </p>
                            <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                              {a.employeeNo ?? emp?.employeeNo ?? '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell">
                        <span style={{ fontSize: 13, color: '#64748B' }}>
                          {emp?.department?.split(' ').slice(0, 2).join(' ') ?? '—'}
                        </span>
                      </td>
                      <td>
                        <span className="tabular-nums" style={{ fontSize: 13, color: '#475569' }}>
                          {a.timeIn
                            ? new Date(a.timeIn).toLocaleTimeString('en-PH', {
                                hour: '2-digit', minute: '2-digit', hour12: true,
                              })
                            : <span style={{ color: '#CBD5E1' }}>—</span>
                          }
                        </span>
                      </td>
                      <td>
                        <span className={sc.pill}>{sc.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {working.length === 0 && (
              <div className="flex flex-col items-center py-12 text-center">
                <Clock style={{ width: 36, height: 36, color: '#E2E8F0', marginBottom: 10 }} />
                <p style={{ fontSize: 13.5, fontWeight: 500, color: '#94A3B8', letterSpacing: '-0.01em' }}>
                  No attendance recorded yet
                </p>
                <p style={{ fontSize: 12, color: '#CBD5E1', marginTop: 3 }}>
                  Employees clock in via the Kiosk
                </p>
                <button onClick={() => navigate('/kiosk')} className="btn btn-primary btn-sm mt-4">
                  Open Kiosk
                </button>
              </div>
            )}
          </div>

          {/* Footer legend */}
          {working.length > 0 && (
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}
            >
              <div className="flex items-center gap-4 flex-wrap">
                {[
                  { label: 'Present', value: present, color: '#059669' },
                  { label: 'Late',    value: late,    color: '#D97706' },
                  { label: 'Absent',  value: absent,  color: '#DC2626' },
                  { label: 'Leave',   value: onLeave, color: '#4F46E5' },
                ].map(item => (
                  <span key={item.label} className="flex items-center gap-1.5" style={{ fontSize: 12 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.color, flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ color: '#64748B' }}>{item.label}</span>
                    <span style={{ fontWeight: 700, color: item.color }} className="tabular-nums">{item.value}</span>
                  </span>
                ))}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }} className="tabular-nums">
                {attPct}% rate
              </span>
            </div>
          )}
        </div>

        {/* ── Right panel ── */}
        <div className="space-y-4">

          {/* Attendance Overview — Donut */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
                Attendance Overview
              </h3>
              <span style={{
                fontSize: 11, fontWeight: 600, color: '#64748B',
                background: '#F1F5F9', padding: '3px 10px',
                borderRadius: 9999, border: '1px solid #E2E8F0',
              }}>
                Today
              </span>
            </div>

            {donutData.length > 0 ? (
              <>
                <div style={{ position: 'relative', height: 155 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%" cy="50%"
                        innerRadius={50} outerRadius={68}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          fontSize: 12, border: '1px solid #E2E8F0',
                          borderRadius: 8, boxShadow: '0 4px 6px rgba(0,0,0,0.06)',
                          padding: '6px 12px',
                        }}
                        formatter={(v: number, name: string) => [
                          `${v} (${Math.round((v / donutTotal) * 100)}%)`, name,
                        ]}
                      />
                      <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle"
                        style={{ fontSize: 22, fontWeight: 800, fill: '#0F172A' }}>
                        {donutTotal}
                      </text>
                      <text x="50%" y="59%" textAnchor="middle" dominantBaseline="middle"
                        style={{ fontSize: 9.5, fill: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Total
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2.5 mt-2">
                  {[
                    { label: 'Present',  value: present - late, color: '#059669' },
                    { label: 'Late',     value: late,           color: '#D97706' },
                    { label: 'Absent',   value: absent,         color: '#DC2626' },
                    { label: 'On Leave', value: onLeave,        color: '#4F46E5' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0, display: 'inline-block' }} />
                        <span style={{ fontSize: 12.5, color: '#64748B' }}>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A' }} className="tabular-nums">
                          {item.value}
                        </span>
                        <span style={{ fontSize: 11, color: '#94A3B8', width: 36, textAlign: 'right' }} className="tabular-nums">
                          ({donutTotal > 0 ? Math.round((item.value / donutTotal) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  className="flex items-center justify-between mt-3 pt-3"
                  style={{ borderTop: '1px solid var(--color-border)' }}
                >
                  <span style={{ fontSize: 11.5, color: '#94A3B8' }}>Attendance rate today</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>↑ {attPct}%</span>
                </div>
              </>
            ) : (
              <div className="h-40 flex items-center justify-center" style={{ color: '#CBD5E1', fontSize: 13 }}>
                No attendance data yet
              </div>
            )}
          </div>

          {/* Payroll Summary */}
          {lastPeriod && (
            <div className="card overflow-hidden">
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid var(--color-border)' }}
              >
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
                  Payroll Summary
                </h3>
                <span className={(PAYROLL_STATUS[lastPeriod.status] ?? PAYROLL_STATUS.draft).pill}>
                  {(PAYROLL_STATUS[lastPeriod.status] ?? PAYROLL_STATUS.draft).label}
                </span>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94A3B8', marginBottom: 6 }}>
                  Pay Run
                </p>
                <p style={{ fontSize: 13, color: '#475569', fontWeight: 500, marginBottom: 14, letterSpacing: '-0.01em' }}>
                  {new Date(lastPeriod.startDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                  {' – '}
                  {new Date(lastPeriod.endDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 12.5, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
                      Gross Payroll
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }} className="tabular-nums">
                      {formatPeso(lastPeriod.totalGross)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 12.5, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626', display: 'inline-block' }} />
                      Deductions
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#DC2626' }} className="tabular-nums">
                      − {formatPeso(lastPeriod.totalDeductions)}
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-between pt-2.5 mt-1"
                    style={{ borderTop: '1px solid var(--color-border)' }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 7, letterSpacing: '-0.01em' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4F46E5', display: 'inline-block' }} />
                      Net Payroll
                    </span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#4F46E5', letterSpacing: '-0.04em' }} className="tabular-nums">
                      {formatPeso(lastPeriod.totalNet)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: 12, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Users style={{ width: 12, height: 12 }} />
                    {lastPeriod.totalEmployees} employees
                  </span>
                  <button
                    onClick={() => navigate('/payroll')}
                    className="flex items-center gap-1 font-semibold transition-colors"
                    style={{ fontSize: 12, color: 'var(--color-indigo)' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-indigo-hover)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-indigo)')}
                  >
                    View payroll run <ChevronRight style={{ width: 12, height: 12 }} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card p-4">
            <p style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 6, padding: '0 4px', letterSpacing: '-0.01em' }}>
              Quick Actions
            </p>
            <div className="grid grid-cols-3 gap-0.5">
              <QuickAction icon={UserPlus}  label="Add Employee"  color="#7C3AED" onClick={() => navigate('/employees/new')} />
              <QuickAction icon={Umbrella}  label="Leave Request" color="#D97706" onClick={() => navigate('/leaves')} />
              <QuickAction icon={Timer}     label="OT Request"    color="#BE185D" onClick={() => navigate('/overtime')} />
              <QuickAction icon={Banknote}  label="Run Payroll"   color="#4F46E5" onClick={() => navigate('/payroll')} />
              <QuickAction icon={BarChart2} label="Reports"       color="#059669" onClick={() => navigate('/reports')} />
              <QuickAction icon={Users}     label="Employees"     color="#0891B2" onClick={() => navigate('/employees')} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Bottom: Pending requests ── */}
      {(leaves.length > 0 || otReqs.length > 0) && (
        <motion.div
          className="grid grid-cols-1 xl:grid-cols-2 gap-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.15 }}
        >

          {/* Leave Requests */}
          {leaves.length > 0 && (
            <div className="card overflow-hidden">
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid #FDE68A', background: '#FFFBEB' }}
              >
                <div className="flex items-center gap-2.5">
                  <Umbrella style={{ width: 15, height: 15, color: '#D97706' }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
                    Leave Requests
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: '#92400E',
                    background: '#FEF3C7', padding: '2px 8px', borderRadius: 99,
                    border: '1px solid #FDE68A',
                  }}>
                    {leaves.length}
                  </span>
                </div>
                <button
                  onClick={() => navigate('/leaves')}
                  style={{ fontSize: 12.5, color: 'var(--color-indigo)', fontWeight: 600 }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-indigo-hover)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-indigo)')}
                >
                  View all
                </button>
              </div>
              {leaves.slice(0, 5).map((l, i) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between px-5 py-3.5 transition-colors"
                  style={{
                    borderBottom: i < Math.min(leaves.length, 5) - 1 ? '1px solid var(--color-border)' : 'none',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#FAFAFA')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  <div className="flex items-center gap-3">
                    <div className="avatar avatar-sm avatar-round" style={{ background: avatarColor(l.id), flexShrink: 0 }}>
                      {l.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', letterSpacing: '-0.01em' }}>
                        {l.employeeName}
                      </p>
                      <p style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2, textTransform: 'capitalize' }}>
                        {l.leaveType} leave · {l.days} day{l.days !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>
                      {new Date(l.startDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="pill pill-yellow">Pending</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Overtime Requests */}
          {otReqs.length > 0 && (
            <div className="card overflow-hidden">
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid #DDD6FE', background: '#F5F3FF' }}
              >
                <div className="flex items-center gap-2.5">
                  <Timer style={{ width: 15, height: 15, color: '#7C3AED' }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
                    Overtime Requests
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: '#6D28D9',
                    background: '#EDE9FE', padding: '2px 8px', borderRadius: 99,
                    border: '1px solid #DDD6FE',
                  }}>
                    {otReqs.length}
                  </span>
                </div>
                <button
                  onClick={() => navigate('/overtime')}
                  style={{ fontSize: 12.5, color: 'var(--color-indigo)', fontWeight: 600 }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-indigo-hover)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-indigo)')}
                >
                  View all
                </button>
              </div>
              {otReqs.slice(0, 5).map((o, i) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between px-5 py-3.5 transition-colors"
                  style={{ borderBottom: i < Math.min(otReqs.length, 5) - 1 ? '1px solid var(--color-border)' : 'none' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#FAFAFA')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  <div className="flex items-center gap-3">
                    <div className="avatar avatar-sm avatar-round" style={{ background: avatarColor(o.id), flexShrink: 0 }}>
                      {o.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', letterSpacing: '-0.01em' }}>
                        {o.employeeName}
                      </p>
                      <p style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>
                        {o.date} · {o.hoursRequested}h overtime
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate('/overtime')}
                      className="flex items-center justify-center transition-all"
                      style={{ width: 30, height: 30, borderRadius: 8, color: '#94A3B8', background: 'transparent', border: 'none', cursor: 'pointer' }}
                      title="Review"
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#ECFDF5'; (e.currentTarget as HTMLElement).style.color = '#059669' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#94A3B8' }}
                    >
                      <CheckCircle style={{ width: 15, height: 15 }} />
                    </button>
                    <button
                      onClick={() => navigate('/overtime')}
                      className="flex items-center justify-center transition-all"
                      style={{ width: 30, height: 30, borderRadius: 8, color: '#94A3B8', background: 'transparent', border: 'none', cursor: 'pointer' }}
                      title="Reject"
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FEF2F2'; (e.currentTarget as HTMLElement).style.color = '#DC2626' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#94A3B8' }}
                    >
                      <XCircle style={{ width: 15, height: 15 }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
