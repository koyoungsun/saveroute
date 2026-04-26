CREATE TABLE IF NOT EXISTS public.brand_requests (
  id SERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,
  normalized_keyword TEXT NOT NULL UNIQUE,
  request_count INT NOT NULL DEFAULT 1 CHECK (request_count <= 10),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'ignored')),
  memo TEXT,
  last_requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_requests_status
  ON public.brand_requests(status);
CREATE INDEX IF NOT EXISTS idx_brand_requests_count
  ON public.brand_requests(request_count DESC);
CREATE INDEX IF NOT EXISTS idx_brand_requests_last_requested_at
  ON public.brand_requests(last_requested_at DESC);
