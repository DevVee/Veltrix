import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { AppLayout } from './components/layout/AppLayout'

// Public pages
import { Landing } from './pages/landing/Landing'
import { Login }   from './pages/auth/Login'
import { Kiosk }   from './pages/kiosk/Kiosk'

// Dashboard
import { Dashboard } from './pages/dashboard/Dashboard'

// Employees
import { EmployeeList }    from './pages/employees/EmployeeList'
import { EmployeeProfile } from './pages/employees/EmployeeProfile'
import { EmployeeForm }    from './pages/employees/EmployeeForm'

// Attendance
import { AttendanceToday } from './pages/attendance/AttendanceToday'
import { AttendanceLog }   from './pages/attendance/AttendanceLog'

// Payroll
import { PayrollList }   from './pages/payroll/PayrollList'
import { PayrollDetail } from './pages/payroll/PayrollDetail'
import { Payslip }       from './pages/payroll/Payslip'

// Leaves & OT
import { LeaveList }    from './pages/leaves/LeaveList'
import { OvertimeList } from './pages/overtime/OvertimeList'

// Schedules
import { ShiftList }   from './pages/schedules/ShiftList'
import { HolidayList } from './pages/schedules/HolidayList'

// Reports / Settings / Audit
import { Reports }  from './pages/reports/Reports'
import { Settings } from './pages/settings/Settings'
import { AuditLog } from './pages/audit/AuditLog'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(s => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public ── */}
        <Route path="/"      element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/kiosk" element={<Kiosk />} />

        {/* ── Protected app — pathless layout route ── */}
        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Employees */}
          <Route path="/employees"          element={<EmployeeList />} />
          <Route path="/employees/new"      element={<EmployeeForm />} />
          <Route path="/employees/:id"      element={<EmployeeProfile />} />
          <Route path="/employees/:id/edit" element={<EmployeeForm />} />

          {/* Attendance */}
          <Route path="/attendance"     element={<AttendanceToday />} />
          <Route path="/attendance/log" element={<AttendanceLog />} />

          {/* Payroll */}
          <Route path="/payroll"                                element={<PayrollList />} />
          <Route path="/payroll/:id"                            element={<PayrollDetail />} />
          <Route path="/payroll/:periodId/payslip/:employeeId"  element={<Payslip />} />

          {/* Leaves & OT */}
          <Route path="/leaves"   element={<LeaveList />} />
          <Route path="/overtime" element={<OvertimeList />} />

          {/* Schedules */}
          <Route path="/schedules/shifts"   element={<ShiftList />} />
          <Route path="/schedules/holidays" element={<HolidayList />} />

          {/* Reports / Settings / Audit */}
          <Route path="/reports"   element={<Reports />} />
          <Route path="/settings"  element={<Settings />} />
          <Route path="/audit-log" element={<AuditLog />} />
        </Route>

        {/* Catch-all → landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
