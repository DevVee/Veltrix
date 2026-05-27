-- ═══════════════════════════════════════════════════════════════════════════════
-- Veltrix HR & Payroll — Supabase Schema
-- Run this in the Supabase SQL Editor (once, on a fresh project).
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ══════════════════════════════════════════════════════════════════════════════
-- PROFILES  (links Supabase Auth users → app roles)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'employee',   -- super-admin | hr-admin | payroll-officer | dept-head | employee
  employee_id    UUID,                               -- FK set after employees table exists
  department     TEXT,
  avatar_initials TEXT
);

-- ══════════════════════════════════════════════════════════════════════════════
-- DEPARTMENTS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  code        TEXT,
  description TEXT,
  head_name   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- POSITIONS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS positions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT UNIQUE NOT NULL,
  department  TEXT,
  level       TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- WORK SHIFTS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS work_shifts (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        TEXT NOT NULL,
  time_in                     TEXT NOT NULL,   -- "08:00"
  time_out                    TEXT NOT NULL,   -- "17:00"
  break_minutes               INT  NOT NULL DEFAULT 60,
  grace_minutes               INT  NOT NULL DEFAULT 15,
  rest_days                   INT[]NOT NULL DEFAULT '{0,6}',
  overtime_enabled            BOOLEAN NOT NULL DEFAULT TRUE,
  overtime_threshold_minutes  INT  DEFAULT 30
);

-- ══════════════════════════════════════════════════════════════════════════════
-- EMPLOYEES
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS employees (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_no             TEXT UNIQUE NOT NULL,
  first_name              TEXT NOT NULL,
  last_name               TEXT NOT NULL,
  middle_name             TEXT,
  full_name               TEXT NOT NULL,
  email                   TEXT UNIQUE NOT NULL,
  phone                   TEXT,
  address                 TEXT,
  birth_date              DATE,
  gender                  TEXT,
  civil_status            TEXT,
  position                TEXT,
  department              TEXT,
  employment_type         TEXT NOT NULL DEFAULT 'regular',
  status                  TEXT NOT NULL DEFAULT 'active',
  hire_date               DATE,
  resign_date             DATE,
  -- Compensation
  compensation_type       TEXT NOT NULL DEFAULT 'monthly',
  compensation_rate       NUMERIC(14,4) NOT NULL DEFAULT 0,
  basic_salary            NUMERIC(14,4) NOT NULL DEFAULT 0,
  daily_rate              NUMERIC(14,4) NOT NULL DEFAULT 0,
  pay_frequency           TEXT NOT NULL DEFAULT 'bi-monthly',
  -- Identification
  pin_code                TEXT,
  rfid_tag                TEXT,
  photo_url               TEXT,
  sss_no                  TEXT,
  philhealth_no           TEXT,
  pagibig_no              TEXT,
  tin_no                  TEXT,
  bank_name               TEXT,
  bank_account            TEXT,
  shift_id                UUID REFERENCES work_shifts(id),
  tax_status              TEXT NOT NULL DEFAULT 'S',
  allowances              JSONB NOT NULL DEFAULT '[]',
  emergency_contact_name  TEXT,
  emergency_contact_phone TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK from profiles to employees
ALTER TABLE profiles
  ADD CONSTRAINT fk_profiles_employee
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL;

-- Updated-at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- ATTENDANCE RECORDS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS attendance_records (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id        UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  employee_name      TEXT NOT NULL,
  employee_no        TEXT NOT NULL,
  department         TEXT,
  date               DATE NOT NULL,
  time_in            TIMESTAMPTZ,
  time_out           TIMESTAMPTZ,
  status             TEXT NOT NULL DEFAULT 'present',
  minutes_late       INT  NOT NULL DEFAULT 0,
  overtime_minutes   INT  NOT NULL DEFAULT 0,
  night_diff_minutes INT  NOT NULL DEFAULT 0,
  source             TEXT NOT NULL DEFAULT 'kiosk',   -- 'kiosk' | 'manual'
  corrected_by       TEXT,
  correction_reason  TEXT,
  note               TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One record per employee per day
  UNIQUE (employee_id, date)
);

CREATE INDEX idx_attendance_date        ON attendance_records(date);
CREATE INDEX idx_attendance_employee_id ON attendance_records(employee_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- HOLIDAYS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS holidays (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  date         DATE NOT NULL UNIQUE,
  type         TEXT NOT NULL DEFAULT 'regular',   -- regular | special-non-working | special-working
  is_nationwide BOOLEAN NOT NULL DEFAULT TRUE,
  description  TEXT
);

-- ══════════════════════════════════════════════════════════════════════════════
-- LEAVE REQUESTS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS leave_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id      UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  employee_name    TEXT NOT NULL,
  employee_no      TEXT,
  leave_type       TEXT NOT NULL,
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  days             INT  NOT NULL DEFAULT 1,
  reason           TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending',
  reviewed_by      TEXT,
  reviewed_at      TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- LEAVE BALANCES
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS leave_balances (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  year         INT  NOT NULL,
  vacation     JSONB NOT NULL DEFAULT '{"entitled":15,"used":0,"balance":15}',
  sick         JSONB NOT NULL DEFAULT '{"entitled":15,"used":0,"balance":15}',
  emergency    JSONB NOT NULL DEFAULT '{"entitled":5,"used":0,"balance":5}',
  UNIQUE (employee_id, year)
);

-- ══════════════════════════════════════════════════════════════════════════════
-- OVERTIME REQUESTS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS overtime_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id      UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  employee_name    TEXT NOT NULL,
  employee_no      TEXT NOT NULL,
  department       TEXT NOT NULL,
  date             DATE NOT NULL,
  hours_requested  NUMERIC(6,2) NOT NULL DEFAULT 0,
  overtime_type    TEXT DEFAULT 'regular',
  multiplier       NUMERIC(5,2) DEFAULT 1.25,
  reason           TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending',
  reviewed_by      TEXT,
  reviewed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- PAYROLL PERIODS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS payroll_periods (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_no        TEXT UNIQUE NOT NULL,
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  pay_date         DATE NOT NULL,
  frequency        TEXT NOT NULL DEFAULT 'bi-monthly',
  status           TEXT NOT NULL DEFAULT 'draft',
  total_employees  INT  NOT NULL DEFAULT 0,
  total_gross      NUMERIC(18,4) NOT NULL DEFAULT 0,
  total_deductions NUMERIC(18,4) NOT NULL DEFAULT 0,
  total_net        NUMERIC(18,4) NOT NULL DEFAULT 0,
  created_by       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by      TEXT,
  reviewed_at      TIMESTAMPTZ,
  approved_by      TEXT,
  approved_at      TIMESTAMPTZ,
  paid_at          TIMESTAMPTZ,
  notes            TEXT
);

-- ══════════════════════════════════════════════════════════════════════════════
-- PAYROLL ENTRIES  (one row per employee per pay period)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS payroll_entries (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_period_id    UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
  employee_id          UUID NOT NULL REFERENCES employees(id),
  employee_name        TEXT NOT NULL,
  employee_no          TEXT NOT NULL,
  position             TEXT,
  department           TEXT,
  employment_type      TEXT,
  scheduled_days       INT  NOT NULL DEFAULT 0,
  present_days         INT  NOT NULL DEFAULT 0,
  absent_days          INT  NOT NULL DEFAULT 0,
  late_days            INT  NOT NULL DEFAULT 0,
  half_days            INT  NOT NULL DEFAULT 0,
  leave_days           INT  NOT NULL DEFAULT 0,
  overtime_hours       NUMERIC(8,2) NOT NULL DEFAULT 0,
  night_diff_hours     NUMERIC(8,2) NOT NULL DEFAULT 0,
  regular_holiday_days NUMERIC(8,2) NOT NULL DEFAULT 0,
  special_holiday_days NUMERIC(8,2) NOT NULL DEFAULT 0,
  basic_pay            NUMERIC(14,4) NOT NULL DEFAULT 0,
  overtime_pay         NUMERIC(14,4) NOT NULL DEFAULT 0,
  regular_holiday_pay  NUMERIC(14,4) NOT NULL DEFAULT 0,
  special_holiday_pay  NUMERIC(14,4) NOT NULL DEFAULT 0,
  night_differential   NUMERIC(14,4) NOT NULL DEFAULT 0,
  allowances           JSONB NOT NULL DEFAULT '[]',
  gross_pay            NUMERIC(14,4) NOT NULL DEFAULT 0,
  late_deductions      NUMERIC(14,4) NOT NULL DEFAULT 0,
  absence_deductions   NUMERIC(14,4) NOT NULL DEFAULT 0,
  undertime_deductions NUMERIC(14,4) NOT NULL DEFAULT 0,
  sss_employee         NUMERIC(14,4) NOT NULL DEFAULT 0,
  philhealth_employee  NUMERIC(14,4) NOT NULL DEFAULT 0,
  pagibig_employee     NUMERIC(14,4) NOT NULL DEFAULT 0,
  withholding_tax      NUMERIC(14,4) NOT NULL DEFAULT 0,
  other_deductions     JSONB NOT NULL DEFAULT '[]',
  total_deductions     NUMERIC(14,4) NOT NULL DEFAULT 0,
  sss_employer         NUMERIC(14,4) NOT NULL DEFAULT 0,
  philhealth_employer  NUMERIC(14,4) NOT NULL DEFAULT 0,
  pagibig_employer     NUMERIC(14,4) NOT NULL DEFAULT 0,
  net_pay              NUMERIC(14,4) NOT NULL DEFAULT 0,
  remarks              TEXT,
  marked_paid          BOOLEAN NOT NULL DEFAULT FALSE,
  marked_paid_at       TIMESTAMPTZ,
  marked_paid_by       TEXT,
  UNIQUE (payroll_period_id, employee_id)
);

-- ══════════════════════════════════════════════════════════════════════════════
-- AUDIT LOGS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id     TEXT,
  user_name   TEXT NOT NULL,
  action      TEXT NOT NULL,
  module      TEXT NOT NULL,
  description TEXT NOT NULL,
  before_data TEXT,
  after_data  TEXT,
  record_id   TEXT
);

CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_module    ON audit_logs(module);

-- ══════════════════════════════════════════════════════════════════════════════
-- APP SETTINGS  (key-value, single-row per key)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS app_settings (
  id         TEXT PRIMARY KEY,   -- 'company' | 'deductions'
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- PAYROLL SEQUENCE  (replaces localStorage payrollSeq)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE SEQUENCE IF NOT EXISTS payroll_seq START 100 INCREMENT 1;

-- Helper function used by seed + app
CREATE OR REPLACE FUNCTION next_period_no()
RETURNS TEXT LANGUAGE sql AS $$
  SELECT 'PAY-' || LPAD(NEXTVAL('payroll_seq')::TEXT, 4, '0');
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- Authenticated users have full access (role-based logic is enforced in the app).
-- Tighten per-table policies before going to production.
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_shifts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees          ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays           ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances     ENABLE ROW LEVEL SECURITY;
ALTER TABLE overtime_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_periods    ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings       ENABLE ROW LEVEL SECURITY;

-- Allow all actions for authenticated users (anon key + signed-in session)
DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'profiles','departments','positions','work_shifts','employees',
    'attendance_records','holidays','leave_requests','leave_balances',
    'overtime_requests','payroll_periods','payroll_entries',
    'audit_logs','app_settings'
  ] LOOP
    EXECUTE FORMAT(
      'CREATE POLICY "authenticated_all" ON %I FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE)',
      tbl
    );
  END LOOP;
END $$;
