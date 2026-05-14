-- PSK Hotels HR Management System
-- PostgreSQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── BRANCHES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS branches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(10) NOT NULL UNIQUE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── USERS (System users / logins) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('superadmin','hr','branch_manager','accounts','viewer')),
  branch_access VARCHAR(100) DEFAULT 'ALL',
  active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── STAFF ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  emp_id VARCHAR(30) UNIQUE,
  full_name VARCHAR(200) NOT NULL,
  branch VARCHAR(100) NOT NULL,
  dept_code VARCHAR(50),
  position VARCHAR(100),
  department VARCHAR(100),
  gross_salary NUMERIC(12,2) DEFAULT 0,
  paye NUMERIC(12,2) DEFAULT 0,
  vaccine_deduction NUMERIC(12,2) DEFAULT 0,
  loan_monthly NUMERIC(12,2) DEFAULT 0,
  other_deductions NUMERIC(12,2) DEFAULT 0,
  net_salary NUMERIC(12,2) GENERATED ALWAYS AS (
    GREATEST(0, gross_salary - paye - vaccine_deduction - loan_monthly - other_deductions)
  ) STORED,
  -- Personal
  phone VARCHAR(20),
  residential_address TEXT,
  date_of_birth DATE,
  nin VARCHAR(20),
  date_of_resumption DATE,
  -- Next of Kin
  kin_name VARCHAR(200),
  kin_phone VARCHAR(20),
  kin_relationship VARCHAR(100),
  kin_address TEXT,
  -- Bank
  account_number VARCHAR(30),
  bank_name VARCHAR(100),
  -- Photo
  photo_url TEXT,
  -- Status
  status VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active','inactive','suspended','terminated')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_branch ON staff(branch);
CREATE INDEX IF NOT EXISTS idx_staff_dept ON staff(department);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);
CREATE INDEX IF NOT EXISTS idx_staff_name ON staff(full_name);

-- ─── LOANS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loans (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
  staff_name VARCHAR(200) NOT NULL,
  position VARCHAR(100),
  branch VARCHAR(100),
  loan_amount NUMERIC(12,2) DEFAULT 0,
  month_requested VARCHAR(30),
  monthly_repayment NUMERIC(12,2) DEFAULT 0,
  balance NUMERIC(12,2) DEFAULT 0,
  last_month_paid VARCHAR(30),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','cleared','suspended')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loans_staff ON loans(staff_id);
CREATE INDEX IF NOT EXISTS idx_loans_branch ON loans(branch);

-- ─── PAYROLL RUNS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payroll_runs (
  id SERIAL PRIMARY KEY,
  period VARCHAR(7) NOT NULL UNIQUE,  -- e.g. '2026-05'
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  days_in_month INTEGER NOT NULL,
  locked BOOLEAN DEFAULT FALSE,
  locked_by INTEGER REFERENCES users(id),
  locked_at TIMESTAMPTZ,
  generated_by INTEGER REFERENCES users(id),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- ─── PAYROLL RECORDS (per staff per month) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS payroll_records (
  id SERIAL PRIMARY KEY,
  run_id INTEGER NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
  emp_id VARCHAR(30),
  full_name VARCHAR(200),
  branch VARCHAR(100),
  dept_code VARCHAR(50),
  days_in_month INTEGER,
  days_absent INTEGER DEFAULT 0,
  days_worked INTEGER,
  gross_salary NUMERIC(12,2),
  pro_rata_gross NUMERIC(12,2),
  paye NUMERIC(12,2),
  vaccine_deduction NUMERIC(12,2),
  loan_monthly NUMERIC(12,2),
  other_deductions NUMERIC(12,2),
  net_salary NUMERIC(12,2),
  account_number VARCHAR(30),
  bank_name VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_payroll_records_run ON payroll_records(run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_staff ON payroll_records(staff_id);

-- ─── ATTENDANCE ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  period VARCHAR(7) NOT NULL,  -- e.g. '2026-05'
  days_absent INTEGER DEFAULT 0,
  notes TEXT,
  recorded_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, period)
);

CREATE INDEX IF NOT EXISTS idx_attendance_period ON attendance(period);
CREATE INDEX IF NOT EXISTS idx_attendance_staff ON attendance(staff_id);

-- ─── AUDIT LOG ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  username VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);

-- ─── SALARY HISTORY SNAPSHOTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salary_history (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  period VARCHAR(7) NOT NULL,
  gross_salary NUMERIC(12,2),
  net_salary NUMERIC(12,2),
  paye NUMERIC(12,2),
  loan_monthly NUMERIC(12,2),
  other_deductions NUMERIC(12,2),
  change_reason TEXT,
  changed_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, period)
);

-- ─── TRIGGER: auto-update updated_at ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_staff_updated BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_loans_updated BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
