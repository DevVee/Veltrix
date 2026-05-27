import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, FileText, CheckCircle, Search,
  Users, Banknote, TrendingDown, DollarSign, Printer,
} from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { useData } from '../../hooks/useData'
import { apiGetPayrollPeriod, apiGetPayrollEntries, apiUpdatePayrollStatus, apiMarkEntryPaid } from '../../lib/db'
import { useAuthStore } from '../../store/authStore'
import { formatPeso } from '../../lib/payrollEngine'

const STATUS_FLOW: Record<string, string> = {
  draft: 'reviewed', reviewed: 'approved', approved: 'paid',
}
const STATUS_ACTION: Record<string, { label: string; variant: string }> = {
  draft:    { label: 'Mark Reviewed', variant: 'secondary' },
  reviewed: { label: 'Approve',       variant: 'primary' },
  approved: { label: 'Mark as Paid',  variant: 'success' },
}
const STATUS_BADGE: Record<string, string> = {
  draft:    'pill pill-gray',
  reviewed: 'pill pill-yellow',
  approved: 'pill pill-blue',
  paid:     'pill pill-green',
}
const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft', reviewed: 'For Approval', approved: 'Approved', paid: 'Paid',
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function PayrollDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const user      = useAuthStore(s => s.user)
  const [search,    setSearch]    = useState('')
  const [advancing, setAdvancing] = useState(false)

  const [markingId, setMarkingId] = useState<string | null>(null)

  const { data: period, loading: pLoading, refetch }          = useData(() => apiGetPayrollPeriod(id!), [id])
  const { data: entries, loading: eLoading, refetch: refetchEntries } = useData(() => apiGetPayrollEntries(id!), [id])

  const handleMarkEntryPaid = async (employeeId: string) => {
    if (markingId) return
    setMarkingId(employeeId)
    try {
      await apiMarkEntryPaid(id!, employeeId, user?.name)
      refetchEntries()
    } finally {
      setMarkingId(null)
    }
  }

  const loading = pLoading || eLoading

  const filtered = (entries ?? []).filter(e =>
    !search ||
    e.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    e.employeeNo.toLowerCase().includes(search.toLowerCase()) ||
    e.department.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdvance = async () => {
    if (!period) return
    const next = STATUS_FLOW[period.status]
    if (!next) return
    setAdvancing(true)
    try {
      await apiUpdatePayrollStatus(id!, next as 'reviewed' | 'approved' | 'paid', user?.name)
      refetch()
    } finally {
      setAdvancing(false)
    }
  }

  if (loading || !period) return (
    <div className="flex items-center justify-center h-64">
      <div className="spinner" />
    </div>
  )

  const canAdvance = !!STATUS_FLOW[period.status]
  const actionCfg  = STATUS_ACTION[period.status]

  const totalAllowances = (entries ?? []).reduce((s, e) =>
    s + e.allowances.reduce((a, x) => a + x.amount, 0), 0
  )
  const totalOT = (entries ?? []).reduce((s, e) => s + e.overtimePay, 0)

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumb="Payroll"
        title={`Payroll — ${period.periodNo}`}
        subtitle={`${fmtDate(period.startDate)} – ${fmtDate(period.endDate)} · Pay Date: ${fmtDate(period.payDate)}`}
        actions={[
          {
            label: 'Back',
            icon: ArrowLeft,
            variant: 'secondary',
            onClick: () => navigate('/payroll'),
          },
          ...(canAdvance ? [{
            label: advancing ? 'Processing…' : actionCfg.label,
            icon: CheckCircle,
            onClick: handleAdvance,
          }] : []),
        ]}
      />

      {/* ── Summary KPI strip ── */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 divide-x"
        style={{
          background: '#fff',
          border: '1px solid #e4e7ec',
          borderRadius: 5,
        }}
      >
        {[
          { label: 'Employees',   value: period.totalEmployees.toString(), icon: Users,        color: '#1a56db' },
          { label: 'Gross Pay',   value: formatPeso(period.totalGross),    icon: Banknote,     color: '#7c3aed' },
          { label: 'Deductions',  value: formatPeso(period.totalDeductions), icon: TrendingDown, color: '#dc2626' },
          { label: 'Net Pay',     value: formatPeso(period.totalNet),      icon: DollarSign,   color: '#15803d', highlight: true },
        ].map((item, i) => (
          <div
            key={item.label}
            className="px-4 py-3"
            style={{ borderRight: i < 3 ? '1px solid #f0f2f5' : 'none' }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <p className="uppercase tracking-wide text-gray-400" style={{ fontSize: 10, fontWeight: 600 }}>
                {item.label}
              </p>
              <item.icon style={{ width: 12, height: 12, color: item.color, opacity: 0.55 }} />
            </div>
            <p
              className={`font-bold tabular-nums ${item.highlight ? 'text-brand' : 'text-gray-900'}`}
              style={{ fontSize: 19, letterSpacing: '-0.03em' }}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Status + metadata bar ── */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{
          background: period.status === 'paid' ? '#f0fdf4' : '#eff6ff',
          border: `1px solid ${period.status === 'paid' ? '#a7f3d0' : '#bfdbfe'}`,
          borderRadius: 5,
        }}
      >
        <div className="flex items-center gap-3">
          <span className={STATUS_BADGE[period.status]}>
            {STATUS_LABEL[period.status]}
          </span>
          <span className="text-gray-500" style={{ fontSize: 12 }}>
            {period.frequency.replace('-', '-')} payroll ·{' '}
            {period.totalEmployees} employees
          </span>
        </div>
        <div className="flex items-center gap-3">
          {period.approvedBy && (
            <span className="text-gray-500" style={{ fontSize: 11 }}>
              Approved by <strong>{period.approvedBy}</strong>
              {period.approvedAt && ` on ${fmtDate(period.approvedAt)}`}
            </span>
          )}
          {period.paidAt && (
            <span className="text-gray-500" style={{ fontSize: 11 }}>
              Paid on <strong>{fmtDate(period.paidAt)}</strong>
            </span>
          )}
          <button
            onClick={() => window.print()}
            className="btn btn-secondary btn-sm no-print"
          >
            <Printer style={{ width: 12, height: 12 }} />
            Print
          </button>
        </div>
      </div>

      {/* ── Entries Table ── */}
      <div className="card overflow-hidden">
        {/* Table toolbar */}
        <div
          className="flex items-center gap-3 px-4 py-2.5"
          style={{ borderBottom: '1px solid #f0f2f5' }}
        >
          <div className="relative flex-1" style={{ maxWidth: 300 }}>
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              style={{ width: 13, height: 13 }}
            />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search employee, department…"
              className="input-base"
              style={{ paddingLeft: 30 }}
            />
          </div>
          <span className="text-gray-400" style={{ fontSize: 11 }}>
            {filtered.length} employee{filtered.length !== 1 ? 's' : ''}
          </span>

          {/* Totals summary */}
          <div
            className="hidden lg:flex items-center gap-4 ml-auto pl-4"
            style={{ borderLeft: '1px solid #f0f2f5' }}
          >
            {[
              { label: 'OT Pay',     value: totalOT,         color: '#7c3aed' },
              { label: 'Allowances', value: totalAllowances,  color: '#0d9488' },
            ].map(item => (
              <div key={item.label}>
                <p className="text-gray-400 uppercase tracking-wide" style={{ fontSize: 9, fontWeight: 600 }}>
                  {item.label}
                </p>
                <p
                  className="font-bold tabular-nums"
                  style={{ fontSize: 12, color: item.color }}
                >
                  {formatPeso(item.value)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table-base w-full">
            <thead>
              <tr>
                <th>Employee</th>
                <th className="hidden lg:table-cell text-right">Days</th>
                <th className="text-right">Basic Pay</th>
                <th className="hidden xl:table-cell text-right">OT Pay</th>
                <th className="hidden xl:table-cell text-right">Allowances</th>
                <th className="text-right">Gross Pay</th>
                <th className="text-right">Deductions</th>
                <th className="text-right">Net Pay</th>
                <th className="no-print text-right" style={{ width: 130 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => {
                const totalAllow = e.allowances.reduce((s, a) => s + a.amount, 0)
                return (
                  <tr key={e.id}>
                    <td>
                      <p className="font-semibold text-gray-900" style={{ fontSize: 12.5 }}>
                        {e.employeeName}
                      </p>
                      <p className="text-gray-400 mt-0.5" style={{ fontSize: 10 }}>
                        {e.employeeNo} · {e.department}
                      </p>
                    </td>

                    <td className="hidden lg:table-cell text-right">
                      <span className="tabular-nums text-gray-600" style={{ fontSize: 12 }}>
                        {e.presentDays}
                        <span className="text-gray-300">/{e.scheduledDays}</span>
                      </span>
                    </td>

                    <td className="text-right">
                      <span className="tabular-nums text-gray-700" style={{ fontSize: 12 }}>
                        {formatPeso(e.basicPay)}
                      </span>
                    </td>

                    <td className="hidden xl:table-cell text-right">
                      <span className="tabular-nums text-gray-600" style={{ fontSize: 12 }}>
                        {e.overtimePay > 0 ? formatPeso(e.overtimePay) : (
                          <span style={{ color: '#d1d5db' }}>—</span>
                        )}
                      </span>
                    </td>

                    <td className="hidden xl:table-cell text-right">
                      <span className="tabular-nums text-gray-600" style={{ fontSize: 12 }}>
                        {totalAllow > 0 ? formatPeso(totalAllow) : (
                          <span style={{ color: '#d1d5db' }}>—</span>
                        )}
                      </span>
                    </td>

                    <td className="text-right">
                      <span className="font-semibold tabular-nums text-gray-800" style={{ fontSize: 12 }}>
                        {formatPeso(e.grossPay)}
                      </span>
                    </td>

                    <td className="text-right">
                      <span className="font-semibold tabular-nums text-red-600" style={{ fontSize: 12 }}>
                        −{formatPeso(e.totalDeductions)}
                      </span>
                    </td>

                    <td className="text-right">
                      <span className="font-bold tabular-nums text-brand" style={{ fontSize: 13 }}>
                        {formatPeso(e.netPay)}
                      </span>
                    </td>

                    <td className="no-print text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        {/* Paid status pill */}
                        {e.markedPaid && (
                          <span
                            className="inline-flex items-center gap-1"
                            style={{
                              fontSize: 10, fontWeight: 700, color: '#065F46',
                              background: '#ECFDF5', border: '1px solid #6EE7B7',
                              padding: '1px 7px', borderRadius: 99,
                            }}
                          >
                            <CheckCircle style={{ width: 9, height: 9 }} />
                            Paid
                          </span>
                        )}
                        <div className="flex items-center gap-2.5 ml-auto">
                          {/* Mark Paid toggle */}
                          <button
                            onClick={() => handleMarkEntryPaid(e.employeeId)}
                            disabled={markingId === e.employeeId}
                            style={{
                              fontSize: 10.5, fontWeight: 600,
                              color: e.markedPaid ? '#9CA3AF' : '#059669',
                              opacity: markingId === e.employeeId ? 0.5 : 1,
                              cursor: markingId === e.employeeId ? 'not-allowed' : 'pointer',
                            }}
                            title={e.markedPaid ? 'Click to unmark as paid' : 'Click to mark as paid'}
                          >
                            {e.markedPaid ? 'Unmark' : 'Mark Paid'}
                          </button>
                          <button
                            onClick={() => navigate(`/payroll/${id}/payslip/${e.employeeId}`)}
                            className="flex items-center gap-1 text-brand font-semibold hover:underline"
                            style={{ fontSize: 11 }}
                          >
                            <FileText style={{ width: 12, height: 12 }} />
                            Payslip
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Table footer totals */}
        <div
          className="px-4 py-2.5"
          style={{ borderTop: '1px solid #f0f2f5', background: '#fafbfc' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-400" style={{ fontSize: 11 }}>
              {filtered.length} employee{filtered.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 uppercase tracking-wide" style={{ fontSize: 9.5, fontWeight: 600 }}>
                  Total Gross
                </span>
                <span className="font-bold tabular-nums text-gray-700" style={{ fontSize: 12 }}>
                  {formatPeso(period.totalGross)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 uppercase tracking-wide" style={{ fontSize: 9.5, fontWeight: 600 }}>
                  Deductions
                </span>
                <span className="font-bold tabular-nums text-red-600" style={{ fontSize: 12 }}>
                  −{formatPeso(period.totalDeductions)}
                </span>
              </div>
              <div
                className="flex items-center gap-1.5 pl-4"
                style={{ borderLeft: '1px solid #e4e7ec' }}
              >
                <span className="text-gray-500 uppercase tracking-wide font-bold" style={{ fontSize: 9.5 }}>
                  Net Pay
                </span>
                <span className="font-black tabular-nums text-brand" style={{ fontSize: 14 }}>
                  {formatPeso(period.totalNet)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
