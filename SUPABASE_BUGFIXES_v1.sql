-- ============================================================
-- TYCOON SOURCING — BUG FIXES v1
-- Fixes for: stock inventory, invoice sync, withdrawals, onboarding
-- Run AFTER SUPABASE_V9_SETUP.sql
-- Safe to re-run (uses DROP IF EXISTS)
-- ============================================================

-- ===========================================
-- FIX #1: Add profiles.status field if missing
-- ===========================================
DO $$ BEGIN
  BEGIN ALTER TABLE profiles ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'suspended'));
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
  BEGIN ALTER TABLE profiles ADD COLUMN kyc_status TEXT DEFAULT 'not_started' CHECK (kyc_status IN ('not_started', 'pending_review', 'verified', 'rejected'));
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
  BEGIN ALTER TABLE profiles ADD COLUMN verified_at TIMESTAMPTZ;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
END $$;

-- ===========================================
-- FIX #2: Add KYC documents table
-- ===========================================
CREATE TABLE IF NOT EXISTS kyc_documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type   TEXT NOT NULL CHECK (document_type IN ('nic', 'business_license', 'bank_statement', 'tax_id', 'other')),
  file_name       TEXT NOT NULL,
  file_url        TEXT NOT NULL,
  file_size       INT,
  file_type       TEXT,
  uploaded_at     TIMESTAMPTZ DEFAULT NOW(),
  verified_at     TIMESTAMPTZ,
  verified_by     UUID REFERENCES profiles(id),
  notes           TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own KYC docs" ON kyc_documents;
DROP POLICY IF EXISTS "Admins see all KYC docs" ON kyc_documents;
CREATE POLICY "Users see own KYC docs" ON kyc_documents FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Admins see all KYC docs" ON kyc_documents FOR ALL USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_kyc_documents_client ON kyc_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON kyc_documents(status);

-- ===========================================
-- FIX #3: Trigger - Only deduct stock on batch RELEASED status
-- ===========================================
DROP FUNCTION IF EXISTS update_deal_collected_units_on_batch_release() CASCADE;
CREATE OR REPLACE FUNCTION update_deal_collected_units_on_batch_release()
RETURNS TRIGGER AS $$
BEGIN
  -- ONLY deduct from deal.collected_units when batch status changes to 'released'
  -- This ensures stock is only reduced AFTER payment AND warehouse release
  IF NEW.status = 'released' AND OLD.status != 'released' THEN
    UPDATE deals 
    SET collected_units = collected_units + COALESCE(NEW.units, 0)
    WHERE id = NEW.deal_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_batch_release_stock ON batches;
CREATE TRIGGER trigger_batch_release_stock
AFTER UPDATE ON batches
FOR EACH ROW
EXECUTE FUNCTION update_deal_collected_units_on_batch_release();

-- ===========================================
-- FIX #4: Trigger - Sync batch status to invoice status
-- ===========================================
DROP FUNCTION IF EXISTS sync_batch_status_to_invoice() CASCADE;
CREATE OR REPLACE FUNCTION sync_batch_status_to_invoice()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    UPDATE invoices 
    SET status = CASE 
      WHEN NEW.status = 'paid' THEN 'paid'
      WHEN NEW.status = 'released' THEN 'paid'
      WHEN NEW.status = 'cancelled' THEN 'cancelled'
      ELSE 'unpaid'
    END,
    updated_at = NOW()
    WHERE batch_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_batch_to_invoice ON batches;
CREATE TRIGGER trigger_sync_batch_to_invoice
AFTER UPDATE ON batches
FOR EACH ROW
EXECUTE FUNCTION sync_batch_status_to_invoice();

-- ===========================================
-- FIX #5: Trigger - Auto-create batch when withdrawal COLLECTED
-- ===========================================
DROP FUNCTION IF EXISTS create_batch_on_withdrawal_collected() CASCADE;
CREATE OR REPLACE FUNCTION create_batch_on_withdrawal_collected()
RETURNS TRIGGER AS $$
DECLARE
  v_deal deals%ROWTYPE;
  v_batch_num INT;
  v_cbm_per_unit NUMERIC;
  v_handling_fee NUMERIC;
  v_service_fee NUMERIC;
  v_storage_fee NUMERIC;
  v_base_cost NUMERIC;
  v_total_amount NUMERIC;
BEGIN
  IF NEW.status = 'collected' AND OLD.status != 'collected' THEN
    -- Get deal details
    SELECT * INTO v_deal FROM deals WHERE id = NEW.deal_id;
    IF v_deal IS NOT NULL THEN
      -- Calculate batch number
      SELECT COALESCE(MAX(batch_num), 0) + 1 INTO v_batch_num 
      FROM batches WHERE deal_id = NEW.deal_id;
      
      -- Calculate fees based on deal parameters
      v_cbm_per_unit := COALESCE(v_deal.total_cbm, 0) / COALESCE(v_deal.total_units, 1);
      v_base_cost := COALESCE(NEW.units_requested, 0) * COALESCE(v_deal.order_value_lkr, 0) / COALESCE(v_deal.total_units, 1);
      v_handling_fee := v_base_cost * (COALESCE(v_deal.handling_pct, 0) / 100);
      v_service_fee := v_base_cost * (COALESCE(v_deal.service_pct, 0) / 100);
      v_storage_fee := (NEW.units_requested * v_cbm_per_unit) * COALESCE(v_deal.cbm_rate_lkr, 140) * 1; -- 1 day default
      v_total_amount := v_base_cost + v_handling_fee + v_service_fee + v_storage_fee;
      
      -- Create batch record
      INSERT INTO batches (
        deal_id, batch_num, units, cbm_collected,
        amount_lkr, handling_fee, service_fee, storage_fee, base_cost,
        status, collected_at, notes
      ) VALUES (
        NEW.deal_id, v_batch_num, NEW.units_requested, NEW.units_requested * v_cbm_per_unit,
        ROUND(v_total_amount::NUMERIC, 2), ROUND(v_handling_fee::NUMERIC, 2), ROUND(v_service_fee::NUMERIC, 2), ROUND(v_storage_fee::NUMERIC, 2), ROUND(v_base_cost::NUMERIC, 2),
        'released', NOW(), CONCAT('Auto-created from withdrawal request ', NEW.id)
      );
      
      -- Link withdrawal to batch
      UPDATE withdrawals SET batch_id = (
        SELECT id FROM batches WHERE deal_id = NEW.deal_id AND batch_num = v_batch_num
      ) WHERE id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_withdrawal_to_batch ON withdrawals;
CREATE TRIGGER trigger_withdrawal_to_batch
AFTER UPDATE ON withdrawals
FOR EACH ROW
EXECUTE FUNCTION create_batch_on_withdrawal_collected();

-- ===========================================
-- FIX #6: Add updated_at to invoices if missing
-- ===========================================
DO $$ BEGIN
  BEGIN ALTER TABLE invoices ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
END $$;

-- ===========================================
-- FIX #7: Verify RLS policies on key tables
-- ===========================================

-- Withdrawals policies (should already exist from v9, but verify)
DROP POLICY IF EXISTS "Users read own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Users insert own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Admins manage all withdrawals" ON withdrawals;
CREATE POLICY "Users read own withdrawals" ON withdrawals 
  FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Users insert own withdrawals" ON withdrawals 
  FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Admins manage all withdrawals" ON withdrawals 
  FOR ALL USING (public.is_admin());

-- Invoices policies
DROP POLICY IF EXISTS "Users read own invoices" ON invoices;
DROP POLICY IF EXISTS "Admins manage invoices" ON invoices;
CREATE POLICY "Users read own invoices" ON invoices 
  FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Admins manage invoices" ON invoices 
  FOR ALL USING (public.is_admin());

-- Batches policies
DROP POLICY IF EXISTS "Users read own batches" ON batches;
DROP POLICY IF EXISTS "Admins manage batches" ON batches;
CREATE POLICY "Users read own batches" ON batches 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM deals WHERE deals.id = batches.deal_id AND deals.client_id = auth.uid())
  );
CREATE POLICY "Admins manage batches" ON batches 
  FOR ALL USING (public.is_admin());

-- ===========================================
-- FIX #8: Add notifications table index
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_notifications_client_created ON notifications(client_id, created_at DESC);

-- ============================================================
-- DONE! All bug fixes applied.
-- ============================================================
