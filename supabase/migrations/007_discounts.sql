CREATE TABLE IF NOT EXISTS public.discounts (
  id SERIAL PRIMARY KEY,
  brand_id INT NOT NULL REFERENCES public.brands(id),
  benefit_category_id INT NOT NULL REFERENCES public.benefit_categories(id),
  provider_id INT NOT NULL REFERENCES public.providers(id),
  benefit_product_id INT REFERENCES public.benefit_products(id),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  detail TEXT,
  condition_text TEXT,
  discount_value NUMERIC NOT NULL DEFAULT 0,
  discount_unit TEXT NOT NULL
    CHECK (discount_unit IN ('percent', 'won', 'special_price', 'free', 'unknown')),
  special_price NUMERIC,
  usage_type TEXT NOT NULL
    CHECK (usage_type IN (
      'onsite_payment',
      'app_booking',
      'online_booking',
      'coupon_code',
      'membership_app',
      'unknown'
    )),
  is_stackable BOOLEAN NOT NULL DEFAULT FALSE,
  stacking_note TEXT,
  valid_from DATE,
  valid_until DATE,
  has_no_expiry BOOLEAN NOT NULL DEFAULT FALSE,
  source_url TEXT,
  last_checked_at DATE NOT NULL,
  data_confidence TEXT NOT NULL DEFAULT 'medium'
    CHECK (data_confidence IN ('high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'expired', 'hidden')),
  admin_memo TEXT,
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discounts_brand_id
  ON public.discounts(brand_id);
CREATE INDEX IF NOT EXISTS idx_discounts_status
  ON public.discounts(status);
CREATE INDEX IF NOT EXISTS idx_discounts_provider_id
  ON public.discounts(provider_id);
CREATE INDEX IF NOT EXISTS idx_discounts_benefit_category_id
  ON public.discounts(benefit_category_id);
CREATE INDEX IF NOT EXISTS idx_discounts_benefit_product_id
  ON public.discounts(benefit_product_id);
CREATE INDEX IF NOT EXISTS idx_discounts_last_checked_at
  ON public.discounts(last_checked_at);
CREATE INDEX IF NOT EXISTS idx_discounts_valid_until
  ON public.discounts(valid_until);
CREATE INDEX IF NOT EXISTS idx_discounts_dashboard_update_needed
  ON public.discounts(status, last_checked_at);
