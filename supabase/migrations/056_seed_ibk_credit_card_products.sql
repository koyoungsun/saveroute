-- IBK기업은행카드 신용 benefit_products 멱등 시드
-- 소스: scripts/data/ibk_credit_cards.input.json · 재생성: npm run seed:ibk-credit-products
-- provider 표시명: IBK기업은행카드 · code=ibk_corporate_bank
-- benefit_type·card_type: credit · product_type: credit_card
--
-- 논리 중복 방지 인덱스: benefit_products_provider_name_benefittype_uidx
-- code 는 slug+해시 패턴 ibk_cred_* (benefit_products.code UNIQUE)

INSERT INTO public.providers (benefit_category_id, name, code, provider_type)
SELECT
  c.id,
  'IBK기업은행카드',
  'ibk_corporate_bank',
  'card_company'
FROM public.benefit_categories AS c
WHERE c.code = 'card'
LIMIT 1
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  benefit_category_id = EXCLUDED.benefit_category_id,
  provider_type = EXCLUDED.provider_type,
  is_active = TRUE,
  updated_at = NOW();

WITH hid AS (
  SELECT id AS provider_id FROM public.providers WHERE code = 'ibk_corporate_bank' LIMIT 1
),
cid AS (
  SELECT id AS benefit_category_id FROM public.benefit_categories WHERE code = 'card' LIMIT 1
),
incoming AS (
  SELECT *
  FROM (VALUES
  ('IBK 포인트 신용카드'::TEXT, 'ibk_cred_xae0fac1e764d'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('IBK 포인트 3.8 신용카드'::TEXT, 'ibk_cred_ibk_3_8'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('BLISS Mileage (대한항공)'::TEXT, 'ibk_cred_bliss_mileage'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('BLISS Point (IBK포인트)'::TEXT, 'ibk_cred_bliss_point_ibk'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('DailyWith (데일리위드)카드'::TEXT, 'ibk_cred_dailywith'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('I-MILEAGE(대한항공)'::TEXT, 'ibk_cred_i_mileage'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('IBK K-패스(신용)'::TEXT, 'ibk_cred_ibk_k'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('기업은행 일상의 기쁨카드'::TEXT, 'ibk_cred_x76713c0a3d04'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('K-22(Mileage)'::TEXT, 'ibk_cred_k_22_mileage'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('I-PET카드'::TEXT, 'ibk_cred_i_pet'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('참! 좋은 kt wiz 카드'::TEXT, 'ibk_cred_kt_wiz'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('IBKhi카드'::TEXT, 'ibk_cred_ibkhi'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('기업은행 참! 좋은 다이소카드'::TEXT, 'ibk_cred_x43cb9d758769'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('일년의 설렘카드'::TEXT, 'ibk_cred_x595119c4bc77'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('IBK-Syrup카드'::TEXT, 'ibk_cred_ibk_syrup'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('K-22(Point)'::TEXT, 'ibk_cred_k_22_point'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('해피메이트 ibk카드(신용)'::TEXT, 'ibk_cred_xb564be24b77d'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('IBK i-ALL 카드'::TEXT, 'ibk_cred_ibk_i_all'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('기업은행 용인시민카드'::TEXT, 'ibk_cred_x2408756025f0'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('I-나눔카드(일반)'::TEXT, 'ibk_cred_x89c1299260ec'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('IBK 국민행복카드'::TEXT, 'ibk_cred_xcafb64b98e62'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('I-기후동행카드(신용)'::TEXT, 'ibk_cred_xc0f8832d757a'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('IBK기업 I-어디로든 그린카드'::TEXT, 'ibk_cred_ibk_i'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT)
  ) AS t(name, code, product_type, card_type, benefit_type)
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
  is_mvno,
  mvno_notice_required,
  is_active
)
SELECT
  c.benefit_category_id,
  h.provider_id,
  i.name,
  i.code,
  i.product_type,
  NULL::TEXT,
  i.card_type,
  i.benefit_type,
  FALSE,
  FALSE,
  TRUE
FROM incoming i
CROSS JOIN hid h
CROSS JOIN cid c
WHERE NOT EXISTS (
  SELECT 1
  FROM public.benefit_products bp
  WHERE bp.provider_id = h.provider_id
    AND bp.name = i.name
    AND COALESCE(bp.benefit_type, '') = COALESCE(i.benefit_type, '')
);

