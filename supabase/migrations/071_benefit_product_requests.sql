-- 사용자 카드상품(benefit_product) 요청 승인 흐름
CREATE TABLE IF NOT EXISTS public.benefit_product_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  provider_id INT NOT NULL REFERENCES public.providers(id),
  category_code TEXT NOT NULL DEFAULT 'card'
    CHECK (category_code = 'card'),
  requested_name TEXT NOT NULL,
  requested_benefit_type TEXT NOT NULL
    CHECK (requested_benefit_type IN ('credit', 'debit')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_benefit_product_id INT REFERENCES public.benefit_products(id),
  admin_memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT benefit_product_requests_name_len
    CHECK (char_length(trim(requested_name)) BETWEEN 1 AND 200)
);

CREATE INDEX IF NOT EXISTS idx_benefit_product_requests_status_created
  ON public.benefit_product_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_benefit_product_requests_provider_created
  ON public.benefit_product_requests (provider_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_benefit_product_requests_user_created
  ON public.benefit_product_requests (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

COMMENT ON TABLE public.benefit_product_requests IS
  '사용자가 /my-benefits 에서 직접 입력한 카드상품 등록 요청 (Admin 승인 후 benefit_products 확정).';

ALTER TABLE public.user_benefits
  ADD COLUMN IF NOT EXISTS benefit_product_request_id BIGINT
    REFERENCES public.benefit_product_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approval_status TEXT
    CHECK (approval_status IS NULL OR approval_status IN ('pending', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_user_benefits_product_request
  ON public.user_benefits (benefit_product_request_id)
  WHERE benefit_product_request_id IS NOT NULL;

ALTER TABLE public.benefit_product_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users insert own benefit product requests"
  ON public.benefit_product_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users select own benefit product requests"
  ON public.benefit_product_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "admins manage benefit product requests"
  ON public.benefit_product_requests FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
