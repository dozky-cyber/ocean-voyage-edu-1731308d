CREATE TABLE public.conversation_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.consultations(id) ON DELETE SET NULL,
  version integer NOT NULL,
  business text NOT NULL DEFAULT '',
  project text NOT NULL DEFAULT '',
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  problems jsonb NOT NULL DEFAULT '[]'::jsonb,
  package_name text,
  timeline text,
  budget text,
  users_scale text,
  intent text NOT NULL DEFAULT 'medium',
  score integer NOT NULL DEFAULT 0,
  contact_name text,
  contact_email text,
  contact_whatsapp text,
  summary text,
  change_note text,
  final_prompt text,
  source text NOT NULL DEFAULT 'ai',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, version)
);

GRANT SELECT, INSERT ON public.conversation_requirements TO authenticated;
GRANT ALL ON public.conversation_requirements TO service_role;

ALTER TABLE public.conversation_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace can read requirement versions"
ON public.conversation_requirements FOR SELECT TO authenticated
USING (public.has_workspace_access(auth.uid()));

CREATE POLICY "Sales can add requirement versions"
ON public.conversation_requirements FOR INSERT TO authenticated
WITH CHECK (public.can_work_leads(auth.uid()));

CREATE INDEX idx_conversation_requirements_conversation
ON public.conversation_requirements (conversation_id, version DESC);