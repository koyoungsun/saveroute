-- 현대카드 신용 benefit_products 멱등 시드
-- 소스: scripts/data/hyundai_credit_cards.input.json · 재생성: npm run seed:hyundai-credit-products
-- provider: 현대카드 (code=hyundai_card), benefit_type·card_type: credit · product_type: credit_card
--
-- 논리 중복 방지 인덱스: benefit_products_provider_name_benefittype_uidx
-- (provider_id, name, COALESCE(benefit_type,'')) 에 이미 있으면 INSERT 생략
-- code 는 slug+해시 패턴 hyundai_cred_* (benefit_products.code UNIQUE)
--
-- 참고: benefit_products 에 display_order 컬럼은 없음 (providers.display_order 만 존재)

WITH hid AS (
  SELECT id AS provider_id FROM public.providers WHERE code = 'hyundai_card' LIMIT 1
),
cid AS (
  SELECT id AS benefit_category_id FROM public.benefit_categories WHERE code = 'card' LIMIT 1
),
incoming AS (
  SELECT *
  FROM (VALUES
  ('현대카드Z work Edition2'::TEXT, 'hyundai_cred_z_work_edition2'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드ZERO Edition3(포인트형)'::TEXT, 'hyundai_cred_zero_edition3'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드Z family Edition2'::TEXT, 'hyundai_cred_z_family_edition2'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드ZERO Edition3(할인형)'::TEXT, 'hyundai_cred_fcfc538cbded'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드M'::TEXT, 'hyundai_cred_x6e9e63850aef'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드T'::TEXT, 'hyundai_cred_x9ba4823f1d0d'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드 ZERO Up'::TEXT, 'hyundai_cred_zero_up'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드 Summit'::TEXT, 'hyundai_cred_summit'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('the Pink Edition2'::TEXT, 'hyundai_cred_the_pink_edition2'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드MM'::TEXT, 'hyundai_cred_xdf3b883a3e26'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드O'::TEXT, 'hyundai_cred_xca57c709c366'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('the Orange'::TEXT, 'hyundai_cred_the_orange'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드Z everyday'::TEXT, 'hyundai_cred_z_everyday'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드S'::TEXT, 'hyundai_cred_x04d7c7a5f7e0'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드 하이브리드(Apple Pay Rewards)'::TEXT, 'hyundai_cred_apple_pay_rewards'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드H'::TEXT, 'hyundai_cred_xdae3040983b5'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드 MX Black Edition2'::TEXT, 'hyundai_cred_mx_black_edition2'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('the Red(항공 마일리지형)'::TEXT, 'hyundai_cred_the_red'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드 하이브리드(포인트형)'::TEXT, 'hyundai_cred_x7c2d41b46efe'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드D'::TEXT, 'hyundai_cred_x3259e16b74be'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('the Green Edition3'::TEXT, 'hyundai_cred_the_green_edition3'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드Z play'::TEXT, 'hyundai_cred_z_play'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('the Red Stripe Edition2(마일리지형)'::TEXT, 'hyundai_cred_the_red_stripe_edition2'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드 X Save'::TEXT, 'hyundai_cred_x_save'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드X'::TEXT, 'hyundai_cred_x5638bf83e022'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드 하이브리드(캐시백형)'::TEXT, 'hyundai_cred_x31d9cb2832ba'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드 X Cut'::TEXT, 'hyundai_cred_x_cut'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드 Boutique - Satin'::TEXT, 'hyundai_cred_boutique_satin'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드 Summit CE'::TEXT, 'hyundai_cred_summit_ce'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('the Red Stripe Edition2(M포인트형)'::TEXT, 'hyundai_cred_the_red_stripe_edition2_m'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드 Boutique - Velvet'::TEXT, 'hyundai_cred_boutique_velvet'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드 Boutique - Copper'::TEXT, 'hyundai_cred_boutique_copper'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('the Red(M포인트형)'::TEXT, 'hyundai_cred_the_red_m'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드M-경차전용카드 Edition2(유류세환급)'::TEXT, 'hyundai_cred_m_edition2'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드 MC GLOBAL'::TEXT, 'hyundai_cred_mc_global'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('coway-현대카드M Edition3'::TEXT, 'hyundai_cred_coway_m_edition3'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('SKT-현대카드M Edition3(통신할인형2.0)'::TEXT, 'hyundai_cred_skt_m_edition3_2_0'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드 대한항공카드 060'::TEXT, 'hyundai_cred_x8824a8052b80'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('kt-현대카드M Edition3(통신할인형2.0)'::TEXT, 'hyundai_cred_kt_m_edition3_2_0'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('LG U+-현대카드M Edition3(통신할인형2.0)'::TEXT, 'hyundai_cred_lg_u_m_edition3_2_0'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드 대한항공카드 300'::TEXT, 'hyundai_cred_x3396fe8fbd02'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드 대한항공카드 the First Edition2'::TEXT, 'hyundai_cred_the_first_edition2'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드 MC SKYPASS'::TEXT, 'hyundai_cred_mc_skypass'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드 MC TWO(법인 리워드형)'::TEXT, 'hyundai_cred_mc_two'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드 대한항공카드 120'::TEXT, 'hyundai_cred_x3291cf8a240d'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대 아멕스 골드 카드 Edition2'::TEXT, 'hyundai_cred_edition2'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('SmileCard Edition3'::TEXT, 'hyundai_cred_smilecard_edition3'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('에너지플러스 현대카드'::TEXT, 'hyundai_cred_x9da16f276e69'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대 아멕스 더 플래티넘 카드 Edition2'::TEXT, 'hyundai_cred_bb717cfa21d4'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드MY BUSINESS M Retail'::TEXT, 'hyundai_cred_my_business_m_retail'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('the Purple(대한항공 마일리지형)'::TEXT, 'hyundai_cred_the_purple'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드MY BUSINESS ZERO Ed3 할인형'::TEXT, 'hyundai_cred_my_business_zero_ed3'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드MY BUSINESS M F&B'::TEXT, 'hyundai_cred_my_business_m_f_b'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('GOLD FOR 롯데백화점, 현대카드'::TEXT, 'hyundai_cred_gold_for'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('SILVER FOR 롯데백화점, 현대카드'::TEXT, 'hyundai_cred_silver_for'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('캐시노트 BUSINESS 현대카드'::TEXT, 'hyundai_cred_business'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드 MC ONE(법인 리워드형)'::TEXT, 'hyundai_cred_mc_one'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('The CJ-현대카드M Edition2'::TEXT, 'hyundai_cred_the_cj_m_edition2'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드MY BUSINESS ZERO Ed3 포인트형'::TEXT, 'hyundai_cred_b5f85a56a6d7'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('코스트코 리워드 현대카드 Edition2'::TEXT, 'hyundai_cred_85e8779eb77c'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드 MC ONE(대한항공 마일리지형)'::TEXT, 'hyundai_cred_8b19cf79e7d0'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('DB손해보험 현대카드'::TEXT, 'hyundai_cred_x62f051a8f782'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대 아멕스 그린 카드 Edition2'::TEXT, 'hyundai_cred_dcc665c05493'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드MY BUSINESS M E-seller'::TEXT, 'hyundai_cred_my_business_m_e_seller'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('the Purple(M포인트형)'::TEXT, 'hyundai_cred_the_purple_m'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드MY BUSINESS X Retail'::TEXT, 'hyundai_cred_my_business_x_retail'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드 MC 주유전용카드'::TEXT, 'hyundai_cred_x27555703109e'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드 MC 항공권전용카드'::TEXT, 'hyundai_cred_xba926ceda471'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대해상 현대카드'::TEXT, 'hyundai_cred_xf42eb91550cd'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('올리브영 현대카드'::TEXT, 'hyundai_cred_x86284c4fad62'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드MY BUSINESS X E-seller'::TEXT, 'hyundai_cred_my_business_x_e_seller'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드 이마트 e카드 Plus'::TEXT, 'hyundai_cred_e_plus'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대홈쇼핑 현대카드 Edition2'::TEXT, 'hyundai_cred_559efe050aef'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드MY BUSINESS X F&B'::TEXT, 'hyundai_cred_my_business_x_f_b'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드M-화물차유가보조금카드'::TEXT, 'hyundai_cred_x6eae7da1cb15'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드X-화물차유가보조금카드(S-OIL)'::TEXT, 'hyundai_cred_x_s_oil'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT),
  ('현대카드X-화물차유가보조금카드(SK에너지)'::TEXT, 'hyundai_cred_x_sk'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT, 'credit'::TEXT)
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

