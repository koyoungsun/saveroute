-- 롯데카드 신용 benefit_products 멱등 시드
-- 소스: scripts/data/lotte_credit_cards.input.json · 재생성: npm run seed:lotte-credit-products
-- provider: 롯데카드 (code=lotte_card), benefit_type·card_type: credit · product_type: credit_card
--
-- 논리 중복 방지 인덱스: benefit_products_provider_name_benefittype_uidx
-- (provider_id, name, COALESCE(benefit_type,'')) 에 이미 있으면 INSERT 생략
-- code 는 slug+해시 패턴 lotte_cred_* (benefit_products.code UNIQUE)

WITH hid AS (
  SELECT id AS provider_id FROM public.providers WHERE code = 'lotte_card' LIMIT 1
),
cid AS (
  SELECT id AS benefit_category_id FROM public.benefit_categories WHERE code = 'card' LIMIT 1
),
incoming AS (
  SELECT *
  FROM (VALUES
  ('디지로카 London'::TEXT, 'lotte_cred_london'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('LOCA LIKIT 1.2'::TEXT, 'lotte_cred_loca_likit_1_2'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('LOCA 365'::TEXT, 'lotte_cred_loca_365'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KT DC PLUS 롯데카드'::TEXT, 'lotte_cred_kt_dc_plus'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('롯데카드 텔로 SE'::TEXT, 'lotte_cred_x71a614667553'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('Toss Mobile x LOCA'::TEXT, 'lotte_cred_toss_mobile_x_loca'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('LG U+ X LOCA'::TEXT, 'lotte_cred_lg_u_x_loca'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('롯데멤버스 카드'::TEXT, 'lotte_cred_x0beebf05d45d'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('롯데백화점 롯데카드'::TEXT, 'lotte_cred_xc5a4d06f7504'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('디지로카 Edu'::TEXT, 'lotte_cred_x029f9ce3c966'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('디지로카 Las Vegas'::TEXT, 'lotte_cred_las_vegas'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('LOCA 나누기 카드'::TEXT, 'lotte_cred_loca'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('LOCA LIKIT Shop'::TEXT, 'lotte_cred_loca_likit_shop'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('디지로카 Paris'::TEXT, 'lotte_cred_paris'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('LOCA LIKIT Play'::TEXT, 'lotte_cred_loca_likit_play'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('LOCA LIKIT Eat'::TEXT, 'lotte_cred_loca_likit_eat'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('롯데 국민행복카드'::TEXT, 'lotte_cred_xb54419e45e1b'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('디지로카 Wellness'::TEXT, 'lotte_cred_wellness'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('LOCA CLASSIC (로카 클래식)'::TEXT, 'lotte_cred_loca_classic'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('LOCA LIKIT'::TEXT, 'lotte_cred_loca_likit'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('디지로카 Travel'::TEXT, 'lotte_cred_travel'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('K-패스엔로카'::TEXT, 'lotte_cred_xe9060804435f'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('LOCA LIKIT 2.0'::TEXT, 'lotte_cred_loca_likit_2_0'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('롯데 포인트플러스 카드'::TEXT, 'lotte_cred_x29a20a08a29d'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('LOCA X 기후동행카드'::TEXT, 'lotte_cred_loca_x'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('LOCA LIKIT 1.5'::TEXT, 'lotte_cred_loca_likit_1_5'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('코웨이 X LOCA'::TEXT, 'lotte_cred_x_loca'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('경차 smart 롯데카드'::TEXT, 'lotte_cred_smart'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('어디로든 그린카드 X LOCA'::TEXT, 'lotte_cred_51c29907417a'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('SK인텔릭스 X LOCA'::TEXT, 'lotte_cred_sk_x_loca'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KT Super DC 롯데카드'::TEXT, 'lotte_cred_kt_super_dc'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('쿠쿠 X LOCA'::TEXT, 'lotte_cred_361f8c029a48'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('Trip to 로카'::TEXT, 'lotte_cred_trip_to'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('디지로카 Travel 프리미엄'::TEXT, 'lotte_cred_7cff0cf616d7'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('청호나이스 X LOCA'::TEXT, 'lotte_cred_48675a4dae72'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('롯데멤버스 카드 - 프리미엄'::TEXT, 'lotte_cred_xdeff9160775d'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('디지로카 Link'::TEXT, 'lotte_cred_link'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('LOCA Biz'::TEXT, 'lotte_cred_loca_biz'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('LG헬로비전 롯데카드'::TEXT, 'lotte_cred_xc9590a6870b2'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('디지로카 Golf'::TEXT, 'lotte_cred_golf'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('LOCA MONEY (로카 머니)'::TEXT, 'lotte_cred_loca_money'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('디지로카 Pet'::TEXT, 'lotte_cred_x72ea521a8c8c'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('디지로카 Auto'::TEXT, 'lotte_cred_auto'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('LOCA Professional'::TEXT, 'lotte_cred_loca_professional'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('디지로카 Monaco'::TEXT, 'lotte_cred_monaco'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('LOCA PLATINUM(할인형)'::TEXT, 'lotte_cred_loca_platinum'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('롯데백화점 FLEX 카드'::TEXT, 'lotte_cred_flex'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('LOCA 100'::TEXT, 'lotte_cred_loca_100'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('LOCA Biz+'::TEXT, 'lotte_cred_c3366354b021'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT)
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

