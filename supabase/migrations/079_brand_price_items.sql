-- brand_price_items schema enhancement (updated_at + defaults)
-- NOTE: brand_price_items table was introduced in migration 075.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.brand_price_items
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Ensure a safe default for admin inputs (still validated in actions)
ALTER TABLE public.brand_price_items
  ALTER COLUMN price SET DEFAULT 0;

-- Keep updated_at in sync on UPDATE
CREATE OR REPLACE FUNCTION public.set_brand_price_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_brand_price_items_updated_at ON public.brand_price_items;
CREATE TRIGGER set_brand_price_items_updated_at
  BEFORE UPDATE ON public.brand_price_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_brand_price_items_updated_at();

