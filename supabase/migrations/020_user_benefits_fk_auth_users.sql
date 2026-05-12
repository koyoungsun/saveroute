-- user_benefits.user_id → auth.users(id) (정책 명시; profiles.id와 동일 UUID)

ALTER TABLE public.user_benefits
  DROP CONSTRAINT IF EXISTS user_benefits_user_id_fkey;

ALTER TABLE public.user_benefits
  ADD CONSTRAINT user_benefits_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
