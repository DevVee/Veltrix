// ─── Local-first data store (localStorage) ────────────────────────────────────
import { v4 as uuid } from 'uuid'
import type {
  Employee, WorkShift, AttendanceRecord, PayrollPeriod, PayrollEntry,
  LeaveRequest, LeaveBalance, OvertimeRequest, Holiday, HRUser,
  AuditLog, CompanySettings, Department, Position, PayrollDeductionSettings,
} from '../types'
import { computePayrollEntry, countWorkingDays, DEFAULT_DEDUCTION_SETTINGS } from './payrollEngine'

// ─── Storage keys ─────────────────────────────────────────────────────────────
const K = {
  employees:         'tp_employees',
  shifts:            'tp_shifts',
  attendance:        'tp_attendance',
  payrollPeriods:    'tp_payroll_periods',
  payrollEntries:    'tp_payroll_entries',
  leaves:            'tp_leaves',
  leaveBalances:     'tp_leave_balances',
  overtime:          'tp_overtime',
  holidays:          'tp_holidays',
  users:             'tp_users',
  currentUser:       'tp_current_user',
  auditLogs:         'tp_audit_logs',
  company:           'tp_company',
  departments:       'tp_departments',
  positions:         'tp_positions',
  deductionSettings: 'tp_deduction_settings',
  seeded:            'tp_seeded_v4',
  payrollSeq:        'tp_payroll_seq',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ls<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') as T[] } catch { return [] }
}
function lsGet<T>(key: string): T | null {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') as T } catch { return null }
}
function lsSet(key: string, val: unknown) { localStorage.setItem(key, JSON.stringify(val)) }
function ds(d: Date) { return d.toISOString().split('T')[0] }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString() }
function dateAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return ds(d) }

let _seq = parseInt(localStorage.getItem(K.payrollSeq) ?? '100', 10)
function nextPeriodNo() {
  _seq++; localStorage.setItem(K.payrollSeq, String(_seq))
  return `PAY-${String(_seq).padStart(4, '0')}`
}

// ─── Audit helper ─────────────────────────────────────────────────────────────
function pushAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
  const logs = ls<AuditLog>(K.auditLogs)
  logs.unshift({ ...entry, id: uuid(), timestamp: new Date().toISOString() })
  lsSet(K.auditLogs, logs.slice(0, 200))
}

// ─── SEED ─────────────────────────────────────────────────────────────────────
export function seedIfNeeded() {
  if (localStorage.getItem(K.seeded)) return

  // ── Departments ───────────────────────────────────────────────────────────
  const departments: Department[] = [
    { id:'dept-01', name:'Human Resources',       code:'HR',   description:'Handles recruitment, benefits, and employee relations', headName:'Maria Cruz Santos',      createdAt: new Date().toISOString() },
    { id:'dept-02', name:'Finance',               code:'FIN',  description:'Manages accounting, payroll, and financial reporting',  headName:'Juan Reyes Villanueva',   createdAt: new Date().toISOString() },
    { id:'dept-03', name:'Operations',            code:'OPS',  description:'Oversees day-to-day business operations',              headName:'Eduardo Garcia Torres',   createdAt: new Date().toISOString() },
    { id:'dept-04', name:'Information Technology',code:'IT',   description:'Manages IT infrastructure and software systems',       headName:'Kevin Uy Lim',            createdAt: new Date().toISOString() },
    { id:'dept-05', name:'Sales & Marketing',     code:'S&M',  description:'Drives sales strategy and marketing campaigns',        headName:'Geraldine Vega Ocampo',   createdAt: new Date().toISOString() },
    { id:'dept-06', name:'Administration',        code:'ADMIN',description:'General administrative and support functions',         headName:'',                        createdAt: new Date().toISOString() },
  ]

  // ── Positions ─────────────────────────────────────────────────────────────
  const positions: Position[] = [
    { id:'pos-01', title:'HR Manager',          level:'Manager',   createdAt: new Date().toISOString() },
    { id:'pos-02', title:'HR Officer',          level:'Officer',   createdAt: new Date().toISOString() },
    { id:'pos-03', title:'HR Coordinator',      level:'Staff',     createdAt: new Date().toISOString() },
    { id:'pos-04', title:'Finance Manager',     level:'Manager',   createdAt: new Date().toISOString() },
    { id:'pos-05', title:'Payroll Officer',     level:'Officer',   createdAt: new Date().toISOString() },
    { id:'pos-06', title:'Accountant',          level:'Officer',   createdAt: new Date().toISOString() },
    { id:'pos-07', title:'Billing Clerk',       level:'Staff',     createdAt: new Date().toISOString() },
    { id:'pos-08', title:'Operations Manager',  level:'Manager',   createdAt: new Date().toISOString() },
    { id:'pos-09', title:'Supervisor',          level:'Supervisor',createdAt: new Date().toISOString() },
    { id:'pos-10', title:'Clerk',               level:'Staff',     createdAt: new Date().toISOString() },
    { id:'pos-11', title:'Utility Staff',       level:'Staff',     createdAt: new Date().toISOString() },
    { id:'pos-12', title:'Security Guard',      level:'Staff',     createdAt: new Date().toISOString() },
    { id:'pos-13', title:'IT Manager',          level:'Manager',   createdAt: new Date().toISOString() },
    { id:'pos-14', title:'Software Developer',  level:'Senior',    createdAt: new Date().toISOString() },
    { id:'pos-15', title:'IT Support',          level:'Staff',     createdAt: new Date().toISOString() },
    { id:'pos-16', title:'Systems Analyst',     level:'Officer',   createdAt: new Date().toISOString() },
    { id:'pos-17', title:'Sales Manager',       level:'Manager',   createdAt: new Date().toISOString() },
    { id:'pos-18', title:'Sales Executive',     level:'Officer',   createdAt: new Date().toISOString() },
    { id:'pos-19', title:'Marketing Officer',   level:'Officer',   createdAt: new Date().toISOString() },
    { id:'pos-20', title:'Brand Associate',     level:'Staff',     createdAt: new Date().toISOString() },
    { id:'pos-21', title:'Admin Officer',       level:'Officer',   createdAt: new Date().toISOString() },
    { id:'pos-22', title:'Receptionist',        level:'Staff',     createdAt: new Date().toISOString() },
    { id:'pos-23', title:'Driver',              level:'Staff',     createdAt: new Date().toISOString() },
  ]

  // ── Shifts ────────────────────────────────────────────────────────────────
  const shifts: WorkShift[] = [
    { id: 'sh-1', name: 'Morning Shift',   timeIn: '08:00', timeOut: '17:00', breakMinutes: 60, graceMinutes: 10, restDays: [0,6], overtimeEnabled: true },
    { id: 'sh-2', name: 'Afternoon Shift', timeIn: '14:00', timeOut: '23:00', breakMinutes: 60, graceMinutes: 10, restDays: [0,6], overtimeEnabled: true },
    { id: 'sh-3', name: 'Night Shift',     timeIn: '22:00', timeOut: '07:00', breakMinutes: 60, graceMinutes: 10, restDays: [0,6], overtimeEnabled: true },
    { id: 'sh-4', name: 'Flexible Shift',  timeIn: '09:00', timeOut: '18:00', breakMinutes: 60, graceMinutes: 30, restDays: [0,6], overtimeEnabled: false },
  ]

  // ── Employees — 20 across 5 departments ──────────────────────────────────
  const employees: Employee[] = [
    // ── Human Resources (3) ─────────────────────────────────────────────────
    { id:'emp-01',employeeNo:'EMP-0001',firstName:'Maria',lastName:'Santos',middleName:'Cruz',fullName:'Maria Cruz Santos',
      email:'maria.santos@acme.ph',phone:'09171111001',address:'123 Rizal St, Quezon City',birthDate:'1988-03-15',gender:'female',civilStatus:'married',
      position:'HR Manager',department:'Human Resources',employmentType:'regular',status:'active',
      hireDate:daysAgo(900),compensationType:'monthly',compensationRate:55000,basicSalary:55000,dailyRate:2500,payFrequency:'bi-monthly',pinCode:'1001',
      sssNo:'34-1234567-8',philhealthNo:'12-345678901-2',pagibigNo:'1234-5678-9012',tinNo:'123-456-789-000',
      bankName:'BDO',bankAccount:'001234567890',shiftId:'sh-1',taxStatus:'ME',
      allowances:[{type:'Transportation',amount:2000,taxable:false},{type:'Meal',amount:1500,taxable:false}],
      emergencyContactName:'Jose Santos',emergencyContactPhone:'09170000001',createdAt:daysAgo(900),updatedAt:daysAgo(0) },
    { id:'emp-02',employeeNo:'EMP-0002',firstName:'Lourdes',lastName:'Reyes',middleName:'Bautista',fullName:'Lourdes Bautista Reyes',
      email:'lourdes.reyes@acme.ph',phone:'09181111002',address:'456 Mabini Ave, Makati',birthDate:'1992-07-22',gender:'female',civilStatus:'single',
      position:'HR Officer',department:'Human Resources',employmentType:'regular',status:'active',
      hireDate:daysAgo(540),compensationType:'monthly',compensationRate:35000,basicSalary:35000,dailyRate:1590.91,payFrequency:'bi-monthly',pinCode:'1002',
      sssNo:'34-2345678-9',philhealthNo:'12-456789012-3',pagibigNo:'2345-6789-0123',tinNo:'234-567-890-000',
      bankName:'BPI',bankAccount:'002345678901',shiftId:'sh-1',taxStatus:'S',
      allowances:[{type:'Transportation',amount:1500,taxable:false}],
      emergencyContactName:'Corazon Reyes',emergencyContactPhone:'09180000002',createdAt:daysAgo(540),updatedAt:daysAgo(0) },
    { id:'emp-03',employeeNo:'EMP-0003',firstName:'Roberto',lastName:'Dela Cruz',middleName:'Garbo',fullName:'Roberto Garbo Dela Cruz',
      email:'roberto.delacruz@acme.ph',phone:'09191111003',address:'789 Aguinaldo Blvd, Cavite',birthDate:'1995-11-05',gender:'male',civilStatus:'single',
      position:'HR Coordinator',department:'Human Resources',employmentType:'probationary',status:'active',
      hireDate:daysAgo(120),compensationType:'monthly',compensationRate:22000,basicSalary:22000,dailyRate:1000,payFrequency:'bi-monthly',pinCode:'1003',
      sssNo:'34-3456789-0',philhealthNo:'12-567890123-4',pagibigNo:'3456-7890-1234',tinNo:'345-678-901-000',
      bankName:'Metrobank',bankAccount:'003456789012',shiftId:'sh-4',taxStatus:'S',
      allowances:[],
      emergencyContactName:'Ana Dela Cruz',emergencyContactPhone:'09190000003',createdAt:daysAgo(120),updatedAt:daysAgo(0) },
    // ── Finance (4) ─────────────────────────────────────────────────────────
    { id:'emp-04',employeeNo:'EMP-0004',firstName:'Juan',lastName:'Villanueva',middleName:'Reyes',fullName:'Juan Reyes Villanueva',
      email:'juan.villanueva@acme.ph',phone:'09201111004',address:'101 Katipunan, Loyola Heights',birthDate:'1985-09-18',gender:'male',civilStatus:'married',
      position:'Finance Manager',department:'Finance',employmentType:'regular',status:'active',
      hireDate:daysAgo(1200),compensationType:'monthly',compensationRate:60000,basicSalary:60000,dailyRate:2727.27,payFrequency:'bi-monthly',pinCode:'1004',
      sssNo:'34-4567890-1',philhealthNo:'12-678901234-5',pagibigNo:'4567-8901-2345',tinNo:'456-789-012-000',
      bankName:'BDO',bankAccount:'004567890123',shiftId:'sh-1',taxStatus:'ME1',
      allowances:[{type:'Transportation',amount:3000,taxable:false},{type:'Meal',amount:2000,taxable:false}],
      emergencyContactName:'Carmen Villanueva',emergencyContactPhone:'09200000004',createdAt:daysAgo(1200),updatedAt:daysAgo(0) },
    { id:'emp-05',employeeNo:'EMP-0005',firstName:'Ana',lastName:'Mendoza',middleName:'Lopez',fullName:'Ana Lopez Mendoza',
      email:'ana.mendoza@acme.ph',phone:'09211111005',address:'202 Espana Blvd, Manila',birthDate:'1990-04-30',gender:'female',civilStatus:'single',
      position:'Payroll Officer',department:'Finance',employmentType:'regular',status:'active',
      hireDate:daysAgo(700),compensationType:'monthly',compensationRate:38000,basicSalary:38000,dailyRate:1727.27,payFrequency:'bi-monthly',pinCode:'1005',
      sssNo:'34-5678901-2',philhealthNo:'12-789012345-6',pagibigNo:'5678-9012-3456',tinNo:'567-890-123-000',
      bankName:'UnionBank',bankAccount:'005678901234',shiftId:'sh-1',taxStatus:'S1',
      allowances:[{type:'Transportation',amount:1500,taxable:false}],
      emergencyContactName:'Pedro Mendoza',emergencyContactPhone:'09210000005',createdAt:daysAgo(700),updatedAt:daysAgo(0) },
    { id:'emp-06',employeeNo:'EMP-0006',firstName:'Carlos',lastName:'Aquino',middleName:'Santos',fullName:'Carlos Santos Aquino',
      email:'carlos.aquino@acme.ph',phone:'09221111006',address:'303 Aurora Blvd, Pasig',birthDate:'1993-12-01',gender:'male',civilStatus:'single',
      position:'Accountant',department:'Finance',employmentType:'regular',status:'active',
      hireDate:daysAgo(400),compensationType:'monthly',compensationRate:32000,basicSalary:32000,dailyRate:1454.55,payFrequency:'bi-monthly',pinCode:'1006',
      sssNo:'34-6789012-3',philhealthNo:'12-890123456-7',pagibigNo:'6789-0123-4567',tinNo:'678-901-234-000',
      bankName:'BPI',bankAccount:'006789012345',shiftId:'sh-4',taxStatus:'S',
      allowances:[{type:'Meal',amount:1000,taxable:false}],
      emergencyContactName:'Rosa Aquino',emergencyContactPhone:'09220000006',createdAt:daysAgo(400),updatedAt:daysAgo(0) },
    { id:'emp-07',employeeNo:'EMP-0007',firstName:'Patricia',lastName:'Ramos',middleName:'Flores',fullName:'Patricia Flores Ramos',
      email:'patricia.ramos@acme.ph',phone:'09231111007',address:'404 Shaw Blvd, Mandaluyong',birthDate:'1997-06-14',gender:'female',civilStatus:'single',
      position:'Billing Clerk',department:'Finance',employmentType:'probationary',status:'active',
      hireDate:daysAgo(90),compensationType:'daily',compensationRate:818.18,basicSalary:18000,dailyRate:818.18,payFrequency:'weekly',pinCode:'1007',
      sssNo:'34-7890123-4',philhealthNo:'12-901234567-8',pagibigNo:'7890-1234-5678',tinNo:'789-012-345-000',
      bankName:'Metrobank',bankAccount:'007890123456',shiftId:'sh-1',taxStatus:'S',
      allowances:[],
      emergencyContactName:'Antonio Ramos',emergencyContactPhone:'09230000007',createdAt:daysAgo(90),updatedAt:daysAgo(0) },
    // ── Operations (5) ──────────────────────────────────────────────────────
    { id:'emp-08',employeeNo:'EMP-0008',firstName:'Eduardo',lastName:'Torres',middleName:'Garcia',fullName:'Eduardo Garcia Torres',
      email:'eduardo.torres@acme.ph',phone:'09241111008',address:'505 EDSA, Guadalupe, Makati',birthDate:'1984-02-28',gender:'male',civilStatus:'married',
      position:'Operations Manager',department:'Operations',employmentType:'regular',status:'active',
      hireDate:daysAgo(1500),compensationType:'monthly',compensationRate:65000,basicSalary:65000,dailyRate:2954.55,payFrequency:'bi-monthly',pinCode:'1008',
      sssNo:'34-8901234-5',philhealthNo:'12-012345678-9',pagibigNo:'8901-2345-6789',tinNo:'890-123-456-000',
      bankName:'BDO',bankAccount:'008901234567',shiftId:'sh-1',taxStatus:'ME2',
      allowances:[{type:'Transportation',amount:3000,taxable:false},{type:'Meal',amount:2000,taxable:false},{type:'Communication',amount:1000,taxable:false}],
      emergencyContactName:'Ligaya Torres',emergencyContactPhone:'09240000008',createdAt:daysAgo(1500),updatedAt:daysAgo(0) },
    { id:'emp-09',employeeNo:'EMP-0009',firstName:'Maricel',lastName:'Castro',middleName:'Bautista',fullName:'Maricel Bautista Castro',
      email:'maricel.castro@acme.ph',phone:'09251111009',address:'606 Taft Ave, Pasay',birthDate:'1991-08-10',gender:'female',civilStatus:'single',
      position:'Supervisor',department:'Operations',employmentType:'regular',status:'active',
      hireDate:daysAgo(600),compensationType:'monthly',compensationRate:30000,basicSalary:30000,dailyRate:1363.64,payFrequency:'bi-monthly',pinCode:'1009',
      sssNo:'34-9012345-6',philhealthNo:'12-123456789-0',pagibigNo:'9012-3456-7890',tinNo:'901-234-567-000',
      bankName:'BPI',bankAccount:'009012345678',shiftId:'sh-2',taxStatus:'S',
      allowances:[{type:'Transportation',amount:1500,taxable:false}],
      emergencyContactName:'Ricardo Castro',emergencyContactPhone:'09250000009',createdAt:daysAgo(600),updatedAt:daysAgo(0) },
    { id:'emp-10',employeeNo:'EMP-0010',firstName:'Renato',lastName:'Navarro',middleName:'Cruz',fullName:'Renato Cruz Navarro',
      email:'renato.navarro@acme.ph',phone:'09261111010',address:'707 Ortigas Ave, Pasig',birthDate:'1994-05-20',gender:'male',civilStatus:'single',
      position:'Clerk',department:'Operations',employmentType:'regular',status:'active',
      hireDate:daysAgo(350),compensationType:'daily',compensationRate:909.09,basicSalary:20000,dailyRate:909.09,payFrequency:'weekly',pinCode:'1010',
      sssNo:'34-0123456-7',philhealthNo:'12-234567890-1',pagibigNo:'0123-4567-8901',tinNo:'012-345-678-000',
      bankName:'UnionBank',bankAccount:'010123456789',shiftId:'sh-1',taxStatus:'S',
      allowances:[],
      emergencyContactName:'Elena Navarro',emergencyContactPhone:'09260000010',createdAt:daysAgo(350),updatedAt:daysAgo(0) },
    { id:'emp-11',employeeNo:'EMP-0011',firstName:'Josefina',lastName:'Reyes',middleName:'Aguilar',fullName:'Josefina Aguilar Reyes',
      email:'josefina.reyes@acme.ph',phone:'09271111011',address:'808 Commonwealth Ave, QC',birthDate:'1996-01-07',gender:'female',civilStatus:'single',
      position:'Utility Staff',department:'Operations',employmentType:'contractual',status:'active',
      hireDate:daysAgo(180),compensationType:'daily',compensationRate:681.82,basicSalary:15000,dailyRate:681.82,payFrequency:'weekly',pinCode:'1011',
      sssNo:'34-1234568-9',philhealthNo:'12-345678902-3',pagibigNo:'1234-5679-0123',tinNo:'123-456-790-000',
      bankName:'Metrobank',bankAccount:'011234567890',shiftId:'sh-1',taxStatus:'S',
      allowances:[],
      emergencyContactName:'Felix Reyes',emergencyContactPhone:'09270000011',createdAt:daysAgo(180),updatedAt:daysAgo(0) },
    { id:'emp-12',employeeNo:'EMP-0012',firstName:'Dennis',lastName:'Morales',middleName:'Salazar',fullName:'Dennis Salazar Morales',
      email:'dennis.morales@acme.ph',phone:'09281111012',address:'909 Mindanao Ave, QC',birthDate:'1999-09-09',gender:'male',civilStatus:'single',
      position:'Security Guard',department:'Operations',employmentType:'regular',status:'active',
      hireDate:daysAgo(270),compensationType:'daily',compensationRate:727.27,basicSalary:16000,dailyRate:727.27,payFrequency:'weekly',pinCode:'1012',
      sssNo:'34-2345679-0',philhealthNo:'12-456789013-4',pagibigNo:'2345-6790-1234',tinNo:'234-567-891-000',
      bankName:'BDO',bankAccount:'012345678901',shiftId:'sh-3',taxStatus:'S',
      allowances:[{type:'Night Differential Allowance',amount:800,taxable:false}],
      emergencyContactName:'Gloria Morales',emergencyContactPhone:'09280000012',createdAt:daysAgo(270),updatedAt:daysAgo(0) },
    // ── IT (4) ──────────────────────────────────────────────────────────────
    { id:'emp-13',employeeNo:'EMP-0013',firstName:'Kevin',lastName:'Lim',middleName:'Uy',fullName:'Kevin Uy Lim',
      email:'kevin.lim@acme.ph',phone:'09291111013',address:'111 East Ave, QC',birthDate:'1987-10-25',gender:'male',civilStatus:'married',
      position:'IT Manager',department:'Information Technology',employmentType:'regular',status:'active',
      hireDate:daysAgo(1100),compensationType:'monthly',compensationRate:70000,basicSalary:70000,dailyRate:3181.82,payFrequency:'bi-monthly',pinCode:'1013',
      sssNo:'34-3456780-1',philhealthNo:'12-567890124-5',pagibigNo:'3456-7891-2345',tinNo:'345-678-902-000',
      bankName:'BPI',bankAccount:'013456789012',shiftId:'sh-4',taxStatus:'ME1',
      allowances:[{type:'Transportation',amount:3000,taxable:false},{type:'Internet',amount:1000,taxable:false}],
      emergencyContactName:'Vanessa Lim',emergencyContactPhone:'09290000013',createdAt:daysAgo(1100),updatedAt:daysAgo(0) },
    { id:'emp-14',employeeNo:'EMP-0014',firstName:'Stephanie',lastName:'Chan',middleName:'Go',fullName:'Stephanie Go Chan',
      email:'stephanie.chan@acme.ph',phone:'09301111014',address:'222 West Ave, QC',birthDate:'1993-03-08',gender:'female',civilStatus:'single',
      position:'Software Developer',department:'Information Technology',employmentType:'regular',status:'active',
      hireDate:daysAgo(500),compensationType:'monthly',compensationRate:55000,basicSalary:55000,dailyRate:2500,payFrequency:'bi-monthly',pinCode:'1014',
      sssNo:'34-4567891-2',philhealthNo:'12-678901235-6',pagibigNo:'4567-8902-3456',tinNo:'456-789-013-000',
      bankName:'UnionBank',bankAccount:'014567890123',shiftId:'sh-4',taxStatus:'S',
      allowances:[{type:'Internet',amount:1000,taxable:false}],
      emergencyContactName:'John Chan',emergencyContactPhone:'09300000014',createdAt:daysAgo(500),updatedAt:daysAgo(0) },
    { id:'emp-15',employeeNo:'EMP-0015',firstName:'Mark',lastName:'Tan',middleName:'Sy',fullName:'Mark Sy Tan',
      email:'mark.tan@acme.ph',phone:'09311111015',address:'333 North Ave, QC',birthDate:'1996-07-19',gender:'male',civilStatus:'single',
      position:'IT Support',department:'Information Technology',employmentType:'regular',status:'active',
      hireDate:daysAgo(300),compensationType:'monthly',compensationRate:28000,basicSalary:28000,dailyRate:1272.73,payFrequency:'bi-monthly',pinCode:'1015',
      sssNo:'34-5678902-3',philhealthNo:'12-789012346-7',pagibigNo:'5678-9013-4567',tinNo:'567-890-124-000',
      bankName:'Metrobank',bankAccount:'015678901234',shiftId:'sh-1',taxStatus:'S',
      allowances:[],
      emergencyContactName:'Linda Tan',emergencyContactPhone:'09310000015',createdAt:daysAgo(300),updatedAt:daysAgo(0) },
    { id:'emp-16',employeeNo:'EMP-0016',firstName:'Jasmine',lastName:'Wong',middleName:'Chua',fullName:'Jasmine Chua Wong',
      email:'jasmine.wong@acme.ph',phone:'09321111016',address:'444 South Super Hwy, Pasay',birthDate:'1998-12-03',gender:'female',civilStatus:'single',
      position:'Systems Analyst',department:'Information Technology',employmentType:'probationary',status:'active',
      hireDate:daysAgo(80),compensationType:'monthly',compensationRate:35000,basicSalary:35000,dailyRate:1590.91,payFrequency:'bi-monthly',pinCode:'1016',
      sssNo:'34-6789013-4',philhealthNo:'12-890123457-8',pagibigNo:'6789-0124-5678',tinNo:'678-901-235-000',
      bankName:'BDO',bankAccount:'016789012345',shiftId:'sh-4',taxStatus:'S',
      allowances:[],
      emergencyContactName:'Henry Wong',emergencyContactPhone:'09320000016',createdAt:daysAgo(80),updatedAt:daysAgo(0) },
    // ── Sales & Marketing (4) ────────────────────────────────────────────────
    { id:'emp-17',employeeNo:'EMP-0017',firstName:'Geraldine',lastName:'Ocampo',middleName:'Vega',fullName:'Geraldine Vega Ocampo',
      email:'geraldine.ocampo@acme.ph',phone:'09331111017',address:'555 Alabang-Zapote Rd, Las Pinas',birthDate:'1986-05-12',gender:'female',civilStatus:'married',
      position:'Sales Manager',department:'Sales & Marketing',employmentType:'regular',status:'active',
      hireDate:daysAgo(950),compensationType:'monthly',compensationRate:58000,basicSalary:58000,dailyRate:2636.36,payFrequency:'bi-monthly',pinCode:'1017',
      sssNo:'34-7890124-5',philhealthNo:'12-901234568-9',pagibigNo:'7890-1235-6789',tinNo:'789-012-346-000',
      bankName:'BPI',bankAccount:'017890123456',shiftId:'sh-1',taxStatus:'ME',
      allowances:[{type:'Transportation',amount:3000,taxable:false},{type:'Representation',amount:2000,taxable:true}],
      emergencyContactName:'Armando Ocampo',emergencyContactPhone:'09330000017',createdAt:daysAgo(950),updatedAt:daysAgo(0) },
    { id:'emp-18',employeeNo:'EMP-0018',firstName:'Ferdinand',lastName:'Cruz',middleName:'Santos',fullName:'Ferdinand Santos Cruz',
      email:'ferdinand.cruz@acme.ph',phone:'09341111018',address:'666 Roxas Blvd, Manila',birthDate:'1992-10-30',gender:'male',civilStatus:'single',
      position:'Sales Executive',department:'Sales & Marketing',employmentType:'regular',status:'active',
      hireDate:daysAgo(420),compensationType:'monthly',compensationRate:28000,basicSalary:28000,dailyRate:1272.73,payFrequency:'bi-monthly',pinCode:'1018',
      sssNo:'34-8901235-6',philhealthNo:'12-012345679-0',pagibigNo:'8901-2346-7890',tinNo:'890-123-457-000',
      bankName:'UnionBank',bankAccount:'018901234567',shiftId:'sh-1',taxStatus:'S1',
      allowances:[{type:'Transportation',amount:1500,taxable:false}],
      emergencyContactName:'Luisa Cruz',emergencyContactPhone:'09340000018',createdAt:daysAgo(420),updatedAt:daysAgo(0) },
    { id:'emp-19',employeeNo:'EMP-0019',firstName:'Rowena',lastName:'Garcia',middleName:'Diaz',fullName:'Rowena Diaz Garcia',
      email:'rowena.garcia@acme.ph',phone:'09351111019',address:'777 Quirino Ave, Paco, Manila',birthDate:'1994-02-17',gender:'female',civilStatus:'single',
      position:'Marketing Officer',department:'Sales & Marketing',employmentType:'regular',status:'active',
      hireDate:daysAgo(380),compensationType:'monthly',compensationRate:30000,basicSalary:30000,dailyRate:1363.64,payFrequency:'bi-monthly',pinCode:'1019',
      sssNo:'34-9012346-7',philhealthNo:'12-123456780-1',pagibigNo:'9012-3457-8901',tinNo:'901-234-568-000',
      bankName:'Metrobank',bankAccount:'019012345678',shiftId:'sh-4',taxStatus:'S',
      allowances:[{type:'Internet',amount:800,taxable:false}],
      emergencyContactName:'Homer Garcia',emergencyContactPhone:'09350000019',createdAt:daysAgo(380),updatedAt:daysAgo(0) },
    { id:'emp-20',employeeNo:'EMP-0020',firstName:'Virgilio',lastName:'Flores',middleName:'Reyes',fullName:'Virgilio Reyes Flores',
      email:'virgilio.flores@acme.ph',phone:'09361111020',address:'888 Nagtahan St, Sta. Mesa, Manila',birthDate:'1998-08-22',gender:'male',civilStatus:'single',
      position:'Brand Associate',department:'Sales & Marketing',employmentType:'contractual',status:'active',
      hireDate:daysAgo(60),compensationType:'daily',compensationRate:727.27,basicSalary:16000,dailyRate:727.27,payFrequency:'weekly',pinCode:'1020',
      sssNo:'34-0123457-8',philhealthNo:'12-234567891-2',pagibigNo:'0123-4568-9012',tinNo:'012-345-679-000',
      bankName:'BDO',bankAccount:'020123456789',shiftId:'sh-1',taxStatus:'S',
      allowances:[],
      emergencyContactName:'Nora Flores',emergencyContactPhone:'09360000020',createdAt:daysAgo(60),updatedAt:daysAgo(0) },
  ]

  // ── Philippines 2026 holidays ─────────────────────────────────────────────
  const holidays: Holiday[] = [
    { id:'hol-01', name:"New Year's Day",              date:'2026-01-01', type:'regular',             isNationwide:true },
    { id:'hol-02', name:'Chinese New Year',            date:'2026-01-17', type:'special-non-working', isNationwide:true },
    { id:'hol-03', name:'EDSA People Power Revolution',date:'2026-02-25', type:'special-non-working', isNationwide:true },
    { id:'hol-04', name:'Maundy Thursday',             date:'2026-04-02', type:'regular',             isNationwide:true },
    { id:'hol-05', name:'Good Friday',                 date:'2026-04-03', type:'regular',             isNationwide:true },
    { id:'hol-06', name:'Araw ng Kagitingan',          date:'2026-04-09', type:'regular',             isNationwide:true },
    { id:'hol-07', name:'Labor Day',                   date:'2026-05-01', type:'regular',             isNationwide:true },
    { id:'hol-08', name:'Independence Day',            date:'2026-06-12', type:'regular',             isNationwide:true },
    { id:'hol-09', name:'Ninoy Aquino Day',            date:'2026-08-21', type:'special-non-working', isNationwide:true },
    { id:'hol-10', name:"National Heroes' Day",        date:'2026-08-31', type:'regular',             isNationwide:true },
    { id:'hol-11', name:'All Saints Day',              date:'2026-11-01', type:'special-non-working', isNationwide:true },
    { id:'hol-12', name:'All Souls Day',               date:'2026-11-02', type:'special-non-working', isNationwide:true },
    { id:'hol-13', name:'Bonifacio Day',               date:'2026-11-30', type:'regular',             isNationwide:true },
    { id:'hol-14', name:'Immaculate Conception',       date:'2026-12-08', type:'special-non-working', isNationwide:true },
    { id:'hol-15', name:'Christmas Day',               date:'2026-12-25', type:'regular',             isNationwide:true },
    { id:'hol-16', name:'Rizal Day',                   date:'2026-12-30', type:'regular',             isNationwide:true },
    { id:'hol-17', name:"New Year's Eve",              date:'2026-12-31', type:'special-non-working', isNationwide:true },
  ]

  // ── Attendance — 90 days × 20 employees ───────────────────────────────────
  const attendance: AttendanceRecord[] = []
  const today = new Date()

  for (let dayOff = 89; dayOff >= 0; dayOff--) {
    const d = new Date(today)
    d.setDate(d.getDate() - dayOff)
    const dow = d.getDay()
    const dateStr = ds(d)

    for (const emp of employees) {
      const shift = shifts.find(s => s.id === emp.shiftId)!
      if (shift.restDays.includes(dow)) {
        attendance.push({ id:uuid(), employeeId:emp.id, employeeName:emp.fullName, employeeNo:emp.employeeNo,
          date:dateStr, status:'rest-day', minutesLate:0, overtimeMinutes:0, nightDiffMinutes:0, source:'kiosk' })
        continue
      }
      const seed = (dayOff * 23 + employees.indexOf(emp) * 7) % 100
      let status: AttendanceRecord['status'] = 'present'
      let minutesLate = 0
      let overtimeMinutes = 0
      const nightDiffMinutes = emp.shiftId === 'sh-3' ? 180 : 0

      if (seed < 6)       { status = 'absent' }
      else if (seed < 14) { status = 'late'; minutesLate = 10 + (seed % 40) }
      else if (seed < 18) { status = 'half-day' }
      else if (seed < 21 && dayOff < 10) { status = 'on-leave' }

      if (status === 'present' && seed > 80) overtimeMinutes = 60 + (seed % 120)

      if (status !== 'absent' && status !== 'on-leave') {
        const [ih, im] = shift.timeIn.split(':').map(Number)
        const timeInD = new Date(d)
        timeInD.setHours(ih, im + (status === 'late' ? minutesLate : 0), 0, 0)
        const [oh, om] = shift.timeOut.split(':').map(Number)
        const timeOutD = new Date(d)
        timeOutD.setHours(oh, om + (status === 'present' ? Math.round(overtimeMinutes) : 0), 0, 0)

        attendance.push({ id:uuid(), employeeId:emp.id, employeeName:emp.fullName, employeeNo:emp.employeeNo,
          date:dateStr, status,
          timeIn:  timeInD.toISOString(),
          timeOut: status !== 'half-day' ? timeOutD.toISOString() : undefined,
          minutesLate, overtimeMinutes, nightDiffMinutes, source:'kiosk' })
      } else {
        attendance.push({ id:uuid(), employeeId:emp.id, employeeName:emp.fullName, employeeNo:emp.employeeNo,
          date:dateStr, status, minutesLate:0, overtimeMinutes:0, nightDiffMinutes:0, source:'kiosk' })
      }
    }
  }

  // ── Leave balances ────────────────────────────────────────────────────────
  const leaveBalances: LeaveBalance[] = employees.map(emp => {
    const vu = Math.floor(Math.random() * 6)
    const su = Math.floor(Math.random() * 4)
    return { id:uuid(), employeeId:emp.id, year:2026,
      vacation:  { entitled:15, used:vu, balance:15-vu },
      sick:      { entitled:15, used:su, balance:15-su },
      emergency: { entitled:5,  used:0,  balance:5 } }
  })

  // ── Leave requests ────────────────────────────────────────────────────────
  const leaveRequests: LeaveRequest[] = [
    { id:'lv-01', employeeId:'emp-02', employeeName:'Lourdes Bautista Reyes',    leaveType:'vacation', startDate:dateAgo(45), endDate:dateAgo(43), days:3, reason:'Family vacation in Batangas', status:'approved', reviewedBy:'Maria Cruz Santos', reviewedAt:daysAgo(47), createdAt:daysAgo(50) },
    { id:'lv-02', employeeId:'emp-05', employeeName:'Ana Lopez Mendoza',          leaveType:'sick',     startDate:dateAgo(30), endDate:dateAgo(29), days:2, reason:'Fever and flu symptoms', status:'approved', reviewedBy:'Maria Cruz Santos', reviewedAt:daysAgo(31), createdAt:daysAgo(32) },
    { id:'lv-03', employeeId:'emp-09', employeeName:'Maricel Bautista Castro',    leaveType:'emergency',startDate:dateAgo(20), endDate:dateAgo(20), days:1, reason:'Medical emergency for parent', status:'approved', reviewedBy:'Maria Cruz Santos', reviewedAt:daysAgo(21), createdAt:daysAgo(22) },
    { id:'lv-04', employeeId:'emp-14', employeeName:'Stephanie Go Chan',          leaveType:'vacation', startDate:dateAgo(15), endDate:dateAgo(11), days:5, reason:'Out of town trip', status:'approved', reviewedBy:'Maria Cruz Santos', reviewedAt:daysAgo(17), createdAt:daysAgo(18) },
    { id:'lv-05', employeeId:'emp-18', employeeName:'Ferdinand Santos Cruz',      leaveType:'sick',     startDate:dateAgo(8),  endDate:dateAgo(7),  days:2, reason:'Dental procedure', status:'approved', reviewedBy:'Maria Cruz Santos', reviewedAt:daysAgo(9), createdAt:daysAgo(10) },
    { id:'lv-06', employeeId:'emp-10', employeeName:'Renato Cruz Navarro',        leaveType:'vacation', startDate:dateAgo(3),  endDate:dateAgo(2),  days:2, reason:'Personal affairs', status:'pending', createdAt:daysAgo(4) },
    { id:'lv-07', employeeId:'emp-15', employeeName:'Mark Sy Tan',                leaveType:'sick',     startDate:dateAgo(1),  endDate:dateAgo(1),  days:1, reason:'Not feeling well', status:'pending', createdAt:daysAgo(2) },
    { id:'lv-08', employeeId:'emp-19', employeeName:'Rowena Diaz Garcia',         leaveType:'vacation', startDate:dateAgo(2),  endDate:dateAgo(1),  days:2, reason:'Anniversary leave', status:'pending', createdAt:daysAgo(3) },
    { id:'lv-09', employeeId:'emp-03', employeeName:'Roberto Garbo Dela Cruz',    leaveType:'sick',     startDate:dateAgo(60), endDate:dateAgo(59), days:2, reason:'Flu', status:'approved', reviewedBy:'Maria Cruz Santos', reviewedAt:daysAgo(61), createdAt:daysAgo(62) },
    { id:'lv-10', employeeId:'emp-17', employeeName:'Geraldine Vega Ocampo',      leaveType:'vacation', startDate:dateAgo(70), endDate:dateAgo(66), days:5, reason:'Summer vacation with family', status:'approved', reviewedBy:'Admin User', reviewedAt:daysAgo(72), createdAt:daysAgo(73) },
  ]

  // ── Overtime requests ──────────────────────────────────────────────────────
  const overtimeRequests: OvertimeRequest[] = [
    { id:'ot-01', employeeId:'emp-04', employeeName:'Juan Reyes Villanueva',      employeeNo:'EMP-0004', department:'Finance',              date:dateAgo(5),  hoursRequested:3, reason:'Month-end closing reports', status:'approved', reviewedBy:'Admin User', reviewedAt:daysAgo(6), createdAt:daysAgo(7) },
    { id:'ot-02', employeeId:'emp-05', employeeName:'Ana Lopez Mendoza',           employeeNo:'EMP-0005', department:'Finance',              date:dateAgo(5),  hoursRequested:2, reason:'Payroll processing cutoff', status:'approved', reviewedBy:'Admin User', reviewedAt:daysAgo(6), createdAt:daysAgo(7) },
    { id:'ot-03', employeeId:'emp-08', employeeName:'Eduardo Garcia Torres',       employeeNo:'EMP-0008', department:'Operations',           date:dateAgo(8),  hoursRequested:4, reason:'Inventory count', status:'approved', reviewedBy:'Admin User', reviewedAt:daysAgo(9), createdAt:daysAgo(10) },
    { id:'ot-04', employeeId:'emp-13', employeeName:'Kevin Uy Lim',               employeeNo:'EMP-0013', department:'Information Technology',date:dateAgo(3),  hoursRequested:3, reason:'System maintenance downtime window', status:'approved', reviewedBy:'Admin User', reviewedAt:daysAgo(4), createdAt:daysAgo(5) },
    { id:'ot-05', employeeId:'emp-14', employeeName:'Stephanie Go Chan',           employeeNo:'EMP-0014', department:'Information Technology',date:dateAgo(3),  hoursRequested:2, reason:'Emergency bug fix deployment', status:'approved', reviewedBy:'Admin User', reviewedAt:daysAgo(4), createdAt:daysAgo(5) },
    { id:'ot-06', employeeId:'emp-17', employeeName:'Geraldine Vega Ocampo',      employeeNo:'EMP-0017', department:'Sales & Marketing',    date:dateAgo(10), hoursRequested:2, reason:'Product launch preparation', status:'approved', reviewedBy:'Admin User', reviewedAt:daysAgo(11), createdAt:daysAgo(12) },
    { id:'ot-07', employeeId:'emp-09', employeeName:'Maricel Bautista Castro',     employeeNo:'EMP-0009', department:'Operations',           date:dateAgo(1),  hoursRequested:2, reason:'Urgent order fulfillment', status:'pending', createdAt:daysAgo(1) },
    { id:'ot-08', employeeId:'emp-06', employeeName:'Carlos Santos Aquino',        employeeNo:'EMP-0006', department:'Finance',              date:dateAgo(1),  hoursRequested:1, reason:'Audit document preparation', status:'pending', createdAt:daysAgo(1) },
    { id:'ot-09', employeeId:'emp-18', employeeName:'Ferdinand Santos Cruz',       employeeNo:'EMP-0018', department:'Sales & Marketing',    date:dateAgo(0),  hoursRequested:2, reason:'Client meeting follow-up', status:'pending', createdAt:daysAgo(0) },
  ]

  // ── System users ──────────────────────────────────────────────────────────
  const users: HRUser[] = [
    { id:'usr-1', name:'Admin User',         email:'admin@acme.ph',              role:'super-admin',     avatarInitials:'AU' },
    { id:'usr-2', name:'Maria Cruz Santos',  email:'maria.santos@acme.ph',       role:'hr-admin',        employeeId:'emp-01', department:'Human Resources', avatarInitials:'MS' },
    { id:'usr-3', name:'Ana Lopez Mendoza',  email:'ana.mendoza@acme.ph',        role:'payroll-officer', employeeId:'emp-05', department:'Finance',         avatarInitials:'AM' },
    { id:'usr-4', name:'Eduardo Garcia Torres', email:'eduardo.torres@acme.ph',  role:'dept-head',       employeeId:'emp-08', department:'Operations',      avatarInitials:'ET' },
  ]

  // ── Company settings ──────────────────────────────────────────────────────
  const company: CompanySettings = {
    name: 'ACME Corporation Philippines', tagline: 'ACME Corporation Philippines Inc.',
    address: '10F Skyrise Tower, BGC, Taguig City, Metro Manila',
    contact: '(02) 8123-4567', email: 'hr@acme.ph', tin: '123-456-789-000', payPeriod: 'bi-monthly',
  }

  // ── Seed audit logs ───────────────────────────────────────────────────────
  const auditLogs: AuditLog[] = [
    { id:'al-01', timestamp:daysAgo(5),  userId:'usr-1', userName:'Admin User',        action:'login',    module:'Auth',     description:'Admin logged in' },
    { id:'al-02', timestamp:daysAgo(5),  userId:'usr-2', userName:'Maria Cruz Santos', action:'approve',  module:'Leaves',   description:'Approved leave request LV-05 for Ferdinand Santos Cruz' },
    { id:'al-03', timestamp:daysAgo(4),  userId:'usr-3', userName:'Ana Lopez Mendoza', action:'generate', module:'Payroll',  description:'Generated payroll period PAY-0101' },
    { id:'al-04', timestamp:daysAgo(3),  userId:'usr-2', userName:'Maria Cruz Santos', action:'create',   module:'Employee', description:'Created employee record for Jasmine Chua Wong (EMP-0016)' },
    { id:'al-05', timestamp:daysAgo(2),  userId:'usr-1', userName:'Admin User',        action:'approve',  module:'Payroll',  description:'Approved payroll period PAY-0101' },
    { id:'al-06', timestamp:daysAgo(1),  userId:'usr-2', userName:'Maria Cruz Santos', action:'update',   module:'Employee', description:'Updated salary for Kevin Uy Lim (EMP-0013)' },
    { id:'al-07', timestamp:daysAgo(0),  userId:'usr-3', userName:'Ana Lopez Mendoza', action:'login',    module:'Auth',     description:'Payroll officer logged in' },
  ]

  lsSet(K.departments,     departments)
  lsSet(K.positions,       positions)
  lsSet(K.shifts,          shifts)
  lsSet(K.employees,       employees)
  lsSet(K.holidays,        holidays)
  lsSet(K.attendance,      attendance)
  lsSet(K.leaveBalances,   leaveBalances)
  lsSet(K.leaves,          leaveRequests)
  lsSet(K.overtime,        overtimeRequests)
  lsSet(K.users,           users)
  lsSet(K.auditLogs,       auditLogs)
  lsSet(K.company,         company)
  lsSet(K.deductionSettings, DEFAULT_DEDUCTION_SETTINGS)
  lsSet(K.payrollPeriods,  [])
  lsSet(K.payrollEntries,  [])
  localStorage.setItem(K.seeded, '1')
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
const DEMO_PW: Record<string, string> = {
  'admin@acme.ph':             'admin123',
  'maria.santos@acme.ph':      'hr123',
  'ana.mendoza@acme.ph':       'payroll123',
  'eduardo.torres@acme.ph':    'dept123',
}

export async function apiLogin(email: string, password: string): Promise<HRUser> {
  await delay()
  const users = ls<HRUser>(K.users)
  const user = users.find(u => u.email === email)
  if (!user || DEMO_PW[email] !== password) throw new Error('Invalid email or password')
  lsSet(K.currentUser, user)
  localStorage.setItem('tp_token', 'demo-token')
  pushAudit({ userId: user.id, userName: user.name, action: 'login', module: 'Auth', description: `${user.name} logged in` })
  return user
}
export function apiLogout(user?: HRUser | null) {
  if (user) pushAudit({ userId: user.id, userName: user.name, action: 'logout', module: 'Auth', description: `${user.name} logged out` })
  localStorage.removeItem(K.currentUser)
  localStorage.removeItem('tp_token')
}
export function getToken()       { return localStorage.getItem('tp_token') }
export function getCurrentUser() { return lsGet<HRUser>(K.currentUser) }

// ─── Employees ────────────────────────────────────────────────────────────────
export async function apiGetEmployees(p?: { search?: string; department?: string; status?: string }): Promise<Employee[]> {
  await delay()
  let list = ls<Employee>(K.employees)
  if (p?.search) { const q = p.search.toLowerCase(); list = list.filter(e => e.fullName.toLowerCase().includes(q) || e.employeeNo.toLowerCase().includes(q) || e.position.toLowerCase().includes(q)) }
  if (p?.department && p.department !== 'all') list = list.filter(e => e.department === p.department)
  if (p?.status && p.status !== 'all') list = list.filter(e => e.status === p.status)
  return list
}
export async function apiGetEmployee(id: string): Promise<Employee | null> { await delay(); return ls<Employee>(K.employees).find(e => e.id === id) ?? null }

export async function apiCreateEmployee(data: Omit<Employee,'id'|'createdAt'|'updatedAt'>): Promise<Employee> {
  await delay()
  const emps = ls<Employee>(K.employees)
  const emp: Employee = { ...data, id: uuid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  emps.push(emp); lsSet(K.employees, emps)
  const lbs = ls<LeaveBalance>(K.leaveBalances)
  lbs.push({ id:uuid(), employeeId:emp.id, year:new Date().getFullYear(), vacation:{entitled:15,used:0,balance:15}, sick:{entitled:15,used:0,balance:15}, emergency:{entitled:5,used:0,balance:5} })
  lsSet(K.leaveBalances, lbs)
  pushAudit({ userId:'sys', userName:'System', action:'create', module:'Employee', description:`Created employee ${emp.fullName} (${emp.employeeNo})` })
  return emp
}
export async function apiUpdateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
  await delay()
  const emps = ls<Employee>(K.employees)
  const idx = emps.findIndex(e => e.id === id)
  if (idx === -1) throw new Error('Employee not found')
  const before = JSON.stringify(emps[idx])
  emps[idx] = { ...emps[idx], ...data, updatedAt: new Date().toISOString() }
  lsSet(K.employees, emps)
  pushAudit({ userId:'sys', userName:'System', action:'update', module:'Employee', description:`Updated ${emps[idx].fullName}`, before, after: JSON.stringify(emps[idx]) })
  return emps[idx]
}
export async function apiDeleteEmployee(id: string): Promise<void> { await delay(); lsSet(K.employees, ls<Employee>(K.employees).filter(e => e.id !== id)) }
export function getDepartments(): string[] { 
  const depts = ls<Department>(K.departments)
  if (depts.length > 0) return depts.map(d => d.name).sort()
  return [...new Set(ls<Employee>(K.employees).map(e => e.department))].sort()
}

// ─── Departments ─────────────────────────────────────────────────────────────
export async function apiGetDepartments(): Promise<Department[]> { await delay(); return ls<Department>(K.departments).sort((a,b) => a.name.localeCompare(b.name)) }
export async function apiCreateDepartment(data: Omit<Department,'id'|'createdAt'>): Promise<Department> {
  await delay()
  const dept: Department = { ...data, id: uuid(), createdAt: new Date().toISOString() }
  const l = ls<Department>(K.departments); l.push(dept); lsSet(K.departments, l)
  pushAudit({ userId:'sys', userName:'System', action:'create', module:'Settings', description:`Created department: ${dept.name}` })
  return dept
}
export async function apiUpdateDepartment(id: string, data: Partial<Department>): Promise<Department> {
  await delay()
  const l = ls<Department>(K.departments); const i = l.findIndex(d => d.id === id)
  if (i === -1) throw new Error('Department not found')
  l[i] = { ...l[i], ...data }; lsSet(K.departments, l)
  pushAudit({ userId:'sys', userName:'System', action:'update', module:'Settings', description:`Updated department: ${l[i].name}` })
  return l[i]
}
export async function apiDeleteDepartment(id: string): Promise<void> {
  await delay()
  const dept = ls<Department>(K.departments).find(d => d.id === id)
  lsSet(K.departments, ls<Department>(K.departments).filter(d => d.id !== id))
  if (dept) pushAudit({ userId:'sys', userName:'System', action:'delete', module:'Settings', description:`Deleted department: ${dept.name}` })
}

// ─── Positions ────────────────────────────────────────────────────────────────
export async function apiGetPositions(): Promise<Position[]> { await delay(); return ls<Position>(K.positions).sort((a,b) => a.title.localeCompare(b.title)) }
export async function apiCreatePosition(data: Omit<Position,'id'|'createdAt'>): Promise<Position> {
  await delay()
  const pos: Position = { ...data, id: uuid(), createdAt: new Date().toISOString() }
  const l = ls<Position>(K.positions); l.push(pos); lsSet(K.positions, l)
  pushAudit({ userId:'sys', userName:'System', action:'create', module:'Settings', description:`Created position: ${pos.title}` })
  return pos
}
export async function apiUpdatePosition(id: string, data: Partial<Position>): Promise<Position> {
  await delay()
  const l = ls<Position>(K.positions); const i = l.findIndex(p => p.id === id)
  if (i === -1) throw new Error('Position not found')
  l[i] = { ...l[i], ...data }; lsSet(K.positions, l)
  pushAudit({ userId:'sys', userName:'System', action:'update', module:'Settings', description:`Updated position: ${l[i].title}` })
  return l[i]
}
export async function apiDeletePosition(id: string): Promise<void> {
  await delay()
  const pos = ls<Position>(K.positions).find(p => p.id === id)
  lsSet(K.positions, ls<Position>(K.positions).filter(p => p.id !== id))
  if (pos) pushAudit({ userId:'sys', userName:'System', action:'delete', module:'Settings', description:`Deleted position: ${pos.title}` })
}

// ─── Deduction Settings ───────────────────────────────────────────────────────
export function getDeductionSettings(): PayrollDeductionSettings {
  return lsGet<PayrollDeductionSettings>(K.deductionSettings) ?? DEFAULT_DEDUCTION_SETTINGS
}
export function saveDeductionSettings(s: PayrollDeductionSettings): void { lsSet(K.deductionSettings, s) }

// ─── Shifts ───────────────────────────────────────────────────────────────────
export async function apiGetShifts(): Promise<WorkShift[]> { await delay(); return ls<WorkShift>(K.shifts) }
export async function apiCreateShift(data: Omit<WorkShift,'id'>): Promise<WorkShift> { await delay(); const s: WorkShift = { ...data, id:uuid() }; const l = ls<WorkShift>(K.shifts); l.push(s); lsSet(K.shifts,l); return s }
export async function apiUpdateShift(id: string, data: Partial<WorkShift>): Promise<WorkShift> { await delay(); const l = ls<WorkShift>(K.shifts); const i = l.findIndex(s=>s.id===id); if(i===-1) throw new Error('Not found'); l[i]={...l[i],...data}; lsSet(K.shifts,l); return l[i] }
export async function apiDeleteShift(id: string): Promise<void> { await delay(); lsSet(K.shifts, ls<WorkShift>(K.shifts).filter(s=>s.id!==id)) }

// ─── Attendance ───────────────────────────────────────────────────────────────
export async function apiGetAttendance(p?: { employeeId?:string; date?:string; startDate?:string; endDate?:string; status?:string }): Promise<AttendanceRecord[]> {
  await delay()
  const empMap = new Map(ls<Employee>(K.employees).map(e => [e.id, e]))
  let list = ls<AttendanceRecord>(K.attendance)
  if (p?.employeeId) list = list.filter(a => a.employeeId === p.employeeId)
  if (p?.date)       list = list.filter(a => a.date === p.date)
  if (p?.startDate)  list = list.filter(a => a.date >= p.startDate!)
  if (p?.endDate)    list = list.filter(a => a.date <= p.endDate!)
  if (p?.status && p.status !== 'all') list = list.filter(a => a.status === p.status)
  return list
    .sort((a,b) => b.date.localeCompare(a.date) || (a.employeeName ?? '').localeCompare(b.employeeName ?? ''))
    .map(a => ({ ...a, department: empMap.get(a.employeeId)?.department ?? a.department }))
}
export async function apiGetTodayAttendance(): Promise<AttendanceRecord[]> { await delay(); return ls<AttendanceRecord>(K.attendance).filter(a => a.date === ds(new Date())) }
export async function apiUpsertAttendance(r: Omit<AttendanceRecord,'id'>): Promise<AttendanceRecord> {
  await delay()
  const list = ls<AttendanceRecord>(K.attendance)
  const idx = list.findIndex(a => a.employeeId === r.employeeId && a.date === r.date)
  if (idx >= 0) { list[idx] = { ...list[idx], ...r }; lsSet(K.attendance, list); return list[idx] }
  const rec: AttendanceRecord = { ...r, id: uuid() }
  list.push(rec); lsSet(K.attendance, list); return rec
}
export async function apiCorrectAttendance(id: string, data: Partial<AttendanceRecord>, by: string, reason: string): Promise<AttendanceRecord> {
  await delay()
  const list = ls<AttendanceRecord>(K.attendance)
  const idx = list.findIndex(a => a.id === id)
  if (idx === -1) throw new Error('Not found')
  list[idx] = { ...list[idx], ...data, source:'manual', correctedBy:by, correctionReason:reason }
  lsSet(K.attendance, list)
  pushAudit({ userId:'sys', userName:by, action:'update', module:'Attendance', description:`Corrected attendance for ${list[idx].employeeName} on ${list[idx].date}: ${reason}` })
  return list[idx]
}

// ─── Kiosk PIN ────────────────────────────────────────────────────────────────
export async function apiKioskPIN(pin: string): Promise<{ type:'time-in'|'time-out'; employee: Employee; message: string }> {
  await delay()
  const employees = ls<Employee>(K.employees)
  const employee = employees.find(e => e.pinCode === pin && e.status === 'active')
  if (!employee) throw new Error('Unknown PIN. Please contact HR.')

  const today = ds(new Date())
  const now = new Date().toISOString()
  const todayRec = ls<AttendanceRecord>(K.attendance).find(a => a.employeeId === employee.id && a.date === today)
  const type: 'time-in'|'time-out' = (todayRec?.timeIn && !todayRec.timeOut) ? 'time-out' : 'time-in'
  const shift = ls<WorkShift>(K.shifts).find(s => s.id === employee.shiftId)

  if (type === 'time-in') {
    let minutesLate = 0; let status: AttendanceRecord['status'] = 'present'
    if (shift) {
      const [ih, im] = shift.timeIn.split(':').map(Number)
      const expected = new Date(); expected.setHours(ih, im + shift.graceMinutes, 0, 0)
      if (new Date() > expected) { minutesLate = Math.round((Date.now() - expected.getTime()) / 60000); status = 'late' }
    }
    await apiUpsertAttendance({ employeeId:employee.id, employeeName:employee.fullName, employeeNo:employee.employeeNo, date:today, timeIn:now, status, minutesLate, overtimeMinutes:0, nightDiffMinutes:0, source:'kiosk' })
  } else {
    const list = ls<AttendanceRecord>(K.attendance)
    const idx = list.findIndex(a => a.employeeId === employee.id && a.date === today)
    if (idx >= 0) {
      let overtimeMinutes = 0
      if (shift) { const [oh,om] = shift.timeOut.split(':').map(Number); const exp = new Date(); exp.setHours(oh,om,0,0); if (new Date() > exp) overtimeMinutes = Math.round((Date.now() - exp.getTime())/60000) }
      list[idx] = { ...list[idx], timeOut:now, overtimeMinutes }; lsSet(K.attendance, list)
    }
  }
  return { type, employee, message:`${employee.fullName} — ${type === 'time-in' ? 'Time In' : 'Time Out'} recorded` }
}

// ─── Kiosk RFID ───────────────────────────────────────────────────────────────
export async function apiKioskRFID(code: string): Promise<{ type:'time-in'|'time-out'; employee: Employee; message: string }> {
  await delay()
  const employees = ls<Employee>(K.employees)
  const employee = employees.find(e => e.rfidTag === code && e.status === 'active')
  if (!employee) throw new Error('Card not recognized. Please contact HR.')

  const today = ds(new Date())
  const now = new Date().toISOString()
  const todayRec = ls<AttendanceRecord>(K.attendance).find(a => a.employeeId === employee.id && a.date === today)
  const type: 'time-in'|'time-out' = (todayRec?.timeIn && !todayRec.timeOut) ? 'time-out' : 'time-in'
  const shift = ls<WorkShift>(K.shifts).find(s => s.id === employee.shiftId)

  if (type === 'time-in') {
    let minutesLate = 0; let status: AttendanceRecord['status'] = 'present'
    if (shift) {
      const [ih, im] = shift.timeIn.split(':').map(Number)
      const expected = new Date(); expected.setHours(ih, im + shift.graceMinutes, 0, 0)
      if (new Date() > expected) { minutesLate = Math.round((Date.now() - expected.getTime()) / 60000); status = 'late' }
    }
    await apiUpsertAttendance({ employeeId:employee.id, employeeName:employee.fullName, employeeNo:employee.employeeNo, date:today, timeIn:now, status, minutesLate, overtimeMinutes:0, nightDiffMinutes:0, source:'kiosk' })
  } else {
    const list = ls<AttendanceRecord>(K.attendance)
    const idx = list.findIndex(a => a.employeeId === employee.id && a.date === today)
    if (idx >= 0) {
      let overtimeMinutes = 0
      if (shift) { const [oh,om] = shift.timeOut.split(':').map(Number); const exp = new Date(); exp.setHours(oh,om,0,0); if (new Date() > exp) overtimeMinutes = Math.round((Date.now() - exp.getTime())/60000) }
      list[idx] = { ...list[idx], timeOut:now, overtimeMinutes }; lsSet(K.attendance, list)
    }
  }
  return { type, employee, message:`${employee.fullName} — ${type === 'time-in' ? 'Time In' : 'Time Out'} recorded` }
}

export async function apiGetTodayHoliday(): Promise<Holiday|null> { await delay(); return ls<Holiday>(K.holidays).find(h => h.date === ds(new Date())) ?? null }

// ─── Leaves ───────────────────────────────────────────────────────────────────
export async function apiGetLeaves(p?: { employeeId?:string; status?:string }): Promise<LeaveRequest[]> {
  await delay()
  let list = ls<LeaveRequest>(K.leaves)
  if (p?.employeeId) list = list.filter(l => l.employeeId === p.employeeId)
  if (p?.status && p.status !== 'all') list = list.filter(l => l.status === p.status)
  return list.sort((a,b) => b.createdAt.localeCompare(a.createdAt))
}
export async function apiCreateLeave(data: Omit<LeaveRequest,'id'|'createdAt'|'status'>): Promise<LeaveRequest> {
  await delay()
  const leave: LeaveRequest = { ...data, id:uuid(), status:'pending', createdAt:new Date().toISOString() }
  const l = ls<LeaveRequest>(K.leaves); l.push(leave); lsSet(K.leaves, l); return leave
}
export async function apiUpdateLeaveStatus(id: string, status: LeaveStatus, by?: string, reason?: string): Promise<LeaveRequest> {
  await delay()
  const list = ls<LeaveRequest>(K.leaves)
  const idx = list.findIndex(l => l.id === id)
  if (idx === -1) throw new Error('Not found')
  list[idx] = { ...list[idx], status, reviewedBy:by, reviewedAt:new Date().toISOString(), rejectionReason:reason }
  lsSet(K.leaves, list)
  pushAudit({ userId:'sys', userName:by??'System', action:status==='approved'?'approve':'reject', module:'Leaves', description:`${status==='approved'?'Approved':'Rejected'} leave for ${list[idx].employeeName}` })
  if (status === 'approved') {
    const lv = list[idx]
    const d = new Date(lv.startDate), end = new Date(lv.endDate)
    while (d <= end) {
      const dateStr = ds(d)
      const attn = ls<AttendanceRecord>(K.attendance)
      if (!attn.find(a => a.employeeId === lv.employeeId && a.date === dateStr)) {
        attn.push({ id:uuid(), employeeId:lv.employeeId, employeeName:lv.employeeName, employeeNo:'', date:dateStr, status:'on-leave', minutesLate:0, overtimeMinutes:0, nightDiffMinutes:0, source:'manual', note:`${lv.leaveType} leave` })
        lsSet(K.attendance, attn)
      }
      d.setDate(d.getDate() + 1)
    }
  }
  return list[idx]
}
export async function apiGetLeaveBalances(employeeId?: string): Promise<LeaveBalance[]> {
  await delay()
  const emps = ls<Employee>(K.employees)
  let list = ls<LeaveBalance>(K.leaveBalances)
  if (employeeId) list = list.filter(b => b.employeeId === employeeId)
  return list.map(b => {
    const emp = emps.find(e => e.id === b.employeeId)
    return { ...b, employeeName: emp?.fullName, employeeNo: emp?.employeeNo, department: emp?.department }
  })
}

// ─── Overtime ─────────────────────────────────────────────────────────────────
export async function apiGetOvertime(p?: { employeeId?:string; status?:string }): Promise<OvertimeRequest[]> {
  await delay()
  let list = ls<OvertimeRequest>(K.overtime)
  if (p?.employeeId) list = list.filter(o => o.employeeId === p.employeeId)
  if (p?.status && p.status !== 'all') list = list.filter(o => o.status === p.status)
  return list.sort((a,b) => b.createdAt.localeCompare(a.createdAt))
}
export async function apiCreateOvertime(data: Omit<OvertimeRequest,'id'|'createdAt'|'status'>): Promise<OvertimeRequest> {
  await delay()
  const ot: OvertimeRequest = { ...data, id:uuid(), status:'pending', createdAt:new Date().toISOString() }
  const l = ls<OvertimeRequest>(K.overtime); l.push(ot); lsSet(K.overtime, l); return ot
}
export async function apiUpdateOvertimeStatus(id: string, status: OTStatus, by?: string): Promise<OvertimeRequest> {
  await delay()
  const list = ls<OvertimeRequest>(K.overtime)
  const idx = list.findIndex(o => o.id === id)
  if (idx === -1) throw new Error('Not found')
  list[idx] = { ...list[idx], status, reviewedBy:by, reviewedAt:new Date().toISOString() }
  lsSet(K.overtime, list)
  pushAudit({ userId:'sys', userName:by??'System', action:status==='approved'?'approve':'reject', module:'Overtime', description:`${status==='approved'?'Approved':'Rejected'} OT for ${list[idx].employeeName} on ${list[idx].date}` })
  return list[idx]
}

// ─── Holidays ─────────────────────────────────────────────────────────────────
export async function apiGetHolidays(year?: number): Promise<Holiday[]> { await delay(); let l = ls<Holiday>(K.holidays); if(year) l=l.filter(h=>h.date.startsWith(String(year))); return l.sort((a,b)=>a.date.localeCompare(b.date)) }
export async function apiCreateHoliday(data: Omit<Holiday,'id'>): Promise<Holiday> { await delay(); const h: Holiday = {...data,id:uuid()}; const l=ls<Holiday>(K.holidays); l.push(h); lsSet(K.holidays,l); return h }
export async function apiUpdateHoliday(id:string, data:Partial<Holiday>): Promise<Holiday> { await delay(); const l=ls<Holiday>(K.holidays); const i=l.findIndex(h=>h.id===id); if(i===-1) throw new Error('Not found'); l[i]={...l[i],...data}; lsSet(K.holidays,l); return l[i] }
export async function apiDeleteHoliday(id:string): Promise<void> { await delay(); lsSet(K.holidays, ls<Holiday>(K.holidays).filter(h=>h.id!==id)) }

// ─── Payroll ──────────────────────────────────────────────────────────────────
export async function apiGetPayrollPeriods(): Promise<PayrollPeriod[]> { await delay(); return ls<PayrollPeriod>(K.payrollPeriods).sort((a,b)=>b.startDate.localeCompare(a.startDate)) }
export async function apiGetPayrollPeriod(id:string): Promise<PayrollPeriod|null> { await delay(); return ls<PayrollPeriod>(K.payrollPeriods).find(p=>p.id===id)??null }

export async function apiCreatePayrollPeriod(data: { startDate:string; endDate:string; payDate:string; frequency:PayFrequency }): Promise<{ period:PayrollPeriod; entries:PayrollEntry[] }> {
  await delay()
  const period: PayrollPeriod = { id:uuid(), periodNo:nextPeriodNo(), ...data, status:'draft', totalEmployees:0, totalGross:0, totalDeductions:0, totalNet:0, createdBy:getCurrentUser()?.name??'System', createdAt:new Date().toISOString() }
  const employees = ls<Employee>(K.employees).filter(e => e.status === 'active')
  const holidays  = ls<Holiday>(K.holidays)
  const deductionSettings = getDeductionSettings()
  const periodDays = countWorkingDays(data.startDate, data.endDate)
  const entries: PayrollEntry[] = []
  for (const emp of employees) {
    const attRecs = ls<AttendanceRecord>(K.attendance).filter(a => a.employeeId===emp.id && a.date>=data.startDate && a.date<=data.endDate && a.status!=='rest-day')
    const periodHols = holidays.filter(h => h.date>=data.startDate && h.date<=data.endDate)
    entries.push(computePayrollEntry({ employee:emp, attendanceRecords:attRecs, holidays:periodHols, periodDays, payrollPeriodId:period.id, deductionSettings }))
  }
  period.totalEmployees = entries.length
  period.totalGross     = Math.round(entries.reduce((s,e)=>s+e.grossPay,0)*100)/100
  period.totalDeductions= Math.round(entries.reduce((s,e)=>s+e.totalDeductions,0)*100)/100
  period.totalNet       = Math.round(entries.reduce((s,e)=>s+e.netPay,0)*100)/100
  const ps = ls<PayrollPeriod>(K.payrollPeriods); ps.push(period); lsSet(K.payrollPeriods, ps)
  const pe = ls<PayrollEntry>(K.payrollEntries); lsSet(K.payrollEntries, [...pe,...entries])
  pushAudit({ userId:'sys', userName:period.createdBy, action:'generate', module:'Payroll', description:`Generated payroll ${period.periodNo} (${data.startDate} – ${data.endDate})` })
  return { period, entries }
}
export async function apiUpdatePayrollStatus(id:string, status:PayrollStatus, by?:string): Promise<PayrollPeriod> {
  await delay()
  const ps = ls<PayrollPeriod>(K.payrollPeriods)
  const idx = ps.findIndex(p=>p.id===id); if(idx===-1) throw new Error('Not found')
  const now = new Date().toISOString()
  if(status==='reviewed') ps[idx]={...ps[idx],status,reviewedBy:by,reviewedAt:now}
  else if(status==='approved') ps[idx]={...ps[idx],status,approvedBy:by,approvedAt:now}
  else if(status==='paid') ps[idx]={...ps[idx],status,paidAt:now}
  else ps[idx]={...ps[idx],status}
  lsSet(K.payrollPeriods, ps)
  pushAudit({ userId:'sys', userName:by??'System', action:status==='approved'?'approve':status==='paid'?'approve':'update', module:'Payroll', description:`Payroll ${ps[idx].periodNo} status changed to ${status}` })
  return ps[idx]
}
export async function apiGetPayrollEntries(periodId:string): Promise<PayrollEntry[]> { await delay(); return ls<PayrollEntry>(K.payrollEntries).filter(e=>e.payrollPeriodId===periodId) }
export async function apiGetPayrollEntry(periodId:string, employeeId:string): Promise<PayrollEntry|null> { await delay(); return ls<PayrollEntry>(K.payrollEntries).find(e=>e.payrollPeriodId===periodId&&e.employeeId===employeeId)??null }

export async function apiMarkEntryPaid(periodId:string, employeeId:string, by?:string): Promise<PayrollEntry> {
  await delay()
  const entries = ls<PayrollEntry>(K.payrollEntries)
  const idx = entries.findIndex(e => e.payrollPeriodId===periodId && e.employeeId===employeeId)
  if (idx===-1) throw new Error('Payroll entry not found')
  const nowPaid = !entries[idx].markedPaid
  entries[idx] = {
    ...entries[idx],
    markedPaid:   nowPaid,
    markedPaidAt: nowPaid ? new Date().toISOString() : undefined,
    markedPaidBy: nowPaid ? (by ?? 'System') : undefined,
  }
  lsSet(K.payrollEntries, entries)
  pushAudit({ userId:'sys', userName:by??'System', action:'update', module:'Payroll',
    description:`${nowPaid?'Marked':'Unmarked'} payroll entry for ${entries[idx].employeeName} as paid` })
  return entries[idx]
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export async function apiPayrollSummaryByMonth(): Promise<{ month:string; gross:number; deductions:number; net:number }[]> {
  await delay()
  const periods = ls<PayrollPeriod>(K.payrollPeriods)
  const map: Record<string, { gross:number; deductions:number; net:number }> = {}
  for (const p of periods) {
    const m = p.startDate.slice(0,7)
    if (!map[m]) map[m] = { gross:0, deductions:0, net:0 }
    map[m].gross      += p.totalGross
    map[m].deductions += p.totalDeductions
    map[m].net        += p.totalNet
  }
  return Object.entries(map).sort(([a],[b])=>a.localeCompare(b)).map(([month,v])=>({month,...v}))
}

// ─── Audit ────────────────────────────────────────────────────────────────────
export async function apiGetAuditLogs(limit = 200): Promise<AuditLog[]> { await delay(); return ls<AuditLog>(K.auditLogs).slice(0, limit) }

// ─── Company ──────────────────────────────────────────────────────────────────
export function getCompanySettings(): CompanySettings { return lsGet<CompanySettings>(K.company) ?? { name:'Ten Foundation Philippines Inc.', tagline:'', address:'', contact:'', email:'', tin:'', payPeriod:'bi-monthly' } }
export function saveCompanySettings(s: CompanySettings): void { lsSet(K.company, s) }

// ─── types re-export ──────────────────────────────────────────────────────────
import type { PayFrequency, LeaveStatus, OTStatus, PayrollStatus } from '../types'

function delay() { return new Promise<void>(r => setTimeout(r, 40)) }

