CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'draft',
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  message_count integer NOT NULL DEFAULT 0,
  intent text NOT NULL DEFAULT 'unknown',
  business_category text,
  problems jsonb NOT NULL DEFAULT '[]'::jsonb,
  requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  package_name text,
  complexity text,
  budget text,
  timeline text,
  users_scale text,
  contact_name text,
  contact_email text,
  contact_whatsapp text,
  summary text,
  score integer NOT NULL DEFAULT 0,
  qualified_at timestamptz,
  lead_id uuid REFERENCES public.consultations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversations TO authenticated;
GRANT ALL ON public.ai_conversations TO service_role;

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace can view ai conversations"
  ON public.ai_conversations FOR SELECT TO authenticated
  USING (public.has_workspace_access(auth.uid()));

CREATE POLICY "Sales can update ai conversations"
  ON public.ai_conversations FOR UPDATE TO authenticated
  USING (public.can_work_leads(auth.uid()))
  WITH CHECK (public.can_work_leads(auth.uid()));

CREATE POLICY "Owners can delete ai conversations"
  ON public.ai_conversations FOR DELETE TO authenticated
  USING (public.can_manage_business(auth.uid()));

CREATE TRIGGER ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_proposals_updated_at();

CREATE INDEX ai_conversations_status_idx ON public.ai_conversations (status, updated_at DESC);