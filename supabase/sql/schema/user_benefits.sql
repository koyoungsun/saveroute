-- 최종 스키마 스냅샷: user_benefits
-- 신규 DB·문서 기준. migrations/008 는 이력용 원본( benefit_type 미포함 ).
-- 실제 적용 이력: 008 → 027(benefit_type) → 047(prepaid) → 057(all)

CREATE TABLE IF NOT EXISTS public.user_benefits (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  benefit_category_id INT NOT NULL REFERENCES public.benefit_categories(id),
  provider_id INT NOT NULL REFERENCES public.providers(id),
  benefit_product_id INT REFERENCES public.benefit_products(id),
  benefit_type TEXT
    CHECK (
      benefit_type IS NULL
      OR benefit_type IN ('credit', 'debit', 'prepaid', 'all')
    ),
  custom_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, benefit_category_id, provider_id, benefit_product_id)
);

COMMENT ON COLUMN public.user_benefits.benefit_type IS
  '등록 시 선택한 카드 혜택 구분. 카드사 전체 등록 시 all.';

CREATE INDEX IF NOT EXISTS idx_user_benefits_user_id
  ON public.user_benefits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_benefits_match
  ON public.user_benefits(user_id, benefit_category_id, provider_id, benefit_product_id);
CREATE INDEX IF NOT EXISTS idx_user_benefits_active
  ON public.user_benefits(is_active);
