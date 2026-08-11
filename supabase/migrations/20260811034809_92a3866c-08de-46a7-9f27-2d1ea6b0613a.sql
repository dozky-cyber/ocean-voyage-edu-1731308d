ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS pricing_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'IDR',
  ADD COLUMN IF NOT EXISTS valid_until date,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS viewed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone;

CREATE TABLE IF NOT EXISTS public.proposal_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  version integer NOT NULL,
  title text NOT NULL,
  recommended_package text,
  content jsonb NOT NULL DEFAULT '[]'::jsonb,
  pricing_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  investment_note text,
  timeline_note text,
  note text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS proposal_versions_proposal_idx
  ON public.proposal_versions (proposal_id, version DESC);

GRANT SELECT, INSERT ON public.proposal_versions TO authenticated;
GRANT ALL ON public.proposal_versions TO service_role;

ALTER TABLE public.proposal_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view proposal versions"
  ON public.proposal_versions FOR SELECT TO authenticated
  USING (has_workspace_access(auth.uid()));

CREATE POLICY "Sales team can create proposal versions"
  ON public.proposal_versions FOR INSERT TO authenticated
  WITH CHECK (can_work_leads(auth.uid()));

CREATE POLICY "Managers can delete proposal versions"
  ON public.proposal_versions FOR DELETE TO authenticated
  USING (can_manage_business(auth.uid()));