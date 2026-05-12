INSERT INTO public.providers (benefit_category_id, name, code, provider_type)
VALUES
  ((SELECT id FROM public.benefit_categories WHERE code = 'card'), '신한카드', 'shinhan_card', 'card_company'),
  ((SELECT id FROM public.benefit_categories WHERE code = 'card'), '삼성카드', 'samsung_card', 'card_company'),
  ((SELECT id FROM public.benefit_categories WHERE code = 'card'), '현대카드', 'hyundai_card', 'card_company'),
  ((SELECT id FROM public.benefit_categories WHERE code = 'card'), 'KB국민카드', 'kb_card', 'card_company'),
  ((SELECT id FROM public.benefit_categories WHERE code = 'card'), '롯데카드', 'lotte_card', 'card_company'),
  ((SELECT id FROM public.benefit_categories WHERE code = 'card'), '우리카드', 'woori_card', 'card_company'),
  ((SELECT id FROM public.benefit_categories WHERE code = 'card'), '하나카드', 'hana_card', 'card_company'),
  ((SELECT id FROM public.benefit_categories WHERE code = 'card'), 'BC카드', 'bc_card', 'card_company'),
  ((SELECT id FROM public.benefit_categories WHERE code = 'card'), 'NH농협카드', 'nh_card', 'card_company')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  benefit_category_id = EXCLUDED.benefit_category_id,
  provider_type = EXCLUDED.provider_type,
  is_active = TRUE,
  updated_at = NOW();
