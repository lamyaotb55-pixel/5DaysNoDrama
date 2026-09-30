-- Admin dashboard numbers. Only the admin account gets an answer.
CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admins only'; END IF;

  WITH sessions AS (
    SELECT d.user_id,
           to_timestamp((h ->> 'at')::double precision / 1000) AS at,
           h ->> 'planId' AS plan_id
    FROM user_data d,
         jsonb_array_elements(CASE WHEN jsonb_typeof(d.state -> 'history') = 'array'
                                   THEN d.state -> 'history' ELSE '[]'::jsonb END) h
    WHERE (h ->> 'at') ~ '^[0-9.]+$'
  ),
  days AS (
    SELECT generate_series((now() AT TIME ZONE 'Asia/Riyadh')::date - 13,
                           (now() AT TIME ZONE 'Asia/Riyadh')::date, '1 day')::date AS day
  )
  SELECT jsonb_build_object(
    'generatedAt', now(),
    'users', jsonb_build_object(
      'total', (SELECT count(*) FROM auth.users),
      'confirmed', (SELECT count(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL),
      'new7', (SELECT count(*) FROM auth.users WHERE created_at > now() - interval '7 days'),
      'new30', (SELECT count(*) FROM auth.users WHERE created_at > now() - interval '30 days'),
      'signedIn7', (SELECT count(*) FROM auth.users WHERE last_sign_in_at > now() - interval '7 days'),
      'google', (SELECT count(*) FROM auth.users WHERE raw_app_meta_data ->> 'provider' = 'google'),
      'withProgress', (SELECT count(*) FROM user_data WHERE jsonb_typeof(state -> 'history') = 'array'
                                                        AND jsonb_array_length(state -> 'history') > 0)
    ),
    'activity', jsonb_build_object(
      'workoutsTotal', (SELECT count(*) FROM sessions),
      'workouts7', (SELECT count(*) FROM sessions WHERE at > now() - interval '7 days'),
      'active7', (SELECT count(DISTINCT user_id) FROM sessions WHERE at > now() - interval '7 days'),
      'active30', (SELECT count(DISTINCT user_id) FROM sessions WHERE at > now() - interval '30 days'),
      'finished8Weeks', (SELECT count(*) FROM user_data
                         WHERE (jsonb_typeof(state -> 'programSeen') = 'object' AND state -> 'programSeen' <> '{}'::jsonb)
                            OR EXISTS (SELECT 1 FROM jsonb_array_elements(
                                         CASE WHEN jsonb_typeof(state -> 'tracks') = 'array' THEN state -> 'tracks' ELSE '[]'::jsonb END) tr
                                       WHERE (tr ->> 'daysDone') ~ '^[0-9]+$' AND (tr ->> 'daysDone')::int >= 40)),
      'perDay', (SELECT coalesce(jsonb_agg(jsonb_build_object('day', days.day, 'workouts', coalesce(c.n, 0)) ORDER BY days.day), '[]'::jsonb)
                 FROM days
                 LEFT JOIN (SELECT (at AT TIME ZONE 'Asia/Riyadh')::date AS day, count(*) AS n FROM sessions GROUP BY 1) c
                   ON c.day = days.day)
    ),
    'plans', (SELECT coalesce(jsonb_object_agg(k, n), '{}'::jsonb) FROM (
                SELECT CASE WHEN state ->> 'activePlanId' LIKE 'my-%' THEN 'custom'
                            ELSE coalesce(state ->> 'activePlanId', 'none') END AS k,
                       count(*) AS n
                FROM user_data GROUP BY 1) p),
    'language', (SELECT coalesce(jsonb_object_agg(k, n), '{}'::jsonb) FROM (
                SELECT coalesce(state ->> 'language', 'not set') AS k, count(*) AS n FROM user_data GROUP BY 1) l),
    'unit', (SELECT coalesce(jsonb_object_agg(k, n), '{}'::jsonb) FROM (
                SELECT coalesce(state ->> 'unit', 'kg') AS k, count(*) AS n FROM user_data GROUP BY 1) u),
    'community', jsonb_build_object(
      'live', (SELECT count(*) FROM community_plans WHERE status = 'approved'),
      'waiting', (SELECT count(*) FROM plan_submissions WHERE status = 'pending'),
      'follows', (SELECT count(*) FROM plan_follows)
    ),
    'recent', (SELECT coalesce(jsonb_agg(r ORDER BY r.created_at DESC), '[]'::jsonb) FROM (
                SELECT u.email,
                       coalesce(nullif(btrim(p.display_name), ''), split_part(u.email, '@', 1)) AS name,
                       u.created_at, u.last_sign_in_at,
                       u.raw_app_meta_data ->> 'provider' AS provider,
                       (SELECT count(*) FROM sessions s WHERE s.user_id = u.id) AS workouts,
                       (SELECT max(s.at) FROM sessions s WHERE s.user_id = u.id) AS last_workout
                FROM auth.users u LEFT JOIN profiles p ON p.id = u.id
                ORDER BY u.created_at DESC LIMIT 25) r)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_stats() TO authenticated;
