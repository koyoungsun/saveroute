-- Public read for search: brand_price_items (active rows only)
-- Admin writes use service_role; user search uses anon/authenticated client.

ALTER TABLE public.brand_price_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public can read active brand price items" ON public.brand_price_items;
DROP POLICY IF EXISTS "anon can read active brand price items" ON public.brand_price_items;

CREATE POLICY "public can read active brand price items"
  ON public.brand_price_items FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "anon can read active brand price items"
  ON public.brand_price_items FOR SELECT
  TO anon
  USING (is_active = TRUE);

GRANT SELECT ON public.brand_price_items TO anon, authenticated;
GRANT ALL ON public.brand_price_items TO service_role;
