import { useState } from 'react'
import { Search, Download, Edit3, CalendarDays, Clock } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal } from '../../components/ui/Modal'
import { useData } from '../../hooks/useData'
import { apiGetAttendance, apiCorrectAttendance, getDepartments } from '../../lib/db'
import { useAuthStore } from '../../store/authStore'
import type { AttendanceRecord } from '../../types'

const STATUS_PILL: Record<string, string> = {
  present:    'pill pill-green',
  late:       'pill pill-yellow',
  absent:     'pill pill-red',
  'on-leave': 'pill pill-blue',
  'half-day': 'pill pill-orange',
  'rest-day': 'pill pill-gray',
  holiday:    'pill pill-purple',
}

function dateN(offset: number) {
  const d = new Date(); d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PH', { hour:'2-digit', minute:'2-digit', hour12:true })
}

export function AttendanceLog() {
  const user = useAuthStore(s => s.user)
  const [search,    setSearch]    = useState('')
  const [status,    setStatus]    = useState('all')
  const [startDate, setStartDate] = useState(dateN(-30))
  const [endDate,   setEndDate]   = useState(dateN(0))
  const [dept,      setDept]      = useState('all')
  const departments = getDepartments()

  const { data: records, loading, refetch } = useData(
    () => apiGetAttendance({ startDate, endDate, status: status !== 'all' ? status : undefined }),
    [startDate, endDate, status]
  )

  // Correction modal
  const [correcting, setCorrecting] = useState<AttendanceRecord | null>(null)
  const [corrForm,   setCorrForm]   = useState({ timeIn:'', timeOut:'', status:'', reason:'' })
  const [saving,     setSaving]     = useState(false)

  const filtered = (records ?? []).filter(r => {
    if (r.status === 'rest-day') return false
    const q = search.toLowerCase()
    const matchSearch = !search || r.employeeName.toLowerCase().includes(q) || r.employeeNo.toLowerCase().includes(q)
    const matchDept   = dept === 'all' || (r as any).department === dept
    return matchSearch && matchDept
  })

  // Summary stats
  const total   = filtered.length
  const present = filtered.filter(r => r.status === 'present').length
  const late    = filtered.filter(r => r.status === 'late').length
  const absent  = filtered.filter(r => r.status === 'absent').length

  const openCorrect = (r: AttendanceRecord) => {
    setCorrecting(r)
    setCorrForm({
      timeIn:  r.timeIn  ? new Date(r.timeIn).toTimeString().slice(0,5)  : '',
      timeOut: r.timeOut ? new Date(r.timeOut).toTimeString().slice(0,5) : '',
      status:  r.status,
      reason:  '',
    })
  }

  const saveCorrection = async () => {
    if (!correcting || !corrForm.reason) return
    setSaving(true)
    try {
      const d = correcting.date
      const updates: Partial<AttendanceRecord> = { status: corrForm.status as AttendanceRecord['status'] }
      if (corrForm.timeIn)  updates.timeIn  = `${d}T${corrForm.timeIn}:00.000Z`
      if (corrForm.timeOut) updates.timeOut = `${d}T${corrForm.timeOut}:00.000Z`
      await apiCorrectAttendance(correcting.id, updates, user?.name ?? 'HR', corrForm.reason)
      setCorrecting(null); refetch()
    } finally { setSaving(false) }
  }

  const exportCSV = () => {
    const rows = [
      ['Date','Emp No','Name','Time In','Time Out','Hours','Late (min)','OT (min)','Status'],
      ...filtered.map(r => {
        const hours = r.timeIn && r.timeOut
          ? ((new Date(r.timeOut).getTime() - new Date(r.timeIn).getTime()) / 3600000).toFixed(2)
          : ''
        return [
          r.date, r.employeeNo, r.employeeName,
          r.timeIn  ? fmt(r.timeIn)  : '',
          r.timeOut ? fmt(r.timeOut) : '',
          hours, r.minutesLate, r.overtimeMinutes, r.status,
        ]
      }),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`
    a.download = `attendance_${startDate}_${endDate}.csv`
    a.click()
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Attendance Log"
        subtitle="Historical attendance records with correction support"
        actions={[
          { label: 'Export CSV', icon: Download, variant: 'secondary', onClick: exportCSV },
        ]}
      />

      {/* ── Summary strip ── */}
      <div
        className="grid grid-cols-4 divide-x divide-gray-100 bg-white"
        style={{ border: '1px solid #E2E5EB', borderRadius: '6px' }}
      >
        {[
          { label: 'Total Records', value: total,   color: '#111827' },
          { label: 'Present',       value: present, color: '#15803D' },
          { label: 'Late',          value: late,    color: '#B45309' },
          { label: 'Absent',        value: absent,  color: '#991B1B' },
        ].map(item => (
          <div key={item.label} className="px-4 py-2.5 text-center" style={{ borderColor: '#EEF0F4' }}>
            <p className="text-[18px] font-bold tabular-nums" style={{ color: item.color }}>{item.value}</p>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search employee…"
              className="input-base pl-8"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="input-base"
              style={{ width: '140px' }}
            />
            <span className="text-[11px] text-gray-400">–</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="input-base"
              style={{ width: '140px' }}
            />
          </div>

          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="input-base"
            style={{ width: '130px' }}
          >
            <option value="all">All Status</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="absent">Absent</option>
            <option value="on-leave">On Leave</option>
            <option value="half-day">Half Day</option>
          </select>

          <select
            value={dept}
            onChange={e => setDept(e.target.value)}
            className="input-base"
            style={{ width: '160px' }}
          >
            <option value="all">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="spinner" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table-base w-full">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: '16px' }}>Date</th>
                    <th>Employee</th>
                    <th>Time In</th>
                    <th>Time Out</th>
                    <th>Hours</th>
                    <th>Late</th>
                    <th>OT</th>
                    <th>Status</th>
                    <th style={{ width: '60px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 250).map(a => {
                    const hours = a.timeIn && a.timeOut
                      ? ((new Date(a.timeOut).getTime() - new Date(a.timeIn).getTime()) / 3600000).toFixed(1)
                      : null

                    return (
                      <tr key={a.id}>
                        <td style={{ paddingLeft: '16px' }}>
                          <span className="text-sm tabular-nums text-gray-700 font-medium">{a.date}</span>
                        </td>
                        <td>
                          <p className="text-sm font-semibold text-gray-800 leading-none">{a.employeeName}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{a.employeeNo}</p>
                        </td>
                        <td>
                          <span className="text-sm tabular-nums text-gray-700">
                            {a.timeIn ? fmt(a.timeIn) : <span className="text-gray-300">—</span>}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm tabular-nums text-gray-700">
                            {a.timeOut ? fmt(a.timeOut) : <span className="text-gray-300">—</span>}
                          </span>
                        </td>
                        <td>
                          <span className={`text-sm tabular-nums ${hours ? 'text-gray-700' : 'text-gray-300'}`}>
                            {hours ? `${hours}h` : '—'}
                          </span>
                        </td>
                        <td>
                          {a.minutesLate > 0 ? (
                            <span className="text-sm tabular-nums text-amber-600 font-semibold">
                              {a.minutesLate}m
                            </span>
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          )}
                        </td>
                        <td>
                          {a.overtimeMinutes > 0 ? (
                            <span className="text-sm tabular-nums text-brand font-semibold">
                              {a.overtimeMinutes}m
                            </span>
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          )}
                        </td>
                        <td>
                          <span className={STATUS_PILL[a.status] ?? 'pill pill-gray'}>
                            {a.status.replace('-', ' ')}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => openCorrect(a)}
                            className="btn btn-ghost btn-sm gap-1"
                            title="Correct record"
                          >
                            <Edit3 className="w-3 h-3" />
                            Edit
                          </button>
                        </td>
                      </tr>
                    )
                  })}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-12 text-center">
                        <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: '#E2E5EB' }} />
                        <p className="text-sm text-gray-400">No attendance records found</p>
                        <p className="text-[11px] text-gray-300 mt-0.5">Try adjusting the date range or filters</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div
              className="flex items-center justify-between px-4 py-2"
              style={{ borderTop: '1px solid #EEF0F4', background: '#FAFBFC' }}
            >
              <span className="text-[11px] text-gray-400">
                {filtered.length} records · {filtered.length > 250 ? 'showing first 250' : 'all shown'}
              </span>
              <span className="text-[11px] text-gray-400">
                {startDate} — {endDate}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Correction modal */}
      <Modal
        open={!!correcting}
        onClose={() => setCorrecting(null)}
        title="Correct Attendance Record"
        footer={
          <>
            <button onClick={() => setCorrecting(null)} className="btn btn-secondary">Cancel</button>
            <button
              onClick={saveCorrection}
              disabled={saving || !corrForm.reason}
              className="btn btn-primary"
            >
              {saving ? 'Saving…' : 'Save Correction'}
            </button>
          </>
        }
      >
        {correcting && (
          <div className="space-y-4">
            <div
              className="px-3 py-2.5"
              style={{ background: '#F7F8FA', border: '1px solid #EEF0F4', borderRadius: '4px' }}
            >
              <p className="text-sm font-semibold text-gray-800">{correcting.employeeName}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{correcting.date} · {correcting.status}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Time In</label>
                <input
                  type="time"
                  className="input-base"
                  value={corrForm.timeIn}
                  onChange={e => setCorrForm(f => ({ ...f, timeIn: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label">Time Out</label>
                <input
                  type="time"
                  className="input-base"
                  value={corrForm.timeOut}
                  onChange={e => setCorrForm(f => ({ ...f, timeOut: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Status</label>
              <select
                className="input-base"
                value={corrForm.status}
                onChange={e => setCorrForm(f => ({ ...f, status: e.target.value }))}
              >
                {['present','late','absent','half-day','on-leave','holiday'].map(s => (
                  <option key={s} value={s}>{s.replace('-',' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">
                Reason for Correction <span className="text-red-500 normal-case font-normal text-[11px]">*required</span>
              </label>
              <textarea
                className="input-base"
                style={{ height: '80px', resize: 'none' }}
                value={corrForm.reason}
                onChange={e => setCorrForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Explain why this record is being corrected…"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
