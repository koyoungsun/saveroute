-- 검색 로그에 성별·연령 세그먼트 저장 금지 (비식별 로그만 허용)

DROP POLICY IF EXISTS "authenticated users can insert search logs" ON public.search_logs;

CREATE POLICY "authenticated users can insert search logs"
  ON public.search_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    gender_group IS NULL
    AND age_group IS NULL
  );
