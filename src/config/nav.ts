// ─── Navigation Configuration — config-driven, role-aware ─────────────────────
import type { UserRole } from '../types'

export type NavSection = 'OVERVIEW' | 'WORKFORCE' | 'PAYROLL' | 'SYSTEM'

export interface NavChild {
  label: string
  to: string
  end?: boolean
}

export interface NavItem {
  id: string
  label: string
  to: string
  icon: string              // lucide icon name
  roles: UserRole[]
  section: NavSection
  module: string            // matches ModuleConfig key
  children?: NavChild[]
  badge?: string            // optional count badge key
}

export const NAV_ITEMS: NavItem[] = [
  // ── OVERVIEW ─────────────────────────────────────────────────────────────
  {
    id: 'dashboard',
    label: 'Dashboard', to: '/dashboard', icon: 'LayoutDashboard',
    roles: ['super-admin','hr-admin','payroll-officer','dept-head'],
    section: 'OVERVIEW', module: 'employees',
  },

  // ── WORKFORCE ────────────────────────────────────────────────────────────
  {
    id: 'employees',
    label: 'Employees', to: '/employees', icon: 'Users',
    roles: ['super-admin','hr-admin'],
    section: 'WORKFORCE', module: 'employees',
    children: [
      { label: 'Directory',    to: '/employees',     end: true },
      { label: 'Add Employee', to: '/employees/new' },
    ],
  },
  {
    id: 'attendance',
    label: 'Attendance', to: '/attendance', icon: 'Clock',
    roles: ['super-admin','hr-admin','payroll-officer'],
    section: 'WORKFORCE', module: 'attendance',
    children: [
      { label: "Today's Log",    to: '/attendance',     end: true },
      { label: 'Attendance Log', to: '/attendance/log' },
    ],
  },
  {
    id: 'leaves',
    label: 'Leave Management', to: '/leaves', icon: 'Umbrella',
    roles: ['super-admin','hr-admin','dept-head'],
    section: 'WORKFORCE', module: 'leaves',
  },
  {
    id: 'overtime',
    label: 'Overtime', to: '/overtime', icon: 'Timer',
    roles: ['super-admin','hr-admin','dept-head'],
    section: 'WORKFORCE', module: 'overtime',
  },
  {
    id: 'schedules',
    label: 'Schedules', to: '/schedules', icon: 'Calendar',
    roles: ['super-admin','hr-admin'],
    section: 'WORKFORCE', module: 'schedules',
    children: [
      { label: 'Work Shifts', to: '/schedules/shifts' },
      { label: 'Holidays',    to: '/schedules/holidays' },
    ],
  },

  // ── PAYROLL ───────────────────────────────────────────────────────────────
  {
    id: 'payroll',
    label: 'Payroll Runs', to: '/payroll', icon: 'Banknote',
    roles: ['super-admin','hr-admin','payroll-officer'],
    section: 'PAYROLL', module: 'payroll',
    children: [
      { label: 'Pay Runs', to: '/payroll', end: true },
    ],
  },
  {
    id: 'reports',
    label: 'Reports', to: '/reports', icon: 'BarChart2',
    roles: ['super-admin','hr-admin','payroll-officer'],
    section: 'PAYROLL', module: 'reports',
  },

  // ── SYSTEM ────────────────────────────────────────────────────────────────
  {
    id: 'audit',
    label: 'Audit Logs', to: '/audit-log', icon: 'Shield',
    roles: ['super-admin'],
    section: 'SYSTEM', module: 'audit',
  },
  {
    id: 'settings',
    label: 'Settings', to: '/settings', icon: 'Settings',
    roles: ['super-admin'],
    section: 'SYSTEM', module: 'employees',
  },
]

export const NAV_SECTIONS: NavSection[] = ['OVERVIEW', 'WORKFORCE', 'PAYROLL', 'SYSTEM']

export const SECTION_LABELS: Record<NavSection, string> = {
  OVERVIEW:  'Overview',
  WORKFORCE: 'Workforce',
  PAYROLL:   'Payroll',
  SYSTEM:    'System',
}

export const ROLE_LABELS: Record<string, string> = {
  'super-admin':     'Super Admin',
  'hr-admin':        'HR Admin',
  'payroll-officer': 'Payroll Officer',
  'dept-head':       'Dept Head',
  'employee':        'Employee',
}

export const ROLE_COLORS: Record<string, string> = {
  'super-admin':     '#A78BFA',
  'hr-admin':        '#60A5FA',
  'payroll-officer': '#34D399',
  'dept-head':       '#FDBA74',
  'employee':        '#94A3B8',
}

export const ROLE_PILL_COLORS: Record<string, { bg: string; text: string }> = {
  'super-admin':     { bg: '#F5F3FF', text: '#7C3AED' },
  'hr-admin':        { bg: '#EFF6FF', text: '#2563EB' },
  'payroll-officer': { bg: '#ECFDF5', text: '#059669' },
  'dept-head':       { bg: '#FFFBEB', text: '#D97706' },
  'employee':        { bg: '#F1F5F9', text: '#64748B' },
}

export const PAGE_TITLES: Record<string, { section?: string; title: string }> = {
  '/dashboard':          { title: 'Dashboard' },
  '/employees':          { section: 'Workforce', title: 'Employee Directory' },
  '/employees/new':      { section: 'Employees', title: 'New Employee' },
  '/attendance':         { section: 'Workforce', title: "Today's Attendance" },
  '/attendance/log':     { section: 'Attendance', title: 'Attendance Log' },
  '/leaves':             { section: 'Workforce', title: 'Leave Management' },
  '/overtime':           { section: 'Workforce', title: 'Overtime Requests' },
  '/schedules/shifts':   { section: 'Schedules', title: 'Work Shifts' },
  '/schedules/holidays': { section: 'Schedules', title: 'Holidays' },
  '/payroll':            { section: 'Payroll', title: 'Payroll Runs' },
  '/reports':            { section: 'Payroll', title: 'Reports & Analytics' },
  '/audit-log':          { section: 'System', title: 'Audit Logs' },
  '/settings':           { section: 'System', title: 'Settings' },
}
