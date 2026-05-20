-- 카드사(provider) 신규 등록 승인 요청

CREATE TABLE IF NOT EXISTS public.provider_requests (
  id BIGSERIAL PRIMARY KEY,
  provider_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'card',
  request_user TEXT NOT NULL,
  request_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_memo TEXT,
  approved_provider_id INT REFERENCES public.providers(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT provider_requests_name_len CHECK (char_length(trim(provider_name)) BETWEEN 1 AND 120)
);

CREATE INDEX IF NOT EXISTS idx_provider_requests_status_requested
  ON public.provider_requests (status, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_provider_requests_name
  ON public.provider_requests (provider_name);

COMMENT ON TABLE public.provider_requests IS
  '카드사 등 provider 신규 등록 승인 요청. 승인 시 providers INSERT.';

ALTER TABLE public.provider_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage provider requests"
  ON public.provider_requests
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
