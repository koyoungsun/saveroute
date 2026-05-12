-- benefit_categories 에 mvno 가 없으면 추가 (034 미적용·부분 적용 환경 보호)
INSERT INTO public.benefit_categories (code, name, description, sort_order)
VALUES
  ('mvno', '알뜰폰', 'MVNO 알뜰 통신사', 2)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = COALESCE(EXCLUDED.description, public.benefit_categories.description),
  sort_order = EXCLUDED.sort_order,
  is_active = TRUE,
  updated_at = NOW();
