-- brand_requests 상태값 정리: reviewing / rejected 용어로 통일

ALTER TABLE public.brand_requests DROP CONSTRAINT IF EXISTS brand_requests_status_check;

UPDATE public.brand_requests SET status = 'reviewing' WHERE status = 'processing';
UPDATE public.brand_requests SET status = 'rejected' WHERE status = 'ignored';

ALTER TABLE public.brand_requests
  ADD CONSTRAINT brand_requests_status_check
  CHECK (status IN ('pending', 'reviewing', 'completed', 'rejected'));
