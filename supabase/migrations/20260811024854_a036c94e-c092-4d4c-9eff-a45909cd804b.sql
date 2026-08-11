CREATE TABLE public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'KERJAKU Digital Solution Proposal',
  status text NOT NULL DEFAULT 'Draft',
  recommended_package text,
  content jsonb NOT NULL DEFAULT '[]'::jsonb,
  investment_note text,
  timeline_note text,
  created_by uuid,
  sent_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposals TO authenticated;
GRANT ALL ON public.proposals TO service_role;

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view proposals" ON public.proposals
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create proposals" ON public.proposals
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update proposals" ON public.proposals
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete proposals" ON public.proposals
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX proposals_lead_id_idx ON public.proposals(lead_id);

CREATE OR REPLACE FUNCTION public.set_proposals_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER proposals_updated_at BEFORE UPDATE ON public.proposals
FOR EACH ROW EXECUTE FUNCTION public.set_proposals_updated_at();