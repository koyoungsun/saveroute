-- 삼성카드 신용 benefit_products 멱등 시드
-- 소스: scripts/data/samsung_credit_cards.input.json · 재생성: npm run seed:samsung-credit-products
-- provider: 삼성카드 (code=samsung_card), benefit_type·card_type: credit · product_type: credit_card
--
-- 논리 중복 방지 인덱스: benefit_products_provider_name_benefittype_uidx
-- (provider_id, name, COALESCE(benefit_type,'')) 에 이미 있으면 INSERT 생략
-- code 는 slug+해시 패턴 samsung_cred_* (benefit_products.code UNIQUE)
--
-- 참고: benefit_products 에 display_order 컬럼은 없음

WITH hid AS (
  SELECT id AS provider_id FROM public.providers WHERE code = 'samsung_card' LIMIT 1
),
cid AS (
  SELECT id AS benefit_category_id FROM public.benefit_categories WHERE code = 'card' LIMIT 1
),
incoming AS (
  SELECT *
  FROM (VALUES
  ('삼성 iD ON 카드'::TEXT, 'samsung_cred_id_on'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성 iD ALL 카드'::TEXT, 'samsung_cred_id_all'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성 iD SIMPLE 카드'::TEXT, 'samsung_cred_id_simple'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성 iD MOVE 카드'::TEXT, 'samsung_cred_id_move'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성 iD NOMAD 카드'::TEXT, 'samsung_cred_id_nomad'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성 iD ENERGY 카드'::TEXT, 'samsung_cred_id_energy'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성 iD VITA 카드'::TEXT, 'samsung_cred_id_vita'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성 iD PET 카드'::TEXT, 'samsung_cred_id_pet'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성 iD STATION 카드'::TEXT, 'samsung_cred_id_station'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성 iD GLOBAL 카드'::TEXT, 'samsung_cred_id_global'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성 iD EV 카드'::TEXT, 'samsung_cred_id_ev'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성 iD AUTO 카드'::TEXT, 'samsung_cred_id_auto'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성 iD 달달할인 카드'::TEXT, 'samsung_cred_xb834631667b9'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성 iD 달달할인 PLUS 카드'::TEXT, 'samsung_cred_id_plus'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성 iD EDU 카드'::TEXT, 'samsung_cred_id_edu'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성 iD POCKET 카드'::TEXT, 'samsung_cred_id_pocket'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성 iD FLEX 카드'::TEXT, 'samsung_cred_id_flex'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성 iD BENEFIT 카드'::TEXT, 'samsung_cred_id_benefit'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성 iD CLASSY 카드'::TEXT, 'samsung_cred_id_classy'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성 iD REMOTE 카드'::TEXT, 'samsung_cred_id_remote'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 taptap O'::TEXT, 'samsung_cred_taptap_o'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 taptap S'::TEXT, 'samsung_cred_taptap_s'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 taptap DIGITAL'::TEXT, 'samsung_cred_taptap_digital'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 taptap DRIVE'::TEXT, 'samsung_cred_taptap_drive'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 taptap SHOPPING'::TEXT, 'samsung_cred_taptap_shopping'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 taptap AIR'::TEXT, 'samsung_cred_taptap_air'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 taptap I'::TEXT, 'samsung_cred_taptap_i'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 & MILEAGE PLATINUM(스카이패스)'::TEXT, 'samsung_cred_mileage_platinum'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 & MILEAGE PLATINUM(아시아나)'::TEXT, 'samsung_cred_8e09ec2494d9'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 2 V4'::TEXT, 'samsung_cred_2_v4'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 3 V4'::TEXT, 'samsung_cred_3_v4'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 4 V4'::TEXT, 'samsung_cred_4_v4'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 5 V4'::TEXT, 'samsung_cred_5_v4'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 6 V4'::TEXT, 'samsung_cred_6_v4'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 THE O'::TEXT, 'samsung_cred_the_o'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 THE 1'::TEXT, 'samsung_cred_the_1'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 BIZ iD BENEFIT'::TEXT, 'samsung_cred_biz_id_benefit'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 BIZ 2 V4'::TEXT, 'samsung_cred_biz_2_v4'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 SC제일은행 PLUS'::TEXT, 'samsung_cred_sc_plus'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 국민행복카드'::TEXT, 'samsung_cred_x559895526b8b'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 아메리칸 익스프레스 그린'::TEXT, 'samsung_cred_xeb399855af08'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 아메리칸 익스프레스 골드'::TEXT, 'samsung_cred_x7b7152c84de7'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 아메리칸 익스프레스 플래티넘'::TEXT, 'samsung_cred_x70f2d0d3b3c4'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 KLOOK'::TEXT, 'samsung_cred_klook'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 LINK'::TEXT, 'samsung_cred_link'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 삼성스토어 BENEFIT'::TEXT, 'samsung_cred_benefit'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 홈플러스'::TEXT, 'samsung_cred_xc7ce029723c1'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 코스트코'::TEXT, 'samsung_cred_x60f3e348213c'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 CJ ONE'::TEXT, 'samsung_cred_cj_one'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 SFC'::TEXT, 'samsung_cred_xead671fc1ba1'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 롯데월드'::TEXT, 'samsung_cred_x216cc609d09e'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 삼성앤마일리지'::TEXT, 'samsung_cred_xec5d9f16a82a'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 SKYPASS'::TEXT, 'samsung_cred_skypass'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 아시아나클럽'::TEXT, 'samsung_cred_x59888413a5b1'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 여행'::TEXT, 'samsung_cred_xd524ee0df3e3'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 행복한'::TEXT, 'samsung_cred_xeb52bfe349bd'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 할인'::TEXT, 'samsung_cred_x6671c4168210'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 포인트'::TEXT, 'samsung_cred_x60ea19199985'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 쇼핑'::TEXT, 'samsung_cred_x022e5b90216a'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 주유'::TEXT, 'samsung_cred_x53e47efcf634'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 의료'::TEXT, 'samsung_cred_x15697026c32d'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 교육'::TEXT, 'samsung_cred_xc9ae1a715ee3'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 반려동물'::TEXT, 'samsung_cred_x11b67423397c'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 웨딩'::TEXT, 'samsung_cred_x1fef4319315d'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 골프'::TEXT, 'samsung_cred_x11e4024fe553'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 프리미엄'::TEXT, 'samsung_cred_x8f1276b07a17'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 비즈니스'::TEXT, 'samsung_cred_x682756b74e37'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('삼성카드 법인'::TEXT, 'samsung_cred_x735c1f6a3afa'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT)
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

