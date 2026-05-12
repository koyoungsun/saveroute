-- SaveRoute: 원격 DB에서 brands RLS 정책·QA 행 존재 여부를 분리 확인
-- Supabase Dashboard → SQL Editor 에서 실행

-- 1) public.brands 의 정책 목록 (생성 여부 확인)
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'brands';

-- 2) qa-starbucks 행 존재·활성 여부 (데이터 확인)
SELECT id, name, slug, is_active, admin_memo
FROM public.brands
WHERE slug = 'qa-starbucks';
