ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS payment_type text NOT NULL DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS payment_dp_percent integer,
  ADD COLUMN IF NOT EXISTS payment_terms_text text,
  ADD COLUMN IF NOT EXISTS core_features jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.proposal_versions
  ADD COLUMN IF NOT EXISTS payment_type text NOT NULL DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS payment_dp_percent integer,
  ADD COLUMN IF NOT EXISTS payment_terms_text text,
  ADD COLUMN IF NOT EXISTS core_features jsonb NOT NULL DEFAULT '[]'::jsonb;