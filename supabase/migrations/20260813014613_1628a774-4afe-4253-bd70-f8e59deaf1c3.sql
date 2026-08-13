ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS payment_type text NOT NULL DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS schedule jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS optional_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS project_name text,
  ADD COLUMN IF NOT EXISTS paid_amount numeric NOT NULL DEFAULT 0;