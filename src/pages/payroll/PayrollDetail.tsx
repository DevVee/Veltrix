import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, FileText, CheckCircle,
  Users, Banknote, TrendingDown, DollarSign, Printer,
} from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { SearchInput } from '../../components/ui/SearchInput'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useData } from '../../hooks/useData'
import { apiGetPayrollPeriod, apiGetPayrollEntries, apiUpdatePayrollStatus, apiMarkEntryPaid } from '../../lib/db'
import { useAuthStore } from '../../store/authStore'
import { formatPeso } from '../../lib/payrollEngine'

const STATUS_FLOW: Record<string, string> = {
  draft: 'reviewed', reviewed: 'approved', approved: 'paid',
}
const STATUS_ACTION: Record<string, { label: string }> = {
  draft:    { label: 'Mark Reviewed' },
  reviewed: { label: 'Approve' },
  approved: { label: 'Mark as Paid' },
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

  const { data: period, loading: pLoading, refetch }                  = useData(() => apiGetPayrollPeriod(id!), [id])
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

  const canAdvance      = !!STATUS_FLOW[period.status]
  const actionCfg       = STATUS_ACTION[period.status]
  const totalAllowances = (entries ?? []).reduce((s, e) => s + e.allowances.reduce((a, x) => a + x.amount, 0), 0)
  const totalOT         = (entries ?? []).reduce((s, e) => s + e.overtimePay, 0)

  // Status bar colors
  const statusBarBg     = period.status === 'paid' ? '#ECFDF5' : '#EEF2FF'
  const statusBarBorder = period.status === 'paid' ? '#A7F3D0' : '#C7D2FE'

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumb="Payroll"
        title={`Payroll — ${period.periodNo}`}
        subtitle={`${fmtDate(period.startDate)} – ${fmtDate(period.endDate)} · Pay Date: ${fmtDate(period.payDate)}`}
        actions={[
          { label: 'Back', icon: ArrowLeft, variant: 'secondary', onClick: () => navigate('/payroll') },
          ...(canAdvance ? [{
            label: advancing ? 'Processing…' : actionCfg.label,
            icon: CheckCircle,
            onClick: handleAdvance,
          }] : []),
        ]}
      />

      {/* ── Summary KPI strip ── */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 bg-white"
        style={{ border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}
      >
        {[
          { label: 'Employees',  value: period.totalEmployees.toString(), icon: Users,       color: '#4F46E5', highlight: false },
          { label: 'Gross Pay',  value: formatPeso(period.totalGross),    icon: Banknote,    color: '#7C3AED', highlight: false },
          { label: 'Deductions', value: formatPeso(period.totalDeductions), icon: TrendingDown, color: '#DC2626', highlight: false },
          { label: 'Net Pay',    value: formatPeso(period.totalNet),      icon: DollarSign,  color: '#4F46E5', highlight: true },
        ].map((item, i) => (
          <div
            key={item.label}
            className="px-4 py-3"
            style={{ borderLeft: i > 0 ? '1px solid #F1F5F9' : 'none' }}
          >
            <div className="flex items-center justify-between mb-2">
              <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {item.label}
              </p>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: `${item.color}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <item.icon style={{ width: 12, height: 12, color: item.color }} />
              </div>
            </div>
            <p style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: item.highlight ? '#4F46E5' : '#0F172A' }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Status + metadata bar ── */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: statusBarBg, border: `1px solid ${statusBarBorder}`, borderRadius: 10 }}
      >
        <div className="flex items-center gap-3">
          <StatusBadge type="payroll" status={period.status}>
            {STATUS_LABEL[period.status]}
          </StatusBadge>
          <span style={{ fontSize: 12, color: '#64748B' }}>
            {period.frequency.replace('-', '-')} payroll ·{' '}
            {period.totalEmployees} employees
          </span>
        </div>
        <div className="flex items-center gap-3">
          {period.approvedBy && (
            <span style={{ fontSize: 11, color: '#64748B' }}>
              Approved by <strong>{period.approvedBy}</strong>
              {period.approvedAt && ` on ${fmtDate(period.approvedAt)}`}
            </span>
          )}
          {period.paidAt && (
            <span style={{ fontSize: 11, color: '#64748B' }}>
              Paid on <strong>{fmtDate(period.paidAt)}</strong>
            </span>
          )}
          <button onClick={() => window.print()} className="btn btn-secondary no-print" style={{ height: 30, fontSize: 12 }}>
            <Printer style={{ width: 12, height: 12 }} />
            Print
          </button>
        </div>
      </div>

      {/* ── Entries Table ── */}
      <div className="card overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search employee, department…"
            className="flex-1"
          />
          <span style={{ fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap' }}>
            {filtered.length} employee{filtered.length !== 1 ? 's' : ''}
          </span>
          {/* Summary totals */}
          <div className="hidden lg:flex items-center gap-5 ml-2 pl-4" style={{ borderLeft: '1px solid #F1F5F9' }}>
            {[
              { label: 'OT Pay',     value: totalOT,         color: '#7C3AED' },
              { label: 'Allowances', value: totalAllowances,  color: '#059669' },
            ].map(item => (
              <div key={item.label}>
                <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {item.label}
                </p>
                <p style={{ fontSize: 12, fontWeight: 700, color: item.color }} className="tabular-nums">
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
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A' }}>{e.employeeName}</p>
                      <p style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2 }}>
                        {e.employeeNo} · {e.department}
                      </p>
                    </td>

                    <td className="hidden lg:table-cell text-right tabular-nums" style={{ fontSize: 12, color: '#475569' }}>
                      {e.presentDays}<span style={{ color: '#CBD5E1' }}>/{e.scheduledDays}</span>
                    </td>

                    <td className="text-right tabular-nums" style={{ fontSize: 12, color: '#475569' }}>
                      {formatPeso(e.basicPay)}
                    </td>

                    <td className="hidden xl:table-cell text-right tabular-nums" style={{ fontSize: 12, color: '#475569' }}>
                      {e.overtimePay > 0 ? formatPeso(e.overtimePay) : <span style={{ color: '#CBD5E1' }}>—</span>}
                    </td>

                    <td className="hidden xl:table-cell text-right tabular-nums" style={{ fontSize: 12, color: '#475569' }}>
                      {totalAllow > 0 ? formatPeso(totalAllow) : <span style={{ color: '#CBD5E1' }}>—</span>}
                    </td>

                    <td className="text-right tabular-nums" style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>
                      {formatPeso(e.grossPay)}
                    </td>

                    <td className="text-right tabular-nums" style={{ fontSize: 12, fontWeight: 600, color: '#DC2626' }}>
                      −{formatPeso(e.totalDeductions)}
                    </td>

                    <td className="text-right tabular-nums" style={{ fontSize: 13, fontWeight: 800, color: '#4F46E5' }}>
                      {formatPeso(e.netPay)}
                    </td>

                    <td className="no-print text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        {e.markedPaid && (
                          <span
                            className="inline-flex items-center gap-1"
                            style={{ fontSize: 10, fontWeight: 700, color: '#065F46', background: '#ECFDF5', border: '1px solid #6EE7B7', padding: '1px 7px', borderRadius: 9999 }}
                          >
                            <CheckCircle style={{ width: 9, height: 9 }} />
                            Paid
                          </span>
                        )}
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => handleMarkEntryPaid(e.employeeId)}
                            disabled={markingId === e.employeeId}
                            style={{
                              fontSize: 11, fontWeight: 600,
                              color: e.markedPaid ? '#94A3B8' : '#059669',
                              opacity: markingId === e.employeeId ? 0.5 : 1,
                              cursor: markingId === e.employeeId ? 'not-allowed' : 'pointer',
                            }}
                            title={e.markedPaid ? 'Click to unmark as paid' : 'Click to mark as paid'}
                          >
                            {e.markedPaid ? 'Unmark' : 'Mark Paid'}
                          </button>
                          <button
                            onClick={() => navigate(`/payroll/${id}/payslip/${e.employeeId}`)}
                            className="flex items-center gap-1 hover:underline font-semibold"
                            style={{ fontSize: 11, color: '#4F46E5' }}
                          >
                            <FileText style={{ width: 11, height: 11 }} />
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

        {/* Footer totals */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{ borderTop: '1px solid #F1F5F9', background: '#FAFBFC' }}
        >
          <span style={{ fontSize: 11, color: '#94A3B8' }}>
            {filtered.length} employee{filtered.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5">
              <span style={{ fontSize: 9.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Total Gross
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }} className="tabular-nums">
                {formatPeso(period.totalGross)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ fontSize: 9.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Deductions
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#DC2626' }} className="tabular-nums">
                −{formatPeso(period.totalDeductions)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 pl-4" style={{ borderLeft: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Net Pay
              </span>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#4F46E5' }} className="tabular-nums">
                {formatPeso(period.totalNet)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
