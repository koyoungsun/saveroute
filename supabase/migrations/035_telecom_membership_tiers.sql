-- 통신 3사 멤버십 등급(일반·VIP·VVIP) 상품 보강 · 기존 VIP 대표 상품과 병행
-- 멱등: benefit_products.code ON CONFLICT

UPDATE public.benefit_products bp
SET
  grade = 'VIP',
  updated_at = NOW()
WHERE bp.code IN ('kt_vip', 'skt_tmembership', 'lguplus_vip');

UPDATE public.benefit_products bp
SET
  name = CASE bp.code
    WHEN 'kt_vip' THEN 'KT · VIP'
    WHEN 'skt_tmembership' THEN 'SKT · VIP'
    WHEN 'lguplus_vip' THEN 'LG U+ · VIP'
    ELSE bp.name
  END,
  updated_at = NOW()
WHERE bp.code IN ('kt_vip', 'skt_tmembership', 'lguplus_vip');

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
  (SELECT id FROM public.providers WHERE code = 'skt' LIMIT 1),
  v.name,
  v.code,
  'telecom_membership'::TEXT,
  v.grade,
  NULL::TEXT,
  FALSE,
  FALSE,
  TRUE
FROM (VALUES
  ('SKT · 일반', 'skt_membership_regular', '일반'),
  ('SKT · VVIP', 'skt_membership_vvip', 'VVIP')
) AS v(name, code, grade)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  benefit_category_id = EXCLUDED.benefit_category_id,
  provider_id = EXCLUDED.provider_id,
  product_type = EXCLUDED.product_type,
  grade = EXCLUDED.grade,
  is_active = TRUE,
  updated_at = NOW();

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
  (SELECT id FROM public.providers WHERE code = 'kt' LIMIT 1),
  v.name,
  v.code,
  'telecom_membership'::TEXT,
  v.grade,
  NULL::TEXT,
  FALSE,
  FALSE,
  TRUE
FROM (VALUES
  ('KT · 일반', 'kt_membership_regular', '일반'),
  ('KT · VVIP', 'kt_membership_vvip', 'VVIP')
) AS v(name, code, grade)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  benefit_category_id = EXCLUDED.benefit_category_id,
  provider_id = EXCLUDED.provider_id,
  product_type = EXCLUDED.product_type,
  grade = EXCLUDED.grade,
  is_active = TRUE,
  updated_at = NOW();

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
  (SELECT id FROM public.providers WHERE code = 'lguplus' LIMIT 1),
  v.name,
  v.code,
  'telecom_membership'::TEXT,
  v.grade,
  NULL::TEXT,
  FALSE,
  FALSE,
  TRUE
FROM (VALUES
  ('LG U+ · 일반', 'lguplus_membership_regular', '일반'),
  ('LG U+ · VVIP', 'lguplus_membership_vvip', 'VVIP')
) AS v(name, code, grade)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  benefit_category_id = EXCLUDED.benefit_category_id,
  provider_id = EXCLUDED.provider_id,
  product_type = EXCLUDED.product_type,
  grade = EXCLUDED.grade,
  is_active = TRUE,
  updated_at = NOW();
