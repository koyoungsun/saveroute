-- KB국민카드 신용 benefit_products 멱등 시드
-- 소스: scripts/data/kb_credit_cards.input.json · 재생성: npm run seed:kb-credit-products
-- provider: KB국민카드 (code=kb_card), benefit_type·card_type: credit · product_type: credit_card
--
-- 논리 중복 방지 인덱스: benefit_products_provider_name_benefittype_uidx
-- (provider_id, name, COALESCE(benefit_type,'')) 에 이미 있으면 INSERT 생략
-- code 는 slug+해시 패턴 kb_cred_* (benefit_products.code UNIQUE)

WITH hid AS (
  SELECT id AS provider_id FROM public.providers WHERE code = 'kb_card' LIMIT 1
),
cid AS (
  SELECT id AS benefit_category_id FROM public.benefit_categories WHERE code = 'card' LIMIT 1
),
incoming AS (
  SELECT *
  FROM (VALUES
  ('KB국민 굿데이카드'::TEXT, 'kb_cred_xb70b4ebeb39a'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 WE:SH Travel 카드'::TEXT, 'kb_cred_kb_we_sh_travel'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 YOU Prime카드'::TEXT, 'kb_cred_kb_you_prime'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 굿데이올림카드'::TEXT, 'kb_cred_xdee5728d35de'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 K-패스카드'::TEXT, 'kb_cred_kb_k'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민행복카드'::TEXT, 'kb_cred_xf4e54e27b259'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 기후동행카드'::TEXT, 'kb_cred_x6037ba98cd4c'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 하이패스 2.0'::TEXT, 'kb_cred_kb_2_0'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 마일리지 가온카드(대한항공)'::TEXT, 'kb_cred_x8448a6cb8e08'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 My WE:SH 카드'::TEXT, 'kb_cred_kb_my_we_sh'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 그린카드(전국형)'::TEXT, 'kb_cred_x520c4ec180d5'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 톡톡Pay카드'::TEXT, 'kb_cred_kb_pay'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 와이즈카드'::TEXT, 'kb_cred_x624273fbe58c'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 Easy all 티타늄카드'::TEXT, 'kb_cred_kb_easy_all'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 청춘대로 톡톡카드'::TEXT, 'kb_cred_xff061df368be'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 NEED Edu카드'::TEXT, 'kb_cred_kb_need_edu'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 다담카드'::TEXT, 'kb_cred_x06b38bc46d2f'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('국방복지카드 KB국민 Prestige Members카드'::TEXT, 'kb_cred_kb_prestige_members'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 그린카드(서울형)'::TEXT, 'kb_cred_x42435f19add3'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 마이핏카드(할인형)'::TEXT, 'kb_cred_x127c1e046e7c'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('아메리칸 익스프레스 블루 KB국민카드'::TEXT, 'kb_cred_x919aad42c876'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 The Easy카드'::TEXT, 'kb_cred_kb_the_easy'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 Easy Pick카드'::TEXT, 'kb_cred_kb_easy_pick'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 WE:SH All+ 카드'::TEXT, 'kb_cred_kb_we_sh_all'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('아메리칸 익스프레스 로즈골드 KB국민카드'::TEXT, 'kb_cred_xe8fd14bc850a'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 HERITAGE Classic (스카이패스형)'::TEXT, 'kb_cred_kb_heritage_classic'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 Easy on카드'::TEXT, 'kb_cred_kb_easy_on'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 NEED Pay 카드'::TEXT, 'kb_cred_kb_need_pay'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 Green Wave 1.5℃ 카드'::TEXT, 'kb_cred_kb_green_wave_1_5_c'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB전통시장온누리카드'::TEXT, 'kb_cred_x776f46578a15'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 KB Pay 챌린지카드'::TEXT, 'kb_cred_kb_kb_pay'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 가온글로벌카드'::TEXT, 'kb_cred_x943b402cca4a'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 HERITAGE Classic (할인형)'::TEXT, 'kb_cred_493761fbb417'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 WE:SH Daily 카드'::TEXT, 'kb_cred_kb_we_sh_daily'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 All 카드'::TEXT, 'kb_cred_kb_all'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 ALL point 카드'::TEXT, 'kb_cred_kb_all_point'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('세라젬 KB국민카드'::TEXT, 'kb_cred_xfc39aba9e59c'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 코웨이Ⅱ카드'::TEXT, 'kb_cred_kb_ii'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 EV카드'::TEXT, 'kb_cred_kb_ev'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB Biz Prime 카드'::TEXT, 'kb_cred_kb_biz_prime'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('한화손해보험 캐롯 KB국민카드'::TEXT, 'kb_cred_x0e309dfdf487'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('이마트II KB국민카드(옐로우)'::TEXT, 'kb_cred_ii_kb'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 올라운드카드'::TEXT, 'kb_cred_x0077d975343c'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('소노아임레디 KB국민카드'::TEXT, 'kb_cred_x57a98c4d6be0'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB국민 예다함카드'::TEXT, 'kb_cred_x74e02295df3f'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('KB MyBiz 사장님든든 기업카드'::TEXT, 'kb_cred_kb_mybiz'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('CU KB국민카드'::TEXT, 'kb_cred_cu_kb'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT)
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

