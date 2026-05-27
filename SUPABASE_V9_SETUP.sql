-- ============================================================
-- TYCOON SOURCING — V9 SETUP (Operations Polish + Queued items)
-- Run AFTER all previous SQL scripts.
-- Takes about 20 seconds. Safe to re-run.
-- ============================================================

-- 1. WAREHOUSES TABLE — admin-managed warehouses
CREATE TABLE IF NOT EXISTS warehouses (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  location        TEXT NOT NULL,
  cbm_rate        NUMERIC(8,2) NOT NULL DEFAULT 140,
  wholesale_rate  NUMERIC(8,2) DEFAULT 80,
  capacity_cbm    INT DEFAULT 100,
  type            TEXT DEFAULT 'Owned' CHECK (type IN ('Owned','Partner','Leased')),
  active          BOOLEAN DEFAULT TRUE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone reads active warehouses" ON warehouses;
DROP POLICY IF EXISTS "Admins manage warehouses" ON warehouses;
CREATE POLICY "Anyone reads active warehouses" ON warehouses FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage warehouses" ON warehouses FOR ALL USING (public.is_admin());

-- Seed initial warehouses if empty (migration from content.js)
INSERT INTO warehouses (id, name, location, cbm_rate, wholesale_rate, capacity_cbm, type, active) VALUES
  ('wh-col', 'Colombo Main',   'Colombo, Sri Lanka',  140, 140, 200, 'Owned',   TRUE),
  ('wh-kan', 'Kandy Hub',      'Kandy, Sri Lanka',    130, 80,  80,  'Partner', FALSE),
  ('wh-gal', 'Galle Southern', 'Galle, Sri Lanka',    120, 70,  60,  'Partner', FALSE),
  ('wh-neg', 'Negombo Hub',    'Negombo, Sri Lanka',  124, 76,  70,  'Partner', FALSE),
  ('wh-jaf', 'Jaffna North',   'Jaffna, Sri Lanka',   116, 66,  50,  'Partner', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 2. PAYMENT TRACKING on deals + batches
DO $$ BEGIN
  BEGIN ALTER TABLE deals ADD COLUMN deposit_paid_at TIMESTAMPTZ; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE deals ADD COLUMN deposit_method TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE deals ADD COLUMN deposit_reference TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE batches ADD COLUMN payment_method TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE batches ADD COLUMN payment_reference TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

-- 3. WITHDRAWALS TABLE — client stock withdrawal requests
CREATE TABLE IF NOT EXISTS withdrawals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  deal_id         UUID REFERENCES deals(id) ON DELETE CASCADE,
  batch_id        UUID REFERENCES batches(id) ON DELETE SET NULL,
  units_requested INT NOT NULL,
  pickup_date     DATE,
  status          TEXT DEFAULT 'requested' CHECK (status IN ('requested','approved','ready','collected','rejected','cancelled')),
  client_notes    TEXT,
  admin_notes     TEXT,
  approved_at     TIMESTAMPTZ,
  approved_by     UUID REFERENCES profiles(id),
  collected_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_client ON withdrawals(client_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_deal ON withdrawals(deal_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Users insert own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Admins manage all withdrawals" ON withdrawals;
CREATE POLICY "Users read own withdrawals"   ON withdrawals FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Users insert own withdrawals" ON withdrawals FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Admins manage all withdrawals" ON withdrawals FOR ALL USING (public.is_admin());

-- 4. INVOICE LINE ITEMS (already have line_items JSONB, but ensure structured)
-- Nothing to do — uses existing line_items JSONB column

-- ============================================================
-- DONE! v9 schema ready.
-- ============================================================
