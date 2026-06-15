-- Word of Mouth enhancements migration
-- Safe to run on existing production databases.
-- Idempotent: safe to re-run without errors or data loss.
--
-- What this does (all additive / non-destructive):
--   • Adds optional profiles.neighborhood column
--   • Adds recommendation_category enum value 'other'
--   • Creates/updates avatars storage bucket
--   • Recreates avatars storage RLS policies (policy definitions only — no row data affected)
--
-- What this does NOT do:
--   • No DROP TABLE / TRUNCATE / column drops
--   • No changes to existing enum values or existing rows
--   • No deletion of uploaded files

-- 1. Neighborhood field on profiles (nullable, optional)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS neighborhood TEXT;

-- 2. "Other" recommendation category
-- Use pg_enum existence check (reliable re-run; avoids brittle exception handling).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'recommendation_category'
      AND e.enumlabel = 'other'
  ) THEN
    ALTER TYPE public.recommendation_category ADD VALUE 'other';
  END IF;
END $$;

-- 3. Avatar storage bucket (upsert — does not delete existing objects)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 4. Storage policies (drop + recreate for idempotency)
-- NOTE: Drops only policy definitions, not storage.objects rows/files.
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
