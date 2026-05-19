-- ============================================
-- search_logs / profiles 구조 확인용 (마이그레이션 실행 전 · 수동 실행)
-- Supabase SQL Editor 또는 psql에서 실행
-- ============================================

-- 1) search_logs 컬럼 목록
SELECT
  ordinal_position,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'search_logs'
ORDER BY ordinal_position;

-- 2) search_logs 에서 user_id 컬럼 존재 여부만 빠르게 확인
SELECT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'search_logs'
    AND column_name = 'user_id'
) AS search_logs_has_user_id;

-- 3) search_logs 외래키 (user_id → auth.users)
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.constraint_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
  AND rc.constraint_schema = tc.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'search_logs'
  AND tc.constraint_type = 'FOREIGN KEY';

-- 4) profiles 필수 컬럼 존재 여부
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN (
    'nickname',
    'allow_search_stats',
    'allow_personalized_recommendations',
    'allow_marketing_notifications',
    'updated_at'
  )
ORDER BY column_name;

-- 5) search_logs RLS 정책 이름 확인 (디버깅용)
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'search_logs'
ORDER BY policyname;
