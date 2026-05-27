import { useState, useEffect } from "react"
import { Clock, Search, RefreshCw } from "lucide-react"
import { DataTable } from "../../components/data/DataTable"
import { apiGetAttendance, apiGetEmployees } from "../../lib/db"
import { formatTime } from "../../lib/utils/format"
import type { AttendanceRecord, Employee } from "../../types"

const STATUS_PILL: Record<string, string> = {
  present: "pill pill-green", late: "pill pill-yellow", absent: "pill pill-red",
  "on-leave": "pill pill-purple", "half-day": "pill pill-orange",
  "rest-day": "pill pill-gray", holiday: "pill pill-blue",
}
const STATUS_LABEL: Record<string, string> = {
  present: "Present", late: "Late", absent: "Absent",
  "on-leave": "On Leave", "half-day": "Half Day", "rest-day": "Rest Day", holiday: "Holiday",
}

export function AttendanceLog() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")

  const today = new Date().toISOString().split("T")[0]
  const thirtyAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]
  const [startDate, setStartDate] = useState(thirtyAgo)
  const [endDate, setEndDate] = useState(today)

  const load = async () => {
    setLoading(true)
    try {
      const [recs, emps] = await Promise.all([
        apiGetAttendance({ startDate, endDate }),
        apiGetEmployees(),
      ])
      setRecords(recs); setEmployees(emps)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [startDate, endDate])

  const empMap = new Map(employees.map(e => [e.id, e]))
  const filtered = records.filter(r => {
    if (r.status === "rest-day") return false
    const q = search.toLowerCase()
    const matchSearch = !q || (r.employeeName ?? "").toLowerCase().includes(q) || (r.employeeNo ?? "").toLowerCase().includes(q)
    const matchStatus = status === "all" || r.status === status
    return matchSearch && matchStatus
  })

  const present = records.filter(r => r.status === "present" || r.status === "late").length
  const absent  = records.filter(r => r.status === "absent").length
  const late    = records.filter(r => r.status === "late").length
  const onLeave = records.filter(r => r.status === "on-leave").length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em" }}>Attendance Log</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 3 }}>
            Showing records from {startDate} to {endDate}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary" onClick={load}>
            <RefreshCw style={{ width: 14, height: 14 }} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Present", value: present, color: "#059669" },
          { label: "Absent",  value: absent,  color: "#DC2626" },
          { label: "Late",    value: late,    color: "#D97706" },
          { label: "On Leave",value: onLeave, color: "#4F46E5" },
        ].map(s => (
          <div key={s.label} className="card-sm" style={{ padding: "14px 18px" }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: "-0.04em", lineHeight: 1 }} className="tabular-nums">{s.value}</p>
            <p style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 p-4" style={{ borderBottom: "1px solid #F1F5F9" }}>
          <div className="relative" style={{ minWidth: 200, flex: 1 }}>
            <Search style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#94A3B8", pointerEvents: "none" }} />
            <input type="text" placeholder="Search employee…" value={search} onChange={e => setSearch(e.target.value)} className="input-base search-input" style={{ paddingLeft: 34 }} />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)} className="input-base" style={{ width: "auto", minWidth: 130 }}>
            <option value="all">All Status</option>
            {["present","late","absent","on-leave","half-day","holiday"].map(s => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-base" style={{ width: 150 }} />
          <span style={{ color: "#94A3B8", fontSize: 13 }}>to</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-base" style={{ width: 150 }} />
          <span style={{ fontSize: 12.5, color: "#94A3B8", marginLeft: "auto" }}>{filtered.length} records</span>
        </div>

        <DataTable
          data={filtered}
          rowKey={r => r.id}
          loading={loading}
          pageSize={20}
          empty={{ title: "No attendance records", description: "No records match your filters.", icon: Clock }}
          columns={[
            { key: "date", header: "Date", sortable: true, render: r => <span className="tabular-nums" style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>{r.date}</span> },
            { key: "employeeName", header: "Employee", sortable: true, render: r => (
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>{r.employeeName}</p>
                <p style={{ fontSize: 11.5, color: "#94A3B8" }}>{r.employeeNo}</p>
              </div>
            )},
            { key: "department", header: "Department", render: r => <span style={{ fontSize: 13, color: "#475569" }}>{empMap.get(r.employeeId)?.department ?? r.department ?? "—"}</span> },
            { key: "timeIn",  header: "Time In",  render: r => <span className="tabular-nums" style={{ fontSize: 13 }}>{formatTime(r.timeIn)}</span> },
            { key: "timeOut", header: "Time Out", render: r => <span className="tabular-nums" style={{ fontSize: 13 }}>{formatTime(r.timeOut)}</span> },
            { key: "minutesLate", header: "Late", render: r => (
              <span className="tabular-nums" style={{ fontSize: 13, color: r.minutesLate > 0 ? "#D97706" : "#94A3B8" }}>
                {r.minutesLate > 0 ? `${r.minutesLate}m` : "—"}
              </span>
            )},
            { key: "status", header: "Status", sortable: true, render: r => <span className={STATUS_PILL[r.status] ?? "pill pill-gray"}>{STATUS_LABEL[r.status] ?? r.status}</span> },
            { key: "source", header: "Source", render: r => (
              <span style={{ fontSize: 12, color: r.source === "manual" ? "#D97706" : "#94A3B8", fontWeight: 500 }}>
                {r.source === "manual" ? "Manual" : "Kiosk"}
              </span>
            )},
          ]}
        />
      </div>
    </div>
  )
}
