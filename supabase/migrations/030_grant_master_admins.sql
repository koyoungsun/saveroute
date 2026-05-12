WITH target_users AS (
  SELECT id, email
  FROM auth.users
  WHERE LOWER(email) IN ('srrtr4@naver.com', 'srrtr4@gmail.com')
)
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'master'
FROM target_users
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  role = 'master',
  updated_at = NOW();
