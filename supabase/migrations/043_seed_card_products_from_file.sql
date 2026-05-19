-- benefit_products 카드명 마스터 (외부 카드 목록 파일 기반 생성)
-- 재생성: npm run seed:card-products-from-file 또는 node scripts/generate-card-products-from-file.cjs [--in 경로]
-- 생성 시점: 2026-05-15T14:27:21.339Z
-- 소스 파일: D:/new-saveroute/saveroute/scripts/data/card_products_by_provider.input.example.json
-- 할인·혜택 상세 미포함. 미구분 카드 타입일 때 benefit_type/card_type unknown, product_type 임시 credit_card 스키마 정합성.


INSERT INTO public.benefit_products (
  benefit_category_id,
  provider_id,
  name,
  code,
  product_type,
  grade,
  card_type,
  benefit_type,
  is_mvno,
  mvno_notice_required,
  is_active
)
SELECT
  (SELECT id FROM public.benefit_categories WHERE code = 'card' LIMIT 1),
  (SELECT id FROM public.providers WHERE code = v.provider_code LIMIT 1),
  v.name,
  v.code,
  v.product_type::TEXT,
  NULL::TEXT,
  v.card_type::TEXT,
  v.benefit_type::TEXT,
  FALSE,
  FALSE,
  TRUE
FROM (VALUES
  ('원더카드'::TEXT, 'hana_card_xbecf47d1f8e1'::TEXT, 'hana_card'::TEXT, 'credit_card'::TEXT, 'unknown'::TEXT, 'unknown'::TEXT),
  ('트래블로그 체크카드'::TEXT, 'hana_card_x717836844c90'::TEXT, 'hana_card'::TEXT, 'credit_card'::TEXT, 'unknown'::TEXT, 'unknown'::TEXT),
  ('Deep Dream'::TEXT, 'shinhan_card_deep_dream'::TEXT, 'shinhan_card'::TEXT, 'credit_card'::TEXT, 'unknown'::TEXT, 'unknown'::TEXT),
  ('Mr.Life'::TEXT, 'shinhan_card_mr_life'::TEXT, 'shinhan_card'::TEXT, 'credit_card'::TEXT, 'unknown'::TEXT, 'unknown'::TEXT)
) AS v(name, code, provider_code, product_type, card_type, benefit_type)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  benefit_category_id = EXCLUDED.benefit_category_id,
  provider_id = EXCLUDED.provider_id,
  product_type = EXCLUDED.product_type,
  grade = EXCLUDED.grade,
  card_type = EXCLUDED.card_type,
  benefit_type = EXCLUDED.benefit_type,
  is_mvno = EXCLUDED.is_mvno,
  mvno_notice_required = EXCLUDED.mvno_notice_required,
  is_active = TRUE,
  updated_at = NOW();
