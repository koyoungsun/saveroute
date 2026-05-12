-- 비로그인 사용자도 브랜드·할인 카탈로그 검색 가능
-- search_logs anon INSERT 는 018_search_logs_anon_insert_policy.sql 참고

CREATE POLICY "anon can read active brands"
  ON public.brands FOR SELECT
  TO anon
  USING (is_active = TRUE);

CREATE POLICY "anon can read active discounts"
  ON public.discounts FOR SELECT
  TO anon
  USING (status = 'active');

CREATE POLICY "anon can read active benefit_categories"
  ON public.benefit_categories FOR SELECT
  TO anon
  USING (is_active = TRUE);

CREATE POLICY "anon can read active providers"
  ON public.providers FOR SELECT
  TO anon
  USING (is_active = TRUE);

CREATE POLICY "anon can read active benefit_products"
  ON public.benefit_products FOR SELECT
  TO anon
  USING (is_active = TRUE);

CREATE POLICY "anon can read active brand_categories"
  ON public.brand_categories FOR SELECT
  TO anon
  USING (is_active = TRUE);
