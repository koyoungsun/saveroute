-- 하나카드 제외 · 테스트/샘플 benefit_products 후보 탐지 (SELECT 전용)
-- 실행: Supabase SQL Editor 또는 psql
-- 비활성화 적용: migration 060_deactivate_non_hana_test_card_products.sql

WITH card_providers AS (
  SELECT p.id, p.code, p.name
  FROM public.providers p
  WHERE p.provider_type = 'card_company'
    AND p.is_active = TRUE
    AND p.code <> 'hana_card'
),
test_name_pattern AS (
  SELECT bp.id
  FROM public.benefit_products bp
  INNER JOIN card_providers p ON p.id = bp.provider_id
  WHERE bp.name ~* '(테스트|샘플|QA|개발용|임시|더미|test|sample|dummy|example|예시|점검용)'
),
test_code_pattern AS (
  SELECT bp.id
  FROM public.benefit_products bp
  INNER JOIN card_providers p ON p.id = bp.provider_id
  WHERE bp.code ~* '(^|[_-])(test|sample|dummy|qa|dev|example)([_-]|$)'
),
legacy_043_file_seed AS (
  -- 043_seed_card_products_from_file.sql 예시 파일 기반 (신한 Deep Dream / Mr.Life 등)
  SELECT bp.id
  FROM public.benefit_products bp
  INNER JOIN card_providers p ON p.id = bp.provider_id
  WHERE bp.code IN ('shinhan_card_deep_dream', 'shinhan_card_mr_life')
     OR (
       bp.code LIKE p.code || '_card_%'
       AND bp.code NOT LIKE p.code || '_cred_%'
       AND bp.code NOT LIKE p.code || '_deb_%'
       AND bp.code NOT LIKE p.code || '_cg_%'
       AND bp.code <> p.code || '_all'
     )
),
candidates AS (
  SELECT DISTINCT bp.id
  FROM public.benefit_products bp
  WHERE bp.id IN (SELECT id FROM test_name_pattern)
     OR bp.id IN (SELECT id FROM test_code_pattern)
     OR bp.id IN (SELECT id FROM legacy_043_file_seed)
)
SELECT
  bp.id,
  p.name AS provider_name,
  p.code AS provider_code,
  bp.name AS product_name,
  bp.code AS product_code,
  bp.benefit_type,
  bp.is_active,
  CASE
    WHEN bp.id IN (SELECT id FROM test_name_pattern) THEN 'name_pattern'
    WHEN bp.id IN (SELECT id FROM test_code_pattern) THEN 'code_pattern'
    WHEN bp.id IN (SELECT id FROM legacy_043_file_seed) THEN 'legacy_043_seed'
    ELSE 'other'
  END AS match_reason
FROM public.benefit_products bp
INNER JOIN card_providers p ON p.id = bp.provider_id
INNER JOIN candidates c ON c.id = bp.id
ORDER BY p.name, bp.name;
