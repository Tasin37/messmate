-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Identity Tables (Better Auth compatible)
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "session" (
  id TEXT PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account" (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at TIMESTAMPTZ,
  refresh_token_expires_at TIMESTAMPTZ,
  scope TEXT,
  password TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "verification" (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Mess Domain Tables
CREATE TABLE IF NOT EXISTS messes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  currency_code VARCHAR(3) NOT NULL DEFAULT 'BDT',
  timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Dhaka',
  address TEXT,
  created_by TEXT NOT NULL REFERENCES "user"(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mess_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE RESTRICT,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  display_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30),
  room_label VARCHAR(50),
  role VARCHAR(20) NOT NULL CHECK (role IN ('manager', 'member')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  joined_on DATE NOT NULL DEFAULT CURRENT_DATE,
  left_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_active_mess_member UNIQUE (mess_id, user_id)
);

CREATE TABLE IF NOT EXISTS mess_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  role_to_assign VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role_to_assign IN ('manager', 'member')),
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INT NOT NULL DEFAULT 1 CHECK (max_uses > 0),
  used_count INT NOT NULL DEFAULT 0,
  revoked_at TIMESTAMPTZ,
  created_by TEXT NOT NULL REFERENCES "user"(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accounting_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE RESTRICT,
  year INT NOT NULL CHECK (year >= 2020),
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  closed_at TIMESTAMPTZ,
  closed_by TEXT REFERENCES "user"(id),
  reopened_at TIMESTAMPTZ,
  reopened_by TEXT REFERENCES "user"(id),
  policy_version INT NOT NULL DEFAULT 1,
  snapshot_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_mess_year_month UNIQUE (mess_id, year, month)
);

CREATE TABLE IF NOT EXISTS meal_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL,
  label VARCHAR(50) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT unique_mess_meal_slot UNIQUE (mess_id, code)
);

CREATE TABLE IF NOT EXISTS meal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE RESTRICT,
  member_id UUID NOT NULL REFERENCES mess_members(id) ON DELETE RESTRICT,
  meal_date DATE NOT NULL,
  meal_slot_id UUID NOT NULL REFERENCES meal_slots(id) ON DELETE RESTRICT,
  quantity NUMERIC(8,2) NOT NULL DEFAULT 1.00 CHECK (quantity >= 0),
  entry_type VARCHAR(30) NOT NULL DEFAULT 'self' CHECK (entry_type IN ('self', 'guest', 'manager_adjustment')),
  host_member_id UUID REFERENCES mess_members(id),
  note TEXT,
  created_by TEXT NOT NULL REFERENCES "user"(id),
  updated_by TEXT REFERENCES "user"(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meal_off_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES mess_members(id) ON DELETE RESTRICT,
  meal_date DATE NOT NULL,
  meal_slot_id UUID NOT NULL REFERENCES meal_slots(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by TEXT REFERENCES "user"(id),
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS manager_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES mess_members(id) ON DELETE RESTRICT,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  rotation_type VARCHAR(30) NOT NULL DEFAULT 'fixed_days' CHECK (rotation_type IN ('fixed_days', 'monthly', 'custom')),
  rotation_days INT,
  sequence_order INT NOT NULL DEFAULT 1,
  is_override BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  created_by TEXT NOT NULL REFERENCES "user"(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL,
  pool VARCHAR(20) NOT NULL DEFAULT 'meal' CHECK (pool IN ('meal', 'shared', 'individual')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT unique_mess_expense_category UNIQUE (mess_id, code)
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE RESTRICT,
  period_id UUID REFERENCES accounting_periods(id) ON DELETE RESTRICT,
  expense_date DATE NOT NULL,
  paid_by_member_id UUID NOT NULL REFERENCES mess_members(id) ON DELETE RESTRICT,
  category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
  title VARCHAR(200) NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  note TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'approved' CHECK (status IN ('draft', 'approved', 'voided')),
  void_reason TEXT,
  voided_by TEXT REFERENCES "user"(id),
  voided_at TIMESTAMPTZ,
  created_by TEXT NOT NULL REFERENCES "user"(id),
  updated_by TEXT REFERENCES "user"(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shared_bill_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL,
  default_amount NUMERIC(14,2) DEFAULT 0.00,
  allocation_method VARCHAR(30) NOT NULL DEFAULT 'equal' CHECK (allocation_method IN ('equal', 'weighted', 'custom', 'room_based')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL REFERENCES "user"(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shared_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE RESTRICT,
  period_id UUID NOT NULL REFERENCES accounting_periods(id) ON DELETE RESTRICT,
  template_id UUID REFERENCES shared_bill_templates(id),
  title VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  allocation_method VARCHAR(30) NOT NULL DEFAULT 'equal' CHECK (allocation_method IN ('equal', 'weighted', 'custom', 'room_based')),
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('draft', 'confirmed', 'voided')),
  created_by TEXT NOT NULL REFERENCES "user"(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bill_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE RESTRICT,
  shared_bill_id UUID NOT NULL REFERENCES shared_bills(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES mess_members(id) ON DELETE RESTRICT,
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  weight NUMERIC(8,2) DEFAULT 1.00,
  calculation_note TEXT,
  CONSTRAINT unique_bill_member_allocation UNIQUE (shared_bill_id, member_id)
);

CREATE TABLE IF NOT EXISTS member_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE RESTRICT,
  member_id UUID NOT NULL REFERENCES mess_members(id) ON DELETE RESTRICT,
  period_id UUID NOT NULL REFERENCES accounting_periods(id) ON DELETE RESTRICT,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL,
  method VARCHAR(30) NOT NULL DEFAULT 'cash' CHECK (method IN ('cash', 'bkash', 'nagad', 'bank', 'other')),
  reference VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'reversed')),
  reversal_reason TEXT,
  reversed_by TEXT REFERENCES "user"(id),
  reversed_at TIMESTAMPTZ,
  recorded_by TEXT NOT NULL REFERENCES "user"(id),
  note TEXT,
  idempotency_key VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS monthly_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE RESTRICT,
  period_id UUID NOT NULL REFERENCES accounting_periods(id) ON DELETE RESTRICT,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  policy_version INT NOT NULL DEFAULT 1,
  calculated_by TEXT NOT NULL REFERENCES "user"(id),
  is_final BOOLEAN NOT NULL DEFAULT false,
  total_meal_count NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_expense_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_shared_bill_amount NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settlement_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE RESTRICT,
  settlement_id UUID NOT NULL REFERENCES monthly_settlements(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES mess_members(id) ON DELETE RESTRICT,
  meal_count NUMERIC(8,2) NOT NULL DEFAULT 0,
  meal_charge NUMERIC(14,2) NOT NULL DEFAULT 0,
  shared_bill_charge NUMERIC(14,2) NOT NULL DEFAULT 0,
  other_charges NUMERIC(14,2) NOT NULL DEFAULT 0,
  expense_credit NUMERIC(14,2) NOT NULL DEFAULT 0,
  payments_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  final_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  breakdown_json JSONB,
  CONSTRAINT unique_settlement_member UNIQUE (settlement_id, member_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID REFERENCES messes(id) ON DELETE SET NULL,
  actor_user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  before_data JSONB,
  after_data JSONB,
  reason TEXT,
  request_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT NOT NULL REFERENCES "user"(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Core Performance & Isolation Indexes
CREATE INDEX IF NOT EXISTS idx_mess_members_mess_status ON mess_members(mess_id, status);
CREATE INDEX IF NOT EXISTS idx_meal_entries_lookup ON meal_entries(mess_id, meal_date, member_id);
CREATE INDEX IF NOT EXISTS idx_expenses_lookup ON expenses(mess_id, expense_date, status);
CREATE INDEX IF NOT EXISTS idx_shared_bills_period ON shared_bills(mess_id, period_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_member_period ON member_payments(mess_id, period_id, member_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_order ON audit_logs(mess_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_accounting_periods_unique ON accounting_periods(mess_id, year, month);
