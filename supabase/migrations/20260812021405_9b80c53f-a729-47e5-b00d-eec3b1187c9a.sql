CREATE TABLE public.document_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  kind text NOT NULL DEFAULT 'order-brief',
  bucket text NOT NULL DEFAULT 'order-briefs',
  path text NOT NULL,
  file_name text NOT NULL,
  lead_id uuid REFERENCES public.consultations(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.ai_conversations(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_links TO authenticated;
GRANT ALL ON public.document_links TO service_role;

ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace can view document links"
ON public.document_links FOR SELECT TO authenticated
USING (public.has_workspace_access(auth.uid()));

CREATE POLICY "Sales can create document links"
ON public.document_links FOR INSERT TO authenticated
WITH CHECK (public.can_work_leads(auth.uid()));

CREATE POLICY "Sales can update document links"
ON public.document_links FOR UPDATE TO authenticated
USING (public.can_work_leads(auth.uid()));

CREATE POLICY "Admins can delete document links"
ON public.document_links FOR DELETE TO authenticated
USING (public.can_manage_business(auth.uid()));

CREATE TRIGGER document_links_updated_at
BEFORE UPDATE ON public.document_links
FOR EACH ROW EXECUTE FUNCTION public.set_proposals_updated_at();

CREATE INDEX document_links_lead_idx ON public.document_links(lead_id);