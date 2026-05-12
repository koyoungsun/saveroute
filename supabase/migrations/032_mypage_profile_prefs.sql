-- 마이페이지: 닉네임·통계·추천·마케팅 동의 + 사용자별 업데이트 요청 참여 로그 + 검색 로그 본인 조회
--
-- 주의: search_logs RLS는 user_id 컬럼이 존재한 뒤에만 생성해야 합니다.
-- (컬럼 없이 정책만 만들면 ERROR 42703 발생)

-- ---------------------------------------------------------------------------
-- 1) profiles — 필수 컬럼 (없으면 추가)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nickname TEXT,
  ADD COLUMN IF NOT EXISTS allow_search_stats BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS allow_personalized_recommendations BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS allow_marketing_notifications BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.nickname IS '사용자 표시 이름';
COMMENT ON COLUMN public.profiles.allow_search_stats IS '검색 통계 저장 동의';
COMMENT ON COLUMN public.profiles.allow_personalized_recommendations IS '맞춤 할인 추천 사용 동의';
COMMENT ON COLUMN public.profiles.allow_marketing_notifications IS '알림·마케팅 수신 동의';

-- ---------------------------------------------------------------------------
-- 2) search_logs.user_id — RLS 정책보다 먼저 추가
-- ---------------------------------------------------------------------------
ALTER TABLE public.search_logs
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_search_logs_user_id ON public.search_logs (user_id);

-- ---------------------------------------------------------------------------
-- 3) user_brand_request_events
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 4) search_logs RLS — 로그인 사용자는 본인 user_id 행만 조회·본인 user_id로만 INSERT
--    gender_group / age_group 은 NULL 만 허용 (직접 세그먼트 저장 금지 유지)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "users read own search logs" ON public.search_logs;
CREATE POLICY "users read own search logs"
  ON public.search_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "authenticated users can insert search logs" ON public.search_logs;
CREATE POLICY "authenticated users can insert search logs"
  ON public.search_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    gender_group IS NULL
    AND age_group IS NULL
    AND (user_id IS NULL OR user_id = auth.uid())
  );
