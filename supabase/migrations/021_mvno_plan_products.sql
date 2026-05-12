-- MVNO 선택 시 매칭을 위해 알뜰 통신사별 대표 요금제·혜택 행 추가 (기존 KT M모바일만 있던 구멍 보완)

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
    (SELECT id FROM public.providers WHERE code = 'sk_7mobile'),
    'SK 7mobile 요금제',
    'sk_7mobile_plan',
    'telecom_mvno_plan',
    NULL,
    NULL,
    TRUE,
    TRUE
  ),
  (
    (SELECT id FROM public.benefit_categories WHERE code = 'telecom'),
    (SELECT id FROM public.providers WHERE code = 'uplus_mvno'),
    'U+ 알뜰모바일 요금제',
    'uplus_mvno_plan',
    'telecom_mvno_plan',
    NULL,
    NULL,
    TRUE,
    TRUE
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  benefit_category_id = EXCLUDED.benefit_category_id,
  provider_id = EXCLUDED.provider_id,
  product_type = EXCLUDED.product_type,
  is_mvno = EXCLUDED.is_mvno,
  mvno_notice_required = EXCLUDED.mvno_notice_required,
  is_active = TRUE;
