-- 통신 3사 멤버십 등급 전체 시드 (영문 소문자·하이픈 slug)
-- SKT: SILVER, GOLD, VIP · KT: 일반~VVIP · LG U+: 일반·우수·VIP·VVIP
-- 멱등: benefit_products.code UNIQUE 기준 ON CONFLICT

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
  (SELECT id FROM public.benefit_categories WHERE code = 'telecom' LIMIT 1),
  pr.id,
  v.name,
  v.code,
  'telecom_membership'::TEXT,
  v.grade,
  NULL::TEXT,
  FALSE,
  FALSE,
  TRUE
FROM (VALUES
  -- SKT
  ('skt', 'SKT · SILVER', 'skt-silver', 'SILVER'),
  ('skt', 'SKT · GOLD', 'skt-gold', 'GOLD'),
  ('skt', 'SKT · VIP', 'skt-vip', 'VIP'),
  -- KT
  ('kt', 'KT · 일반', 'kt-regular', '일반'),
  ('kt', 'KT · WHITE', 'kt-white', 'WHITE'),
  ('kt', 'KT · SILVER', 'kt-silver', 'SILVER'),
  ('kt', 'KT · GOLD', 'kt-gold', 'GOLD'),
  ('kt', 'KT · VIP', 'kt-vip', 'VIP'),
  ('kt', 'KT · VVIP', 'kt-vvip', 'VVIP'),
  -- LG U+ (provider code: lguplus, slug prefix: lgu-)
  ('lguplus', 'LG U+ · 일반', 'lgu-regular', '일반'),
  ('lguplus', 'LG U+ · 우수', 'lgu-superior', '우수'),
  ('lguplus', 'LG U+ · VIP', 'lgu-vip', 'VIP'),
  ('lguplus', 'LG U+ · VVIP', 'lgu-vvip', 'VVIP')
) AS v(provider_code, name, code, grade)
JOIN public.providers pr
  ON pr.code = v.provider_code
  AND pr.benefit_category_id = (SELECT id FROM public.benefit_categories WHERE code = 'telecom' LIMIT 1)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  benefit_category_id = EXCLUDED.benefit_category_id,
  provider_id = EXCLUDED.provider_id,
  product_type = EXCLUDED.product_type,
  grade = EXCLUDED.grade,
  is_mvno = EXCLUDED.is_mvno,
  mvno_notice_required = EXCLUDED.mvno_notice_required,
  is_active = TRUE,
  updated_at = NOW();
