-- Optional count of active discounts returned for this search (0 if unmatched / none).
ALTER TABLE public.search_logs
ADD COLUMN IF NOT EXISTS result_count integer;
