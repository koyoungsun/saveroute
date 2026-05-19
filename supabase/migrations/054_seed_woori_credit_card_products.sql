-- 우리카드 신용 benefit_products 멱등 시드
-- 소스: scripts/data/woori_credit_cards.input.json · 재생성: npm run seed:woori-credit-products
-- provider: 우리카드 (code=woori_card), benefit_type·card_type: credit · product_type: credit_card
--
-- 논리 중복 방지 인덱스: benefit_products_provider_name_benefittype_uidx
-- (provider_id, name, COALESCE(benefit_type,'')) 에 이미 있으면 INSERT 생략
-- code 는 slug+해시 패턴 woori_cred_* (benefit_products.code UNIQUE)

WITH hid AS (
  SELECT id AS provider_id FROM public.providers WHERE code = 'woori_card' LIMIT 1
),
cid AS (
  SELECT id AS benefit_category_id FROM public.benefit_categories WHERE code = 'card' LIMIT 1
),
incoming AS (
  SELECT *
  FROM (VALUES
  ('카드의정석2 SUPER'::TEXT, 'woori_cred_2_super'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('DA카드의정석Ⅱ'::TEXT, 'woori_cred_da_ii'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('카드의정석 SHOPPING+'::TEXT, 'woori_cred_shopping'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('카드의정석 EVERY MILE SKYPASS'::TEXT, 'woori_cred_every_mile_skypass'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('카드의정석2 SHOPPER'::TEXT, 'woori_cred_2_shopper'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('우리 국민행복카드 S2'::TEXT, 'woori_cred_x006ec8d4f7fc'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('우리카드 7CORE'::TEXT, 'woori_cred_7core'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('우리카드 MILE&POINT'::TEXT, 'woori_cred_mile_point'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('D4카드의정석Ⅱ'::TEXT, 'woori_cred_d4_ii'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('카드의정석2'::TEXT, 'woori_cred_x7e45e589a9f2'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('SK 주유 400 우리카드'::TEXT, 'woori_cred_sk_400'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('카드의정석 TEN'::TEXT, 'woori_cred_xc0526773ffa3'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('E1 우리카드'::TEXT, 'woori_cred_x3b3aa3c7acea'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('카드의정석 I&U+'::TEXT, 'woori_cred_xd130792aee27'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('우리카드 UniMile'::TEXT, 'woori_cred_unimile'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('카드의정석 EVERY DISCOUNT'::TEXT, 'woori_cred_every_discount'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('카드의정석 EVERY POINT'::TEXT, 'woori_cred_every_point'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('우리카드 the OPUS silver'::TEXT, 'woori_cred_the_opus_silver'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('ALL 우리카드 Infinite'::TEXT, 'woori_cred_all_infinite'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('트래블월렛 우리카드'::TEXT, 'woori_cred_xf808143ed712'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('ALL 우리카드 Premium'::TEXT, 'woori_cred_all_premium'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT)
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

