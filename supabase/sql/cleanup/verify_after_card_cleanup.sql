-- 정리·057/058/059 적용 후 수동 검증 (SELECT 전용)

-- 1) benefit_products.benefit_type 허용값 외
SELECT id, name, code, benefit_type
FROM public.benefit_products
WHERE benefit_type IS NOT NULL
  AND benefit_type NOT IN ('credit', 'debit', 'prepaid', 'all');

-- 2) user_benefits.benefit_type 허용값 외
SELECT id, user_id, benefit_product_id, benefit_type
FROM public.user_benefits
WHERE benefit_type IS NOT NULL
  AND benefit_type NOT IN ('credit', 'debit', 'prepaid', 'all');

-- 3) 하나카드 외 active 테스트/샘플성 카드명·코드
SELECT
  p.name AS provider_name,
  bp.id,
  bp.name AS product_name,
  bp.code,
  bp.is_active
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
  )
ORDER BY p.name, bp.name;

-- 4) 카드사 전체 상품 — provider당 active 1개 여부
SELECT
  p.name AS provider_name,
  p.code AS provider_code,
  COUNT(*) FILTER (WHERE bp.is_active) AS active_all_product_count,
  array_agg(bp.name ORDER BY bp.id) FILTER (WHERE bp.is_active) AS active_names
FROM public.providers p
LEFT JOIN public.benefit_products bp
  ON bp.provider_id = p.id
 AND bp.is_all_product = TRUE
 AND bp.benefit_type = 'all'
WHERE p.provider_type = 'card_company'
  AND p.is_active = TRUE
GROUP BY p.id, p.name, p.code
HAVING COUNT(*) FILTER (WHERE bp.is_active) <> 1
ORDER BY p.name;

-- 5) 비활성 상품을 참조하는 active user_benefits (0건 기대)
SELECT
  ub.id,
  ub.user_id,
  bp.name AS product_name,
  bp.is_active AS product_active,
  ub.is_active AS user_benefit_active
FROM public.user_benefits ub
INNER JOIN public.benefit_products bp ON bp.id = ub.benefit_product_id
WHERE ub.is_active = TRUE
  AND bp.is_active = FALSE;
