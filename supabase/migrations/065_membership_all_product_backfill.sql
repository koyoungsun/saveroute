-- membership_company 제공사마다 기본 "{멤버십명} 전체" 상품이 없으면 자동 보강 (확장형)
-- Admin CRUD·추가 seed 이후에도 멱등 실행 가능

WITH membership_category AS (
  SELECT id AS benefit_category_id
  FROM public.benefit_categories
  WHERE code = 'membership'
  LIMIT 1
),
missing AS (
  SELECT
    c.benefit_category_id,
    p.id AS provider_id,
    p.code AS provider_code,
    p.name AS provider_name,
    p.is_active AS provider_is_active
  FROM membership_category c
  JOIN public.providers p
    ON p.benefit_category_id = c.benefit_category_id
   AND p.provider_type = 'membership_company'
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.benefit_products bp
    WHERE bp.provider_id = p.id
      AND bp.product_type = 'membership'
      AND bp.is_all_product = TRUE
      AND bp.benefit_type = 'all'
      AND bp.grade = '전체'
  )
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
  m.benefit_category_id,
  m.provider_id,
  CASE
    WHEN m.provider_name LIKE '%전체' THEN m.provider_name
    ELSE m.provider_name || ' 전체'
  END,
  lower(m.provider_code) || '_membership_all',
  'membership',
  '전체',
  NULL::TEXT,
  'all',
  TRUE,
  FALSE,
  FALSE,
  m.provider_is_active
FROM missing m
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  benefit_category_id = EXCLUDED.benefit_category_id,
  provider_id = EXCLUDED.provider_id,
  product_type = EXCLUDED.product_type,
  grade = EXCLUDED.grade,
  benefit_type = EXCLUDED.benefit_type,
  is_all_product = EXCLUDED.is_all_product,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

DO $$
DECLARE
  orphan_count INT;
BEGIN
  SELECT COUNT(*)
  INTO orphan_count
  FROM public.providers p
  JOIN public.benefit_categories bc ON bc.id = p.benefit_category_id
  WHERE bc.code = 'membership'
    AND p.provider_type = 'membership_company'
    AND p.is_active = TRUE
    AND NOT EXISTS (
      SELECT 1
      FROM public.benefit_products bp
      WHERE bp.provider_id = p.id
        AND bp.product_type = 'membership'
        AND bp.is_all_product = TRUE
        AND bp.benefit_type = 'all'
        AND bp.grade = '전체'
        AND bp.is_active = TRUE
    );

  IF orphan_count > 0 THEN
    RAISE EXCEPTION '065 verify failed: % active membership providers missing all product', orphan_count;
  END IF;

  RAISE NOTICE '065 verify OK: all active membership providers have default all product';
END $$;

NOTIFY pgrst, 'reload schema';
