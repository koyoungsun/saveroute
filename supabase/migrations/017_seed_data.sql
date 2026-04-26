INSERT INTO public.benefit_categories (code, name, description, sort_order)
VALUES
  ('telecom', '통신사', '통신사 멤버십 및 요금제 혜택', 1),
  ('card', '카드', '신용카드, 체크카드, 선불카드 혜택', 2),
  ('coupon', '쿠폰', '쿠폰 플랫폼 혜택', 3),
  ('membership', '멤버십', '외부 멤버십 혜택', 4)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = TRUE;

INSERT INTO public.brand_categories (code, name, sort_order)
VALUES
  ('leisure', '여가', 1),
  ('food', '식음료', 2),
  ('shopping', '쇼핑', 3),
  ('transport', '교통', 4),
  ('etc', '기타', 99)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  is_active = TRUE;

INSERT INTO public.providers (benefit_category_id, name, code, provider_type)
VALUES
  ((SELECT id FROM public.benefit_categories WHERE code = 'telecom'), 'KT', 'kt', 'telecom_major'),
  ((SELECT id FROM public.benefit_categories WHERE code = 'telecom'), 'SKT', 'skt', 'telecom_major'),
  ((SELECT id FROM public.benefit_categories WHERE code = 'telecom'), 'LGU+', 'lguplus', 'telecom_major'),
  ((SELECT id FROM public.benefit_categories WHERE code = 'telecom'), 'KT M모바일', 'kt_m_mobile', 'telecom_mvno'),
  ((SELECT id FROM public.benefit_categories WHERE code = 'telecom'), 'SK 7mobile', 'sk_7mobile', 'telecom_mvno'),
  ((SELECT id FROM public.benefit_categories WHERE code = 'telecom'), 'U+ 알뜰모바일', 'uplus_mvno', 'telecom_mvno'),
  ((SELECT id FROM public.benefit_categories WHERE code = 'card'), '신한카드', 'shinhan_card', 'card_company'),
  ((SELECT id FROM public.benefit_categories WHERE code = 'card'), '삼성카드', 'samsung_card', 'card_company'),
  ((SELECT id FROM public.benefit_categories WHERE code = 'card'), '현대카드', 'hyundai_card', 'card_company'),
  ((SELECT id FROM public.benefit_categories WHERE code = 'card'), '국민카드', 'kb_card', 'card_company'),
  ((SELECT id FROM public.benefit_categories WHERE code = 'card'), '하나카드', 'hana_card', 'card_company')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  benefit_category_id = EXCLUDED.benefit_category_id,
  provider_type = EXCLUDED.provider_type,
  is_active = TRUE;

INSERT INTO public.benefit_products (
  benefit_category_id,
  provider_id,
  name,
  code,
  product_type,
  grade,
  card_type,
  is_mvno,
  mvno_notice_required
)
VALUES
  (
    (SELECT id FROM public.benefit_categories WHERE code = 'telecom'),
    (SELECT id FROM public.providers WHERE code = 'kt'),
    'KT VIP',
    'kt_vip',
    'telecom_membership',
    'VIP',
    NULL,
    FALSE,
    FALSE
  ),
  (
    (SELECT id FROM public.benefit_categories WHERE code = 'telecom'),
    (SELECT id FROM public.providers WHERE code = 'skt'),
    'SKT T멤버십',
    'skt_tmembership',
    'telecom_membership',
    'VIP',
    NULL,
    FALSE,
    FALSE
  ),
  (
    (SELECT id FROM public.benefit_categories WHERE code = 'telecom'),
    (SELECT id FROM public.providers WHERE code = 'lguplus'),
    'U+ VIP',
    'lguplus_vip',
    'telecom_membership',
    'VIP',
    NULL,
    FALSE,
    FALSE
  ),
  (
    (SELECT id FROM public.benefit_categories WHERE code = 'telecom'),
    (SELECT id FROM public.providers WHERE code = 'kt_m_mobile'),
    'KT M모바일 요금제',
    'kt_m_mobile_plan',
    'telecom_mvno_plan',
    NULL,
    NULL,
    TRUE,
    TRUE
  ),
  (
    (SELECT id FROM public.benefit_categories WHERE code = 'card'),
    (SELECT id FROM public.providers WHERE code = 'shinhan_card'),
    '신한 Deep Dream',
    'shinhan_deep_dream',
    'credit_card',
    NULL,
    'credit',
    FALSE,
    FALSE
  ),
  (
    (SELECT id FROM public.benefit_categories WHERE code = 'card'),
    (SELECT id FROM public.providers WHERE code = 'samsung_card'),
    '삼성 iD ON',
    'samsung_id_on',
    'credit_card',
    NULL,
    'credit',
    FALSE,
    FALSE
  ),
  (
    (SELECT id FROM public.benefit_categories WHERE code = 'card'),
    (SELECT id FROM public.providers WHERE code = 'kb_card'),
    'KB국민 노리 체크카드',
    'kb_nori_check',
    'debit_card',
    NULL,
    'debit',
    FALSE,
    FALSE
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  benefit_category_id = EXCLUDED.benefit_category_id,
  provider_id = EXCLUDED.provider_id,
  product_type = EXCLUDED.product_type,
  grade = EXCLUDED.grade,
  card_type = EXCLUDED.card_type,
  is_mvno = EXCLUDED.is_mvno,
  mvno_notice_required = EXCLUDED.mvno_notice_required,
  is_active = TRUE;
