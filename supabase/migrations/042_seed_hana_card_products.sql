-- 하나카드 카드명 1차 마스터 시드입니다.
-- 할인 상세 데이터가 아닙니다.
-- 카드 구분을 알 수 없는 경우 product_type은 스키마 제약 때문에 credit_card로 임시 저장합니다.
-- 실제 구분 값은 card_type = 'unknown', benefit_type = 'unknown' 으로 표시합니다.
-- 추후 신용/체크 구분 정리 시 product_type/card_type/benefit_type을 함께 보정해야 합니다.
--
-- [하나카드 시드 검증용 쿼리]
-- select
--   name,
--   code,
--   product_type,
--   card_type,
--   benefit_type,
--   is_active
-- from benefit_products
-- where provider_id = (
--   select id from providers where code = 'hana_card'
-- )
-- order by name;
--
-- 기술 메모 · 재생성: npm run seed:hana-products (scripts/generate-hana-card-products-sql.cjs)
-- provider 'hana_card', category 'card', kind 미지정 시 기본 product_type 후보는 입력 defaultProductTypeWhenKindUnknown(보통 credit_card).
-- code 규칙: ASCII 슬러그면 hana_<슬러그>, 아니면 hana_x<해시>; 동명 추출 줄은 구체적인 kind 우선으로 병합(UNIQUE 인덱스 정합).

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
  (SELECT id FROM public.providers WHERE code = 'hana_card' LIMIT 1),
  v.name,
  v.code,
  v.product_type,
  NULL::TEXT,
  v.card_type,
  v.benefit_type,
  FALSE,
  FALSE,
  TRUE
FROM (VALUES
  ('예시_생성기점검용_한글카드'::TEXT, 'hana_x3d5bc4173171'::TEXT, 'credit_card'::TEXT, 'unknown'::TEXT, 'unknown'::TEXT),
  ('Example English Card'::TEXT, 'hana_example_english_card'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT)
) AS v(name, code, product_type, card_type, benefit_type)
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
