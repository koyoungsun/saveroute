-- 통신 3사 멤버십 "전체" 상품 (등급 무관 할인·매칭용)
-- benefit_type=all · is_all_product=true · product_type=telecom_membership

WITH cid AS (
  SELECT id AS benefit_category_id
  FROM public.benefit_categories
  WHERE code = 'telecom'
  LIMIT 1
),
incoming AS (
  SELECT
    c.benefit_category_id,
    p.id AS provider_id,
    v.name,
    v.code,
    'telecom_membership'::TEXT AS product_type,
    '전체'::TEXT AS grade,
    'all'::TEXT AS benefit_type,
    TRUE AS is_all_product
  FROM cid c
  CROSS JOIN (VALUES
    ('SKT 전체', 'skt_membership_all', 'skt'),
    ('KT 전체', 'kt_membership_all', 'kt'),
    ('LG U+ 전체', 'lguplus_membership_all', 'lguplus')
  ) AS v(name, code, provider_code)
  JOIN public.providers p ON p.code = v.provider_code
    AND p.provider_type = 'telecom_major'
    AND p.is_active = TRUE
)
INSERT INTO public.benefit_products (
  benefit_category_id,
  provider_id,
  name,
  code,
  product_type,
  grade,
  card_type,
  benefit_type,
  is_all_product,
  is_mvno,
  mvno_notice_required,
  is_active
)
SELECT
  i.benefit_category_id,
  i.provider_id,
  i.name,
  i.code,
  i.product_type,
  i.grade,
  NULL::TEXT,
  i.benefit_type,
  i.is_all_product,
  FALSE,
  FALSE,
  TRUE
FROM incoming i
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  benefit_category_id = EXCLUDED.benefit_category_id,
  provider_id = EXCLUDED.provider_id,
  product_type = EXCLUDED.product_type,
  grade = EXCLUDED.grade,
  benefit_type = EXCLUDED.benefit_type,
  is_all_product = EXCLUDED.is_all_product,
  is_active = TRUE,
  updated_at = NOW();

-- provider당 통신사 전체 1건 확인 (카드사 전체 uidx 와 동일 플래그, provider_id 가 다름)
DO $$
DECLARE
  missing TEXT;
BEGIN
  SELECT string_agg(v.expected, ', ')
  INTO missing
  FROM (VALUES ('skt'), ('kt'), ('lguplus')) AS v(expected)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.benefit_products bp
    JOIN public.providers p ON p.id = bp.provider_id
    WHERE p.code = v.expected
      AND bp.is_all_product = TRUE
      AND bp.benefit_type = 'all'
      AND bp.product_type = 'telecom_membership'
      AND bp.is_active = TRUE
  );

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION '062 verify failed: missing telecom all products for %', missing;
  END IF;

  RAISE NOTICE '062 verify OK: SKT/KT/LG U+ telecom all products present';
END $$;
