ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS ai_recommended_package text,
  ADD COLUMN IF NOT EXISTS ai_business_category text,
  ADD COLUMN IF NOT EXISTS ai_problems jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_lead_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_qualification_status text,
  ADD COLUMN IF NOT EXISTS ai_complexity text,
  ADD COLUMN IF NOT EXISTS ai_conversation jsonb NOT NULL DEFAULT '[]'::jsonb;