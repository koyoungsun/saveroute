-- Add provider-level vs product-specific scope for discounts.
-- Some discounts apply to all products of a provider (e.g. all cards from a card company).

ALTER TABLE public.discounts
  ADD COLUMN IF NOT EXISTS benefit_scope TEXT;

ALTER TABLE public.discounts
  DROP CONSTRAINT IF EXISTS discounts_benefit_scope_check;

ALTER TABLE public.discounts
  ADD CONSTRAINT discounts_benefit_scope_check
  CHECK (benefit_scope IN ('provider_all', 'product_specific') OR benefit_scope IS NULL);

-- Enforce consistent combinations.
ALTER TABLE public.discounts
  DROP CONSTRAINT IF EXISTS discounts_benefit_scope_consistency_check;

ALTER TABLE public.discounts
  ADD CONSTRAINT discounts_benefit_scope_consistency_check
  CHECK (
    (benefit_product_id IS NULL AND COALESCE(benefit_scope, 'provider_all') = 'provider_all')
    OR
    (benefit_product_id IS NOT NULL AND COALESCE(benefit_scope, 'product_specific') = 'product_specific')
  );

CREATE OR REPLACE FUNCTION public.set_discount_benefit_scope()
RETURNS TRIGGER AS $$
BEGIN
  -- Default/infer scope if not provided.
  IF NEW.benefit_scope IS NULL THEN
    IF NEW.benefit_product_id IS NULL THEN
      NEW.benefit_scope := 'provider_all';
    ELSE
      NEW.benefit_scope := 'product_specific';
    END IF;
  END IF;

  -- Keep data consistent if benefit_product_id changes.
  IF NEW.benefit_product_id IS NULL THEN
    NEW.benefit_scope := 'provider_all';
  ELSE
    NEW.benefit_scope := 'product_specific';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_discount_benefit_scope ON public.discounts;
CREATE TRIGGER trg_set_discount_benefit_scope
  BEFORE INSERT OR UPDATE OF benefit_product_id, benefit_scope
  ON public.discounts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_discount_benefit_scope();

