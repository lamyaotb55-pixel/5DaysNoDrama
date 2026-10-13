-- Contact & suggestions: messages from signed-in users to the team.
-- Nobody reads or writes the table directly; everything goes through the
-- functions below, which check who is asking.
CREATE TABLE public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL CHECK (kind IN ('idea', 'problem', 'other')),
  body TEXT NOT NULL CHECK (char_length(btrim(body)) BETWEEN 5 AND 2000),
  lang TEXT NOT NULL DEFAULT 'en' CHECK (lang IN ('en', 'ar')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'done')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  done_at TIMESTAMPTZ
);
CREATE INDEX support_messages_user_time ON public.support_messages (user_id, created_at DESC);
CREATE INDEX support_messages_time ON public.support_messages (created_at DESC);
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.support_messages TO service_role;

-- Send a message. Confirmed accounts only, at most 5 a day per person.
-- Returns what the email alert needs.
CREATE OR REPLACE FUNCTION public.send_support_message(p_kind TEXT, p_body TEXT, p_lang TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  u auth.users%ROWTYPE;
  who TEXT;
  row_id UUID;
BEGIN
  SELECT * INTO u FROM auth.users WHERE id = auth.uid();
  IF u.id IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF u.email_confirmed_at IS NULL THEN RAISE EXCEPTION 'Confirm your email first'; END IF;
  IF (SELECT count(*) FROM support_messages
      WHERE user_id = u.id AND created_at > now() - interval '1 day') >= 5 THEN
    RAISE EXCEPTION 'Daily limit reached';
  END IF;

  SELECT left(coalesce(nullif(btrim(p.display_name), ''), split_part(u.email, '@', 1)), 80)
  INTO who FROM profiles p WHERE p.id = u.id;
  who := coalesce(who, split_part(u.email, '@', 1));

  INSERT INTO support_messages (user_id, email, name, kind, body, lang)
  VALUES (u.id, lower(u.email), who, p_kind, btrim(p_body),
          CASE WHEN p_lang = 'ar' THEN 'ar' ELSE 'en' END)
  RETURNING id INTO row_id;

  RETURN jsonb_build_object('id', row_id, 'email', lower(u.email), 'name', who);
END;
$$;

-- Admin: newest messages first.
CREATE OR REPLACE FUNCTION public.admin_messages()
RETURNS SETOF public.support_messages
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admins only'; END IF;
  RETURN QUERY SELECT * FROM support_messages ORDER BY created_at DESC LIMIT 500;
END;
$$;

-- Admin: mark a message done, or back to new.
CREATE OR REPLACE FUNCTION public.set_message_done(p_id UUID, p_done BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admins only'; END IF;
  UPDATE support_messages
  SET status = CASE WHEN p_done THEN 'done' ELSE 'new' END,
      done_at = CASE WHEN p_done THEN now() END
  WHERE id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.send_support_message(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_messages() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_message_done(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_support_message(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_messages() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_message_done(UUID, BOOLEAN) TO authenticated;
