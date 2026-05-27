-- ============================================================
-- TYCOON SOURCING — BATCH MANAGEMENT + INVOICES SETUP
-- Run this AFTER the main setup has already run.
-- Takes about 15 seconds. Safe to re-run.
-- ============================================================

-- Extend batches table with payment tracking columns (adds only if missing)
DO $$ BEGIN
  BEGIN ALTER TABLE batches ADD COLUMN amount_paid NUMERIC(12,2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE batches ADD COLUMN paid_at TIMESTAMPTZ; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE batches ADD COLUMN cbm_collected NUMERIC(8,3); EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE batches ADD COLUMN handling_fee NUMERIC(12,2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE batches ADD COLUMN storage_fee NUMERIC(12,2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE batches ADD COLUMN service_fee NUMERIC(12,2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE batches ADD COLUMN invoice_num TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

-- Invoices table (for deposit invoices and batch invoices)
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_num     TEXT UNIQUE NOT NULL,
  deal_id         UUID REFERENCES deals(id) ON DELETE CASCADE,
  batch_id        UUID REFERENCES batches(id) ON DELETE SET NULL,
  client_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type            TEXT CHECK (type IN ('deposit','batch','final')),
  amount          NUMERIC(12,2) NOT NULL,
  status          TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid','cancelled')),
  paid_at         TIMESTAMPTZ,
  line_items      JSONB,
  notes           TEXT,
  issued_at       TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_deal ON invoices(deal_id);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own invoices" ON invoices;
DROP POLICY IF EXISTS "Admins manage all invoices" ON invoices;
CREATE POLICY "Users read own invoices"   ON invoices FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Admins manage all invoices" ON invoices FOR ALL USING (public.is_admin());

-- Audit log for credit awards (so manual awards + deal awards are distinguishable)
DO $$ BEGIN
  BEGIN ALTER TABLE credits ADD COLUMN source TEXT DEFAULT 'deal_completion'; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE credits ADD COLUMN awarded_by UUID REFERENCES profiles(id); EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

-- ============================================================
-- DONE! Batch management + invoicing now ready.
-- ============================================================
