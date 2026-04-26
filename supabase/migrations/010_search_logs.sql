CREATE TABLE IF NOT EXISTS public.search_logs (
  id BIGSERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,
  normalized_keyword TEXT NOT NULL,
  matched_brand_id INT REFERENCES public.brands(id),
  gender_group TEXT,
  age_group TEXT,
  result_status TEXT NOT NULL
    CHECK (result_status IN ('matched', 'unmatched')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_logs_keyword
  ON public.search_logs(normalized_keyword);
CREATE INDEX IF NOT EXISTS idx_search_logs_matched_brand_id
  ON public.search_logs(matched_brand_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_result_status
  ON public.search_logs(result_status);
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at
  ON public.search_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_search_logs_dashboard_segments
  ON public.search_logs(created_at, gender_group, age_group, matched_brand_id);
