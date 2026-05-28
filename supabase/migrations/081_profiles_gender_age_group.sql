-- profiles: gender 컬럼 추가, age_group 값 정리 (60s+ → 60plus), 회원가입 메타 반영

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender TEXT;

COMMENT ON COLUMN public.profiles.gender IS
  '성별 (male, female, other, prefer_not_to_say). 통계·추천 품질 개선용.';

-- 기존 gender_group → gender 백필
UPDATE public.profiles
SET gender = gender_group
WHERE gender IS NULL
  AND gender_group IS NOT NULL;

-- age_group 레거시 값 정리
UPDATE public.profiles
SET age_group = '60plus'
WHERE age_group = '60s+';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_gender_group_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_age_group_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_gender_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_gender_check
  CHECK (
    gender IS NULL
    OR gender IN ('male', 'female', 'other', 'prefer_not_to_say')
  );

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_age_group_check
  CHECK (
    age_group IS NULL
    OR age_group IN ('10s', '20s', '30s', '40s', '50s', '60plus')
  );

-- gender_group 은 레거시 호환용으로 유지 (male/female/other 만)
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_gender_group_check
  CHECK (
    gender_group IS NULL
    OR gender_group IN ('male', 'female', 'other')
  );

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_nickname TEXT := NULLIF(TRIM(meta->>'nickname'), '');
  v_gender TEXT := NULLIF(TRIM(meta->>'gender'), '');
  v_age_group TEXT := NULLIF(TRIM(meta->>'age_group'), '');
  v_allow_search_stats BOOLEAN := COALESCE((meta->>'allow_search_stats')::boolean, TRUE);
  v_allow_personalized BOOLEAN := COALESCE(
    (meta->>'allow_personalized_recommendations')::boolean,
    TRUE
  );
  v_allow_marketing BOOLEAN := COALESCE(
    (meta->>'allow_marketing_notifications')::boolean,
    FALSE
  );
BEGIN
  IF v_gender IS NOT NULL
    AND v_gender NOT IN ('male', 'female', 'other', 'prefer_not_to_say') THEN
    v_gender := NULL;
  END IF;

  IF v_age_group IS NOT NULL
    AND v_age_group NOT IN ('10s', '20s', '30s', '40s', '50s', '60plus') THEN
    v_age_group := NULL;
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    role,
    nickname,
    gender,
    gender_group,
    age_group,
    allow_search_stats,
    allow_personalized_recommendations,
    allow_marketing_notifications
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    'user',
    v_nickname,
    v_gender,
    CASE
      WHEN v_gender IN ('male', 'female', 'other') THEN v_gender
      ELSE NULL
    END,
    v_age_group,
    v_allow_search_stats,
    v_allow_personalized,
    v_allow_marketing
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
