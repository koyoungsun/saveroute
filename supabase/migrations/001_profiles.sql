CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'operator', 'master')),
  gender_group TEXT
    CHECK (gender_group IN ('male', 'female', 'other') OR gender_group IS NULL),
  age_group TEXT
    CHECK (age_group IN ('10s', '20s', '30s', '40s', '50s', '60s+') OR age_group IS NULL),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
