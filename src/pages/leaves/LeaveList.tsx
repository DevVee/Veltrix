import { useState } from 'react'
import { Calendar, CheckCircle, XCircle, Users } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { SearchInput } from '../../components/ui/SearchInput'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { ActionIconBtn } from '../../components/ui/ActionIconBtn'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useData } from '../../hooks/useData'
import { apiGetLeaves, apiUpdateLeaveStatus, apiGetLeaveBalances } from '../../lib/db'
import { useAuthStore } from '../../store/authStore'
import type { LeaveRequest } from '../../types'

const LEAVE_TYPE_LABEL: Record<string, string> = {
  vacation:    'Vacation',
  sick:        'Sick',
  emergency:   'Emergency',
  maternity:   'Maternity',
  paternity:   'Paternity',
  bereavement: 'Bereavement',
  unpaid:      'Unpaid',
}

const LEAVE_TYPE_PILL: Record<string, string> = {
  vacation:    'pill pill-blue',
  sick:        'pill pill-orange',
  emergency:   'pill pill-red',
  maternity:   'pill pill-purple',
  paternity:   'pill pill-indigo',
  bereavement: 'pill pill-gray',
  unpaid:      'pill pill-gray',
}

export function LeaveList() {
  const user = useAuthStore(s => s.user)
  const [tab,          setTab]          = useState<'requests'|'balances'>('requests')
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter,   setTypeFilter]   = useState('all')

  const { data: leaves,   loading: lLoading, refetch } = useData(
    () => apiGetLeaves({ status: statusFilter !== 'all' ? statusFilter as LeaveRequest['status'] : undefined }),
    [statusFilter]
  )
  const { data: balances, loading: bLoading } = useData(() => apiGetLeaveBalances(), [])

  // Action modal
  const [acting,     setActing]     = useState<LeaveRequest | null>(null)
  const [actionType, setActionType] = useState<'approve'|'reject'>('approve')
  const [remarks,    setRemarks]    = useState('')
  const [saving,     setSaving]     = useState(false)

  const filtered = (leaves ?? []).filter(r => {
    const q = search.toLowerCase()
    return (
      (!search || r.employeeName.toLowerCase().includes(q) || (r.employeeNo ?? '').toLowerCase().includes(q)) &&
      (typeFilter === 'all' || r.leaveType === typeFilter)
    )
  })

  const pendingCount = filtered.filter(r => r.status === 'pending').length

  const openAction = (r: LeaveRequest, type: 'approve'|'reject') => {
    setActing(r); setActionType(type); setRemarks('')
  }

  const saveAction = async () => {
    if (!acting) return
    setSaving(true)
    try {
      await apiUpdateLeaveStatus(acting.id, actionType === 'approve' ? 'approved' : 'rejected', user?.name, remarks)
      setActing(null); refetch()
    } finally { setSaving(false) }
  }

  const days = (r: LeaveRequest) => {
    const ms = new Date(r.endDate).getTime() - new Date(r.startDate).getTime()
    return Math.round(ms / 86400000) + 1
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Leave Management"
        subtitle="Review and manage employee time-off requests"
      />

      {/* ── Tabs ── */}
      <div className="tab-bar">
        <button
          onClick={() => setTab('requests')}
          className={`tab-btn ${tab === 'requests' ? 'active' : ''}`}
        >
          Leave Requests
          {pendingCount > 0 && (
            <span
              className="flex items-center justify-center text-white font-bold"
              style={{
                background: '#4F46E5', borderRadius: 9999,
                width: 16, height: 16, fontSize: 9, marginLeft: 2,
              }}
            >
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('balances')}
          className={`tab-btn ${tab === 'balances' ? 'active' : ''}`}
        >
          Leave Balances
        </button>
      </div>

      {tab === 'requests' ? (
        <>
          {/* Filters */}
          <div className="card">
            <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search employee…"
                className="flex-1"
              />
              {/* Status filter pills */}
              <div className="flex items-center gap-1">
                {(['all','pending','approved','rejected','cancelled'] as const).map(s => (
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
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="input-base input-sm"
                style={{ width: 130 }}
              >
                <option value="all">All Types</option>
                {Object.entries(LEAVE_TYPE_LABEL).map(([v,l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="card overflow-hidden">
            {lLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="spinner" />
              </div>
            ) : !filtered.length ? (
              <EmptyState
                icon={Calendar}
                title="No leave requests"
                description="No requests match your current filters."
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="table-base w-full">
                    <thead>
                      <tr>
                        <th style={{ paddingLeft: '16px' }}>Employee</th>
                        <th>Type</th>
                        <th className="hidden md:table-cell">Dates</th>
                        <th>Days</th>
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
                            {r.employeeNo && (
                              <p className="text-[11px] text-gray-400 mt-0.5">{r.employeeNo}</p>
                            )}
                          </td>
                          <td>
                            <span className={LEAVE_TYPE_PILL[r.leaveType] ?? 'pill pill-gray'}>
                              {LEAVE_TYPE_LABEL[r.leaveType] ?? r.leaveType}
                            </span>
                          </td>
                          <td className="hidden md:table-cell">
                            <span className="text-sm text-gray-700 tabular-nums">
                              {r.startDate === r.endDate ? r.startDate : `${r.startDate} – ${r.endDate}`}
                            </span>
                          </td>
                          <td>
                            <span className="text-sm font-semibold text-gray-700 tabular-nums">{days(r)}</span>
                          </td>
                          <td className="hidden lg:table-cell" style={{ maxWidth: '200px' }}>
                            <span className="text-sm text-gray-500 line-clamp-1">{r.reason}</span>
                          </td>
                          <td>
                            <StatusBadge type="leave" status={r.status}>
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
                    {pendingCount > 0 && ` · ${pendingCount} pending`}
                  </span>
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        /* Leave Balances */
        <div className="card overflow-hidden">
          {bLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="spinner" />
            </div>
          ) : !(balances ?? []).length ? (
            <EmptyState icon={Users} title="No balance data" description="Leave balances will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="table-base w-full">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: '16px' }}>Employee</th>
                    <th className="hidden md:table-cell">Department</th>
                    <th>Vacation</th>
                    <th>Sick</th>
                    <th>Emergency</th>
                    <th className="hidden md:table-cell">Year</th>
                  </tr>
                </thead>
                <tbody>
                  {(balances ?? []).map(b => (
                    <tr key={b.employeeId}>
                      <td style={{ paddingLeft: '16px' }}>
                        <p className="text-sm font-semibold text-gray-800">{b.employeeName ?? b.employeeId}</p>
                        {b.employeeNo && <p className="text-[11px] text-gray-400 mt-0.5">{b.employeeNo}</p>}
                      </td>
                      <td className="hidden md:table-cell">
                        <span className="text-sm text-gray-500">{b.department ?? '—'}</span>
                      </td>
                      <td><BalanceCell used={b.vacation.used} total={b.vacation.entitled} /></td>
                      <td><BalanceCell used={b.sick.used} total={b.sick.entitled} /></td>
                      <td><BalanceCell used={b.emergency.used} total={b.emergency.entitled} /></td>
                      <td className="hidden md:table-cell">
                        <span className="text-xs text-gray-400">{b.year}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Action Modal */}
      <Modal
        open={!!acting}
        onClose={() => setActing(null)}
        title={actionType === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
        footer={
          <>
            <button onClick={() => setActing(null)} className="btn btn-secondary">Cancel</button>
            <button
              onClick={saveAction}
              disabled={saving}
              className={actionType === 'approve' ? 'btn btn-primary' : 'btn btn-danger'}
            >
              {saving ? 'Saving…' : actionType === 'approve' ? 'Approve Leave' : 'Reject Leave'}
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
                {LEAVE_TYPE_LABEL[acting.leaveType]} leave ·{' '}
                {acting.startDate}{acting.startDate !== acting.endDate ? ` – ${acting.endDate}` : ''} ·{' '}
                {days(acting)} day{days(acting) !== 1 ? 's' : ''}
              </p>
              {acting.reason && (
                <p className="text-[11px] text-gray-400 mt-1.5 italic">"{acting.reason}"</p>
              )}
            </div>

            <div>
              <label className="form-label">
                Remarks{' '}
                <span className="text-gray-300 font-normal normal-case text-[11px]">(optional)</span>
              </label>
              <textarea
                className="input-base"
                style={{ height: '80px', resize: 'none' }}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder={actionType === 'approve'
                  ? 'Any notes for the employee…'
                  : 'Reason for rejection…'}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function BalanceCell({ used, total }: { used: number; total: number }) {
  const remaining = total - used
  const pct       = total > 0 ? (used / total) * 100 : 0
  const isLow     = pct > 70

  return (
    <div style={{ minWidth: '80px' }}>
      <div className="flex items-baseline gap-0.5">
        <span className={`text-sm font-bold tabular-nums ${isLow ? 'text-amber-600' : 'text-gray-800'}`}>
          {remaining}
        </span>
        <span className="text-[11px] text-gray-400">/{total}</span>
      </div>
      <div className="h-1 mt-1 bg-gray-100" style={{ borderRadius: '999px' }}>
        <div
          className="h-full transition-all"
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: isLow ? '#D97706' : '#4F46E5',
            borderRadius: '999px',
          }}
        />
      </div>
    </div>
  )
}
