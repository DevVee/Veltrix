import { useState } from 'react'
import { Download, Edit3, CalendarDays, Clock, Plus } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { SearchInput } from '../../components/ui/SearchInput'
import { Modal } from '../../components/ui/Modal'
import { ActionIconBtn } from '../../components/ui/ActionIconBtn'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useData } from '../../hooks/useData'
import { apiGetAttendance, apiCorrectAttendance, apiAddManualAttendance, apiGetEmployees, getDepartments } from '../../lib/db'
import { useAuthStore } from '../../store/authStore'
import type { AttendanceRecord, AttendanceStatus } from '../../types'

function dateN(offset: number) {
  const d = new Date(); d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}

const TODAY = new Date().toISOString().split('T')[0]
const BLANK_MANUAL = { employeeId: '', date: TODAY, status: 'present' as AttendanceStatus, timeIn: '', timeOut: '', reason: '' }

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
  const { data: allEmployees } = useData(() => apiGetEmployees({ status: 'active' }), [])

  // Correction modal
  const [correcting, setCorrecting] = useState<AttendanceRecord | null>(null)
  const [corrForm,   setCorrForm]   = useState({ timeIn:'', timeOut:'', status:'', reason:'' })
  const [saving,     setSaving]     = useState(false)

  // Manual entry modal
  const [manualOpen, setManualOpen] = useState(false)
  const [manForm,    setManForm]    = useState(BLANK_MANUAL)
  const [manSaving,  setManSaving]  = useState(false)

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

  const saveManual = async () => {
    if (!manForm.employeeId || !manForm.date || !manForm.reason.trim()) return
    setManSaving(true)
    try {
      await apiAddManualAttendance({
        employeeId: manForm.employeeId, date: manForm.date, status: manForm.status,
        timeIn:  manForm.timeIn  ? `${manForm.date}T${manForm.timeIn}:00`  : undefined,
        timeOut: manForm.timeOut ? `${manForm.date}T${manForm.timeOut}:00` : undefined,
        reason: manForm.reason,
      }, user?.name)
      setManualOpen(false); setManForm(BLANK_MANUAL); refetch()
    } finally { setManSaving(false) }
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
          { label: 'Manual Entry', icon: Plus,    variant: 'secondary', onClick: () => setManualOpen(true) },
          { label: 'Export CSV',   icon: Download, variant: 'secondary', onClick: exportCSV },
        ]}
      />

      {/* ── Summary stat strip ── */}
      <div
        className="grid grid-cols-4 bg-white"
        style={{ border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}
      >
        {[
          { label: 'Total Records', value: total,   color: '#0F172A' },
          { label: 'Present',       value: present, color: '#059669' },
          { label: 'Late',          value: late,    color: '#D97706' },
          { label: 'Absent',        value: absent,  color: '#DC2626' },
        ].map((item, i) => (
          <div
            key={item.label}
            className="py-3 px-4 text-center"
            style={{ borderLeft: i > 0 ? '1px solid #F1F5F9' : 'none' }}
          >
            <p style={{ fontSize: 22, fontWeight: 800, color: item.color, letterSpacing: '-0.04em', lineHeight: 1 }}>
              {item.value}
            </p>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>
              {item.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search employee…"
            className="flex-1"
          />

          <div className="flex items-center gap-1.5">
            <CalendarDays style={{ width: 13, height: 13, color: '#94A3B8', flexShrink: 0 }} />
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="input-base input-sm"
              style={{ width: 140 }}
            />
            <span style={{ fontSize: 11, color: '#94A3B8' }}>–</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="input-base input-sm"
              style={{ width: 140 }}
            />
          </div>

          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="input-base input-sm"
            style={{ width: 130 }}
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
            className="input-base input-sm"
            style={{ width: 160 }}
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
                    <th>Date</th>
                    <th>Employee</th>
                    <th>Time In</th>
                    <th>Time Out</th>
                    <th>Hours</th>
                    <th>Late</th>
                    <th>OT</th>
                    <th>Status</th>
                    <th style={{ width: 60 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 250).map(a => {
                    const hours = a.timeIn && a.timeOut
                      ? ((new Date(a.timeOut).getTime() - new Date(a.timeIn).getTime()) / 3600000).toFixed(1)
                      : null

                    return (
                      <tr key={a.id}>
                        <td className="tabular-nums" style={{ fontWeight: 500, color: '#475569' }}>
                          {a.date}
                        </td>
                        <td>
                          <p style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A', lineHeight: 1 }}>{a.employeeName}</p>
                          <p style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2 }}>{a.employeeNo}</p>
                        </td>
                        <td className="tabular-nums" style={{ fontSize: 12, color: '#475569' }}>
                          {a.timeIn ? fmt(a.timeIn) : <span style={{ color: '#CBD5E1' }}>—</span>}
                        </td>
                        <td className="tabular-nums" style={{ fontSize: 12, color: '#475569' }}>
                          {a.timeOut ? fmt(a.timeOut) : <span style={{ color: '#CBD5E1' }}>—</span>}
                        </td>
                        <td className="tabular-nums" style={{ fontSize: 12, color: hours ? '#475569' : '#CBD5E1' }}>
                          {hours ? `${hours}h` : '—'}
                        </td>
                        <td className="tabular-nums">
                          {a.minutesLate > 0 ? (
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#D97706' }}>{a.minutesLate}m</span>
                          ) : (
                            <span style={{ fontSize: 12, color: '#CBD5E1' }}>—</span>
                          )}
                        </td>
                        <td className="tabular-nums">
                          {a.overtimeMinutes > 0 ? (
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#4F46E5' }}>{a.overtimeMinutes}m</span>
                          ) : (
                            <span style={{ fontSize: 12, color: '#CBD5E1' }}>—</span>
                          )}
                        </td>
                        <td>
                          <StatusBadge type="attendance" status={a.status}>
                            {a.status === 'on-leave' ? 'On Leave' : a.status === 'half-day' ? 'Half Day' : a.status === 'rest-day' ? 'Rest Day' : a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                          </StatusBadge>
                        </td>
                        <td>
                          <ActionIconBtn variant="edit" icon={Edit3} onClick={() => openCorrect(a)} title="Correct record" />
                        </td>
                      </tr>
                    )
                  })}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-14 text-center">
                        <Clock style={{ width: 32, height: 32, color: '#E2E8F0', margin: '0 auto 8px' }} />
                        <p style={{ fontSize: 13, color: '#94A3B8' }}>No attendance records found</p>
                        <p style={{ fontSize: 11, color: '#CBD5E1', marginTop: 2 }}>Try adjusting the date range or filters</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div
              className="flex items-center justify-between px-4 py-2"
              style={{ borderTop: '1px solid #F1F5F9', background: '#FAFBFC' }}
            >
              <span style={{ fontSize: 11, color: '#94A3B8' }}>
                {filtered.length} records · {filtered.length > 250 ? 'showing first 250' : 'all shown'}
              </span>
              <span style={{ fontSize: 11, color: '#CBD5E1' }}>
                {startDate} — {endDate}
              </span>
            </div>
          </>
        )}
      </div>

      {/* ── Manual Entry Modal ── */}
      <Modal
        open={manualOpen}
        onClose={() => { setManualOpen(false); setManForm(BLANK_MANUAL) }}
        title="Manual Attendance Entry"
        footer={
          <>
            <button onClick={() => { setManualOpen(false); setManForm(BLANK_MANUAL) }} className="btn btn-secondary">Cancel</button>
            <button
              onClick={saveManual}
              disabled={manSaving || !manForm.employeeId || !manForm.date || !manForm.reason.trim()}
              className="btn btn-primary"
            >
              {manSaving ? 'Saving…' : 'Save Entry'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#92400E' }}>
            For employees who were present but forgot to scan. This will be marked as manually added.
          </div>
          <div>
            <label className="form-label">Employee <span className="text-red-500">*</span></label>
            <select className="input-base" value={manForm.employeeId} onChange={e => setManForm(f => ({ ...f, employeeId: e.target.value }))}>
              <option value="">— Select employee —</option>
              {(allEmployees ?? []).map(e => <option key={e.id} value={e.id}>{e.fullName} ({e.employeeNo})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Date <span className="text-red-500">*</span></label>
              <input type="date" className="input-base" value={manForm.date} onChange={e => setManForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Status <span className="text-red-500">*</span></label>
              <select className="input-base" value={manForm.status} onChange={e => setManForm(f => ({ ...f, status: e.target.value as AttendanceStatus }))}>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
                <option value="half-day">Half Day</option>
                <option value="on-leave">On Leave</option>
              </select>
            </div>
          </div>
          {(manForm.status === 'present' || manForm.status === 'late' || manForm.status === 'half-day') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Time In</label>
                <input type="time" className="input-base" value={manForm.timeIn} onChange={e => setManForm(f => ({ ...f, timeIn: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Time Out <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 400 }}>(optional)</span></label>
                <input type="time" className="input-base" value={manForm.timeOut} onChange={e => setManForm(f => ({ ...f, timeOut: e.target.value }))} />
              </div>
            </div>
          )}
          <div>
            <label className="form-label">Admin Note <span className="text-red-500">*</span></label>
            <textarea
              className="input-base"
              style={{ height: 72, resize: 'none', paddingTop: 8 }}
              placeholder="e.g. Employee was present but forgot to scan RFID"
              value={manForm.reason}
              onChange={e => setManForm(f => ({ ...f, reason: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      {/* ── Correction Modal ── */}
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
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{correcting.employeeName}</p>
              <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{correcting.date} · {correcting.status}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Time In</label>
                <input type="time" className="input-base" value={corrForm.timeIn} onChange={e => setCorrForm(f => ({ ...f, timeIn: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Time Out</label>
                <input type="time" className="input-base" value={corrForm.timeOut} onChange={e => setCorrForm(f => ({ ...f, timeOut: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="form-label">Status</label>
              <select className="input-base" value={corrForm.status} onChange={e => setCorrForm(f => ({ ...f, status: e.target.value }))}>
                {['present','late','absent','half-day','on-leave','holiday'].map(s => (
                  <option key={s} value={s}>{s.replace('-',' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">
                Reason for Correction <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 400 }}>*required</span>
              </label>
              <textarea
                className="input-base"
                style={{ height: 80, resize: 'none', paddingTop: 8 }}
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
