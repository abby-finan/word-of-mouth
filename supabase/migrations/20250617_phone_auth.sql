-- Phone OTP auth migration (non-breaking, incremental)
-- Safe to re-run on existing production databases.

-- 1. Optional phone on profiles (does not replace id or email in auth.users)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_number TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_number_unique
  ON public.profiles (phone_number)
  WHERE phone_number IS NOT NULL;

-- 2. Sync phone from auth.users on new signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, phone_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'New User'),
    NEW.phone
  );
  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- 3. Phone digit normalization helper
CREATE OR REPLACE FUNCTION public.normalize_phone_digits(phone TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), '');
$$;

-- 4. Friend lookup by phone (primary) or email (fallback)
--    Resolves to profiles.id — friendships still use auth.users.id via profiles.id
CREATE OR REPLACE FUNCTION public.search_users_by_contact(search_query TEXT)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  city TEXT,
  neighborhood TEXT,
  avatar_url TEXT,
  phone_number TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_query TEXT := trim(search_query);
  v_digits TEXT;
BEGIN
  IF v_query IS NULL OR v_query = '' OR auth.uid() IS NULL THEN
    RETURN;
  END IF;

  -- Email fallback (existing users)
  IF position('@' IN v_query) > 0 THEN
    RETURN QUERY
    SELECT p.id, p.first_name, p.city, p.neighborhood, p.avatar_url, p.phone_number
    FROM public.profiles p
    INNER JOIN auth.users u ON u.id = p.id
    WHERE lower(u.email) = lower(v_query)
      AND p.id <> auth.uid();
    RETURN;
  END IF;

  -- Phone lookup (profiles.phone_number or auth.users.phone)
  v_digits := public.normalize_phone_digits(v_query);

  IF v_digits IS NULL OR length(v_digits) < 10 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT p.id, p.first_name, p.city, p.neighborhood, p.avatar_url, p.phone_number
  FROM public.profiles p
  INNER JOIN auth.users u ON u.id = p.id
  WHERE p.id <> auth.uid()
    AND (
      public.normalize_phone_digits(p.phone_number) = v_digits
      OR public.normalize_phone_digits(u.phone) = v_digits
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_users_by_contact(TEXT) TO authenticated;

-- search_users_by_email kept unchanged for backward compatibility
