import { useState } from 'react'
import { Clock, CheckCircle, XCircle } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { SearchInput } from '../../components/ui/SearchInput'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { ActionIconBtn } from '../../components/ui/ActionIconBtn'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useData } from '../../hooks/useData'
import { apiGetOvertime, apiUpdateOvertimeStatus } from '../../lib/db'
import { useAuthStore } from '../../store/authStore'
import type { OvertimeRequest } from '../../types'

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

      {/* ── Summary strip ── */}
      <div
        className="grid grid-cols-3 bg-white"
        style={{ border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}
      >
        {[
          { label: 'Pending',        value: pending,                  color: '#D97706' },
          { label: 'Approved',       value: approved,                 color: '#059669' },
          { label: 'Total OT Hours', value: `${totalHrs.toFixed(1)}h`, color: '#4F46E5' },
        ].map((s, i) => (
          <div key={s.label} className="px-4 py-3" style={{ borderLeft: i > 0 ? '1px solid #F1F5F9' : 'none' }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: '-0.04em', lineHeight: 1 }} className="tabular-nums">
              {s.value}
            </p>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search employee…"
            className="flex-1"
          />
          <div className="flex items-center gap-1">
            {(['all','pending','approved','rejected'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="filter-pill"
                style={statusFilter === s ? { background: '#EEF2FF', color: '#4F46E5', borderColor: '#C7D2FE', fontWeight: 600 } : {}}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
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
                        <StatusBadge type="overtime" status={r.status}>
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </StatusBadge>
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
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8 }}
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
