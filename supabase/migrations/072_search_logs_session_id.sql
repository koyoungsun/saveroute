-- search_logs: explicit search action tracking + dedup support
ALTER TABLE public.search_logs
  ADD COLUMN IF NOT EXISTS session_id TEXT,
  ADD COLUMN IF NOT EXISTS request_fingerprint TEXT;

CREATE INDEX IF NOT EXISTS idx_search_logs_user_keyword_created
  ON public.search_logs (user_id, normalized_keyword, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_search_logs_session_keyword_created
  ON public.search_logs (session_id, normalized_keyword, created_at DESC)
  WHERE session_id IS NOT NULL;

COMMENT ON COLUMN public.search_logs.session_id IS
  '비로그인 검색 dedup·추적용 visitor session (sr_visitor_session cookie).';

COMMENT ON COLUMN public.search_logs.request_fingerprint IS
  '클라이언트 explicit search 요청 식별자 (optional).';
