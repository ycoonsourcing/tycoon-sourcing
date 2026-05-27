-- ============================================================
-- TYCOON SOURCING — DOCUMENT UPLOADS SETUP
-- Run this AFTER the initial SUPABASE_SETUP.sql has already run.
-- Takes about 15 seconds. Safe to re-run.
-- ============================================================

-- 1. Create storage bucket for request documents (public-read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'request-documents',
  'request-documents',
  true,
  10485760,  -- 10MB per file
  ARRAY[
    'application/pdf',
    'image/jpeg','image/jpg','image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage policies — allow public uploads, admin reads
DROP POLICY IF EXISTS "Anyone can upload to request-documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read request-documents" ON storage.objects;

CREATE POLICY "Anyone can upload to request-documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'request-documents');

CREATE POLICY "Anyone can read request-documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'request-documents');

-- 3. Link documents to requests table
CREATE TABLE IF NOT EXISTS request_documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id  UUID REFERENCES requests(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  file_url    TEXT NOT NULL,
  file_size   INT,
  file_type   TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_request_docs_req ON request_documents(request_id);

ALTER TABLE request_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert request_documents" ON request_documents;
DROP POLICY IF EXISTS "Admins read all request_documents" ON request_documents;
DROP POLICY IF EXISTS "Users read own request_documents" ON request_documents;

CREATE POLICY "Anyone can insert request_documents" ON request_documents FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admins read all request_documents"   ON request_documents FOR ALL USING (public.is_admin());
CREATE POLICY "Users read own request_documents"    ON request_documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM requests WHERE requests.id = request_documents.request_id AND requests.client_id = auth.uid()));

-- ============================================================
-- DONE! You can now upload documents via the request forms.
-- ============================================================
