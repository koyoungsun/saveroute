CREATE TABLE IF NOT EXISTS public.app_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT app_notices_title_not_blank CHECK (char_length(trim(title)) > 0),
  CONSTRAINT app_notices_body_not_blank CHECK (char_length(trim(body)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_app_notices_published_at
  ON public.app_notices (is_published, published_at DESC NULLS LAST, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_app_notices_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_app_notices_updated_at ON public.app_notices;
CREATE TRIGGER set_app_notices_updated_at
  BEFORE UPDATE ON public.app_notices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_app_notices_updated_at();

ALTER TABLE public.app_notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public can read published app notices" ON public.app_notices;
CREATE POLICY "public can read published app notices"
  ON public.app_notices FOR SELECT
  TO anon, authenticated
  USING (is_published = TRUE);

DROP POLICY IF EXISTS "admins can read all app notices" ON public.app_notices;
CREATE POLICY "admins can read all app notices"
  ON public.app_notices FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admins can manage app notices" ON public.app_notices;
CREATE POLICY "admins can manage app notices"
  ON public.app_notices FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
