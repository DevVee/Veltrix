import { useState } from 'react'
import { Clock, CheckCircle, XCircle, Search } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { ActionIconBtn } from '../../components/ui/ActionIconBtn'
import { useData } from '../../hooks/useData'
import { apiGetOvertime, apiUpdateOvertimeStatus } from '../../lib/db'
import { useAuthStore } from '../../store/authStore'
import type { OvertimeRequest } from '../../types'

const STATUS_PILL: Record<string, string> = {
  pending:  'pill pill-yellow',
  approved: 'pill pill-green',
  rejected: 'pill pill-red',
}

export function OvertimeList() {
  const user = useAuthStore(s => s.user)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: otList, loading, refetch } = useData(
    () => apiGetOvertime({ status: statusFilter !== 'all' ? statusFilter as OvertimeRequest['status'] : undefined }),
    [statusFilter]
  )

  const [acting,     setActing]     = useState<OvertimeRequest | null>(null)
  const [actionType, setActionType] = useState<'approve'|'reject'>('approve')
  const [remarks,    setRemarks]    = useState('')
  const [saving,     setSaving]     = useState(false)

  const filtered = (otList ?? []).filter(r => {
    const q = search.toLowerCase()
    return !search || r.employeeName.toLowerCase().includes(q) || r.employeeNo.toLowerCase().includes(q)
  })

  const all       = otList ?? []
  const pending   = all.filter(r => r.status === 'pending').length
  const approved  = all.filter(r => r.status === 'approved').length
  const totalHrs  = all.filter(r => r.status === 'approved').reduce((s,r) => s + r.hoursRequested, 0)

  const openAction = (r: OvertimeRequest, type: 'approve'|'reject') => {
    setActing(r); setActionType(type); setRemarks('')
  }

  const saveAction = async () => {
    if (!acting) return
    setSaving(true)
    try {
      await apiUpdateOvertimeStatus(acting.id, actionType === 'approve' ? 'approved' : 'rejected', user?.name)
      setActing(null); refetch()
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Overtime Requests"
        subtitle="Review and approve employee overtime"
      />

      {/* Summary */}
      <div
        className="grid grid-cols-3 divide-x divide-gray-100 bg-white"
        style={{ border: '1px solid #E2E5EB', borderRadius: '6px' }}
      >
        {[
          { label: 'Pending',           value: pending,              color: '#B45309' },
          { label: 'Approved',          value: approved,             color: '#15803D' },
          { label: 'Total OT Hours',    value: `${totalHrs.toFixed(1)}h`, color: '#1565C0' },
        ].map(s => (
          <div key={s.label} className="px-4 py-2.5">
            <p className="text-[18px] font-bold tabular-nums" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-2 px-3 py-2.5">
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search employee…"
              className="input-base pl-8"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input-base"
            style={{ width: '130px' }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="spinner" />
          </div>
        ) : !filtered.length ? (
          <EmptyState
            icon={Clock}
            title="No overtime requests"
            description="No requests match your current filters."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table-base w-full">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: '16px' }}>Employee</th>
                    <th>Date</th>
                    <th className="hidden md:table-cell">Type</th>
                    <th>Hours</th>
                    <th className="hidden lg:table-cell">Reason</th>
                    <th>Status</th>
                    <th className="hidden md:table-cell">Filed</th>
                    <th style={{ width: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id}>
                      <td style={{ paddingLeft: '16px' }}>
                        <p className="text-sm font-semibold text-gray-800 leading-none">{r.employeeName}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{r.employeeNo}</p>
                      </td>
                      <td>
                        <span className="text-sm tabular-nums text-gray-700">{r.date}</span>
                      </td>
                      <td className="hidden md:table-cell">
                        <span className="text-sm text-gray-600">
                          {r.overtimeType
                            ? r.overtimeType.replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase())
                            : 'Regular OT'}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm font-semibold text-gray-800 tabular-nums">{r.hoursRequested}h</span>
                      </td>
                      <td className="hidden lg:table-cell" style={{ maxWidth: '200px' }}>
                        <span className="text-sm text-gray-500 line-clamp-1">{r.reason}</span>
                      </td>
                      <td>
                        <span className={STATUS_PILL[r.status] ?? 'pill pill-gray'}>{r.status}</span>
                      </td>
                      <td className="hidden md:table-cell">
                        <span className="text-[11px] text-gray-400 tabular-nums">
                          {new Date(r.filedAt ?? r.createdAt).toLocaleDateString('en-PH',{month:'short',day:'numeric'})}
                        </span>
                      </td>
                      <td>
                        {r.status === 'pending' ? (
                          <div className="flex items-center gap-1.5">
                            <ActionIconBtn variant="green"  icon={CheckCircle} onClick={() => openAction(r, 'approve')} title="Approve" />
                            <ActionIconBtn variant="delete" icon={XCircle}     onClick={() => openAction(r, 'reject')}  title="Reject" />
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400">
                            {(r.approvedBy ?? (r as any).reviewedBy) ? `by ${r.approvedBy ?? (r as any).reviewedBy}` : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              className="px-4 py-2"
              style={{ borderTop: '1px solid #EEF0F4', background: '#FAFBFC' }}
            >
              <span className="text-[11px] text-gray-400">
                {filtered.length} request{filtered.length !== 1 ? 's' : ''}
                {pending > 0 && ` · ${pending} pending review`}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Action Modal */}
      <Modal
        open={!!acting}
        onClose={() => setActing(null)}
        title={actionType === 'approve' ? 'Approve Overtime' : 'Reject Overtime'}
        footer={
          <>
            <button onClick={() => setActing(null)} className="btn btn-secondary">Cancel</button>
            <button
              onClick={saveAction}
              disabled={saving}
              className={actionType === 'approve' ? 'btn btn-primary' : 'btn btn-danger'}
            >
              {saving ? 'Saving…' : actionType === 'approve' ? 'Approve OT' : 'Reject OT'}
            </button>
          </>
        }
      >
        {acting && (
          <div className="space-y-4">
            <div
              className="p-3"
              style={{ background: '#F7F8FA', border: '1px solid #EEF0F4', borderRadius: '4px' }}
            >
              <p className="text-sm font-semibold text-gray-800">{acting.employeeName}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {acting.date} · {acting.hoursRequested} hours overtime
              </p>
              {acting.reason && (
                <p className="text-[11px] text-gray-400 mt-1 italic">"{acting.reason}"</p>
              )}
            </div>

            <div>
              <label className="form-label">
                Remarks{' '}
                <span className="text-gray-300 font-normal normal-case text-[11px]">(optional)</span>
              </label>
              <textarea
                className="input-base"
                style={{ height: '72px', resize: 'none' }}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder={actionType === 'approve' ? 'Any notes…' : 'Reason for rejection…'}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
