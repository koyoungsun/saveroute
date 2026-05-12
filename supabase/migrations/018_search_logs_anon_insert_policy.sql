-- 비로그인(anon) 검색 로그·브랜드 등록 요청 INSERT 허용 (비식별·최소 권한)
-- SELECT/UPDATE/DELETE 는 anon 에게 부여하지 않음

-- ---------------------------------------------------------------------------
-- search_logs: anon INSERT (기존 정책명이 있으면 교체)
-- 허용 데이터: keyword, normalized_keyword, matched_brand_id, result_count,
--             result_status, created_at … 개인 세그먼트·user_id 는 비로그인 시 NULL
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "anon can insert anonymous search logs" ON public.search_logs;

ALTER TABLE public.search_logs
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE POLICY "search_logs_anon_insert_non_identifiable_only"
  ON public.search_logs FOR INSERT
  TO anon
  WITH CHECK (
    user_id IS NULL
    AND gender_group IS NULL
    AND age_group IS NULL
    AND result_status IN ('matched', 'unmatched')
  );

-- ---------------------------------------------------------------------------
-- brand_requests: anon INSERT 만 허용 (첫 요청 행 생성용)
-- authenticated 기존 정책은 유지 (별도 정책)
-- ---------------------------------------------------------------------------

CREATE POLICY "brand_requests_anon_insert_initial_pending_row"
  ON public.brand_requests FOR INSERT
  TO anon
  WITH CHECK (
    status = 'pending'
    AND request_count = 1
  );
