import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import {
  apiGetEmployee, apiCreateEmployee, apiUpdateEmployee,
  apiGetShifts, apiGetDepartments, apiGetPositions,
} from '../../lib/db'
import type { Employee, WorkShift, Department, Position, CompensationType } from '../../types'

type FormData = Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>

const BLANK: FormData = {
  employeeNo:'', firstName:'', lastName:'', middleName:'', fullName:'',
  email:'', phone:'', address:'', birthDate:'', gender:'male', civilStatus:'single',
  position:'', department:'', employmentType:'regular', status:'active',
  hireDate: new Date().toISOString().split('T')[0],
  compensationType: 'monthly', compensationRate: 0,
  basicSalary: 0, dailyRate: 0, payFrequency:'weekly', pinCode:'',
  sssNo:'', philhealthNo:'', pagibigNo:'', tinNo:'',
  bankName:'', bankAccount:'', shiftId:'sh-1', taxStatus:'S',
  allowances:[], emergencyContactName:'', emergencyContactPhone:'',
}

const SECTIONS = ['Personal', 'Employment', 'Compensation', 'Government IDs', 'Emergency & Bank'] as const
type Section = typeof SECTIONS[number]

const COMPENSATION_LABELS: Record<CompensationType, { rate: string; hint: string }> = {
  daily:   { rate: 'Daily Rate (₱)',    hint: 'Pay per working day. Monthly salary ≈ daily × 22.' },
  weekly:  { rate: 'Weekly Rate (₱)',   hint: 'Pay per week. Monthly salary ≈ weekly × 4.33.' },
  monthly: { rate: 'Monthly Salary (₱)', hint: 'Full monthly salary. Daily rate auto-computed ÷ 22.' },
}

export function EmployeeForm() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const [form, setForm] = useState<FormData>(BLANK)
  const [shifts, setShifts] = useState<WorkShift[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [section, setSection] = useState<Section>('Personal')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      apiGetShifts(),
      apiGetDepartments(),
      apiGetPositions(),
    ]).then(([sh, depts, pos]) => {
      setShifts(sh)
      setDepartments(depts)
      setPositions(pos)
    })
    if (isEdit) apiGetEmployee(id!).then(emp => {
      if (emp) {
        const filled: FormData = {
          ...emp,
          compensationType: emp.compensationType ?? 'monthly',
          compensationRate: emp.compensationRate ?? emp.basicSalary,
        }
        setForm(filled)
      }
    })
  }, [id, isEdit])

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) => {
    setForm(f => {
      const next = { ...f, [k]: v }
      // Auto-update fullName
      if (k === 'firstName' || k === 'lastName' || k === 'middleName') {
        next.fullName = [next.firstName, next.middleName, next.lastName].filter(Boolean).join(' ')
      }
      // Compensation sync
      if (k === 'compensationType' || k === 'compensationRate') {
        const type = k === 'compensationType' ? (v as CompensationType) : next.compensationType
        const rate = k === 'compensationRate' ? (v as number) : next.compensationRate
        if (type === 'monthly') {
          next.basicSalary = rate
          next.dailyRate = Math.round((rate / 22) * 100) / 100
        } else if (type === 'daily') {
          next.dailyRate = rate
          next.basicSalary = Math.round(rate * 22 * 100) / 100
        } else if (type === 'weekly') {
          next.basicSalary = Math.round(rate * 4.33 * 100) / 100
          next.dailyRate = Math.round((rate / 5) * 100) / 100
        }
      }
      return next
    })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.firstName || !form.lastName || !form.email || !form.position) {
      setError('Please fill in all required fields.'); return
    }
    if (!form.pinCode || form.pinCode.length !== 4) {
      setError('PIN code must be exactly 4 digits.'); return
    }
    setSaving(true)
    try {
      if (isEdit) await apiUpdateEmployee(id!, form)
      else await apiCreateEmployee(form)
      navigate('/employees')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save employee.')
    } finally {
      setSaving(false)
    }
  }

  const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div>
      <label className="form-label">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumb="Employees"
        title={isEdit ? 'Edit Employee' : 'Add New Employee'}
        subtitle={isEdit ? form.fullName : 'Fill in the employee details below'}
        actions={[
          { label: 'Cancel', icon: ArrowLeft, variant: 'secondary', onClick: () => navigate('/employees') },
        ]}
      />

      {error && (
        <div className="px-4 py-3 text-sm text-red-700 rounded" style={{ background:'#FEF2F2', border:'1px solid #FECACA' }}>
          {error}
        </div>
      )}

      {/* Section tabs */}
      <div className="flex gap-0 overflow-x-auto" style={{ borderBottom:'1px solid #E5E7EB' }}>
        {SECTIONS.map(s => (
          <button key={s} onClick={() => setSection(s)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px
              ${section === s ? 'text-brand border-brand' : 'text-gray-500 border-transparent hover:text-gray-700'}`}>
            {s}
          </button>
        ))}
      </div>

      <form onSubmit={submit}>
        <div className="card p-5">

          {/* ── Personal ── */}
          {section === 'Personal' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="First Name" required><input className="input-base" value={form.firstName} onChange={e => set('firstName', e.target.value)} /></Field>
              <Field label="Middle Name"><input className="input-base" value={form.middleName} onChange={e => set('middleName', e.target.value)} /></Field>
              <Field label="Last Name" required><input className="input-base" value={form.lastName} onChange={e => set('lastName', e.target.value)} /></Field>
              <Field label="Email Address" required><input type="email" className="input-base" value={form.email} onChange={e => set('email', e.target.value)} /></Field>
              <Field label="Phone Number"><input className="input-base" value={form.phone} onChange={e => set('phone', e.target.value)} /></Field>
              <Field label="Date of Birth"><input type="date" className="input-base" value={form.birthDate} onChange={e => set('birthDate', e.target.value)} /></Field>
              <Field label="Gender">
                <select className="input-base" value={form.gender} onChange={e => set('gender', e.target.value as 'male'|'female')}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </Field>
              <Field label="Civil Status">
                <select className="input-base" value={form.civilStatus} onChange={e => set('civilStatus', e.target.value as Employee['civilStatus'])}>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="widowed">Widowed</option>
                  <option value="separated">Separated</option>
                </select>
              </Field>
              <div className="sm:col-span-2 lg:col-span-3">
                <Field label="Home Address"><input className="input-base" value={form.address} onChange={e => set('address', e.target.value)} /></Field>
              </div>
            </div>
          )}

          {/* ── Employment ── */}
          {section === 'Employment' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Employee No." required>
                <input className="input-base" value={form.employeeNo} onChange={e => set('employeeNo', e.target.value)} placeholder="EMP-0001" />
              </Field>
              <Field label="Kiosk PIN (4-digit)" required>
                <input className="input-base" value={form.pinCode} onChange={e => set('pinCode', e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="1234" maxLength={4} />
              </Field>
              <Field label="Department" required>
                <select className="input-base" value={form.department} onChange={e => set('department', e.target.value)}>
                  <option value="">— Select department —</option>
                  {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </Field>
              <Field label="Position" required>
                <select className="input-base" value={form.position} onChange={e => set('position', e.target.value)}>
                  <option value="">— Select position —</option>
                  {positions.map(p => <option key={p.id} value={p.title}>{p.title}{p.level ? ` (${p.level})` : ''}</option>)}
                </select>
              </Field>
              <Field label="Employment Type">
                <select className="input-base" value={form.employmentType} onChange={e => set('employmentType', e.target.value as Employee['employmentType'])}>
                  <option value="regular">Regular</option>
                  <option value="probationary">Probationary</option>
                  <option value="contractual">Contractual</option>
                  <option value="part-time">Part-time</option>
                </select>
              </Field>
              <Field label="Status">
                <select className="input-base" value={form.status} onChange={e => set('status', e.target.value as Employee['status'])}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="resigned">Resigned</option>
                  <option value="terminated">Terminated</option>
                  <option value="awol">AWOL</option>
                </select>
              </Field>
              <Field label="Hire Date">
                <input type="date" className="input-base" value={form.hireDate} onChange={e => set('hireDate', e.target.value)} />
              </Field>
              <Field label="Work Shift">
                <select className="input-base" value={form.shiftId} onChange={e => set('shiftId', e.target.value)}>
                  {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.timeIn}–{s.timeOut})</option>)}
                </select>
              </Field>
              <Field label="Pay Frequency">
                <select className="input-base" value={form.payFrequency} onChange={e => set('payFrequency', e.target.value as Employee['payFrequency'])}>
                  <option value="weekly">Weekly</option>
                  <option value="bi-monthly">Bi-Monthly (Semi-Monthly)</option>
                  <option value="monthly">Monthly</option>
                </select>
              </Field>
            </div>
          )}

          {/* ── Compensation ── */}
          {section === 'Compensation' && (
            <div className="space-y-5">
              {/* Compensation type selector */}
              <div>
                <label className="data-label block mb-2">Compensation Type *</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['daily', 'weekly', 'monthly'] as CompensationType[]).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => set('compensationType', type)}
                      className="px-3 py-3 text-sm font-semibold text-left transition-all border rounded-md"
                      style={{
                        borderColor: form.compensationType === type ? '#1565C0' : '#E2E5EB',
                        background: form.compensationType === type ? '#EBF4FF' : '#fff',
                        color: form.compensationType === type ? '#1565C0' : '#374151',
                        boxShadow: form.compensationType === type ? '0 0 0 2px rgba(21,101,192,0.15)' : 'none',
                      }}>
                      <div className="capitalize font-bold">{type}</div>
                      <div className="text-[11px] mt-0.5 font-normal" style={{ color: form.compensationType === type ? '#2563EB' : '#9CA3AF' }}>
                        {type === 'daily' ? 'Pay per working day' : type === 'weekly' ? 'Pay per week' : 'Fixed monthly salary'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">{COMPENSATION_LABELS[form.compensationType].rate} *</label>
                  <input
                    type="number"
                    className="input-base"
                    value={form.compensationRate || ''}
                    onChange={e => set('compensationRate', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-400 mt-1">{COMPENSATION_LABELS[form.compensationType].hint}</p>
                </div>

                {/* Computed equivalents (read-only) */}
                <div>
                  <label className="form-label">Monthly Equivalent (₱)</label>
                  <input type="number" className="input-base" value={form.basicSalary || ''} readOnly
                    style={{ background:'#F9FAFB', color:'#6B7280', cursor:'not-allowed' }} />
                  <p className="text-xs text-gray-400 mt-1">Used for SSS, PhilHealth, Pag-IBIG</p>
                </div>
                <div>
                  <label className="form-label">Daily Rate Equivalent (₱)</label>
                  <input type="number" className="input-base" value={form.dailyRate || ''} readOnly
                    style={{ background:'#F9FAFB', color:'#6B7280', cursor:'not-allowed' }} />
                  <p className="text-xs text-gray-400 mt-1">Used for attendance-based pay</p>
                </div>

                <div>
                  <label className="form-label">Tax Status</label>
                  <select className="input-base" value={form.taxStatus} onChange={e => set('taxStatus', e.target.value as Employee['taxStatus'])}>
                    {['S','S1','S2','S3','ME','ME1','ME2','ME3'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Allowances */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Allowances</h3>
                  <button type="button"
                    onClick={() => set('allowances', [...form.allowances, { type:'', amount:0, taxable:false }])}
                    className="flex items-center gap-1 text-xs text-brand font-semibold hover:underline">
                    <Plus className="w-3 h-3" />Add
                  </button>
                </div>
                {form.allowances.length === 0 ? (
                  <p className="text-sm text-gray-400">No allowances added.</p>
                ) : (
                  <div className="space-y-2">
                    {form.allowances.map((a, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input placeholder="Type (e.g. Transportation)" className="input-base flex-1"
                          value={a.type}
                          onChange={e => { const next=[...form.allowances]; next[i]={...next[i],type:e.target.value}; set('allowances',next) }} />
                        <input type="number" placeholder="Amount" className="input-base w-32"
                          value={a.amount||''}
                          onChange={e => { const next=[...form.allowances]; next[i]={...next[i],amount:parseFloat(e.target.value)||0}; set('allowances',next) }} />
                        <label className="flex items-center gap-1.5 text-xs text-gray-600 whitespace-nowrap">
                          <input type="checkbox" checked={a.taxable}
                            onChange={e => { const next=[...form.allowances]; next[i]={...next[i],taxable:e.target.checked}; set('allowances',next) }} />
                          Taxable
                        </label>
                        <button type="button" onClick={() => set('allowances', form.allowances.filter((_,j)=>j!==i))}
                          className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Government IDs ── */}
          {section === 'Government IDs' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="form-label">SSS Number</label><input className="input-base" value={form.sssNo} onChange={e => set('sssNo', e.target.value)} placeholder="34-XXXXXXX-X" /></div>
              <div><label className="form-label">PhilHealth Number</label><input className="input-base" value={form.philhealthNo} onChange={e => set('philhealthNo', e.target.value)} placeholder="12-XXXXXXXXX-X" /></div>
              <div><label className="form-label">Pag-IBIG Number</label><input className="input-base" value={form.pagibigNo} onChange={e => set('pagibigNo', e.target.value)} placeholder="XXXX-XXXX-XXXX" /></div>
              <div><label className="form-label">TIN Number</label><input className="input-base" value={form.tinNo} onChange={e => set('tinNo', e.target.value)} placeholder="XXX-XXX-XXX-XXX" /></div>
            </div>
          )}

          {/* ── Emergency & Bank ── */}
          {section === 'Emergency & Bank' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="form-label">Emergency Contact Name</label><input className="input-base" value={form.emergencyContactName} onChange={e => set('emergencyContactName', e.target.value)} /></div>
              <div><label className="form-label">Emergency Contact Phone</label><input className="input-base" value={form.emergencyContactPhone} onChange={e => set('emergencyContactPhone', e.target.value)} /></div>
              <div><label className="form-label">Bank Name</label><input className="input-base" value={form.bankName} onChange={e => set('bankName', e.target.value)} placeholder="BDO, BPI, Metrobank…" /></div>
              <div><label className="form-label">Bank Account Number</label><input className="input-base" value={form.bankAccount} onChange={e => set('bankAccount', e.target.value)} /></div>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-0 text-xs text-gray-400">
            {SECTIONS.map((s, i) => (
              <span key={s} className="flex items-center gap-1">
                <button type="button" onClick={() => setSection(s)}
                  className={`font-medium ${section === s ? 'text-brand' : 'hover:text-gray-600'}`}>{i + 1}</button>
                {i < SECTIONS.length - 1 && <span className="mx-1">›</span>}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            {section !== SECTIONS[SECTIONS.length - 1] && (
              <button type="button"
                onClick={() => setSection(SECTIONS[SECTIONS.indexOf(section) + 1])}
                className="btn-secondary">Next →</button>
            )}
            <button type="submit" disabled={saving} className="btn-primary">
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                : <><Save className="w-3.5 h-3.5" />{isEdit ? 'Update Employee' : 'Create Employee'}</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
