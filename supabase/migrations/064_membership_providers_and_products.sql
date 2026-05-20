-- membership 카테고리 제공사 + 전체 상품 seed (멱등 upsert)
-- benefit_categories.code = membership 재사용 · 신규 카테고리 생성 없음

WITH membership_category AS (
  SELECT id AS benefit_category_id
  FROM public.benefit_categories
  WHERE code = 'membership'
  LIMIT 1
),
provider_seed AS (
  SELECT
    c.benefit_category_id,
    v.name,
    v.code
  FROM membership_category c
  CROSS JOIN (VALUES
    ('OK캐시백', 'okcashbag'),
    ('CJ ONE', 'cj_one'),
    ('해피포인트', 'happy_point'),
    ('L.POINT', 'lpoint'),
    ('신세계포인트', 'shinsegae_point'),
    ('H.Point', 'hpoint')
  ) AS v(name, code)
)
INSERT INTO public.providers (
  benefit_category_id,
  name,
  code,
  provider_type,
  is_active
)
SELECT
  ps.benefit_category_id,
  ps.name,
  ps.code,
  'membership_company'::TEXT,
  TRUE
FROM provider_seed ps
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  benefit_category_id = EXCLUDED.benefit_category_id,
  provider_type = EXCLUDED.provider_type,
  is_active = TRUE,
  updated_at = NOW();

WITH membership_category AS (
  SELECT id AS benefit_category_id
  FROM public.benefit_categories
  WHERE code = 'membership'
  LIMIT 1
),
product_seed AS (
  SELECT
    c.benefit_category_id,
    p.id AS provider_id,
    v.name,
    v.code,
    'membership'::TEXT AS product_type,
    '전체'::TEXT AS grade,
    'all'::TEXT AS benefit_type,
    TRUE AS is_all_product
  FROM membership_category c
  CROSS JOIN (VALUES
    ('OK캐시백 전체', 'okcashbag_membership_all', 'okcashbag'),
    ('CJ ONE 전체', 'cj_one_membership_all', 'cj_one'),
    ('해피포인트 전체', 'happy_point_membership_all', 'happy_point'),
    ('L.POINT 전체', 'lpoint_membership_all', 'lpoint'),
    ('신세계포인트 전체', 'shinsegae_point_membership_all', 'shinsegae_point'),
    ('H.Point 전체', 'hpoint_membership_all', 'hpoint')
  ) AS v(name, code, provider_code)
  JOIN public.providers p ON p.code = v.provider_code
    AND p.provider_type = 'membership_company'
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
  ps.benefit_category_id,
  ps.provider_id,
  ps.name,
  ps.code,
  ps.product_type,
  ps.grade,
  NULL::TEXT,
  ps.benefit_type,
  ps.is_all_product,
  FALSE,
  FALSE,
  TRUE
FROM product_seed ps
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

DO $$
DECLARE
  missing_providers TEXT;
  missing_products TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.benefit_categories WHERE code = 'membership' AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION '064 verify failed: membership benefit_category missing';
  END IF;

  SELECT string_agg(v.expected, ', ')
  INTO missing_providers
  FROM (VALUES
    ('okcashbag'),
    ('cj_one'),
    ('happy_point'),
    ('lpoint'),
    ('shinsegae_point'),
    ('hpoint')
  ) AS v(expected)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.providers p
    WHERE p.code = v.expected
      AND p.provider_type = 'membership_company'
      AND p.is_active = TRUE
  );

  IF missing_providers IS NOT NULL THEN
    RAISE EXCEPTION '064 verify failed: missing membership providers: %', missing_providers;
  END IF;

  SELECT string_agg(v.expected, ', ')
  INTO missing_products
  FROM (VALUES
    ('okcashbag_membership_all'),
    ('cj_one_membership_all'),
    ('happy_point_membership_all'),
    ('lpoint_membership_all'),
    ('shinsegae_point_membership_all'),
    ('hpoint_membership_all')
  ) AS v(expected)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.benefit_products bp
    WHERE bp.code = v.expected
      AND bp.product_type = 'membership'
      AND bp.benefit_type = 'all'
      AND bp.is_all_product = TRUE
      AND bp.grade = '전체'
      AND bp.is_active = TRUE
  );

  IF missing_products IS NOT NULL THEN
    RAISE EXCEPTION '064 verify failed: missing membership all products: %', missing_products;
  END IF;

  RAISE NOTICE '064 verify OK: membership providers and all products present';
END $$;

NOTIFY pgrst, 'reload schema';
