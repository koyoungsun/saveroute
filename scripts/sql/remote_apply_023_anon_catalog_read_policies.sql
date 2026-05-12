BEGIN;

-- 비로그인(anon) 검색이 카탈로그를 읽지 못하는 경우 복구용
-- (016만 적용된 상태에서는 USING(auth.role()='authenticated') 정책만 있어 anon 에게 0행)
-- + 일부 DB 에서 누락된 search_logs.result_count 컬럼 보강

ALTER TABLE public.search_logs
  ADD COLUMN IF NOT EXISTS result_count INTEGER;

DROP POLICY IF EXISTS "public can read active benefit categories" ON public.benefit_categories;
DROP POLICY IF EXISTS "public can read active providers" ON public.providers;
DROP POLICY IF EXISTS "public can read active benefit_products" ON public.benefit_products;
DROP POLICY IF EXISTS "public can read active brand categories" ON public.brand_categories;
DROP POLICY IF EXISTS "public can read active brands" ON public.brands;
DROP POLICY IF EXISTS "public can read active discounts" ON public.discounts;

CREATE POLICY "public can read active benefit categories"
  ON public.benefit_categories FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

CREATE POLICY "public can read active providers"
  ON public.providers FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

CREATE POLICY "public can read active benefit_products"
  ON public.benefit_products FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

CREATE POLICY "public can read active brand categories"
  ON public.brand_categories FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

CREATE POLICY "public can read active brands"
  ON public.brands FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

CREATE POLICY "public can read active discounts"
  ON public.discounts FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

COMMIT;
