-- Add new recommendation categories (safe to re-run)

DO $$
DECLARE
  cat TEXT;
BEGIN
  FOREACH cat IN ARRAY ARRAY[
    'landscaper',
    'painter',
    'elderly_caretaker',
    'personal_trainer',
    'pest_control',
    'gutter_cleaner',
    'tree_trimming',
    'wallpaper_installer',
    'woodworker',
    'house_cleaner',
    'mover',
    'mechanic',
    'hvac',
    'cleaner'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typname = 'recommendation_category'
        AND e.enumlabel = cat
    ) THEN
      EXECUTE format('ALTER TYPE public.recommendation_category ADD VALUE %L', cat);
    END IF;
  END LOOP;
END $$;
