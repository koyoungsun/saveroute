-- Canonical admin identities for SaveRoute Admin + RLS helpers

CREATE TABLE IF NOT EXISTS public.admin_accounts (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operator', 'master')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_accounts_email_lower ON public.admin_accounts (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_admin_accounts_active_role ON public.admin_accounts (is_active, role);

-- Migrate existing profile-based admins
INSERT INTO public.admin_accounts (user_id, email, role, is_active)
SELECT id, email, role, TRUE
FROM public.profiles
WHERE role IN ('admin', 'operator', 'master')
ON CONFLICT (user_id) DO UPDATE
SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  is_active = TRUE,
  updated_at = NOW();

-- Known master operators (exist in Auth)
INSERT INTO public.admin_accounts (user_id, email, role, is_active)
SELECT id, COALESCE(email, ''), 'master', TRUE
FROM auth.users
WHERE LOWER(TRIM(email)) IN ('srrtr4@naver.com', 'srrtr4@gmail.com')
ON CONFLICT (user_id) DO UPDATE
SET
  email = COALESCE(EXCLUDED.email, admin_accounts.email),
  role = 'master',
  is_active = TRUE,
  updated_at = NOW();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_accounts aa
    WHERE aa.user_id = auth.uid()
      AND aa.is_active = TRUE
      AND aa.role IN ('admin', 'operator', 'master')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;
