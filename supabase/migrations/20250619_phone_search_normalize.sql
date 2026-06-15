-- Phone search normalization + signup metadata phone (non-breaking)
-- Safe to re-run on existing production databases.

-- Compare phones by last 10 US digits so +19195009338 matches 919-500-9338
CREATE OR REPLACE FUNCTION public.normalize_phone_digits_for_match(phone TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  WITH digits AS (
    SELECT NULLIF(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), '') AS d
  )
  SELECT CASE
    WHEN d IS NULL THEN NULL
    WHEN length(d) = 11 AND left(d, 1) = '1' THEN substring(d FROM 2)
    WHEN length(d) = 10 THEN d
    ELSE d
  END
  FROM digits;
$$;

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
  v_match_digits TEXT;
BEGIN
  IF v_query IS NULL OR v_query = '' OR auth.uid() IS NULL THEN
    RETURN;
  END IF;

  -- Email fallback
  IF position('@' IN v_query) > 0 THEN
    RETURN QUERY
    SELECT p.id, p.first_name, p.city, p.neighborhood, p.avatar_url, p.phone_number
    FROM public.profiles p
    INNER JOIN auth.users u ON u.id = p.id
    WHERE lower(u.email) = lower(v_query)
      AND p.id <> auth.uid();
    RETURN;
  END IF;

  v_match_digits := public.normalize_phone_digits_for_match(v_query);

  IF v_match_digits IS NULL OR length(v_match_digits) < 10 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT p.id, p.first_name, p.city, p.neighborhood, p.avatar_url, p.phone_number
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE p.id <> auth.uid()
    AND (
      public.normalize_phone_digits_for_match(p.phone_number) = v_match_digits
      OR public.normalize_phone_digits_for_match(u.phone) = v_match_digits
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_users_by_contact(TEXT) TO authenticated;

-- Save phone_number from signup metadata (email verification flow, no session yet)
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
    NULLIF(trim(NEW.raw_user_meta_data->>'phone_number'), '')
  );
  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
