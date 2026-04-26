CREATE TABLE IF NOT EXISTS public.benefit_products (
  id SERIAL PRIMARY KEY,
  benefit_category_id INT NOT NULL REFERENCES public.benefit_categories(id),
  provider_id INT NOT NULL REFERENCES public.providers(id),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  product_type TEXT NOT NULL
    CHECK (product_type IN (
      'telecom_membership',
      'telecom_mvno_plan',
      'credit_card',
      'debit_card',
      'prepaid_card',
      'coupon',
      'membership'
    )),
  grade TEXT,
  card_type TEXT
    CHECK (card_type IN ('credit', 'debit', 'prepaid', 'unknown') OR card_type IS NULL),
  is_mvno BOOLEAN NOT NULL DEFAULT FALSE,
  mvno_notice_required BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_benefit_products_benefit_category_id
  ON public.benefit_products(benefit_category_id);
CREATE INDEX IF NOT EXISTS idx_benefit_products_provider_id
  ON public.benefit_products(provider_id);
CREATE INDEX IF NOT EXISTS idx_benefit_products_product_type
  ON public.benefit_products(product_type);
CREATE INDEX IF NOT EXISTS idx_benefit_products_active
  ON public.benefit_products(is_active);
