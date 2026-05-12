ALTER TABLE public.promo_slots
  ADD COLUMN IF NOT EXISTS link_type TEXT NOT NULL DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS hashtags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS click_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS impression_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.promo_slots
  DROP CONSTRAINT IF EXISTS promo_slots_link_type_check,
  ADD CONSTRAINT promo_slots_link_type_check
    CHECK (link_type IN ('internal', 'external'));

ALTER TABLE public.promo_slots
  DROP CONSTRAINT IF EXISTS promo_slots_href_safety_check,
  ADD CONSTRAINT promo_slots_href_safety_check
    CHECK (
      (link_type = 'internal' AND href LIKE '/%' AND href NOT LIKE '//%')
      OR
      (link_type = 'external' AND (href LIKE 'https://%' OR href LIKE 'http://%'))
    );

ALTER TABLE public.promo_slots
  DROP CONSTRAINT IF EXISTS promo_slots_count_non_negative_check,
  ADD CONSTRAINT promo_slots_count_non_negative_check
    CHECK (click_count >= 0 AND impression_count >= 0);

CREATE INDEX IF NOT EXISTS idx_promo_slots_link_type
  ON public.promo_slots (link_type);

CREATE OR REPLACE FUNCTION public.increment_promo_slot_click_count(slot_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.promo_slots
  SET click_count = click_count + 1
  WHERE id = slot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.increment_promo_slot_click_count(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_promo_slot_click_count(BIGINT) TO service_role;

UPDATE public.promo_slots
SET link_type = CASE
  WHEN href LIKE 'http://%' OR href LIKE 'https://%' THEN 'external'
  ELSE 'internal'
END
WHERE link_type IS NULL OR link_type NOT IN ('internal', 'external');
