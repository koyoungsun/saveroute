CREATE TABLE IF NOT EXISTS public.providers (
  id SERIAL PRIMARY KEY,
  benefit_category_id INT NOT NULL REFERENCES public.benefit_categories(id),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  provider_type TEXT NOT NULL
    CHECK (provider_type IN (
      'telecom_major',
      'telecom_mvno',
      'card_company',
      'coupon_platform',
      'membership_company'
    )),
  official_url TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_providers_benefit_category_id
  ON public.providers(benefit_category_id);
CREATE INDEX IF NOT EXISTS idx_providers_provider_type
  ON public.providers(provider_type);
CREATE INDEX IF NOT EXISTS idx_providers_active
  ON public.providers(is_active);
