ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS brief_timeline text,
  ADD COLUMN IF NOT EXISTS estimated_timeline text,
  ADD COLUMN IF NOT EXISTS enhancements jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.proposal_versions
  ADD COLUMN IF NOT EXISTS brief_timeline text,
  ADD COLUMN IF NOT EXISTS estimated_timeline text,
  ADD COLUMN IF NOT EXISTS enhancements jsonb NOT NULL DEFAULT '[]'::jsonb;