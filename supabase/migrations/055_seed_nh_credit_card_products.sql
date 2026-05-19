-- NH농협카드 신용 benefit_products 멱등 시드
-- 소스: scripts/data/nh_credit_cards.input.json · 재생성: npm run seed:nh-credit-products
-- provider: NH농협카드 (code=nh_card), benefit_type·card_type: credit · product_type: credit_card
--
-- 논리 중복 방지 인덱스: benefit_products_provider_name_benefittype_uidx
-- (provider_id, name, COALESCE(benefit_type,'')) 에 이미 있으면 INSERT 생략
-- code 는 slug+해시 패턴 nh_cred_* (benefit_products.code UNIQUE)

WITH hid AS (
  SELECT id AS provider_id FROM public.providers WHERE code = 'nh_card' LIMIT 1
),
cid AS (
  SELECT id AS benefit_category_id FROM public.benefit_categories WHERE code = 'card' LIMIT 1
),
incoming AS (
  SELECT *
  FROM (VALUES
  ('zgm 할인카드'::TEXT, 'nh_cred_x25d7de778b9a'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('zgm living카드'::TEXT, 'nh_cred_zgm_living'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('zgm.the pay카드'::TEXT, 'nh_cred_zgm_the_pay'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('zgm shopping카드'::TEXT, 'nh_cred_zgm_shopping'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('zgm.휴가중카드'::TEXT, 'nh_cred_x67e368954d5f'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('NH농협 국민행복카드(비씨)'::TEXT, 'nh_cred_xa4a9fb04b816'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('NH올원더풀카드'::TEXT, 'nh_cred_x66fe568bce11'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('클래시 트래블카드'::TEXT, 'nh_cred_x7dcabc4beaf3'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('미미(美米)카드'::TEXT, 'nh_cred_x077723cd60f2'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('zgm point카드'::TEXT, 'nh_cred_zgm_point'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('NH농협 K-패스카드'::TEXT, 'nh_cred_nh_k'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('NH올원 파이카드'::TEXT, 'nh_cred_x6fd348d7fa35'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('zgm 스스로카드'::TEXT, 'nh_cred_x6207017581f3'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('zgm.play카드'::TEXT, 'nh_cred_zgm_play'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('올바른POINT UP 카드'::TEXT, 'nh_cred_point_up'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('채움 스카이패스(SKYPASS)카드'::TEXT, 'nh_cred_skypass'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('올바른HOMETOWN카드'::TEXT, 'nh_cred_hometown'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('NH농협 어디로든 그린카드'::TEXT, 'nh_cred_xd769fe477a5c'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('NH올원 Rental&코웨이카드'::TEXT, 'nh_cred_nh_rental'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('NH20 해봄카드'::TEXT, 'nh_cred_nh20'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('올바른POINT UP+ 카드'::TEXT, 'nh_cred_993641a340bb'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('올바른FLEX카드'::TEXT, 'nh_cred_flex'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('zgm.streaming카드'::TEXT, 'nh_cred_zgm_streaming'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('별다줄카드'::TEXT, 'nh_cred_xeabb4dbf9c8f'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('NH농협 기후동행카드'::TEXT, 'nh_cred_x948cac0bcb52'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('올바른NEW HAVE카드'::TEXT, 'nh_cred_new_have'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('올바른BAZIC+ 카드'::TEXT, 'nh_cred_bazic'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('올바른NEW HAVE+카드'::TEXT, 'nh_cred_31695bd6e0d1'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('NH올원 Rental&바디프랜드카드'::TEXT, 'nh_cred_bdcfbe673c6a'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('zgm.일본여행중카드'::TEXT, 'nh_cred_x34242aca6848'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('zgm.고향으로카드'::TEXT, 'nh_cred_x2ba28205512d'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('NH올원 쇼핑&TLC카드'::TEXT, 'nh_cred_nh_tlc'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT)
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

