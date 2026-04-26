CREATE TABLE IF NOT EXISTS public.brands (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category_id INT REFERENCES public.brand_categories(id),
  aliases TEXT[] DEFAULT '{}',
  official_url TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  admin_memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brands_category_id
  ON public.brands(category_id);
CREATE INDEX IF NOT EXISTS idx_brands_active
  ON public.brands(is_active);
CREATE INDEX IF NOT EXISTS idx_brands_name_trgm
  ON public.brands USING gin(to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_brands_aliases
  ON public.brands USING gin(aliases);
