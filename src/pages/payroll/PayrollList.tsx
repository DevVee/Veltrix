import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Banknote, ChevronRight, AlertCircle,
  CheckCircle, Clock, DollarSign, TrendingUp,
} from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { useData } from '../../hooks/useData'
import { apiGetPayrollPeriods, apiCreatePayrollPeriod } from '../../lib/db'
import { formatPeso } from '../../lib/payrollEngine'

const STATUS_CFG: Record<string, {
  pill: string; label: string; step: number; desc: string
}> = {
  draft:    { pill: 'pill pill-gray',   label: 'Draft',        step: 1, desc: 'Computing' },
  reviewed: { pill: 'pill pill-yellow', label: 'For Approval', step: 2, desc: 'Reviewing' },
  approved: { pill: 'pill pill-blue',   label: 'Approved',     step: 3, desc: 'Verified' },
  paid:     { pill: 'pill pill-green',  label: 'Paid',         step: 4, desc: 'Released' },
}

const WORKFLOW_STEPS = [
  { step: 1, label: 'Draft',        icon: Clock },
  { step: 2, label: 'For Approval', icon: AlertCircle },
  { step: 3, label: 'Approved',     icon: CheckCircle },
  { step: 4, label: 'Paid',         icon: DollarSign },
]

function dateN(offset: number) {
  const d = new Date(); d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}

function fmtDateRange(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
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

  const totalNet    = (periods ?? []).reduce((s, p) => s + p.totalNet, 0)
  const totalGross  = (periods ?? []).reduce((s, p) => s + p.totalGross, 0)
  const paidCount   = (periods ?? []).filter(p => p.status === 'paid').length
  const draftCount  = (periods ?? []).filter(p => p.status === 'draft' || p.status === 'reviewed').length

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payroll"
        subtitle="Manage pay periods, review computations, and release payslips"
        actions={[
          { label: 'New Pay Run', icon: Plus, onClick: () => setModal(true) },
        ]}
      />

      {/* ── KPI Strip ── */}
      {(periods?.length ?? 0) > 0 && (
        <div
          className="grid grid-cols-2 sm:grid-cols-4"
          style={{
            background: '#fff',
            border: '1px solid #e4e7ec',
            borderRadius: 5,
          }}
        >
          {[
            {
              label: 'Total Pay Runs',
              value: (periods?.length ?? 0).toString(),
              icon: Banknote,
              color: '#1a56db',
            },
            {
              label: 'Completed (Paid)',
              value: paidCount.toString(),
              icon: CheckCircle,
              color: '#15803d',
            },
            {
              label: 'Total Gross',
              value: formatPeso(totalGross),
              icon: TrendingUp,
              color: '#7c3aed',
            },
            {
              label: 'Total Net Payout',
              value: formatPeso(totalNet),
              icon: DollarSign,
              color: '#b45309',
            },
          ].map((item, i) => (
            <div
              key={item.label}
              className="px-4 py-3"
              style={{ borderRight: i < 3 ? '1px solid #f0f2f5' : 'none' }}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-gray-400 uppercase tracking-wide" style={{ fontSize: 10, fontWeight: 600 }}>
                  {item.label}
                </p>
                <item.icon style={{ width: 12, height: 12, color: item.color, opacity: 0.6 }} />
              </div>
              <p
                className="font-bold tabular-nums text-gray-900"
                style={{ fontSize: 18, letterSpacing: '-0.03em' }}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Workflow indicator ── */}
      <div
        className="flex overflow-hidden"
        style={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 5 }}
      >
        {WORKFLOW_STEPS.map((step, i) => {
          const hasActive = (periods ?? []).some(p => STATUS_CFG[p.status]?.step === step.step)
          const Icon = step.icon
          return (
            <div
              key={step.step}
              className="flex-1 flex items-center gap-2.5 px-4 py-2.5"
              style={{
                borderRight: i < 3 ? '1px solid #f0f2f5' : 'none',
                background: hasActive ? '#eff6ff' : 'transparent',
              }}
            >
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 22,
                  height: 22,
                  background: hasActive ? '#1a56db' : '#f3f4f6',
                  borderRadius: '50%',
                }}
              >
                <Icon
                  style={{
                    width: 10,
                    height: 10,
                    color: hasActive ? '#fff' : '#9ca3af',
                  }}
                />
              </div>
              <div className="min-w-0">
                <p
                  className="font-semibold leading-none truncate"
                  style={{ fontSize: 11, color: hasActive ? '#1a56db' : '#9ca3af' }}
                >
                  {step.label}
                </p>
                <p className="text-gray-400 mt-0.5 leading-none" style={{ fontSize: 9.5 }}>
                  Step {step.step}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Pending alert ── */}
      {draftCount > 0 && (
        <div className="alert-warning">
          <AlertCircle style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }} />
          <span className="font-medium">
            {draftCount} pay run{draftCount !== 1 ? 's' : ''} pending review or approval.{' '}
            <button
              onClick={() => {
                const p = (periods ?? []).find(p => p.status === 'draft' || p.status === 'reviewed')
                if (p) navigate(`/payroll/${p.id}`)
              }}
              className="underline font-semibold"
            >
              Review now →
            </button>
          </span>
        </div>
      )}

      {/* ── Pay Runs Table ── */}
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
                  <th style={{ width: 32 }}></th>
                </tr>
              </thead>
              <tbody>
                {(periods ?? []).map(p => {
                  const cfg = STATUS_CFG[p.status] ?? STATUS_CFG.draft
                  return (
                    <tr
                      key={p.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/payroll/${p.id}`)}
                    >
                      <td>
                        <p className="font-bold text-gray-900" style={{ fontSize: 12.5 }}>
                          {p.periodNo}
                        </p>
                        <p className="text-gray-400 mt-0.5 capitalize" style={{ fontSize: 10 }}>
                          {p.frequency.replace('-', '-')} payroll
                        </p>
                      </td>

                      <td className="hidden lg:table-cell">
                        <span className="tabular-nums text-gray-600" style={{ fontSize: 12 }}>
                          {fmtDateRange(p.startDate, p.endDate)}
                        </span>
                      </td>

                      <td className="hidden lg:table-cell">
                        <span className="tabular-nums text-gray-600" style={{ fontSize: 12 }}>
                          {fmtDate(p.payDate)}
                        </span>
                      </td>

                      <td className="hidden md:table-cell text-right">
                        <span className="font-semibold tabular-nums text-gray-700" style={{ fontSize: 12 }}>
                          {p.totalEmployees}
                        </span>
                      </td>

                      <td className="text-right">
                        <span className="font-semibold tabular-nums text-gray-800" style={{ fontSize: 12 }}>
                          {formatPeso(p.totalGross)}
                        </span>
                      </td>

                      <td className="hidden xl:table-cell text-right">
                        <span className="font-semibold tabular-nums text-red-600" style={{ fontSize: 12 }}>
                          −{formatPeso(p.totalDeductions)}
                        </span>
                      </td>

                      <td className="text-right">
                        <span className="font-bold tabular-nums text-brand" style={{ fontSize: 12 }}>
                          {formatPeso(p.totalNet)}
                        </span>
                      </td>

                      <td>
                        <span className={cfg.pill}>{cfg.label}</span>
                      </td>

                      <td>
                        <ChevronRight style={{ width: 14, height: 14, color: '#d1d5db' }} />
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
            style={{ borderTop: '1px solid #f0f2f5', background: '#fafbfc' }}
          >
            <span className="text-gray-400" style={{ fontSize: 11 }}>
              {(periods ?? []).length} pay run{(periods ?? []).length !== 1 ? 's' : ''} ·{' '}
              Total net:{' '}
              <span className="font-semibold text-gray-600 tabular-nums">
                {formatPeso(totalNet)}
              </span>
            </span>
            <button
              onClick={() => setModal(true)}
              className="flex items-center gap-1 text-brand font-semibold hover:underline"
              style={{ fontSize: 11 }}
            >
              <Plus style={{ width: 11, height: 11 }} /> New pay run
            </button>
          </div>
        </div>
      )}

      {/* ── Generate modal ── */}
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
                  <span
                    className="spinner spinner-sm"
                    style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
                  />
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
            <span>
              Payroll will be computed for all <strong>active</strong> employees based on
              attendance records within the selected period. Government deductions (SSS,
              PhilHealth, Pag-IBIG, Withholding Tax) are auto-calculated.
            </span>
          </div>

          {/* Frequency first */}
          <div>
            <label className="form-label">Pay Frequency</label>
            <select
              className="input-base"
              value={form.frequency}
              onChange={e => {
                const freq = e.target.value as typeof form.frequency
                // Auto-adjust default dates based on frequency
                const offsets: Record<string, number> = {
                  weekly: 7, 'bi-monthly': 15, monthly: 30,
                }
                const days = offsets[freq] ?? 7
                setForm(f => ({
                  ...f,
                  frequency: freq,
                  startDate: dateN(-days),
                  endDate: dateN(0),
                  payDate: dateN(3),
                }))
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
              <input
                type="date"
                className="input-base"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">Period End</label>
              <input
                type="date"
                className="input-base"
                value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Pay Date</label>
            <input
              type="date"
              className="input-base"
              value={form.payDate}
              onChange={e => setForm(f => ({ ...f, payDate: e.target.value }))}
            />
            <p className="text-gray-400 mt-1" style={{ fontSize: 11 }}>
              The date when salaries will be released to employees.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
