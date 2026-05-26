import { useState } from 'react'
import { Download, BarChart3, FileText, Users } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { useData } from '../../hooks/useData'
import { apiGetAttendance, apiGetPayrollPeriods, apiGetEmployees } from '../../lib/db'
import { formatPeso } from '../../lib/payrollEngine'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const REPORT_TABS = [
  { id:'attendance', label:'Attendance',          icon: Users,    desc: 'Status distribution by period' },
  { id:'payroll',    label:'Payroll Summary',     icon: BarChart3, desc: 'Gross vs net across periods' },
  { id:'govcontrib', label:'Gov\'t Contributions', icon: FileText,  desc: 'SSS, PhilHealth, Pag-IBIG breakdown' },
]

const PIE_COLORS  = ['#1a56db','#15803d','#b45309','#dc2626','#7c3aed','#0d9488']
const CHART_STYLE = {
  contentStyle: {
    fontSize: 11,
    border: '1px solid #e4e7ec',
    borderRadius: '4px',
    boxShadow: 'none',
    padding: '4px 8px',
    color: '#374151',
  },
  cursor: { fill: '#f0f4ff' },
}

function dateN(offset: number) {
  const d = new Date(); d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}

export function Reports() {
  const [activeTab,  setActiveTab]  = useState('attendance')
  const [startDate,  setStartDate]  = useState(dateN(-30))
  const [endDate,    setEndDate]    = useState(dateN(0))

  const { data: attendance } = useData(() => apiGetAttendance({ startDate, endDate }), [startDate, endDate])
  const { data: periods }    = useData(() => apiGetPayrollPeriods(), [])
  const { data: employees }  = useData(() => apiGetEmployees({ status: 'active' }), [])

  // ── Attendance data ──
  const att = (attendance ?? []).filter(a => a.status !== 'rest-day')
  const attByStatus = ['present','late','absent','on-leave','half-day'].map(s => ({
    name:  s.replace('-',' ').replace(/\b\w/g, c => c.toUpperCase()),
    value: att.filter(a => a.status === s).length,
  })).filter(x => x.value > 0)

  const deptMap: Record<string, Record<string,number>> = {}
  att.forEach(a => {
    const dept = (a as any).department ?? 'Unknown'
    if (!deptMap[dept]) deptMap[dept] = { present:0, late:0, absent:0 }
    if      (a.status === 'present') deptMap[dept].present++
    else if (a.status === 'late')    deptMap[dept].late++
    else if (a.status === 'absent')  deptMap[dept].absent++
  })
  const deptData = Object.entries(deptMap).map(([dept,s]) => ({
    dept: dept.split(' ')[0], ...s,
  }))

  // ── Payroll data ──
  const payrollData = (periods ?? []).slice(-8).map(p => ({
    period:     p.periodNo.replace('PR-',''),
    gross:      p.totalGross,
    net:        p.totalNet,
    deductions: p.totalDeductions,
  }))
  const lastPeriod = (periods ?? []).slice(-1)[0]

  // ── Gov contrib ──
  const govData = lastPeriod ? [
    { name:'SSS',        ee: lastPeriod.totalGross * 0.045, er: lastPeriod.totalGross * 0.095 },
    { name:'PhilHealth', ee: lastPeriod.totalGross * 0.025, er: lastPeriod.totalGross * 0.025 },
    { name:'Pag-IBIG',   ee: (employees?.length ?? 0) * 200, er: (employees?.length ?? 0) * 200 },
  ] : []

  const exportCSV = () => {
    let rows: (string | number)[][] = []
    let filename = ''
    if (activeTab === 'attendance') {
      rows = [
        ['Date','Emp No','Name','Dept','Status','Mins Late','OT Mins'],
        ...att.map(a => [a.date,a.employeeNo,a.employeeName,(a as any).department??'',a.status,a.minutesLate,a.overtimeMinutes]),
      ]
      filename = `attendance_${startDate}_${endDate}`
    } else if (activeTab === 'payroll') {
      rows = [
        ['Period','Start','End','Employees','Gross','Deductions','Net'],
        ...(periods??[]).map(p=>[p.periodNo,p.startDate,p.endDate,p.totalEmployees,p.totalGross,p.totalDeductions,p.totalNet]),
      ]
      filename = 'payroll_summary'
    } else {
      rows = [
        ['Contribution','Employee Share','Employer Share','Total'],
        ...govData.map(g=>[g.name,g.ee.toFixed(2),g.er.toFixed(2),(g.ee+g.er).toFixed(2)]),
      ]
      filename = 'government_contributions'
    }
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`
    a.download = `${filename}.csv`
    a.click()
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Attendance patterns, payroll history, and government contributions"
        actions={[
          { label: 'Export CSV', icon: Download, variant: 'secondary', onClick: exportCSV },
        ]}
      />

      {/* ── Report tabs ── */}
      <div className="card overflow-hidden">
        <div className="tab-bar px-2 pt-1">
          {REPORT_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              <tab.icon style={{ width: 13, height: 13, flexShrink: 0 }} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Attendance date filter */}
        {activeTab === 'attendance' && (
          <div
            className="flex flex-wrap items-center gap-3 px-4 py-2.5"
            style={{ borderBottom: '1px solid #EEF0F4', background: '#FAFBFC' }}
          >
            <span className="data-label">Date Range</span>
            <input
              type="date"
              className="input-base"
              style={{ width: '145px' }}
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
            <span className="text-[11px] text-gray-400">to</span>
            <input
              type="date"
              className="input-base"
              style={{ width: '145px' }}
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
            <span className="text-[11px] text-gray-400">
              {att.length} records in range
            </span>
          </div>
        )}

        <div className="p-4">

          {/* ── Attendance Report ── */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Pie chart */}
                <div className="lg:col-span-2 card p-4">
                  <h3 className="data-label mb-3">Status Distribution</h3>
                  {attByStatus.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={attByStatus}
                          cx="50%" cy="50%"
                          outerRadius={70}
                          innerRadius={35}
                          dataKey="value"
                          paddingAngle={2}
                        >
                          {attByStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip {...CHART_STYLE} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-sm text-gray-300">No data</div>
                  )}
                </div>

                {/* Summary table */}
                <div className="lg:col-span-3 card overflow-hidden">
                  <div className="px-4 py-2.5" style={{ borderBottom: '1px solid #EEF0F4' }}>
                    <h3 className="data-label">Summary by Status</h3>
                  </div>
                  <table className="table-base w-full">
                    <thead>
                      <tr>
                        <th style={{ paddingLeft: '16px' }}>Status</th>
                        <th>Count</th>
                        <th>Percentage</th>
                        <th>Bar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attByStatus.map(s => (
                        <tr key={s.name}>
                          <td style={{ paddingLeft: '16px' }}>
                            <span className="text-sm font-semibold text-gray-700">{s.name}</span>
                          </td>
                          <td>
                            <span className="text-sm tabular-nums font-semibold text-gray-800">{s.value}</span>
                          </td>
                          <td>
                            <span className="text-sm tabular-nums text-gray-600">
                              {att.length > 0 ? ((s.value / att.length) * 100).toFixed(1) : '0.0'}%
                            </span>
                          </td>
                          <td style={{ minWidth: '80px' }}>
                            <div className="h-1.5 bg-gray-100" style={{ borderRadius: '999px' }}>
                              <div
                                className="h-full"
                                style={{
                                  width: `${att.length > 0 ? (s.value / att.length) * 100 : 0}%`,
                                  background: '#1565C0',
                                  borderRadius: '999px',
                                  transition: 'width 0.4s ease',
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                      {att.length > 0 && (
                        <tr style={{ background: '#F7F8FA' }}>
                          <td style={{ paddingLeft: '16px' }} className="font-bold text-gray-900">Total</td>
                          <td className="font-bold tabular-nums text-gray-900">{att.length}</td>
                          <td className="font-bold text-gray-900">100%</td>
                          <td />
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dept bar chart */}
              {deptData.length > 0 && (
                <div className="card p-4">
                  <h3 className="data-label mb-4">Attendance by Department</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={deptData} margin={{ left: -16 }} barCategoryGap="30%">
                      <XAxis dataKey="dept" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                      <Tooltip {...CHART_STYLE} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="present" fill="#22c55e" name="Present" radius={[2,2,0,0]} />
                      <Bar dataKey="late"    fill="#f59e0b" name="Late"    radius={[2,2,0,0]} />
                      <Bar dataKey="absent"  fill="#ef4444" name="Absent"  radius={[2,2,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* ── Payroll Summary ── */}
          {activeTab === 'payroll' && (
            <div className="space-y-4">
              {payrollData.length > 0 ? (
                <>
                  <div className="card p-4">
                    <h3 className="data-label mb-4">Gross vs Net Pay — Last 8 Periods</h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={payrollData} margin={{ left: 10 }} barCategoryGap="35%">
                        <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#9CA3AF' }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={v => `₱${(v/1000).toFixed(0)}k`}
                        />
                        <Tooltip {...CHART_STYLE} formatter={(v: number) => formatPeso(v)} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="gross"      fill="#1a56db" name="Gross Pay"   radius={[2,2,0,0]} />
                        <Bar dataKey="net"        fill="#22c55e" name="Net Pay"     radius={[2,2,0,0]} />
                        <Bar dataKey="deductions" fill="#ef4444" name="Deductions"  radius={[2,2,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="card overflow-hidden">
                    <div className="px-4 py-2.5" style={{ borderBottom: '1px solid #EEF0F4' }}>
                      <h3 className="data-label">Payroll Period Details</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="table-base w-full">
                        <thead>
                          <tr>
                            <th style={{ paddingLeft: '16px' }}>Period</th>
                            <th className="hidden md:table-cell">Date Range</th>
                            <th className="hidden lg:table-cell">Pay Date</th>
                            <th className="hidden md:table-cell">Employees</th>
                            <th>Gross Pay</th>
                            <th className="hidden lg:table-cell">Deductions</th>
                            <th>Net Pay</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(periods??[]).map(p => (
                            <tr key={p.id}>
                              <td style={{ paddingLeft: '16px' }}>
                                <span className="text-sm font-semibold text-gray-800">{p.periodNo}</span>
                              </td>
                              <td className="hidden md:table-cell">
                                <span className="text-sm text-gray-600 tabular-nums">{p.startDate} – {p.endDate}</span>
                              </td>
                              <td className="hidden lg:table-cell">
                                <span className="text-sm text-gray-600 tabular-nums">{p.payDate}</span>
                              </td>
                              <td className="hidden md:table-cell">
                                <span className="text-sm font-semibold text-gray-700 tabular-nums">{p.totalEmployees}</span>
                              </td>
                              <td>
                                <span className="text-sm font-semibold text-gray-800 tabular-nums">{formatPeso(p.totalGross)}</span>
                              </td>
                              <td className="hidden lg:table-cell">
                                <span className="text-sm font-semibold text-red-600 tabular-nums">{formatPeso(p.totalDeductions)}</span>
                              </td>
                              <td>
                                <span className="text-sm font-bold text-brand tabular-nums">{formatPeso(p.totalNet)}</span>
                              </td>
                              <td>
                                <span className={p.status === 'paid' ? 'pill pill-green' : 'pill pill-blue'}>
                                  {p.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-48 text-sm text-gray-400">
                  No payroll data available yet.
                </div>
              )}
            </div>
          )}

          {/* ── Gov Contributions ── */}
          {activeTab === 'govcontrib' && (
            <div className="space-y-4">
              {lastPeriod ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="card p-4">
                    <h3 className="data-label mb-1">Latest Period: {lastPeriod.periodNo}</h3>
                    <p className="text-[11px] text-gray-400 mb-4">{lastPeriod.startDate} – {lastPeriod.endDate}</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={govData} margin={{ left: 10 }} barCategoryGap="35%">
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#9CA3AF' }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={v => `₱${(v/1000).toFixed(0)}k`}
                        />
                        <Tooltip {...CHART_STYLE} formatter={(v: number) => formatPeso(v)} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="ee" fill="#1a56db" name="Employee Share" radius={[2,2,0,0]} />
                        <Bar dataKey="er" fill="#22c55e" name="Employer Share" radius={[2,2,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="card overflow-hidden">
                    <div className="px-4 py-2.5" style={{ borderBottom: '1px solid #EEF0F4' }}>
                      <h3 className="data-label">Contribution Breakdown</h3>
                    </div>
                    <table className="table-base w-full">
                      <thead>
                        <tr>
                          <th style={{ paddingLeft: '16px' }}>Fund</th>
                          <th>EE Share</th>
                          <th>ER Share</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {govData.map(g => (
                          <tr key={g.name}>
                            <td style={{ paddingLeft: '16px' }}>
                              <span className="text-sm font-bold text-gray-800">{g.name}</span>
                            </td>
                            <td><span className="text-sm tabular-nums text-gray-700">{formatPeso(g.ee)}</span></td>
                            <td><span className="text-sm tabular-nums text-gray-700">{formatPeso(g.er)}</span></td>
                            <td><span className="text-sm tabular-nums font-semibold text-gray-900">{formatPeso(g.ee + g.er)}</span></td>
                          </tr>
                        ))}
                        <tr style={{ background: '#F7F8FA', borderTop: '2px solid #E2E5EB' }}>
                          <td style={{ paddingLeft: '16px' }} className="font-black text-gray-900">TOTAL</td>
                          <td className="font-black tabular-nums text-gray-900">{formatPeso(govData.reduce((s,g)=>s+g.ee,0))}</td>
                          <td className="font-black tabular-nums text-gray-900">{formatPeso(govData.reduce((s,g)=>s+g.er,0))}</td>
                          <td className="font-black tabular-nums text-brand">{formatPeso(govData.reduce((s,g)=>s+g.ee+g.er,0))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-sm text-gray-400">
                  No payroll data available yet.
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
