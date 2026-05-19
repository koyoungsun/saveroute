-- 카드사별 "전체" benefit_products 멱등 시드
-- name: {카드사명} 전체 · benefit_type=all · is_all_product=true
-- 논리 키: (provider_id, name, COALESCE(benefit_type,''))

WITH cid AS (
  SELECT id AS benefit_category_id
  FROM public.benefit_categories
  WHERE code = 'card'
  LIMIT 1
),
providers_card AS (
  SELECT p.id AS provider_id, p.name AS provider_name, p.code AS provider_code
  FROM public.providers p
  WHERE p.provider_type = 'card_company'
    AND p.is_active = TRUE
),
incoming AS (
  SELECT
    c.benefit_category_id,
    p.provider_id,
    (p.provider_name || ' 전체')::TEXT AS name,
    (p.provider_code || '_all')::TEXT AS code,
    'credit_card'::TEXT AS product_type,
    'unknown'::TEXT AS card_type,
    'all'::TEXT AS benefit_type,
    TRUE AS is_all_product
  FROM providers_card p
  CROSS JOIN cid c
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
  NULL::TEXT,
  i.card_type,
  i.benefit_type,
  i.is_all_product,
  FALSE,
  FALSE,
  TRUE
FROM incoming i
WHERE NOT EXISTS (
  SELECT 1
  FROM public.benefit_products bp
  WHERE bp.provider_id = i.provider_id
    AND bp.name = i.name
    AND COALESCE(bp.benefit_type, '') = COALESCE(i.benefit_type, '')
);
