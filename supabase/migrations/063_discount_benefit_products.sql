-- 할인 ↔ 혜택상품 다대다 연결 (통신사 등급 복수 선택)
CREATE TABLE IF NOT EXISTS public.discount_benefit_products (
  id BIGSERIAL PRIMARY KEY,
  discount_id INT NOT NULL REFERENCES public.discounts(id) ON DELETE CASCADE,
  benefit_product_id INT NOT NULL REFERENCES public.benefit_products(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT discount_benefit_products_unique UNIQUE (discount_id, benefit_product_id)
);

CREATE INDEX IF NOT EXISTS idx_discount_benefit_products_discount_id
  ON public.discount_benefit_products(discount_id);

CREATE INDEX IF NOT EXISTS idx_discount_benefit_products_benefit_product_id
  ON public.discount_benefit_products(benefit_product_id);

-- 기존 단일 benefit_product_id 할인은 junction 없이도 동작 (하위 호환)
-- 복수 등급 할인만 이 테이블에 2건 이상 적재됩니다.

ALTER TABLE public.discount_benefit_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated users can read discount benefit products"
  ON public.discount_benefit_products;

CREATE POLICY "authenticated users can read discount benefit products"
  ON public.discount_benefit_products FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.discounts d
      WHERE d.id = discount_id
        AND d.status = 'active'
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "admins manage discount benefit products"
  ON public.discount_benefit_products;

CREATE POLICY "admins manage discount benefit products"
  ON public.discount_benefit_products FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT ON public.discount_benefit_products TO authenticated;
GRANT ALL ON public.discount_benefit_products TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.discount_benefit_products_id_seq TO service_role;

NOTIFY pgrst, 'reload schema';
