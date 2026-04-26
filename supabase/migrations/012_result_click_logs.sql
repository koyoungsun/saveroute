CREATE TABLE IF NOT EXISTS public.result_click_logs (
  id BIGSERIAL PRIMARY KEY,
  brand_id INT NOT NULL REFERENCES public.brands(id),
  discount_id INT NOT NULL REFERENCES public.discounts(id),
  action_type TEXT NOT NULL
    CHECK (action_type IN ('view_detail', 'use_discount')),
  gender_group TEXT,
  age_group TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_result_click_logs_brand_id
  ON public.result_click_logs(brand_id);
CREATE INDEX IF NOT EXISTS idx_result_click_logs_discount_id
  ON public.result_click_logs(discount_id);
CREATE INDEX IF NOT EXISTS idx_result_click_logs_action_type
  ON public.result_click_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_result_click_logs_created_at
  ON public.result_click_logs(created_at);
