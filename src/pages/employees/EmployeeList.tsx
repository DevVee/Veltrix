import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Users, Edit2, Trash2, Eye,
  SlidersHorizontal, Filter,
} from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { ActionIconBtn } from '../../components/ui/ActionIconBtn'
import { EmptyState } from '../../components/ui/EmptyState'
import { SearchInput } from '../../components/ui/SearchInput'
import { useData } from '../../hooks/useData'
import { apiGetEmployees, apiDeleteEmployee, apiGetDepartments } from '../../lib/db'
import type { Employee, Department } from '../../types'

const STATUS_PILL: Record<string, string> = {
  active:     'pill pill-green',
  inactive:   'pill pill-gray',
  resigned:   'pill pill-yellow',
  terminated: 'pill pill-red',
  awol:       'pill pill-orange',
}
const STATUS_LABEL: Record<string, string> = {
  active: 'Active', inactive: 'Inactive', resigned: 'Resigned',
  terminated: 'Terminated', awol: 'AWOL',
}
const TYPE_PILL: Record<string, string> = {
  regular:      'pill pill-blue',
  probationary: 'pill pill-indigo',
  contractual:  'pill pill-purple',
  'part-time':  'pill pill-gray',
}
const TYPE_LABEL: Record<string, string> = {
  regular: 'Regular', probationary: 'Probationary',
  contractual: 'Contractual', 'part-time': 'Part-Time',
}
const COMP_LABEL: Record<string, string> = {
  monthly: '/mo', weekly: '/wk', daily: '/day',
}

// Deterministic avatar color from employee ID
const AVATAR_PALETTE = [
  '#1a56db','#0d9488','#7c3aed','#be185d',
  '#b45309','#15803d','#1d4ed8','#9d174d',
  '#0891b2','#6d28d9','#b91c1c','#065f46',
]
function avatarColor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]
}

export function EmployeeList() {
  const navigate = useNavigate()
  const [search,      setSearch]      = useState('')
  const [dept,        setDept]        = useState('all')
  const [status,      setStatus]      = useState('all')
  const [type,        setType]        = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  const { data: deptList } = useData<Department[]>(() => apiGetDepartments(), [])
  const { data: employees, loading, refetch } = useData(
    () => apiGetEmployees({ search, department: dept, status }),
    [search, dept, status],
  )

  // Client-side type filter
  const filtered = (employees ?? []).filter(e =>
    type === 'all' || e.employmentType === type
  )

  const handleDelete = async (emp: Employee, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Delete ${emp.fullName}? This cannot be undone.`)) return
    await apiDeleteEmployee(emp.id)
    refetch()
  }

  const total     = filtered.length
  const active    = filtered.filter(e => e.status === 'active').length
  const inactive  = total - active
  const activeFilters = [dept !== 'all', status !== 'all', type !== 'all'].filter(Boolean).length

  return (
    <div className="space-y-4">
      <PageHeader
        title="Employee Directory"
        subtitle={`${total} employee${total !== 1 ? 's' : ''}${dept !== 'all' ? ` · ${dept}` : ''}`}
        actions={[
          { label: 'Add Employee', icon: Plus, onClick: () => navigate('/employees/new') },
        ]}
      />

      {/* ── Toolbar ── */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
          {/* Search */}
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search name, ID, position…"
            className="flex-1"
          />

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`btn btn-secondary ${showFilters ? 'border-brand text-brand' : ''}`}
            style={showFilters ? { borderColor: '#1a56db', color: '#1a56db', background: '#eff6ff' } : {}}
          >
            <SlidersHorizontal style={{ width: 13, height: 13 }} />
            Filters
            {activeFilters > 0 && (
              <span
                className="flex items-center justify-center text-white font-bold"
                style={{
                  width: 16, height: 16,
                  background: '#1a56db',
                  borderRadius: 999,
                  fontSize: 9,
                }}
              >
                {activeFilters}
              </span>
            )}
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Stats */}
          <div
            className="hidden md:flex items-center gap-3"
            style={{ paddingLeft: 12, borderLeft: '1px solid #f0f2f5' }}
          >
            <span className="flex items-center gap-1.5" style={{ fontSize: 11 }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              <span className="text-gray-500">{active} active</span>
            </span>
            {inactive > 0 && (
              <span className="flex items-center gap-1.5" style={{ fontSize: 11 }}>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />
                <span className="text-gray-400">{inactive} inactive</span>
              </span>
            )}
          </div>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div
            className="flex flex-wrap items-end gap-3 px-3 py-2.5"
            style={{ borderTop: '1px solid #f0f2f5', background: '#fafbfc' }}
          >
            {/* Department */}
            <div>
              <label className="data-label block mb-1">Department</label>
              <select
                value={dept}
                onChange={e => setDept(e.target.value)}
                className="input-base input-sm"
                style={{ width: 180 }}
              >
                <option value="all">All Departments</option>
                {(deptList ?? []).map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="data-label block mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="input-base input-sm"
                style={{ width: 140 }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="resigned">Resigned</option>
                <option value="terminated">Terminated</option>
                <option value="awol">AWOL</option>
              </select>
            </div>

            {/* Employment type */}
            <div>
              <label className="data-label block mb-1">Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="input-base input-sm"
                style={{ width: 150 }}
              >
                <option value="all">All Types</option>
                <option value="regular">Regular</option>
                <option value="probationary">Probationary</option>
                <option value="contractual">Contractual</option>
                <option value="part-time">Part-Time</option>
              </select>
            </div>

            {activeFilters > 0 && (
              <button
                onClick={() => { setDept('all'); setStatus('all'); setType('all') }}
                className="text-red-500 hover:text-red-700 font-medium transition-colors"
                style={{ fontSize: 11, marginBottom: 1 }}
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="spinner" />
          </div>
        ) : !filtered.length ? (
          <EmptyState
            icon={Users}
            title="No employees found"
            description={
              search || dept !== 'all' || status !== 'all' || type !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Add your first employee to get started.'
            }
            action={
              !search && dept === 'all' && status === 'all' && type === 'all'
                ? { label: 'Add Employee', onClick: () => navigate('/employees/new') }
                : undefined
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table-base w-full">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th className="hidden md:table-cell">Department</th>
                    <th className="hidden lg:table-cell">Position</th>
                    <th className="hidden lg:table-cell">Type</th>
                    <th className="hidden xl:table-cell">Salary</th>
                    <th>Status</th>
                    <th style={{ width: 90 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(emp => {
                    const bgColor = avatarColor(emp.id)
                    const compSuffix = COMP_LABEL[emp.compensationType] ?? '/mo'
                    return (
                      <tr
                        key={emp.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/employees/${emp.id}`)}
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <div
                              className="avatar avatar-sm flex-shrink-0"
                              style={{ background: bgColor }}
                            >
                              {emp.firstName[0]}{emp.lastName[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 leading-none" style={{ fontSize: 12.5 }}>
                                {emp.fullName}
                              </p>
                              <p className="text-gray-400 mt-0.5" style={{ fontSize: 10.5 }}>
                                {emp.employeeNo}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="hidden md:table-cell">
                          <span className="text-gray-600" style={{ fontSize: 12 }}>
                            {emp.department}
                          </span>
                        </td>

                        <td className="hidden lg:table-cell">
                          <span className="text-gray-600" style={{ fontSize: 12 }}>
                            {emp.position}
                          </span>
                        </td>

                        <td className="hidden lg:table-cell">
                          <span className={TYPE_PILL[emp.employmentType] ?? 'pill pill-gray'}>
                            {TYPE_LABEL[emp.employmentType] ?? emp.employmentType}
                          </span>
                        </td>

                        <td className="hidden xl:table-cell">
                          <span className="font-semibold tabular-nums text-gray-800" style={{ fontSize: 12 }}>
                            ₱{emp.basicSalary.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                            <span className="text-gray-400 font-normal text-[10px]">{compSuffix}</span>
                          </span>
                        </td>

                        <td>
                          <span className={STATUS_PILL[emp.status] ?? 'pill pill-gray'}>
                            {STATUS_LABEL[emp.status] ?? emp.status}
                          </span>
                        </td>

                        <td onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1 justify-end">
                            <ActionIconBtn variant="view"   icon={Eye}    onClick={() => navigate(`/employees/${emp.id}`)}       title="View profile" />
                            <ActionIconBtn variant="edit"   icon={Edit2}  onClick={() => navigate(`/employees/${emp.id}/edit`)} title="Edit" />
                            <ActionIconBtn variant="delete" icon={Trash2} onClick={e => handleDelete(emp, e)}                   title="Delete" />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            <div
              className="flex items-center justify-between px-4 py-2"
              style={{ borderTop: '1px solid #f0f2f5', background: '#fafbfc' }}
            >
              <div className="flex items-center gap-1.5">
                <Filter style={{ width: 11, height: 11, color: '#d1d5db' }} />
                <span className="text-gray-400" style={{ fontSize: 11 }}>
                  {total} employee{total !== 1 ? 's' : ''} shown
                  {activeFilters > 0 && (
                    <span className="text-gray-300"> (filtered)</span>
                  )}
                </span>
              </div>
              <button
                onClick={() => navigate('/employees/new')}
                className="flex items-center gap-1 text-brand font-semibold hover:underline"
                style={{ fontSize: 11 }}
              >
                <Plus style={{ width: 11, height: 11 }} /> Add employee
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
