-- User search runs with the anon/server Supabase client, not the service role.
-- Keep active search data publicly readable while preserving write protection.

DROP POLICY IF EXISTS "public can read active benefit categories" ON public.benefit_categories;
DROP POLICY IF EXISTS "public can read active providers" ON public.providers;
DROP POLICY IF EXISTS "public can read active benefit products" ON public.benefit_products;
DROP POLICY IF EXISTS "public can read active brand categories" ON public.brand_categories;
DROP POLICY IF EXISTS "public can read active brands" ON public.brands;
DROP POLICY IF EXISTS "public can read active discounts" ON public.discounts;

CREATE POLICY "public can read active benefit categories"
  ON public.benefit_categories FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "public can read active providers"
  ON public.providers FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "public can read active benefit products"
  ON public.benefit_products FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "public can read active brand categories"
  ON public.brand_categories FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "public can read active brands"
  ON public.brands FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "public can read active discounts"
  ON public.discounts FOR SELECT
  USING (status = 'active');
