CREATE TABLE IF NOT EXISTS public.user_benefits (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  benefit_category_id INT NOT NULL REFERENCES public.benefit_categories(id),
  provider_id INT NOT NULL REFERENCES public.providers(id),
  benefit_product_id INT REFERENCES public.benefit_products(id),
  custom_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, benefit_category_id, provider_id, benefit_product_id)
);

CREATE INDEX IF NOT EXISTS idx_user_benefits_user_id
  ON public.user_benefits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_benefits_match
  ON public.user_benefits(user_id, benefit_category_id, provider_id, benefit_product_id);
CREATE INDEX IF NOT EXISTS idx_user_benefits_active
  ON public.user_benefits(is_active);
