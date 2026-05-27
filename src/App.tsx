import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import { AppLayout } from './components/layout/AppLayout'

// ─── Query client ─────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:  5 * 60 * 1000,   // 5 min
      gcTime:     10 * 60 * 1000,  // 10 min
      retry:      1,
      refetchOnWindowFocus: false,
    },
  },
})

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────
const Landing        = lazy(() => import('./pages/landing/Landing').then(m => ({ default: m.Landing })))
const Login          = lazy(() => import('./pages/auth/Login').then(m => ({ default: m.Login })))
const Kiosk          = lazy(() => import('./pages/kiosk/Kiosk').then(m => ({ default: m.Kiosk })))
const Dashboard      = lazy(() => import('./pages/dashboard/Dashboard').then(m => ({ default: m.Dashboard })))
const EmployeeList   = lazy(() => import('./pages/employees/EmployeeList').then(m => ({ default: m.EmployeeList })))
const EmployeeProfile= lazy(() => import('./pages/employees/EmployeeProfile').then(m => ({ default: m.EmployeeProfile })))
const EmployeeForm   = lazy(() => import('./pages/employees/EmployeeForm').then(m => ({ default: m.EmployeeForm })))
const AttendanceToday= lazy(() => import('./pages/attendance/AttendanceToday').then(m => ({ default: m.AttendanceToday })))
const AttendanceLog  = lazy(() => import('./pages/attendance/AttendanceLog').then(m => ({ default: m.AttendanceLog })))
const PayrollList    = lazy(() => import('./pages/payroll/PayrollList').then(m => ({ default: m.PayrollList })))
const PayrollDetail  = lazy(() => import('./pages/payroll/PayrollDetail').then(m => ({ default: m.PayrollDetail })))
const Payslip        = lazy(() => import('./pages/payroll/Payslip').then(m => ({ default: m.Payslip })))
const LeaveList      = lazy(() => import('./pages/leaves/LeaveList').then(m => ({ default: m.LeaveList })))
const OvertimeList   = lazy(() => import('./pages/overtime/OvertimeList').then(m => ({ default: m.OvertimeList })))
const ShiftList      = lazy(() => import('./pages/schedules/ShiftList').then(m => ({ default: m.ShiftList })))
const HolidayList    = lazy(() => import('./pages/schedules/HolidayList').then(m => ({ default: m.HolidayList })))
const Reports        = lazy(() => import('./pages/reports/Reports').then(m => ({ default: m.Reports })))
const Settings       = lazy(() => import('./pages/settings/Settings').then(m => ({ default: m.Settings })))
const AuditLog       = lazy(() => import('./pages/audit/AuditLog').then(m => ({ default: m.AuditLog })))
const NotFound       = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })))

// ─── Auth guard ───────────────────────────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(s => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="spinner" /></div>}>
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

            {/* Catch-all → 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
