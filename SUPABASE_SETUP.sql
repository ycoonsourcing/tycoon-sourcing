-- ============================================================
-- TYCOON SOURCING — SUPABASE DATABASE SETUP
-- Run this entire script in Supabase SQL Editor (Dashboard → SQL Editor → New Query → paste → Run)
-- Takes about 30 seconds. Safe to run multiple times (IF NOT EXISTS guards).
-- ============================================================

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (client account details, extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT UNIQUE NOT NULL,
  full_name       TEXT,
  company         TEXT,
  phone           TEXT,
  nic             TEXT,
  address         TEXT,
  district        TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','verified','suspended')),
  onboarding_step INT DEFAULT 0,
  is_admin        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. DEALS (trade deals)
-- ============================================================
CREATE TABLE IF NOT EXISTS deals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_code       TEXT UNIQUE NOT NULL,
  client_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product         TEXT NOT NULL,
  supplier        TEXT,
  warehouse_id    TEXT,
  total_units     INT NOT NULL,
  collected_units INT DEFAULT 0,
  order_value_lkr NUMERIC(12,2) NOT NULL,
  deposit_paid    NUMERIC(12,2) DEFAULT 0,
  credit_applied  NUMERIC(12,2) DEFAULT 0,
  total_cbm       NUMERIC(8,3),
  handling_pct    NUMERIC(4,2) DEFAULT 3,
  service_pct     NUMERIC(4,2) DEFAULT 4,
  cbm_rate_lkr    NUMERIC(8,2),
  deposit_pct     INT DEFAULT 20,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','ordered','active','completed','cancelled')),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_client ON deals(client_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);

-- ============================================================
-- 3. BATCHES (pickup batches per deal)
-- ============================================================
CREATE TABLE IF NOT EXISTS batches (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id         UUID REFERENCES deals(id) ON DELETE CASCADE,
  batch_num       INT NOT NULL,
  units           INT NOT NULL,
  amount_lkr      NUMERIC(12,2) NOT NULL,
  collected_at    TIMESTAMPTZ,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','released','cancelled')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batches_deal ON batches(deal_id);

-- ============================================================
-- 4. CREDITS (reward credit balances — FIFO with expiry)
-- ============================================================
CREATE TABLE IF NOT EXISTS credits (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  deal_id         UUID REFERENCES deals(id) ON DELETE SET NULL,
  amount_earned   NUMERIC(12,2) NOT NULL,
  balance         NUMERIC(12,2) NOT NULL,
  earned_at       TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','used','expired')),
  used_on_deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credits_client ON credits(client_id);
CREATE INDEX IF NOT EXISTS idx_credits_expiry ON credits(expires_at);

-- ============================================================
-- 5. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT CHECK (type IN ('info','success','warning','urgent')),
  message     TEXT NOT NULL,
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifs_client ON notifications(client_id);

-- ============================================================
-- 6. DOCUMENTS (KYC uploads)
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT CHECK (type IN ('business_reg','id_proof','address_proof','other')),
  file_url    TEXT,
  file_name   TEXT,
  verified    BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. REQUESTS (product sourcing requests from public)
-- ============================================================
CREATE TABLE IF NOT EXISTS requests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name        TEXT,
  email       TEXT,
  phone       TEXT,
  company     TEXT,
  model       TEXT,
  product     TEXT,
  quantity    TEXT,
  price       TEXT,
  supplier    TEXT,
  notes       TEXT,
  status      TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','quoted','accepted','rejected','converted')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Critical for data privacy
-- ============================================================
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches       ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents     ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests      ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users read own profile"  ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins read all profiles" ON profiles;

CREATE POLICY "Users read own profile"  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins read all profiles" ON profiles FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Deals policies
DROP POLICY IF EXISTS "Users read own deals"  ON deals;
DROP POLICY IF EXISTS "Admins manage all deals" ON deals;
CREATE POLICY "Users read own deals"   ON deals FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Admins manage all deals" ON deals FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Batches policies
DROP POLICY IF EXISTS "Users read own batches" ON batches;
DROP POLICY IF EXISTS "Admins manage all batches" ON batches;
CREATE POLICY "Users read own batches" ON batches FOR SELECT USING (EXISTS (SELECT 1 FROM deals WHERE deals.id = batches.deal_id AND deals.client_id = auth.uid()));
CREATE POLICY "Admins manage all batches" ON batches FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Credits policies
DROP POLICY IF EXISTS "Users read own credits" ON credits;
DROP POLICY IF EXISTS "Admins manage all credits" ON credits;
CREATE POLICY "Users read own credits" ON credits FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Admins manage all credits" ON credits FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Notifications policies
DROP POLICY IF EXISTS "Users read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins manage all notifications" ON notifications;
CREATE POLICY "Users read own notifications"   ON notifications FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = client_id);
CREATE POLICY "Admins manage all notifications" ON notifications FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Documents policies
DROP POLICY IF EXISTS "Users manage own documents" ON documents;
DROP POLICY IF EXISTS "Admins read all documents" ON documents;
CREATE POLICY "Users manage own documents" ON documents FOR ALL USING (auth.uid() = client_id);
CREATE POLICY "Admins read all documents" ON documents FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Requests — anyone can insert (public form), only admins read
DROP POLICY IF EXISTS "Anyone can submit requests" ON requests;
DROP POLICY IF EXISTS "Admins read all requests" ON requests;
DROP POLICY IF EXISTS "Users read own requests" ON requests;
CREATE POLICY "Anyone can submit requests" ON requests FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admins read all requests"   ON requests FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));
CREATE POLICY "Users read own requests"    ON requests FOR SELECT USING (auth.uid() = client_id);

-- ============================================================
-- TRIGGER: Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, company, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- DONE!
-- Next: Go to Authentication → Users → create your first admin account
-- Then run: UPDATE profiles SET is_admin = TRUE WHERE email = 'your@email.com';
-- ============================================================
