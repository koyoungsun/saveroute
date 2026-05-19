-- 신한카드 신용 benefit_products 멱등 시드
-- 소스: scripts/data/shinhan_credit_cards.input.json · 재생성: npm run seed:shinhan-credit-products
-- provider: 신한카드 (code=shinhan_card), benefit_type·card_type: credit · product_type: credit_card
--
-- 논리 중복 방지 인덱스: benefit_products_provider_name_benefittype_uidx
-- (provider_id, name, COALESCE(benefit_type,'')) 에 이미 있으면 INSERT 생략
-- code 는 slug+해시 패턴 shinhan_cred_* (benefit_products.code UNIQUE)
--
-- 참고: benefit_products 테이블에 display_order 컬럼이 없으며, 카드 순서 지정은 별도 정책에서 처리합니다.

WITH hid AS (
  SELECT id AS provider_id FROM public.providers WHERE code = 'shinhan_card' LIMIT 1
),
cid AS (
  SELECT id AS benefit_category_id FROM public.benefit_categories WHERE code = 'card' LIMIT 1
),
incoming AS (
  SELECT *
  FROM (VALUES
  ('신한카드 Mr.Life'::TEXT, 'shinhan_cred_mr_life'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 Simple Plan'::TEXT, 'shinhan_cred_simple_plan'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 Deep Oil'::TEXT, 'shinhan_cred_deep_oil'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 Simple Plan+'::TEXT, 'shinhan_cred_2424f712edae'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 Discount Plan+'::TEXT, 'shinhan_cred_discount_plan'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 K-패스'::TEXT, 'shinhan_cred_xb72d898d55ae'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한 후불 기후동행 신용카드'::TEXT, 'shinhan_cred_x7dbd4ce91fe6'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 Discount Plan'::TEXT, 'shinhan_cred_f8c6e6c08fa4'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 경차사랑 Life'::TEXT, 'shinhan_cred_life'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 국민행복'::TEXT, 'shinhan_cred_x336de6c81236'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('메리어트 본보이 더 베스트 신한카드'::TEXT, 'shinhan_cred_x99139b6eb7fe'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 The CLASSIC-S'::TEXT, 'shinhan_cred_the_classic_s'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 처음(ANNIVERSE)'::TEXT, 'shinhan_cred_anniverse'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 The CLASSIC-V'::TEXT, 'shinhan_cred_the_classic_v'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 Deep On Platinum+'::TEXT, 'shinhan_cred_deep_on_platinum'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 Shopping'::TEXT, 'shinhan_cred_shopping'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('#Pay 신한카드'::TEXT, 'shinhan_cred_xcc11cedd932d'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 MY CAR'::TEXT, 'shinhan_cred_my_car'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 Point Plan+'::TEXT, 'shinhan_cred_point_plan'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 알뜰More(알뜰모아)'::TEXT, 'shinhan_cred_more'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 The BEST-F(SKY PASS형)'::TEXT, 'shinhan_cred_the_best_f_sky_pass'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 Point Plan'::TEXT, 'shinhan_cred_4768b91fd39e'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 EVerywhere'::TEXT, 'shinhan_cred_everywhere'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 RPM+ Platinum#'::TEXT, 'shinhan_cred_rpm_platinum'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 Globus'::TEXT, 'shinhan_cred_globus'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('IKEA Family with 신한카드'::TEXT, 'shinhan_cred_ikea_family_with'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('코웨이 신한카드'::TEXT, 'shinhan_cred_x04de420216db'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 Edu Plan+'::TEXT, 'shinhan_cred_edu_plan'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 Air One'::TEXT, 'shinhan_cred_air_one'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('티머니 Pay & GO 신한카드'::TEXT, 'shinhan_cred_pay_go'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 The PET'::TEXT, 'shinhan_cred_the_pet'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 B.Big(삑)'::TEXT, 'shinhan_cred_b_big'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KT 가족만족 DC 신한카드'::TEXT, 'shinhan_cred_kt_dc'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('11번가 신한카드'::TEXT, 'shinhan_cred_x7034082b2dc1'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('SKT T라이트 신한카드'::TEXT, 'shinhan_cred_skt_t'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 The CLASSIC+(SKYPASS형)'::TEXT, 'shinhan_cred_the_classic_skypass'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('국민내일배움 신한카드 Simple'::TEXT, 'shinhan_cred_simple'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KT가족만족 할부 신한카드'::TEXT, 'shinhan_cred_x28cf8bf240b1'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 Point Plan(서울시다둥이행복카드)'::TEXT, 'shinhan_cred_8efaf918ac23'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 Deep Once'::TEXT, 'shinhan_cred_deep_once'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 My TeenS'::TEXT, 'shinhan_cred_my_teens'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('스타필드 신한카드'::TEXT, 'shinhan_cred_xd690d7dcee3f'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 The Best-XO(스카이패스형)'::TEXT, 'shinhan_cred_the_best_xo'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('싱가포르항공 크리스플라이어 더 베스트 신한카드'::TEXT, 'shinhan_cred_x99601ced523a'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신세계 신한카드'::TEXT, 'shinhan_cred_x654cc548eaf9'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 Deep Taking'::TEXT, 'shinhan_cred_deep_taking'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('이마트 신한카드'::TEXT, 'shinhan_cred_xfd86a5dc8b39'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 KaPick'::TEXT, 'shinhan_cred_kapick'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 Biz Plan'::TEXT, 'shinhan_cred_biz_plan'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 THE BEST-F(캐시백형)'::TEXT, 'shinhan_cred_the_best_f'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 The CLASSIC-Y'::TEXT, 'shinhan_cred_the_classic_y'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('한화이글스 신한카드'::TEXT, 'shinhan_cred_xb7aabac25307'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 Haru(Hoshino Resorts)'::TEXT, 'shinhan_cred_haru_hoshino_resorts'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 The CLASSIC NEO'::TEXT, 'shinhan_cred_the_classic_neo'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('LG U+ Bora 신한카드 Big Plus'::TEXT, 'shinhan_cred_lg_u_bora_big_plus'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('신한카드 The Best-XO(마이신한포인트형)'::TEXT, 'shinhan_cred_8aa8fcf9c2e2'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('LGE.COM 신한카드'::TEXT, 'shinhan_cred_lge_com'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT)
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

