CREATE TABLE IF NOT EXISTS public.coupons (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_id INT REFERENCES public.brands(id),
  provider_id INT REFERENCES public.providers(id),
  coupon_name TEXT NOT NULL,
  coupon_code TEXT,
  discount_value NUMERIC NOT NULL DEFAULT 0,
  discount_unit TEXT NOT NULL
    CHECK (discount_unit IN ('percent', 'won', 'special_price', 'free', 'unknown')),
  valid_from DATE,
  valid_until DATE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'used', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_user_id
  ON public.coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_brand_id
  ON public.coupons(brand_id);
CREATE INDEX IF NOT EXISTS idx_coupons_provider_id
  ON public.coupons(provider_id);
CREATE INDEX IF NOT EXISTS idx_coupons_status
  ON public.coupons(status);
