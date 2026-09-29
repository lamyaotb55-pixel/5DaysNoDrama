-- Plans by You: user-published plans, admin review, follows.

-- Admins are matched by confirmed email, so the role can be granted before
-- the account exists.
CREATE TABLE public.app_admins (
  email TEXT PRIMARY KEY CHECK (email = lower(email))
);
ALTER TABLE public.app_admins ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.app_admins TO service_role;
INSERT INTO public.app_admins (email) VALUES ('bigboss@5daysnodrama.app');

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN public.app_admins a ON a.email = lower(u.email)
    WHERE u.id = auth.uid() AND u.email_confirmed_at IS NOT NULL
  );
$$;

-- A published plan. Only 'approved' rows are public; 'content' is always the
-- last approved version, so edits under review never leak.
CREATE TABLE public.community_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  base TEXT NOT NULL CHECK (base IN ('lose-weight', 'tone-up', 'build-muscle')),
  content JSONB,
  version INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'hidden', 'unpublished')),
  followers INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX community_plans_public_idx ON public.community_plans (status, followers DESC);

-- Each version an author sends in; the admin approves or rejects it.
CREATE TABLE public.plan_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.community_plans(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  base TEXT NOT NULL,
  content JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);
CREATE INDEX plan_submissions_pending_idx ON public.plan_submissions (status, created_at);

CREATE TABLE public.plan_follows (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.community_plans(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, plan_id)
);

ALTER TABLE public.community_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_follows ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.community_plans TO anon, authenticated;
GRANT SELECT ON public.plan_submissions TO authenticated;
GRANT SELECT ON public.plan_follows TO authenticated;
GRANT ALL ON public.community_plans, public.plan_submissions, public.plan_follows TO service_role;

-- Reads only; every write goes through the functions below.
CREATE POLICY "Approved plans are public" ON public.community_plans
  FOR SELECT TO anon, authenticated
  USING (status = 'approved' OR author_id = auth.uid() OR public.is_admin());
CREATE POLICY "Authors and admins see submissions" ON public.plan_submissions
  FOR SELECT TO authenticated
  USING (author_id = auth.uid() OR public.is_admin());
CREATE POLICY "Users see their own follows" ON public.plan_follows
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Author sends a plan (new, or a new version of one they own) for review.
CREATE OR REPLACE FUNCTION public.submit_plan(
  p_plan_id UUID,
  p_name TEXT,
  p_description TEXT,
  p_base TEXT,
  p_content JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_plan UUID := p_plan_id;
  v_author TEXT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign in to publish a plan'; END IF;
  p_name := btrim(coalesce(p_name, ''));
  p_description := btrim(coalesce(p_description, ''));
  IF length(p_name) < 3 OR length(p_name) > 60 THEN
    RAISE EXCEPTION 'Plan name must be 3 to 60 characters';
  END IF;
  IF length(p_description) > 500 THEN
    RAISE EXCEPTION 'Description must be 500 characters or fewer';
  END IF;
  IF p_base NOT IN ('lose-weight', 'tone-up', 'build-muscle') THEN
    RAISE EXCEPTION 'Unknown goal';
  END IF;
  IF p_content IS NULL OR length(p_content::text) > 200000 THEN
    RAISE EXCEPTION 'Plan is empty or too large';
  END IF;

  SELECT coalesce(nullif(btrim(display_name), ''), 'Anonymous') INTO v_author
  FROM profiles WHERE id = v_uid;
  v_author := coalesce(v_author, 'Anonymous');

  IF v_plan IS NULL THEN
    INSERT INTO community_plans (author_id, author_name, name, description, base)
    VALUES (v_uid, v_author, p_name, p_description, p_base)
    RETURNING id INTO v_plan;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM community_plans WHERE id = v_plan AND author_id = v_uid) THEN
      RAISE EXCEPTION 'You can only update your own plans';
    END IF;
    UPDATE community_plans
    SET author_name = v_author,
        status = CASE WHEN content IS NULL THEN 'pending' ELSE status END,
        updated_at = now()
    WHERE id = v_plan;
  END IF;

  -- One version waits for review at a time; the newest replaces older ones.
  DELETE FROM plan_submissions WHERE plan_id = v_plan AND status = 'pending';
  INSERT INTO plan_submissions (plan_id, author_id, name, description, base, content)
  VALUES (v_plan, v_uid, p_name, p_description, p_base, p_content);
  RETURN v_plan;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_submission(p_submission_id UUID, p_approve BOOLEAN, p_note TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s plan_submissions%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admins only'; END IF;
  SELECT * INTO s FROM plan_submissions WHERE id = p_submission_id AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'This submission was already reviewed'; END IF;

  IF p_approve THEN
    UPDATE community_plans
    SET name = s.name, description = s.description, base = s.base, content = s.content,
        version = version + 1, status = 'approved', approved_at = now(), updated_at = now()
    WHERE id = s.plan_id;
    UPDATE plan_submissions SET status = 'approved', note = nullif(btrim(p_note), ''), reviewed_at = now()
    WHERE id = s.id;
  ELSE
    UPDATE plan_submissions SET status = 'rejected', note = nullif(btrim(p_note), ''), reviewed_at = now()
    WHERE id = s.id;
    UPDATE community_plans SET status = 'rejected', updated_at = now()
    WHERE id = s.plan_id AND content IS NULL;
  END IF;
END;
$$;

-- Admin: hide / show. Author: unpublish (and publish again only via review).
CREATE OR REPLACE FUNCTION public.set_plan_status(p_plan_id UUID, p_status TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  p community_plans%ROWTYPE;
BEGIN
  SELECT * INTO p FROM community_plans WHERE id = p_plan_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Plan not found'; END IF;
  IF public.is_admin() AND p_status IN ('hidden', 'approved') THEN
    IF p_status = 'approved' AND p.content IS NULL THEN
      RAISE EXCEPTION 'Approve a submission first';
    END IF;
    UPDATE community_plans SET status = p_status, updated_at = now() WHERE id = p_plan_id;
  ELSIF p.author_id = v_uid AND p_status = 'unpublished' THEN
    UPDATE community_plans SET status = 'unpublished', updated_at = now() WHERE id = p_plan_id;
    DELETE FROM plan_submissions WHERE plan_id = p_plan_id AND status = 'pending';
  ELSE
    RAISE EXCEPTION 'Not allowed';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.follow_plan(p_plan_id UUID, p_follow BOOLEAN)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_count INTEGER;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign in to follow'; END IF;
  IF p_follow THEN
    IF NOT EXISTS (SELECT 1 FROM community_plans WHERE id = p_plan_id AND status = 'approved') THEN
      RAISE EXCEPTION 'Plan not available';
    END IF;
    INSERT INTO plan_follows (user_id, plan_id) VALUES (v_uid, p_plan_id) ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM plan_follows WHERE user_id = v_uid AND plan_id = p_plan_id;
  END IF;
  SELECT count(*) INTO v_count FROM plan_follows WHERE plan_id = p_plan_id;
  UPDATE community_plans SET followers = v_count WHERE id = p_plan_id;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_plan(UUID, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.review_submission(UUID, BOOLEAN, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_plan_status(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.follow_plan(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_plan(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_submission(UUID, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_plan_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.follow_plan(UUID, BOOLEAN) TO authenticated;

CREATE TRIGGER community_plans_touch_updated_at
  BEFORE UPDATE ON public.community_plans
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
