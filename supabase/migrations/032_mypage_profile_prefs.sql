-- 마이페이지: 닉네임·통계·추천·마케팅 동의 + 사용자별 업데이트 요청 참여 로그 + 검색 로그 본인 조회

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nickname TEXT,
  ADD COLUMN IF NOT EXISTS allow_search_stats BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS allow_personalized_recommendations BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS allow_marketing_notifications BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.nickname IS '사용자 표시 이름';
COMMENT ON COLUMN public.profiles.allow_search_stats IS '검색 통계 저장 동의';
COMMENT ON COLUMN public.profiles.allow_personalized_recommendations IS '맞춤 할인 추천 사용 동의';
COMMENT ON COLUMN public.profiles.allow_marketing_notifications IS '알림·마케팅 수신 동의';

CREATE TABLE IF NOT EXISTS public.user_brand_request_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  normalized_keyword TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_brand_request_events_user_created
  ON public.user_brand_request_events (user_id, created_at DESC);

ALTER TABLE public.user_brand_request_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own brand request events" ON public.user_brand_request_events;
CREATE POLICY "users read own brand request events"
  ON public.user_brand_request_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users insert own brand request events" ON public.user_brand_request_events;
CREATE POLICY "users insert own brand request events"
  ON public.user_brand_request_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users read own search logs" ON public.search_logs;
CREATE POLICY "users read own search logs"
  ON public.search_logs FOR SELECT
  USING (auth.role() = 'authenticated' AND auth.uid() = user_id);

DROP POLICY IF EXISTS "authenticated users can insert search logs" ON public.search_logs;

CREATE POLICY "authenticated users can insert search logs"
  ON public.search_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    gender_group IS NULL
    AND age_group IS NULL
    AND (user_id IS NULL OR user_id = auth.uid())
  );
