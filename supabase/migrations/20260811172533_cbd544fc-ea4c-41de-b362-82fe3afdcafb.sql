ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;
CREATE INDEX IF NOT EXISTS idx_consultations_archived_at ON public.consultations (archived_at);