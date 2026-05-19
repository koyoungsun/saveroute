-- 060: 하나카드 제외 테스트 카드 benefit_products 비활성화 + 연쇄 user_benefits 정리
-- 탐지 SELECT: supabase/sql/cleanup/detect_test_card_products.sql
-- 검증 SELECT: supabase/sql/cleanup/verify_after_card_cleanup.sql

-- §1 탐지 CTE (060 UPDATE 와 동일 기준)
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
deactivate_ids AS (
  SELECT DISTINCT bp.id
  FROM public.benefit_products bp
  WHERE bp.is_active = TRUE
    AND (
      bp.id IN (SELECT id FROM test_name_pattern)
      OR bp.id IN (SELECT id FROM test_code_pattern)
      OR bp.id IN (SELECT id FROM legacy_043_file_seed)
    )
)
UPDATE public.benefit_products bp
SET
  is_active = FALSE,
  updated_at = NOW()
FROM deactivate_ids d
WHERE bp.id = d.id;

-- §2 비활성 상품을 참조하는 user_benefits 비활성화
UPDATE public.user_benefits ub
SET
  is_active = FALSE,
  updated_at = NOW()
FROM public.benefit_products bp
WHERE ub.benefit_product_id = bp.id
  AND bp.is_active = FALSE
  AND ub.is_active = TRUE;

-- §3 정리 후 검증 (실패 시 migration 중단)
DO $$
DECLARE
  bad_bp_count INT;
  bad_ub_count INT;
  bad_test_active INT;
  bad_all_product INT;
BEGIN
  SELECT COUNT(*)
  INTO bad_bp_count
  FROM public.benefit_products
  WHERE benefit_type IS NOT NULL
    AND benefit_type NOT IN ('credit', 'debit', 'prepaid', 'all');

  IF bad_bp_count > 0 THEN
    RAISE EXCEPTION 'verify failed: benefit_products invalid benefit_type rows = %', bad_bp_count;
  END IF;

  SELECT COUNT(*)
  INTO bad_ub_count
  FROM public.user_benefits
  WHERE benefit_type IS NOT NULL
    AND benefit_type NOT IN ('credit', 'debit', 'prepaid', 'all');

  IF bad_ub_count > 0 THEN
    RAISE EXCEPTION 'verify failed: user_benefits invalid benefit_type rows = %', bad_ub_count;
  END IF;

  SELECT COUNT(*)
  INTO bad_test_active
  FROM public.benefit_products bp
  INNER JOIN public.providers p ON p.id = bp.provider_id
  WHERE p.provider_type = 'card_company'
    AND p.code <> 'hana_card'
    AND bp.is_active = TRUE
    AND (
      bp.name ~* '(테스트|샘플|QA|개발용|임시|더미|test|sample|dummy|example|예시|점검용)'
      OR bp.code ~* '(^|[_-])(test|sample|dummy|qa|dev|example)([_-]|$)'
      OR bp.code IN ('shinhan_card_deep_dream', 'shinhan_card_mr_life')
      OR (
        bp.code LIKE p.code || '_card_%'
        AND bp.code NOT LIKE p.code || '_cred_%'
        AND bp.code NOT LIKE p.code || '_deb_%'
        AND bp.code NOT LIKE p.code || '_cg_%'
        AND bp.code <> p.code || '_all'
      )
    );

  IF bad_test_active > 0 THEN
    RAISE EXCEPTION 'verify failed: active test-like card products (non-hana) = %', bad_test_active;
  END IF;

  SELECT COUNT(*)
  INTO bad_all_product
  FROM (
    SELECT bp.provider_id
    FROM public.benefit_products bp
    WHERE bp.is_all_product = TRUE
      AND bp.benefit_type = 'all'
      AND bp.is_active = TRUE
    GROUP BY bp.provider_id
    HAVING COUNT(*) <> 1
  ) x;

  IF bad_all_product > 0 THEN
    RAISE EXCEPTION 'verify failed: providers with != 1 active all-product row = %', bad_all_product;
  END IF;

  RAISE NOTICE '060 verify OK: benefit_type clean, test cards inactive, all-product unique per provider';
END $$;
