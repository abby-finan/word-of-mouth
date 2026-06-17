-- Signup trigger: don't fail account creation when phone is already taken.
-- Phone is saved again after signup via updateProfile with a clear app error.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT := NULLIF(trim(NEW.raw_user_meta_data->>'phone_number'), '');
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, first_name, phone_number, onboarding_complete)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'first_name', 'New User'),
      v_phone,
      false
    );
  EXCEPTION
    WHEN unique_violation THEN
      INSERT INTO public.profiles (id, first_name, onboarding_complete)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'New User'),
        false
      )
      ON CONFLICT (id) DO NOTHING;
  END;

  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
