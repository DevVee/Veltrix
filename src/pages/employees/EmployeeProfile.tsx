import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Edit2, ArrowLeft, Mail, Phone, Calendar, CreditCard, Clock } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useData } from '../../hooks/useData'
import { apiGetEmployee, apiGetAttendance, apiGetLeaves, apiGetPayrollPeriods, apiGetPayrollEntries } from '../../lib/db'
import { formatPeso } from '../../lib/payrollEngine'
import type { PayrollEntry } from '../../types'

const TABS = ['Overview', 'Attendance', 'Payroll History', 'Leaves'] as const
type Tab = typeof TABS[number]

// Deterministic avatar color
const AVATAR_PALETTE = [
  '#4F46E5','#7C3AED','#059669','#D97706',
  '#DC2626','#0284C7','#BE185D','#065F46',
]
function avatarColor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]
}

export function EmployeeProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('Overview')

  const { data: emp, loading } = useData(() => apiGetEmployee(id!), [id])
  const { data: attendance }   = useData(() => apiGetAttendance({ employeeId: id, startDate: new Date(Date.now()-30*864e5).toISOString().split('T')[0] }), [id])
  const { data: leaves }       = useData(() => apiGetLeaves({ employeeId: id }), [id])
  const { data: periods }      = useData(() => apiGetPayrollPeriods(), [])

  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([])
  const [entriesLoaded, setEntriesLoaded] = useState(false)

  const loadEntries = async () => {
    if (entriesLoaded || !periods) return
    const all: PayrollEntry[] = []
    for (const p of periods.slice(0, 5)) {
      const entries = await apiGetPayrollEntries(p.id)
      const e = entries.find(e => e.employeeId === id)
      if (e) all.push(e)
    }
    setPayrollEntries(all)
    setEntriesLoaded(true)
  }

  if (tab === 'Payroll History' && !entriesLoaded) loadEntries()

  if (loading || !emp) return (
    <div className="flex items-center justify-center h-64">
      <div className="spinner" />
    </div>
  )

  const att = attendance ?? []
  const lv  = leaves ?? []
  const presentDays = att.filter(a => a.status === 'present' || a.status === 'late').length
  const lateDays    = att.filter(a => a.status === 'late').length
  const absentDays  = att.filter(a => a.status === 'absent').length
  const bgColor     = avatarColor(emp.id)

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumb="Employees"
        title={emp.fullName}
        subtitle={`${emp.employeeNo} · ${emp.position}`}
        actions={[
          { label: 'Back', icon: ArrowLeft, variant: 'secondary', onClick: () => navigate('/employees') },
          { label: 'Edit', icon: Edit2, onClick: () => navigate(`/employees/${id}/edit`) },
        ]}
      />

      {/* ── Profile hero card ── */}
      <div className="card overflow-hidden">
        {/* Gradient bar */}
        <div style={{ height: 5, background: 'linear-gradient(90deg, #4F46E5, #818CF8)' }} />

        <div className="p-5">
          <div className="flex items-start gap-5">
            {/* Avatar with ring */}
            <div
              className="flex-shrink-0 flex items-center justify-center text-white font-bold select-none"
              style={{
                width: 64, height: 64,
                borderRadius: '50%',
                background: bgColor,
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                boxShadow: `0 0 0 3px white, 0 0 0 5px ${bgColor}33`,
              }}
            >
              {emp.firstName[0]}{emp.lastName[0]}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.025em' }}>
                  {emp.fullName}
                </h2>
                <StatusBadge type="employee" status={emp.status}>
                  {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                </StatusBadge>
              </div>
              <p style={{ fontSize: 13, color: '#64748B' }}>
                {emp.position}
                <span style={{ color: '#CBD5E1', margin: '0 6px' }}>·</span>
                {emp.department}
              </p>
              <div className="flex flex-wrap gap-4 mt-3">
                {[
                  { icon: Mail,       text: emp.email },
                  { icon: Phone,      text: emp.phone },
                  { icon: Calendar,   text: `Hired ${new Date(emp.hireDate).toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'})}` },
                  { icon: CreditCard, text: `₱${emp.basicSalary.toLocaleString()} / mo` },
                ].map(({ icon: Icon, text }) => (
                  <span key={text} className="flex items-center gap-1.5" style={{ fontSize: 12, color: '#94A3B8' }}>
                    <Icon style={{ width: 13, height: 13 }} />
                    {text}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick stats strip */}
            <div className="hidden lg:flex items-stretch gap-0" style={{ borderLeft: '1px solid #F1F5F9', paddingLeft: 16 }}>
              {[
                { label: 'Present (30d)', value: presentDays, color: '#059669' },
                { label: 'Late (30d)',    value: lateDays,    color: '#D97706' },
                { label: 'Absent (30d)', value: absentDays,  color: '#DC2626' },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className="text-center px-5"
                  style={{ borderLeft: i > 0 ? '1px solid #F1F5F9' : 'none' }}
                >
                  <p style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1, letterSpacing: '-0.04em' }}>
                    {s.value}
                  </p>
                  <p style={{ fontSize: 10, color: '#94A3B8', marginTop: 4, whiteSpace: 'nowrap' }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="tab-bar">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`tab-btn ${tab === t ? 'active' : ''}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <InfoSection title="Personal Information">
            {[
              ['Full Name',      emp.fullName],
              ['Employee No.',   emp.employeeNo],
              ['Date of Birth',  new Date(emp.birthDate).toLocaleDateString('en-PH')],
              ['Gender',         emp.gender],
              ['Civil Status',   emp.civilStatus],
              ['Address',        emp.address],
              ['Phone',          emp.phone],
              ['Email',          emp.email],
            ]}
          </InfoSection>
          <InfoSection title="Employment Details">
            {[
              ['Department',      emp.department],
              ['Position',        emp.position],
              ['Employment Type', emp.employmentType],
              ['Hire Date',       new Date(emp.hireDate).toLocaleDateString('en-PH')],
              ['Pay Frequency',   emp.payFrequency],
              ['Tax Status',      emp.taxStatus],
              ['Basic Salary',    formatPeso(emp.basicSalary)],
              ['Daily Rate',      formatPeso(emp.dailyRate)],
            ]}
          </InfoSection>
          <InfoSection title="Government IDs">
            {[
              ['SSS No.',        emp.sssNo],
              ['PhilHealth No.', emp.philhealthNo],
              ['Pag-IBIG No.',   emp.pagibigNo],
              ['TIN No.',        emp.tinNo],
            ]}
          </InfoSection>
          <InfoSection title="Banking & Emergency Contact">
            {[
              ['Bank Name',       emp.bankName],
              ['Bank Account',    emp.bankAccount],
              ['Emergency Name',  emp.emergencyContactName],
              ['Emergency Phone', emp.emergencyContactPhone],
            ]}
          </InfoSection>
          {emp.allowances.length > 0 && (
            <div className="card p-4 lg:col-span-2">
              <h3 style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Allowances
              </h3>
              <div className="flex flex-wrap gap-2">
                {emp.allowances.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-1.5"
                    style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8 }}
                  >
                    <span style={{ fontSize: 13, color: '#475569' }}>{a.type}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{formatPeso(a.amount)}</span>
                    {!a.taxable && (
                      <span style={{ fontSize: 10, color: '#059669', fontWeight: 600 }}>NON-TAX</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Attendance ── */}
      {tab === 'Attendance' && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
            <Clock style={{ width: 15, height: 15, color: '#4F46E5' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Last 30 Days Attendance</span>
          </div>
          {att.length === 0 ? (
            <div className="py-12 text-center" style={{ fontSize: 13, color: '#94A3B8' }}>
              No attendance records found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-base w-full">
                <thead>
                  <tr>
                    {['Date','Time In','Time Out','Hours','Late','Status'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {att.filter(a => a.status !== 'rest-day').map(a => {
                    const hours = a.timeIn && a.timeOut
                      ? ((new Date(a.timeOut).getTime() - new Date(a.timeIn).getTime()) / 3600000).toFixed(1)
                      : '—'
                    return (
                      <tr key={a.id}>
                        <td className="tabular-nums" style={{ fontWeight: 500 }}>{a.date}</td>
                        <td className="tabular-nums text-gray-600">
                          {a.timeIn ? new Date(a.timeIn).toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit',hour12:true}) : '—'}
                        </td>
                        <td className="tabular-nums text-gray-600">
                          {a.timeOut ? new Date(a.timeOut).toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit',hour12:true}) : '—'}
                        </td>
                        <td className="tabular-nums text-gray-600">{hours}</td>
                        <td className="tabular-nums text-gray-600">
                          {a.minutesLate > 0 ? `${a.minutesLate}m` : '—'}
                        </td>
                        <td>
                          <StatusBadge type="attendance" status={a.status}>
                            {a.status.replace('-', ' ')}
                          </StatusBadge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Payroll History ── */}
      {tab === 'Payroll History' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Payroll History</span>
          </div>
          {payrollEntries.length === 0 ? (
            <div className="py-12 text-center" style={{ fontSize: 13, color: '#94A3B8' }}>
              {entriesLoaded ? 'No payroll records found' : 'Loading…'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-base w-full">
                <thead>
                  <tr>
                    {['Period','Gross Pay','Deductions','Net Pay',''].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payrollEntries.map(pe => {
                    const period = periods?.find(p => p.id === pe.payrollPeriodId)
                    return (
                      <tr key={pe.id}>
                        <td>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                            {period?.periodNo ?? '—'}
                          </p>
                          <p style={{ fontSize: 11, color: '#94A3B8' }}>
                            {period?.startDate} – {period?.endDate}
                          </p>
                        </td>
                        <td className="tabular-nums" style={{ fontWeight: 600, color: '#0F172A' }}>
                          {formatPeso(pe.grossPay)}
                        </td>
                        <td className="tabular-nums" style={{ fontWeight: 600, color: '#DC2626' }}>
                          −{formatPeso(pe.totalDeductions)}
                        </td>
                        <td className="tabular-nums" style={{ fontWeight: 800, color: '#4F46E5' }}>
                          {formatPeso(pe.netPay)}
                        </td>
                        <td>
                          <button
                            onClick={() => navigate(`/payroll/${pe.payrollPeriodId}/payslip/${pe.employeeId}`)}
                            style={{ fontSize: 12, color: '#4F46E5', fontWeight: 600 }}
                            className="hover:underline"
                          >
                            Payslip →
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Leaves ── */}
      {tab === 'Leaves' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Leave Requests</span>
          </div>
          {lv.length === 0 ? (
            <div className="py-12 text-center" style={{ fontSize: 13, color: '#94A3B8' }}>
              No leave records found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-base w-full">
                <thead>
                  <tr>
                    {['Type','Start','End','Days','Reason','Status'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lv.map(l => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 500, textTransform: 'capitalize' }}>{l.leaveType}</td>
                      <td className="tabular-nums text-gray-600">{l.startDate}</td>
                      <td className="tabular-nums text-gray-600">{l.endDate}</td>
                      <td className="tabular-nums text-gray-600">{l.days}</td>
                      <td className="max-w-xs truncate text-gray-600">{l.reason}</td>
                      <td>
                        <StatusBadge type="leave" status={l.status}>
                          {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InfoSection({ title, children }: { title: string; children: [string, string][] }) {
  return (
    <div className="card p-4">
      <h3 style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        {title}
      </h3>
      <div className="space-y-2.5">
        {children.map(([label, value]) => (
          <div key={label} className="flex items-start gap-3">
            <span style={{ fontSize: 12, color: '#94A3B8', width: 128, flexShrink: 0, paddingTop: 1 }}>{label}</span>
            <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 500, flex: 1, minWidth: 0, wordBreak: 'break-word' }}>
              {value || '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
