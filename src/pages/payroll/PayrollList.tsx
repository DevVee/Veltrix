import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Banknote, ChevronRight, AlertCircle,
  CheckCircle, Clock, DollarSign, TrendingUp,
} from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { SearchInput } from '../../components/ui/SearchInput'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useData } from '../../hooks/useData'
import { apiGetPayrollPeriods, apiCreatePayrollPeriod } from '../../lib/db'
import { formatPeso } from '../../lib/payrollEngine'

const STATUS_CFG: Record<string, { label: string; step: number }> = {
  draft:    { label: 'Draft',        step: 1 },
  reviewed: { label: 'For Approval', step: 2 },
  approved: { label: 'Approved',     step: 3 },
  paid:     { label: 'Paid',         step: 4 },
}

const WORKFLOW_STEPS = [
  { step: 1, label: 'Draft',        icon: Clock,        color: '#94A3B8', activeColor: '#4F46E5' },
  { step: 2, label: 'For Approval', icon: AlertCircle,  color: '#94A3B8', activeColor: '#D97706' },
  { step: 3, label: 'Approved',     icon: CheckCircle,  color: '#94A3B8', activeColor: '#059669' },
  { step: 4, label: 'Paid',         icon: DollarSign,   color: '#94A3B8', activeColor: '#4F46E5' },
]

function dateN(offset: number) {
  const d = new Date(); d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}
function fmtDateRange(start: string, end: string) {
  const s = new Date(start), e = new Date(end)
  const sm = s.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
  const em = e.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${sm} – ${em}`
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function PayrollList() {
  const navigate = useNavigate()
  const { data: periods, loading, refetch } = useData(() => apiGetPayrollPeriods(), [])
  const [modal,      setModal]      = useState(false)
  const [form,       setForm]       = useState({
    startDate: dateN(-7),
    endDate:   dateN(0),
    payDate:   dateN(3),
    frequency: 'weekly' as 'weekly' | 'bi-monthly' | 'monthly',
  })
  const [generating, setGenerating] = useState(false)
  const [search,     setSearch]     = useState('')

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await apiCreatePayrollPeriod(form)
      setModal(false)
      refetch()
    } finally {
      setGenerating(false)
    }
  }

  const totalNet   = (periods ?? []).reduce((s, p) => s + p.totalNet, 0)
  const totalGross = (periods ?? []).reduce((s, p) => s + p.totalGross, 0)
  const paidCount  = (periods ?? []).filter(p => p.status === 'paid').length
  const draftCount = (periods ?? []).filter(p => p.status === 'draft' || p.status === 'reviewed').length

  const filteredPeriods = (periods ?? []).filter(p =>
    !search ||
    p.periodNo.toLowerCase().includes(search.toLowerCase()) ||
    p.startDate.includes(search) ||
    p.endDate.includes(search) ||
    p.status.includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payroll"
        subtitle="Manage pay periods, review computations, and release payslips"
        actions={[
          { label: 'New Pay Run', icon: Plus, onClick: () => setModal(true) },
        ]}
      />

      {/* ── KPI strip ── */}
      {(periods?.length ?? 0) > 0 && (
        <div
          className="grid grid-cols-2 sm:grid-cols-4 bg-white"
          style={{ border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}
        >
          {[
            { label: 'Total Pay Runs',   value: (periods?.length ?? 0).toString(), icon: Banknote,   color: '#4F46E5' },
            { label: 'Completed (Paid)', value: paidCount.toString(),              icon: CheckCircle, color: '#059669' },
            { label: 'Total Gross',      value: formatPeso(totalGross),            icon: TrendingUp,  color: '#7C3AED' },
            { label: 'Total Net Payout', value: formatPeso(totalNet),              icon: DollarSign,  color: '#D97706' },
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
              <p style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.04em', lineHeight: 1 }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Workflow pipeline ── */}
      <div
        className="flex overflow-hidden"
        style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14 }}
      >
        {WORKFLOW_STEPS.map((step, i) => {
          const hasActive = (periods ?? []).some(p => STATUS_CFG[p.status]?.step === step.step)
          const Icon = step.icon
          return (
            <div
              key={step.step}
              className="flex-1 flex items-center gap-2.5 px-4 py-3 transition-colors"
              style={{
                borderLeft: i > 0 ? '1px solid #F1F5F9' : 'none',
                background: hasActive ? `${step.activeColor}08` : 'transparent',
              }}
            >
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: hasActive ? `${step.activeColor}1A` : '#F1F5F9',
                }}
              >
                <Icon style={{ width: 13, height: 13, color: hasActive ? step.activeColor : '#CBD5E1' }} />
              </div>
              <div className="min-w-0">
                <p style={{ fontSize: 12, fontWeight: 600, color: hasActive ? step.activeColor : '#94A3B8', lineHeight: 1 }}>
                  {step.label}
                </p>
                <p style={{ fontSize: 10, color: '#CBD5E1', marginTop: 2 }}>Step {step.step}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Pending alert ── */}
      {draftCount > 0 && (
        <div className="alert-warning">
          <AlertCircle style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 13 }}>
            <span className="font-semibold">{draftCount} pay run{draftCount !== 1 ? 's' : ''}</span> pending review or approval.{' '}
            <button
              onClick={() => {
                const p = (periods ?? []).find(p => p.status === 'draft' || p.status === 'reviewed')
                if (p) navigate(`/payroll/${p.id}`)
              }}
              className="underline font-semibold hover:no-underline"
            >
              Review now →
            </button>
          </span>
        </div>
      )}

      {/* ── Pay Runs list ── */}
      {loading ? (
        <div className="card flex items-center justify-center h-48">
          <div className="spinner" />
        </div>
      ) : !periods?.length ? (
        <div className="card">
          <EmptyState
            icon={Banknote}
            title="No payroll periods yet"
            description="Create your first pay run to compute employee salaries and deductions."
            action={{ label: 'New Pay Run', onClick: () => setModal(true) }}
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Toolbar */}
          <div className="px-3 py-2.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search period number, date, or status…"
              className="w-full"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="table-base w-full">
              <thead>
                <tr>
                  <th>Period</th>
                  <th className="hidden lg:table-cell">Date Range</th>
                  <th className="hidden lg:table-cell">Pay Date</th>
                  <th className="hidden md:table-cell text-right">Employees</th>
                  <th className="text-right">Gross Pay</th>
                  <th className="hidden xl:table-cell text-right">Deductions</th>
                  <th className="text-right">Net Pay</th>
                  <th>Status</th>
                  <th style={{ width: 36 }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredPeriods.map(p => {
                  const cfg = STATUS_CFG[p.status] ?? STATUS_CFG.draft
                  return (
                    <tr
                      key={p.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/payroll/${p.id}`)}
                    >
                      <td>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{p.periodNo}</p>
                        <p style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2, textTransform: 'capitalize' }}>
                          {p.frequency.replace('-', '-')} payroll
                        </p>
                      </td>
                      <td className="hidden lg:table-cell tabular-nums" style={{ fontSize: 12, color: '#475569' }}>
                        {fmtDateRange(p.startDate, p.endDate)}
                      </td>
                      <td className="hidden lg:table-cell tabular-nums" style={{ fontSize: 12, color: '#475569' }}>
                        {fmtDate(p.payDate)}
                      </td>
                      <td className="hidden md:table-cell text-right tabular-nums" style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                        {p.totalEmployees}
                      </td>
                      <td className="text-right tabular-nums" style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>
                        {formatPeso(p.totalGross)}
                      </td>
                      <td className="hidden xl:table-cell text-right tabular-nums" style={{ fontSize: 12, fontWeight: 600, color: '#DC2626' }}>
                        −{formatPeso(p.totalDeductions)}
                      </td>
                      <td className="text-right tabular-nums" style={{ fontSize: 12, fontWeight: 800, color: '#4F46E5' }}>
                        {formatPeso(p.totalNet)}
                      </td>
                      <td>
                        <StatusBadge type="payroll" status={p.status}>
                          {cfg.label}
                        </StatusBadge>
                      </td>
                      <td>
                        <ChevronRight style={{ width: 14, height: 14, color: '#CBD5E1' }} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{ borderTop: '1px solid #F1F5F9', background: '#FAFBFC' }}
          >
            <span style={{ fontSize: 11, color: '#94A3B8' }}>
              {filteredPeriods.length} pay run{filteredPeriods.length !== 1 ? 's' : ''} · Total net:{' '}
              <span style={{ fontWeight: 600, color: '#475569' }} className="tabular-nums">
                {formatPeso(totalNet)}
              </span>
            </span>
            <button
              onClick={() => setModal(true)}
              className="flex items-center gap-1 hover:underline font-semibold"
              style={{ fontSize: 11, color: '#4F46E5' }}
            >
              <Plus style={{ width: 11, height: 11 }} /> New pay run
            </button>
          </div>
        </div>
      )}

      {/* ── Generate Modal ── */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Generate New Pay Run"
        footer={
          <>
            <button onClick={() => setModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn btn-primary"
            >
              {generating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Plus style={{ width: 13, height: 13 }} />
                  Generate Pay Run
                </>
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="alert-info">
            <AlertCircle style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12 }}>
              Payroll will be computed for all <strong>active</strong> employees based on
              attendance records within the selected period. Government deductions (SSS,
              PhilHealth, Pag-IBIG, Withholding Tax) are auto-calculated.
            </span>
          </div>

          <div>
            <label className="form-label">Pay Frequency</label>
            <select
              className="input-base"
              value={form.frequency}
              onChange={e => {
                const freq = e.target.value as typeof form.frequency
                const offsets: Record<string, number> = { weekly: 7, 'bi-monthly': 15, monthly: 30 }
                const days = offsets[freq] ?? 7
                setForm(f => ({ ...f, frequency: freq, startDate: dateN(-days), endDate: dateN(0), payDate: dateN(3) }))
              }}
            >
              <option value="weekly">Weekly (7 days)</option>
              <option value="bi-monthly">Bi-Monthly / Semi-Monthly (15 days)</option>
              <option value="monthly">Monthly (30 days)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Period Start</label>
              <input type="date" className="input-base" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Period End</label>
              <input type="date" className="input-base" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="form-label">Pay Date</label>
            <input type="date" className="input-base" value={form.payDate} onChange={e => setForm(f => ({ ...f, payDate: e.target.value }))} />
            <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
              The date when salaries will be released to employees.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
