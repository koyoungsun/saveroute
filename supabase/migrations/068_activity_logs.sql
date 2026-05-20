-- 사용자 활동 로그 (Admin 운영 패널 · 최근 접속자 집계용)

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type TEXT NOT NULL,
  keyword TEXT,
  path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT activity_logs_actor_check CHECK (
    user_id IS NOT NULL OR (session_id IS NOT NULL AND length(trim(session_id)) > 0)
  )
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at
  ON public.activity_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id
  ON public.activity_logs (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activity_logs_session_id
  ON public.activity_logs (session_id)
  WHERE session_id IS NOT NULL;

COMMENT ON TABLE public.activity_logs IS
  '검색·페이지 활동 로그. Admin 운영 패널에서 최근 접속자 집계에 사용.';

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY activity_logs_anon_insert ON public.activity_logs
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);

CREATE POLICY activity_logs_authenticated_insert ON public.activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
