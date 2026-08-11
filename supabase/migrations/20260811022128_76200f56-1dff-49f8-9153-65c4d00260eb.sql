ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS lead_source text NOT NULL DEFAULT 'manual_form';

CREATE INDEX IF NOT EXISTS consultations_lead_source_idx ON public.consultations (lead_source);