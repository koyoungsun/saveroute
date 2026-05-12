-- =============================================================================
-- Repair / idempotent migration
-- 032 실행 중 search_logs.user_id 없이 RLS만 적용되어 42703 이 난 경우 등 대비.
-- 실행 순서: 컬럼·FK → 인덱스 → (profiles 보강) → RLS 정책 재생성
-- =============================================================================

-- ---------------------------------------------------------------------------
-- A. profiles — 필수 컬럼 (없으면 추가)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nickname TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS allow_search_stats BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS allow_personalized_recommendations BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS allow_marketing_notifications BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.nickname IS '사용자 표시 이름';
COMMENT ON COLUMN public.profiles.allow_search_stats IS '검색 통계 저장 동의';
COMMENT ON COLUMN public.profiles.allow_personalized_recommendations IS '맞춤 할인 추천 사용 동의';
COMMENT ON COLUMN public.profiles.allow_marketing_notifications IS '알림·마케팅 수신 동의';

-- ---------------------------------------------------------------------------
-- B. search_logs.user_id — RLS보다 반드시 선행 (REFERENCES auth.users, nullable)
-- ---------------------------------------------------------------------------
ALTER TABLE public.search_logs
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_search_logs_user_id ON public.search_logs (user_id);

-- ---------------------------------------------------------------------------
-- C. search_logs RLS — 본인 행만 SELECT, INSERT 시 본인 user_id만·세그먼트 금지
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "users read own search logs" ON public.search_logs;

CREATE POLICY "users read own search logs"
  ON public.search_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "authenticated users can insert_search_logs" ON public.search_logs;
DROP POLICY IF EXISTS "authenticated users can insert search logs" ON public.search_logs;

CREATE POLICY "authenticated users can insert search logs"
  ON public.search_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    gender_group IS NULL
    AND age_group IS NULL
    AND (user_id IS NULL OR user_id = auth.uid())
  );
