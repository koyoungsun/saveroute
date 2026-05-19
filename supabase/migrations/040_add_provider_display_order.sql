-- 카드 카테고리 provider 노출 순서 (스키마 최소 변경: display_order만 추가)

ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 500;

COMMENT ON COLUMN public.providers.display_order IS
  'benefit_categories 그룹 내 리스트 노출 순서(오름차순 작을수록 먼저). 기존 행 미지정 시 500 유지 후 시드에서 갱신.';

CREATE INDEX IF NOT EXISTS idx_providers_benefit_display_order
  ON public.providers (benefit_category_id, display_order);
