ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefit_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefit_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.result_click_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "admins can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "users manage own benefits" ON public.user_benefits;
DROP POLICY IF EXISTS "users manage own coupons" ON public.coupons;
DROP POLICY IF EXISTS "authenticated users can read active benefit categories" ON public.benefit_categories;
DROP POLICY IF EXISTS "authenticated users can read active providers" ON public.providers;
DROP POLICY IF EXISTS "authenticated users can read active benefit products" ON public.benefit_products;
DROP POLICY IF EXISTS "authenticated users can read active brand categories" ON public.brand_categories;
DROP POLICY IF EXISTS "authenticated users can read active brands" ON public.brands;
DROP POLICY IF EXISTS "authenticated users can read active discounts" ON public.discounts;
DROP POLICY IF EXISTS "authenticated users can insert search logs" ON public.search_logs;
DROP POLICY IF EXISTS "authenticated users can read brand requests" ON public.brand_requests;
DROP POLICY IF EXISTS "authenticated users can insert brand requests" ON public.brand_requests;
DROP POLICY IF EXISTS "authenticated users can update brand request counts" ON public.brand_requests;
DROP POLICY IF EXISTS "authenticated users can insert result click logs" ON public.result_click_logs;
DROP POLICY IF EXISTS "admins can read audit logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "admins can insert audit logs" ON public.admin_audit_logs;

CREATE POLICY "users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "admins can read profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "users manage own benefits"
  ON public.user_benefits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users manage own coupons"
  ON public.coupons FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated users can read active benefit categories"
  ON public.benefit_categories FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = TRUE);

CREATE POLICY "authenticated users can read active providers"
  ON public.providers FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = TRUE);

CREATE POLICY "authenticated users can read active benefit products"
  ON public.benefit_products FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = TRUE);

CREATE POLICY "authenticated users can read active brand categories"
  ON public.brand_categories FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = TRUE);

CREATE POLICY "authenticated users can read active brands"
  ON public.brands FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = TRUE);

CREATE POLICY "authenticated users can read active discounts"
  ON public.discounts FOR SELECT
  USING (auth.role() = 'authenticated' AND status = 'active');

CREATE POLICY "authenticated users can insert search logs"
  ON public.search_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "authenticated users can read brand requests"
  ON public.brand_requests FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated users can insert brand requests"
  ON public.brand_requests FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "authenticated users can update brand request counts"
  ON public.brand_requests FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "authenticated users can insert result click logs"
  ON public.result_click_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "admins can read audit logs"
  ON public.admin_audit_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "admins can insert audit logs"
  ON public.admin_audit_logs FOR INSERT
  WITH CHECK (public.is_admin());
