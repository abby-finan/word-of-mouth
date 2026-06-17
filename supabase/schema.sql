-- Word of Mouth (WOM) Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  city TEXT,
  neighborhood TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Recommendation categories (enum-like)
CREATE TYPE recommendation_category AS ENUM (
  'plumber',
  'electrician',
  'landscaper',
  'lawn_care',
  'painter',
  'handyman',
  'babysitter',
  'pet_sitter',
  'dog_walker',
  'elderly_caretaker',
  'personal_trainer',
  'therapist',
  'hair_stylist',
  'pest_control',
  'gutter_cleaner',
  'tree_trimming',
  'wallpaper_installer',
  'woodworker',
  'house_cleaner',
  'mover',
  'mechanic',
  'hvac',
  'cleaner',
  'other'
);

-- Recommendations (one per category per user)
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category recommendation_category NOT NULL,
  provider_name TEXT NOT NULL,
  provider_photo_url TEXT,
  phone TEXT,
  note TEXT,
  how_i_know_them TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, category)
);

-- Friendships
CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'declined');

CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status friendship_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

-- Saved recommendations
CREATE TABLE saved_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, recommendation_id)
);

-- Indexes
CREATE INDEX idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX idx_recommendations_category ON recommendations(category);
CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_saved_recommendations_user_id ON saved_recommendations(user_id);

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

-- Auto-create profile on signup
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER recommendations_updated_at
  BEFORE UPDATE ON recommendations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_recommendations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view friends profiles"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT CASE
        WHEN requester_id = auth.uid() AND status = 'accepted' THEN addressee_id
        WHEN addressee_id = auth.uid() AND status = 'accepted' THEN requester_id
      END
      FROM friendships
      WHERE status = 'accepted'
        AND (requester_id = auth.uid() OR addressee_id = auth.uid())
    )
  );

CREATE POLICY "Users can view pending request sender profiles"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT requester_id
      FROM friendships
      WHERE addressee_id = auth.uid()
        AND status = 'pending'
    )
  );

CREATE POLICY "Users can view pending request recipient profiles"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT addressee_id
      FROM friendships
      WHERE requester_id = auth.uid()
        AND status = 'pending'
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Recommendations policies
CREATE POLICY "Users can view own recommendations"
  ON recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view friends recommendations"
  ON recommendations FOR SELECT
  USING (
    user_id IN (
      SELECT CASE
        WHEN requester_id = auth.uid() AND status = 'accepted' THEN addressee_id
        WHEN addressee_id = auth.uid() AND status = 'accepted' THEN requester_id
      END
      FROM friendships
      WHERE status = 'accepted'
        AND (requester_id = auth.uid() OR addressee_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert own recommendations"
  ON recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
  ON recommendations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recommendations"
  ON recommendations FOR DELETE
  USING (auth.uid() = user_id);

-- Friendships policies
CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can send friend requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update friendships they're part of"
  ON friendships FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can delete own friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Saved recommendations policies
CREATE POLICY "Users can view own saved"
  ON saved_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save recommendations"
  ON saved_recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave recommendations"
  ON saved_recommendations FOR DELETE
  USING (auth.uid() = user_id);

-- Allow searching profiles by email (for adding friends)
-- This requires a function since we can't directly query auth.users
CREATE OR REPLACE FUNCTION search_users_by_email(search_email TEXT)
RETURNS TABLE (id UUID, first_name TEXT, city TEXT, avatar_url TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.first_name, p.city, p.avatar_url
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE LOWER(u.email) = LOWER(search_email)
    AND p.id != auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION search_users_by_email(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.normalize_phone_digits(phone TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), '');
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

-- Top recommendations by city/neighborhood with friend boost
CREATE OR REPLACE FUNCTION public.get_top_recommendations(
  p_category public.recommendation_category,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  provider_name TEXT,
  phone TEXT,
  note TEXT,
  recommendation_count BIGINT,
  friend_recommendation_count BIGINT,
  score NUMERIC,
  recommendation_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_city TEXT;
  v_neighborhood TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT p.city, p.neighborhood
  INTO v_city, v_neighborhood
  FROM public.profiles p
  WHERE p.id = v_user_id;

  IF v_city IS NULL OR trim(v_city) = '' THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH friend_ids AS (
    SELECT CASE
      WHEN f.requester_id = v_user_id THEN f.addressee_id
      ELSE f.requester_id
    END AS friend_id
    FROM public.friendships f
    WHERE f.status = 'accepted'
      AND (f.requester_id = v_user_id OR f.addressee_id = v_user_id)
  ),
  local_recs AS (
    SELECT
      r.id,
      r.provider_name,
      r.phone,
      r.note,
      r.created_at,
      CASE WHEN fi.friend_id IS NOT NULL THEN 1 ELSE 0 END AS is_friend,
      CASE
        WHEN v_neighborhood IS NOT NULL
          AND trim(v_neighborhood) <> ''
          AND lower(trim(coalesce(p.neighborhood, ''))) = lower(trim(v_neighborhood))
        THEN 2
        ELSE 1
      END AS location_weight
    FROM public.recommendations r
    INNER JOIN public.profiles p ON p.id = r.user_id
    LEFT JOIN friend_ids fi ON fi.friend_id = r.user_id
    WHERE r.category = p_category
      AND r.user_id <> v_user_id
      AND lower(trim(coalesce(p.city, ''))) = lower(trim(v_city))
  ),
  grouped AS (
    SELECT
      lower(trim(lr.provider_name)) AS provider_key,
      min(lr.provider_name) AS provider_name,
      count(*)::BIGINT AS recommendation_count,
      sum(lr.is_friend)::BIGINT AS friend_recommendation_count,
      sum(lr.location_weight + (lr.is_friend * 3))::NUMERIC AS score,
      (array_agg(lr.id ORDER BY lr.is_friend DESC, lr.location_weight DESC, lr.created_at DESC))[1] AS recommendation_id,
      (array_agg(lr.phone ORDER BY (lr.phone IS NOT NULL) DESC, lr.created_at DESC))[1] AS phone,
      (array_agg(lr.note ORDER BY length(coalesce(lr.note, '')) DESC, lr.created_at DESC))[1] AS note
    FROM local_recs lr
    GROUP BY lower(trim(lr.provider_name))
  )
  SELECT
    g.provider_name,
    g.phone,
    g.note,
    g.recommendation_count,
    g.friend_recommendation_count,
    g.score,
    g.recommendation_id
  FROM grouped g
  ORDER BY g.score DESC, g.recommendation_count DESC, g.provider_name ASC
  LIMIT GREATEST(p_limit, 1);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_top_recommendations(public.recommendation_category, INT)
  TO authenticated;
