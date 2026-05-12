-- 하나카드 대표 카드 benefit_products 시드 (신용 / 체크)
-- slug: 소문자·숫자·언더스코어 (hana_ 접두사)
-- 멱등: benefit_products.code UNIQUE ON CONFLICT

INSERT INTO public.benefit_products (
  benefit_category_id,
  provider_id,
  name,
  code,
  product_type,
  grade,
  card_type,
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
  v.card_type::TEXT,
  FALSE,
  FALSE,
  TRUE
FROM (VALUES
  -- 신용카드 · credit_card + card_type credit
  ('하나 더 넥스트 멤버스'::TEXT, 'hana_more_next_members'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT),
  ('#MY WAY 카드'::TEXT, 'hana_my_way_card'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT),
  ('에너지 더블 카드'::TEXT, 'hana_energy_double'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT),
  ('#tag1 카드 Orange'::TEXT, 'hana_tag1_orange'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT),
  ('원더카드 2.0 FREE+'::TEXT, 'hana_wonder_2_0_free_plus'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT),
  ('원더카드 2.0 HAPPY+'::TEXT, 'hana_wonder_2_0_happy_plus'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT),
  ('원더카드 2.0 PLAY+'::TEXT, 'hana_wonder_2_0_play_plus'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT),
  ('트래블로그+ 신용카드'::TEXT, 'hana_travelog_plus_credit'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT),
  ('MULTI Young 카드'::TEXT, 'hana_multi_young'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT),
  ('CLUB SK 카드'::TEXT, 'hana_club_sk'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT),
  ('JADE Classic'::TEXT, 'hana_jade_classic'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT),
  ('JADE Prime'::TEXT, 'hana_jade_prime'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT),
  ('Mile 1.6'::TEXT, 'hana_mile_1_6'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT),
  ('Mile 1.8'::TEXT, 'hana_mile_1_8'::TEXT, 'credit_card'::TEXT, 'credit'::TEXT),
  -- 체크카드 · debit_card + card_type debit
  ('트래블로그 체크카드'::TEXT, 'hana_travelog_check'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT),
  ('HERO 체크카드'::TEXT, 'hana_hero_check'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT),
  ('Young Hana 체크카드'::TEXT, 'hana_young_hana_check'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT),
  ('하나 비바X 체크카드'::TEXT, 'hana_viva_x_check'::TEXT, 'debit_card'::TEXT, 'debit'::TEXT)
) AS v(name, code, product_type, card_type)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  benefit_category_id = EXCLUDED.benefit_category_id,
  provider_id = EXCLUDED.provider_id,
  product_type = EXCLUDED.product_type,
  grade = EXCLUDED.grade,
  card_type = EXCLUDED.card_type,
  is_mvno = EXCLUDED.is_mvno,
  mvno_notice_required = EXCLUDED.mvno_notice_required,
  is_active = TRUE,
  updated_at = NOW();
