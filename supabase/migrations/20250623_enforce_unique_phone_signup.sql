-- Block signup when phone number is already on another account.
-- Reverts the "resilience" trigger that silently dropped duplicate phones.

CREATE OR REPLACE FUNCTION public.is_phone_number_taken(phone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match_digits TEXT;
BEGIN
  v_match_digits := public.normalize_phone_digits_for_match(phone);
  IF v_match_digits IS NULL OR length(v_match_digits) < 10 THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE public.normalize_phone_digits_for_match(p.phone_number) = v_match_digits
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_phone_number_taken(TEXT) TO anon, authenticated;

-- Catch format variants (+19195009338 vs 9195009338) at the database level.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_match_digits_unique
  ON public.profiles (public.normalize_phone_digits_for_match(phone_number))
  WHERE phone_number IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT := NULLIF(trim(NEW.raw_user_meta_data->>'phone_number'), '');
BEGIN
  IF v_phone IS NOT NULL AND public.is_phone_number_taken(v_phone) THEN
    RAISE EXCEPTION 'duplicate_phone_number'
      USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.profiles (id, first_name, phone_number, onboarding_complete)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'New User'),
    v_phone,
    false
  );

  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
