-- benefit_products 에서 논리적 중복 확인 (통신 등급 / 카드 상품 등)
-- 주의: benefit_type 컬럼은 migration 039 이후 존재합니다. 그 이전에는 benefit_type 행 전부 NULL 로 보입니다.
--
-- Supabase Studio / psql 에서 실행

SELECT
  provider_id,
  name,
  benefit_type,
  COUNT(*) AS cnt
FROM public.benefit_products
GROUP BY provider_id, name, benefit_type
HAVING COUNT(*) > 1
ORDER BY cnt DESC, provider_id, name, benefit_type;
