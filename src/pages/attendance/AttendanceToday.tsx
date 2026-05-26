import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Monitor, Search, Filter, CheckCircle, AlertTriangle, XCircle, Umbrella } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { useData } from '../../hooks/useData'
import { apiGetTodayAttendance, apiGetEmployees } from '../../lib/db'

const STATUS_PILL: Record<string, string> = {
  present:    'pill pill-green',
  late:       'pill pill-yellow',
  absent:     'pill pill-red',
  'on-leave': 'pill pill-blue',
  'half-day': 'pill pill-orange',
}
const STATUS_LABEL: Record<string, string> = {
  present: 'Present', late: 'Late', absent: 'Absent',
  'on-leave': 'On Leave', 'half-day': 'Half Day',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PH', { hour:'2-digit', minute:'2-digit', hour12:true })
}

export function AttendanceToday() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const { data: todayAtt } = useData(() => apiGetTodayAttendance(), [])
  const { data: employees } = useData(() => apiGetEmployees({ status: 'active' }), [])

  const att        = (todayAtt  ?? []).filter(a => a.status !== 'rest-day')
  const employees_ = employees ?? []

  const present  = att.filter(a => a.status === 'present' || a.status === 'late').length
  const late     = att.filter(a => a.status === 'late').length
  const absent   = att.filter(a => a.status === 'absent').length
  const onLeave  = att.filter(a => a.status === 'on-leave').length
  const notScanned = employees_.filter(e => !att.find(a => a.employeeId === e.id))

  const filtered = att.filter(a => {
    const matchSearch = !search || a.employeeName.toLowerCase().includes(search.toLowerCase()) || a.employeeNo.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || a.status === filter
    return matchSearch && matchFilter
  })

  const today = new Date().toLocaleDateString('en-PH', { weekday:'long', year:'numeric', month:'long', day:'numeric' })

  return (
    <div className="space-y-4">
      <PageHeader
        title="Today's Attendance"
        subtitle={today}
        actions={[
          { label: 'Open Kiosk', icon: Monitor, onClick: () => navigate('/kiosk') },
          { label: 'Full Log',   variant: 'secondary', onClick: () => navigate('/attendance/log') },
        ]}
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Present', value: present, sub: late > 0 ? `${late} arrived late` : 'On time', color: '#15803d', bg: '#f0fdf4', icon: CheckCircle, filterKey: 'present' },
          { label: 'Late', value: late, sub: late > 0 ? 'Arrived after shift start' : 'None late today', color: '#b45309', bg: '#fefce8', icon: AlertTriangle, filterKey: 'late' },
          { label: 'Absent', value: absent, sub: absent > 0 ? 'No time-in' : 'All accounted for', color: '#991b1b', bg: '#fef2f2', icon: XCircle, filterKey: 'absent' },
          { label: 'On Leave', value: onLeave, sub: onLeave > 0 ? 'Approved leave' : 'No leaves today', color: '#1d4ed8', bg: '#eff6ff', icon: Umbrella, filterKey: 'on-leave' },
        ].map(card => {
          const isActive = filter === card.filterKey
          const Icon = card.icon
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => setFilter(isActive ? 'all' : card.filterKey)}
              className="card text-left w-full transition-all duration-150"
              style={{
                padding: '12px 14px',
                borderColor: isActive ? card.color : '#e4e7ec',
                background: isActive ? card.bg : '#fff',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-500 font-semibold uppercase tracking-wide" style={{ fontSize: 10 }}>
                  {card.label}
                </p>
                <Icon style={{ width: 13, height: 13, color: card.color, opacity: 0.6 }} />
              </div>
              <p className="font-black tabular-nums leading-none" style={{ fontSize: 22, color: card.color, letterSpacing: '-0.03em' }}>
                {card.value}
              </p>
              <p className="text-gray-400 mt-1" style={{ fontSize: 10 }}>{card.sub}</p>
            </button>
          )
        })}
      </div>

      {/* Not yet scanned */}
      {notScanned.length > 0 && (
        <div className="card p-4">
          <p className="text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-2">
            <span
              className="w-4 h-4 flex items-center justify-center text-[9px] font-bold text-white"
              style={{ background: '#9CA3AF', borderRadius: '999px' }}
            >
              {notScanned.length}
            </span>
            Not Yet Scanned
          </p>
          <div className="flex flex-wrap gap-1.5">
            {notScanned.map(e => (
              <span
                key={e.id}
                className="text-[11px] font-medium text-gray-500 px-2 py-1"
                style={{ background: '#F7F8FA', border: '1px solid #EEF0F4', borderRadius: '4px' }}
              >
                {e.fullName}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-2 px-3 py-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search employee…"
              className="input-base pl-8"
            />
          </div>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="input-base"
            style={{ width: '150px' }}
          >
            <option value="all">All Status</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="absent">Absent</option>
            <option value="on-leave">On Leave</option>
            <option value="half-day">Half Day</option>
          </select>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="text-[11px] text-gray-400 hover:text-gray-600 font-medium"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base w-full">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th className="hidden md:table-cell">Hours</th>
                <th className="hidden md:table-cell">Late</th>
                <th className="hidden lg:table-cell">OT</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => {
                const hours = a.timeIn && a.timeOut
                  ? ((new Date(a.timeOut).getTime() - new Date(a.timeIn).getTime()) / 3600000).toFixed(1)
                  : null

                return (
                  <tr key={a.id}>
                    <td>
                      <p className="font-semibold text-gray-900 leading-none" style={{ fontSize: 12.5 }}>{a.employeeName}</p>
                      <p className="text-gray-400 mt-0.5" style={{ fontSize: 10 }}>{a.employeeNo}</p>
                    </td>
                    <td>
                      <span className="tabular-nums text-gray-700" style={{ fontSize: 12 }}>
                        {a.timeIn ? fmt(a.timeIn) : <span style={{ color: '#d1d5db' }}>—</span>}
                      </span>
                    </td>
                    <td>
                      <span className="tabular-nums text-gray-700" style={{ fontSize: 12 }}>
                        {a.timeOut ? fmt(a.timeOut) : <span style={{ color: '#d1d5db' }}>—</span>}
                      </span>
                    </td>
                    <td className="hidden md:table-cell">
                      <span className={`tabular-nums ${hours ? 'text-gray-700' : ''}`} style={{ fontSize: 12, color: hours ? undefined : '#d1d5db' }}>
                        {hours ? `${hours}h` : '—'}
                      </span>
                    </td>
                    <td className="hidden md:table-cell">
                      {a.minutesLate > 0 ? (
                        <span className="tabular-nums font-semibold text-amber-600" style={{ fontSize: 12 }}>{a.minutesLate}m</span>
                      ) : (
                        <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td className="hidden lg:table-cell">
                      {a.overtimeMinutes > 0 ? (
                        <span className="tabular-nums font-semibold text-brand" style={{ fontSize: 12 }}>{a.overtimeMinutes}m</span>
                      ) : (
                        <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={STATUS_PILL[a.status] ?? 'pill pill-gray'}>
                        {STATUS_LABEL[a.status] ?? a.status}
                      </span>
                    </td>
                  </tr>
                )
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: '#E2E5EB' }} />
                    <p className="text-sm text-gray-400">No records match your filter</p>
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
          <div className="flex items-center gap-1.5">
            <Filter className="w-3 h-3 text-gray-300" />
            <span className="text-[11px] text-gray-400">
              {filtered.length} of {att.length} records
            </span>
          </div>
          <button
            onClick={() => navigate('/kiosk')}
            className="text-[11px] text-brand font-semibold hover:underline"
          >
            Open Kiosk →
          </button>
        </div>
      </div>
    </div>
  )
}
