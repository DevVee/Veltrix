// ─── Supabase facade — same public API surface as the old localStorage version ─
// Every page/component imports from here; swap the _db/* modules to change backends.

// ── No-op seed (data lives in Supabase now) ───────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function seedIfNeeded() {}

// ── Auth ──────────────────────────────────────────────────────────────────────
export { apiLogin, getCurrentUserAsync, getToken, getCurrentUser } from './_db/auth'
import { apiLogout as _apiLogout } from './_db/auth'

/**
 * Sign out. Accepts an optional user arg for backward-compat with callers that
 * pass the current user object — the argument is silently ignored.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apiLogout(_user?: any): Promise<void> { return _apiLogout() }

// ── Employees / Departments / Positions / Leave Balances ──────────────────────
export {
  apiGetEmployees,
  apiGetEmployee,
  apiCreateEmployee,
  apiUpdateEmployee,
  apiDeleteEmployee,
  // Async department name list (was sync in localStorage version)
  getDepartments,
  getDepartmentsSync,
  apiGetDepartments,
  apiCreateDepartment,
  apiUpdateDepartment,
  apiDeleteDepartment,
  apiGetPositions,
  apiCreatePosition,
  apiUpdatePosition,
  apiDeletePosition,
  apiGetLeaveBalances,
} from './_db/employees'

// ── Attendance ────────────────────────────────────────────────────────────────
export {
  apiGetAttendance,
  apiGetTodayAttendance,
  apiUpsertAttendance,
  apiCorrectAttendance,
  apiAddManualAttendance,
  apiGetTodayHoliday,
  apiKioskPIN,
  apiKioskRFID,
} from './_db/attendance'

// ── Payroll ───────────────────────────────────────────────────────────────────
export {
  apiGetPayrollPeriods,
  apiGetPayrollPeriod,
  apiCreatePayrollPeriod,
  apiUpdatePayrollStatus,
  apiGetPayrollEntries,
  apiGetPayrollEntry,
  apiMarkEntryPaid,
  apiPayrollSummaryByMonth,
} from './_db/payroll'

// ── Leaves ────────────────────────────────────────────────────────────────────
export {
  apiGetLeaves,
  apiCreateLeave,
  apiUpdateLeaveStatus,
} from './_db/leaves'

// ── Overtime ──────────────────────────────────────────────────────────────────
export {
  apiGetOvertime,
  apiCreateOvertime,
  apiUpdateOvertimeStatus,
} from './_db/overtime'

// ── Schedules (shifts + holidays) ────────────────────────────────────────────
export {
  apiGetShifts,
  apiCreateShift,
  apiUpdateShift,
  apiDeleteShift,
  apiGetHolidays,
  apiCreateHoliday,
  apiUpdateHoliday,
  apiDeleteHoliday,
} from './_db/schedules'

// ── Settings ──────────────────────────────────────────────────────────────────
export {
  // Sync accessors (return cached defaults immediately)
  getCompanySettings,
  saveCompanySettings,
  getDeductionSettings,
  saveDeductionSettings,
  // Async loaders (fetch from Supabase)
  loadCompanySettings,
  loadDeductionSettings,
  loadAllSettings,
  apiSaveCompanySettings,
  apiSaveDeductionSettings,
} from './_db/settings'

// ── Audit ─────────────────────────────────────────────────────────────────────
export { apiGetAuditLogs } from './_db/audit'
