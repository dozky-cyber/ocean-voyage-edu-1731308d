CREATE TABLE public.lead_ai_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  label TEXT,
  content TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users,
  created_by_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_ai_activities TO authenticated;
GRANT ALL ON public.lead_ai_activities TO service_role;

ALTER TABLE public.lead_ai_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view lead ai activities" ON public.lead_ai_activities
  FOR SELECT TO authenticated USING (public.has_workspace_access(auth.uid()));
CREATE POLICY "Sales team can create lead ai activities" ON public.lead_ai_activities
  FOR INSERT TO authenticated WITH CHECK (public.can_work_leads(auth.uid()));
CREATE POLICY "Managers can delete lead ai activities" ON public.lead_ai_activities
  FOR DELETE TO authenticated USING (public.can_manage_business(auth.uid()));

CREATE INDEX lead_ai_activities_lead_id_idx ON public.lead_ai_activities(lead_id, created_at DESC);