import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Printer, CheckCircle } from 'lucide-react'
import { useData } from '../../hooks/useData'
import { apiGetPayrollEntry, apiGetPayrollPeriod, apiGetEmployee, getCompanySettings, apiMarkEntryPaid } from '../../lib/db'
import { useAuthStore } from '../../store/authStore'
import { formatPeso } from '../../lib/payrollEngine'

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
}
function fmtDateShort(d: string) {
  return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function Payslip() {
  const { periodId, employeeId } = useParams<{ periodId: string; employeeId: string }>()
  const navigate  = useNavigate()
  const company   = getCompanySettings()
  const { user }  = useAuthStore()
  const [marking, setMarking] = useState(false)

  const { data: entry, refetch: refetchEntry } = useData(() => apiGetPayrollEntry(periodId!, employeeId!), [periodId, employeeId])
  const { data: period }   = useData(() => apiGetPayrollPeriod(periodId!), [periodId])
  const { data: employee } = useData(() => apiGetEmployee(employeeId!), [employeeId])

  const handleMarkPaid = async () => {
    if (!periodId || !employeeId || marking) return
    setMarking(true)
    try {
      await apiMarkEntryPaid(periodId, employeeId, user?.name)
      refetchEntry()
    } finally {
      setMarking(false)
    }
  }

  if (!entry || !period || !employee) return (
    <div className="flex items-center justify-center h-64">
      <div className="spinner" />
    </div>
  )

  const govContribs = [
    { label: 'SSS',      ee: entry.sssEmployee,         er: entry.sssEmployer,         no: employee.sssNo },
    { label: 'PhilHealth',ee: entry.philhealthEmployee, er: entry.philhealthEmployer,  no: employee.philhealthNo },
    { label: 'Pag-IBIG', ee: entry.pagibigEmployee,     er: entry.pagibigEmployer,     no: employee.pagibigNo },
  ]

  const earnings = [
    { label: 'Basic Pay',            value: entry.basicPay,           always: true },
    { label: 'Overtime Pay',         value: entry.overtimePay,        always: false },
    { label: 'Regular Holiday Pay',  value: entry.regularHolidayPay,  always: false },
    { label: 'Special Holiday Pay',  value: entry.specialHolidayPay,  always: false },
    { label: 'Night Differential',   value: entry.nightDifferential,  always: false },
  ].filter(e => e.always || e.value > 0)

  const deductions = [
    { label: 'Late Deductions',   value: entry.lateDeductions,    always: false },
    { label: 'Absence Deductions',value: entry.absenceDeductions, always: false },
    { label: 'SSS Contribution',  value: entry.sssEmployee,       always: true  },
    { label: 'PhilHealth',        value: entry.philhealthEmployee,always: true  },
    { label: 'Pag-IBIG (HDMF)',   value: entry.pagibigEmployee,   always: true  },
    { label: 'Withholding Tax',   value: entry.withholdingTax,    always: false },
  ].filter(d => d.always || d.value > 0)

  return (
    <div>
      {/* Screen-only actions */}
      <div className="no-print flex items-center gap-2 mb-4">
        <button
          onClick={() => navigate(`/payroll/${periodId}`)}
          className="btn btn-secondary"
        >
          <ArrowLeft style={{ width: 13, height: 13 }} />
          Back to Payroll
        </button>
        <button
          onClick={() => window.print()}
          className="btn btn-secondary"
        >
          <Printer style={{ width: 13, height: 13 }} />
          Print / Save PDF
        </button>

        {/* Mark as Paid toggle */}
        {entry?.markedPaid ? (
          <button
            onClick={handleMarkPaid}
            disabled={marking}
            className="btn"
            style={{
              background: '#ECFDF5', border: '1px solid #6EE7B7',
              color: '#065F46', gap: 6,
            }}
            title="Click to unmark as paid"
          >
            <CheckCircle style={{ width: 13, height: 13, color: '#059669' }} />
            Paid
            {entry.markedPaidAt && (
              <span style={{ fontSize: 10, opacity: 0.65, fontWeight: 500 }}>
                · {new Date(entry.markedPaidAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
            <span style={{ fontSize: 10, opacity: 0.45, fontWeight: 400, marginLeft: 2 }}>(undo)</span>
          </button>
        ) : (
          <button
            onClick={handleMarkPaid}
            disabled={marking}
            className="btn btn-success"
          >
            <CheckCircle style={{ width: 13, height: 13 }} />
            {marking ? 'Saving…' : 'Mark as Paid'}
          </button>
        )}
      </div>

      {/* ── Payslip document ── */}
      <div
        className="bg-white max-w-[700px] mx-auto payslip-print"
        style={{
          border: '1px solid #d1d5db',
          fontFamily: "'Inter', -apple-system, sans-serif",
        }}
      >
        {/* ── Document Header ── */}
        <div
          style={{
            borderBottom: '4px solid #4F46E5',
            padding: '20px 24px 16px',
          }}
        >
          <div className="flex items-start justify-between">
            {/* Company */}
            <div className="flex items-start gap-3">
              <div
                className="flex items-center justify-center text-white font-black flex-shrink-0"
                style={{
                  width: 36,
                  height: 36,
                  background: '#4F46E5',
                  borderRadius: 6,
                  fontSize: 16,
                }}
              >
                {company.name?.[0] ?? 'C'}
              </div>
              <div>
                <h1
                  className="font-extrabold text-gray-900 leading-tight"
                  style={{ fontSize: 16, letterSpacing: '-0.02em' }}
                >
                  {company.name}
                </h1>
                {company.address && (
                  <p className="text-gray-500 mt-0.5" style={{ fontSize: 11 }}>
                    {company.address}
                  </p>
                )}
                <p className="text-gray-500" style={{ fontSize: 11 }}>
                  {[company.contact, company.email].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>

            {/* Payslip label */}
            <div className="text-right">
              <div
                className="inline-block px-3 py-1 font-black text-white mb-1.5"
                style={{
                  background: '#4F46E5',
                  borderRadius: 3,
                  fontSize: 11,
                  letterSpacing: '0.1em',
                }}
              >
                PAYSLIP
              </div>
              <p className="font-bold text-gray-700" style={{ fontSize: 13 }}>{period.periodNo}</p>
              <p className="text-gray-500" style={{ fontSize: 11 }}>
                {fmtDateShort(period.startDate)} – {fmtDateShort(period.endDate)}
              </p>
              <p className="text-gray-500" style={{ fontSize: 11 }}>
                Pay Date: <strong className="text-gray-700">{fmtDate(period.payDate)}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* ── Employee Info ── */}
        <div
          style={{
            padding: '14px 24px',
            borderBottom: '1px solid #e4e7ec',
            background: '#fafbfc',
          }}
        >
          <div className="grid grid-cols-2 gap-x-8">
            <div>
              <InfoRow label="Employee Name" value={employee.fullName} bold />
              <InfoRow label="Employee No."  value={employee.employeeNo} />
              <InfoRow label="Department"    value={employee.department} />
              <InfoRow label="Position"      value={employee.position} />
            </div>
            <div>
              <InfoRow label="Employment Type" value={employee.employmentType.replace('-', ' ')} />
              <InfoRow label="Pay Frequency"   value={period.frequency.replace('-', '-')} />
              <InfoRow label="Tax Status"      value={employee.taxStatus} />
              <InfoRow label="Bank"
                value={`${employee.bankName}${employee.bankAccount ? ` – ${employee.bankAccount}` : ''}`} />
            </div>
          </div>
        </div>

        {/* ── Earnings & Deductions ── */}
        <div className="grid grid-cols-2" style={{ borderBottom: '1px solid #e4e7ec' }}>
          {/* Earnings column */}
          <div
            style={{
              padding: '14px 20px',
              borderRight: '1px solid #e4e7ec',
            }}
          >
            <SectionTitle>Earnings</SectionTitle>
            <div className="space-y-1.5 mb-3">
              {earnings.map(e => (
                <AmountRow key={e.label} label={e.label} value={e.value} />
              ))}
              {entry.allowances.map((a, i) => (
                <AmountRow key={i} label={a.type} value={a.amount} />
              ))}
            </div>
            <TotalRow label="Gross Pay" value={entry.grossPay} />
          </div>

          {/* Deductions column */}
          <div style={{ padding: '14px 20px' }}>
            <SectionTitle>Deductions</SectionTitle>
            <div className="space-y-1.5 mb-3">
              {deductions.map(d => (
                <AmountRow key={d.label} label={d.label} value={d.value} deduction />
              ))}
              {entry.otherDeductions.map((d, i) => (
                <AmountRow key={i} label={d.type} value={d.amount} deduction />
              ))}
            </div>
            <TotalRow label="Total Deductions" value={entry.totalDeductions} deduction />
          </div>
        </div>

        {/* ── Attendance Summary ── */}
        <div
          style={{
            padding: '12px 24px',
            borderBottom: '1px solid #e4e7ec',
            background: '#fafbfc',
          }}
        >
          <SectionTitle>Attendance Summary</SectionTitle>
          <div className="grid grid-cols-5 gap-2 text-center mt-2">
            {[
              { label: 'Scheduled', value: entry.scheduledDays },
              { label: 'Present',   value: entry.presentDays   },
              { label: 'Absent',    value: entry.absentDays    },
              { label: 'Late',      value: entry.lateDays      },
              { label: 'OT Hours',  value: `${entry.overtimeHours ?? 0}h` },
            ].map(s => (
              <div
                key={s.label}
                style={{
                  padding: '8px 4px',
                  background: '#fff',
                  border: '1px solid #e4e7ec',
                  borderRadius: 3,
                }}
              >
                <p
                  className="font-black tabular-nums text-gray-900 leading-none"
                  style={{ fontSize: 17 }}
                >
                  {s.value}
                </p>
                <p className="text-gray-500 mt-1" style={{ fontSize: 9.5 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Government Contributions ── */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid #e4e7ec' }}>
          <SectionTitle>Government Contributions</SectionTitle>
          <table className="table-base w-full" style={{ fontSize: 11, marginTop: 8 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Contribution</th>
                <th style={{ textAlign: 'center' }}>ID / Reference No.</th>
                <th style={{ textAlign: 'right' }}>Employee Share</th>
                <th style={{ textAlign: 'right' }}>Employer Share</th>
              </tr>
            </thead>
            <tbody>
              {govContribs.map(g => (
                <tr key={g.label}>
                  <td style={{ fontWeight: 600, color: '#374151' }}>{g.label}</td>
                  <td style={{ textAlign: 'center', color: '#6b7280' }}>{g.no || '—'}</td>
                  <td style={{ textAlign: 'right', color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                    {formatPeso(g.ee)}
                  </td>
                  <td style={{ textAlign: 'right', color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>
                    {formatPeso(g.er)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Net Pay banner ── */}
        <div
          style={{
            padding: '16px 24px',
            background: '#EEF2FF',
            borderBottom: '1px solid #C7D2FE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p
              className="font-black uppercase tracking-wider text-brand"
              style={{ fontSize: 10, letterSpacing: '0.1em' }}
            >
              Net Pay
            </p>
            <p className="text-gray-500 mt-0.5" style={{ fontSize: 11 }}>
              {formatPeso(entry.grossPay)} gross − {formatPeso(entry.totalDeductions)} deductions
            </p>
          </div>
          <p
            className="font-black tabular-nums text-brand"
            style={{ fontSize: 28, letterSpacing: '-0.03em' }}
          >
            {formatPeso(entry.netPay)}
          </p>
        </div>

        {/* ── Signature lines ── */}
        <div style={{ padding: '16px 24px 20px' }}>
          <div className="grid grid-cols-3 gap-6 text-center">
            {['Prepared by', 'Verified by', 'Received by'].map(label => (
              <div key={label}>
                <div style={{ height: 32, borderBottom: '1px solid #9ca3af', marginBottom: 4 }} />
                <p className="text-gray-500" style={{ fontSize: 10 }}>{label}</p>
              </div>
            ))}
          </div>

          <p
            className="text-gray-400 text-center mt-4"
            style={{ fontSize: 9, borderTop: '1px solid #f0f2f5', paddingTop: 8 }}
          >
            This is a computer-generated payslip and does not require a signature unless signed above.{' '}
            Generated by TenPayroll · {new Date().toLocaleDateString('en-PH')}
            {company.tin && ` · TIN: ${company.tin}`}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────────────────── */
function InfoRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex gap-2 mb-1" style={{ fontSize: 11 }}>
      <span className="text-gray-500 flex-shrink-0" style={{ width: 110 }}>{label}:</span>
      <span className={bold ? 'font-bold text-gray-900' : 'text-gray-700'}>{value}</span>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="font-black uppercase tracking-wider text-gray-400"
      style={{ fontSize: 9.5, letterSpacing: '0.09em', marginBottom: 10 }}
    >
      {children}
    </p>
  )
}

function AmountRow({ label, value, deduction }: { label: string; value: number; deduction?: boolean }) {
  return (
    <div className="flex justify-between" style={{ fontSize: 11 }}>
      <span className="text-gray-600">{label}</span>
      <span
        className="tabular-nums font-medium"
        style={{ color: deduction ? '#dc2626' : '#374151' }}
      >
        {deduction ? '−' : ''}{formatPeso(value)}
      </span>
    </div>
  )
}

function TotalRow({ label, value, deduction }: { label: string; value: number; deduction?: boolean }) {
  return (
    <div
      className="flex justify-between font-black"
      style={{
        fontSize: 12,
        borderTop: '1px solid #e4e7ec',
        paddingTop: 6,
        marginTop: 4,
        color: deduction ? '#dc2626' : '#111827',
      }}
    >
      <span>{label}</span>
      <span className="tabular-nums">
        {deduction ? '−' : ''}{formatPeso(value)}
      </span>
    </div>
  )
}
