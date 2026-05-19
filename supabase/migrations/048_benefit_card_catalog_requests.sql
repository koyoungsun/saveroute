-- 공식 benefit_products 에 없어도 사용자가 카드 마스터 반영을 요청할 수 있음 (/my-benefits)
CREATE TABLE IF NOT EXISTS public.benefit_card_catalog_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id INT NOT NULL REFERENCES public.providers(id),
  card_name TEXT NOT NULL,
  card_benefit_type TEXT NOT NULL
    CHECK (card_benefit_type IN ('credit', 'debit', 'prepaid', 'unknown')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewing', 'completed', 'rejected')),
  admin_memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT benefit_card_catalog_requests_card_name_len CHECK (char_length(trim(card_name)) BETWEEN 1 AND 200)
);

CREATE INDEX IF NOT EXISTS idx_benefit_card_catalog_requests_user_created
  ON public.benefit_card_catalog_requests (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_benefit_card_catalog_requests_status_created
  ON public.benefit_card_catalog_requests (status, created_at DESC);

COMMENT ON TABLE public.benefit_card_catalog_requests IS
  '카드 마스터에 없는 상품 등록 요청 (카드사·카드명·유형·pending).';

ALTER TABLE public.benefit_card_catalog_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users insert own benefit card catalog requests"
  ON public.benefit_card_catalog_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users select own benefit card catalog requests"
  ON public.benefit_card_catalog_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "admins select all benefit card catalog requests"
  ON public.benefit_card_catalog_requests FOR SELECT
  USING (public.is_admin());
