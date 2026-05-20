-- promo_slot_histories: 종료/비활성/삭제 이벤트 보관
-- NOTE: 원격 promo_slots.id 는 UUID 타입입니다.

CREATE TABLE IF NOT EXISTS public.promo_slot_histories (
  id BIGSERIAL PRIMARY KEY,
  promo_slot_id UUID NULL REFERENCES public.promo_slots(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  link_url TEXT NOT NULL,
  image_url TEXT NULL,
  hashtags TEXT[] NULL,
  started_at TIMESTAMPTZ NULL,
  ended_at TIMESTAMPTZ NULL,
  final_click_count INTEGER NOT NULL DEFAULT 0,
  event_type TEXT NOT NULL,
  reason TEXT NULL,
  snapshot JSONB NULL,
  created_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT promo_slot_histories_event_type_check
    CHECK (
      event_type IN (
        'created',
        'updated',
        'activated',
        'deactivated',
        'expired',
        'deleted',
        'completed'
      )
    ),
  CONSTRAINT promo_slot_histories_click_count_non_negative_check
    CHECK (final_click_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_promo_slot_histories_promo_slot_id
  ON public.promo_slot_histories (promo_slot_id);

CREATE INDEX IF NOT EXISTS idx_promo_slot_histories_event_type
  ON public.promo_slot_histories (event_type);

CREATE INDEX IF NOT EXISTS idx_promo_slot_histories_created_at
  ON public.promo_slot_histories (created_at DESC);

ALTER TABLE public.promo_slot_histories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins can read promo slot histories" ON public.promo_slot_histories;
CREATE POLICY "admins can read promo slot histories"
  ON public.promo_slot_histories FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "admins can insert promo slot histories" ON public.promo_slot_histories;
CREATE POLICY "admins can insert promo slot histories"
  ON public.promo_slot_histories FOR INSERT
  WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_slot_histories TO postgres, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.promo_slot_histories_id_seq TO postgres, service_role;

-- click_count RPC: promo_slots.id UUID 호환
DROP FUNCTION IF EXISTS public.increment_promo_slot_click_count(BIGINT);

CREATE OR REPLACE FUNCTION public.increment_promo_slot_click_count(slot_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.promo_slots
  SET click_count = click_count + 1
  WHERE id = slot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.increment_promo_slot_click_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_promo_slot_click_count(UUID) TO service_role;

-- Sample cleanup: canonical 1건만 active 유지
DO $$
DECLARE
  total_count INTEGER;
  after_count INTEGER;
  keep_id UUID;
  candidate RECORD;
BEGIN
  SELECT COUNT(*) INTO total_count FROM public.promo_slots;
  RAISE NOTICE 'promo_slots COUNT before cleanup: %', total_count;

  FOR candidate IN
    SELECT id, title, href, is_active, priority
    FROM public.promo_slots
    ORDER BY priority DESC, created_at ASC
  LOOP
    RAISE NOTICE 'promo_slots candidate id=%, title=%, href=%, is_active=%, priority=%',
      candidate.id, candidate.title, candidate.href, candidate.is_active, candidate.priority;
  END LOOP;

  SELECT ps.id
  INTO keep_id
  FROM public.promo_slots ps
  WHERE ps.title = '이번 주 인기 할인 모아보기'
    AND ps.href = '/search?keyword=스타벅스'
  ORDER BY ps.created_at ASC
  LIMIT 1;

  IF keep_id IS NULL THEN
    SELECT ps.id
    INTO keep_id
    FROM public.promo_slots ps
    ORDER BY ps.priority DESC, ps.created_at ASC
    LIMIT 1;
  END IF;

  IF keep_id IS NULL THEN
    RAISE NOTICE 'promo_slots cleanup skipped: no rows';
    RETURN;
  END IF;

  RAISE NOTICE 'Keeping promo_slot id=%', keep_id;

  INSERT INTO public.promo_slot_histories (
    promo_slot_id,
    title,
    link_url,
    image_url,
    hashtags,
    started_at,
    ended_at,
    final_click_count,
    event_type,
    reason,
    snapshot,
    created_by
  )
  SELECT
    ps.id,
    ps.title,
    ps.href,
    ps.image_url,
    ps.hashtags,
    ps.starts_at,
    ps.ends_at,
    COALESCE(ps.click_count, 0),
    'deleted',
    '061 migration: 샘플 데이터 정리 (canonical 1건만 유지)',
    jsonb_build_object(
      'id', ps.id,
      'title', ps.title,
      'description', ps.description,
      'badge', ps.badge,
      'image_url', ps.image_url,
      'href', ps.href,
      'priority', ps.priority,
      'is_active', ps.is_active,
      'is_sponsored', ps.is_sponsored,
      'sponsor_name', ps.sponsor_name,
      'starts_at', ps.starts_at,
      'ends_at', ps.ends_at,
      'created_at', ps.created_at,
      'updated_at', ps.updated_at,
      'link_type', ps.link_type,
      'hashtags', ps.hashtags,
      'click_count', ps.click_count,
      'impression_count', ps.impression_count
    ),
    NULL
  FROM public.promo_slots ps
  WHERE ps.id <> keep_id;

  DELETE FROM public.promo_slots ps
  WHERE ps.id <> keep_id;

  UPDATE public.promo_slots
  SET is_active = TRUE
  WHERE id = keep_id;

  SELECT COUNT(*) INTO after_count FROM public.promo_slots;
  RAISE NOTICE 'promo_slots COUNT after cleanup: %', after_count;
END $$;

NOTIFY pgrst, 'reload schema';
