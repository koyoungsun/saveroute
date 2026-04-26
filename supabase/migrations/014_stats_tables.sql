CREATE TABLE IF NOT EXISTS public.daily_search_stats (
  date DATE PRIMARY KEY,
  total_search_count INT NOT NULL DEFAULT 0,
  matched_search_count INT NOT NULL DEFAULT 0,
  unmatched_search_count INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.brand_daily_stats (
  date DATE NOT NULL,
  brand_id INT NOT NULL REFERENCES public.brands(id),
  search_count INT NOT NULL DEFAULT 0,
  detail_view_count INT NOT NULL DEFAULT 0,
  discount_click_count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (date, brand_id)
);

CREATE TABLE IF NOT EXISTS public.brand_request_daily_stats (
  date DATE NOT NULL,
  normalized_keyword TEXT NOT NULL,
  request_count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (date, normalized_keyword)
);

CREATE TABLE IF NOT EXISTS public.daily_user_stats (
  date DATE PRIMARY KEY,
  signup_count INT NOT NULL DEFAULT 0,
  active_user_count INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.segment_search_stats (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  gender_group TEXT,
  age_group TEXT,
  brand_id INT REFERENCES public.brands(id),
  search_count INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_brand_daily_stats_brand_id
  ON public.brand_daily_stats(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_daily_stats_search_count
  ON public.brand_daily_stats(search_count DESC);
CREATE INDEX IF NOT EXISTS idx_brand_request_daily_stats_request_count
  ON public.brand_request_daily_stats(request_count DESC);
CREATE INDEX IF NOT EXISTS idx_segment_search_stats_brand_id
  ON public.segment_search_stats(brand_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_segment_search_stats_unique_segment
  ON public.segment_search_stats(
    date,
    COALESCE(gender_group, ''),
    COALESCE(age_group, ''),
    COALESCE(brand_id, 0)
  );
