-- Brand price board feature (phase 1: DB + admin)
-- - brands.has_price_board: admin toggle per brand
-- - brand_price_items: per-brand price items for calculator (UI in phase 2)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS has_price_board BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.brand_price_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id INT NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  price INT NOT NULL CHECK (price >= 0),
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_price_items_brand_id
  ON public.brand_price_items(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_price_items_active
  ON public.brand_price_items(is_active);
CREATE INDEX IF NOT EXISTS idx_brand_price_items_brand_sort
  ON public.brand_price_items(brand_id, sort_order, created_at);

