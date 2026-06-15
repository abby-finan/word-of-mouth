-- Top Recommendations: city-scoped provider ranking with friend boost
-- Safe to re-run (CREATE OR REPLACE)

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
