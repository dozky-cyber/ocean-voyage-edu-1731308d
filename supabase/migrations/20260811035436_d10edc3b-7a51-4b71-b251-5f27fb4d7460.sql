CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  proposal_id uuid REFERENCES public.proposals(id) ON DELETE SET NULL,
  number text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT 'KERJAKU Invoice',
  client_name text,
  client_email text,
  client_whatsapp text,
  client_company text,
  package text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  currency text NOT NULL DEFAULT 'IDR',
  amount numeric NOT NULL DEFAULT 0,
  due_date date,
  status text NOT NULL DEFAULT 'Pending',
  provider text NOT NULL DEFAULT 'manual_transfer',
  payment_link text,
  provider_reference text,
  notes text,
  paid_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view invoices" ON public.invoices FOR SELECT TO authenticated USING (public.has_workspace_access(auth.uid()));
CREATE POLICY "Sales team can create invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (public.can_work_leads(auth.uid()));
CREATE POLICY "Sales team can update invoices" ON public.invoices FOR UPDATE TO authenticated USING (public.can_work_leads(auth.uid())) WITH CHECK (public.can_work_leads(auth.uid()));
CREATE POLICY "Managers can delete invoices" ON public.invoices FOR DELETE TO authenticated USING (public.can_manage_business(auth.uid()));

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.consultations(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  whatsapp text,
  company text,
  package text,
  status text NOT NULL DEFAULT 'Active',
  portal_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  notes text,
  converted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view clients" ON public.clients FOR SELECT TO authenticated USING (public.has_workspace_access(auth.uid()));
CREATE POLICY "Sales team can create clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (public.can_work_leads(auth.uid()));
CREATE POLICY "Sales team can update clients" ON public.clients FOR UPDATE TO authenticated USING (public.can_work_leads(auth.uid())) WITH CHECK (public.can_work_leads(auth.uid()));
CREATE POLICY "Managers can delete clients" ON public.clients FOR DELETE TO authenticated USING (public.can_manage_business(auth.uid()));

CREATE TABLE public.client_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'Onboarding',
  progress integer NOT NULL DEFAULT 0,
  summary text,
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  start_date date,
  target_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_projects TO authenticated;
GRANT ALL ON public.client_projects TO service_role;
ALTER TABLE public.client_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view client projects" ON public.client_projects FOR SELECT TO authenticated USING (public.has_workspace_access(auth.uid()));
CREATE POLICY "Sales team can create client projects" ON public.client_projects FOR INSERT TO authenticated WITH CHECK (public.can_work_leads(auth.uid()));
CREATE POLICY "Sales team can update client projects" ON public.client_projects FOR UPDATE TO authenticated USING (public.can_work_leads(auth.uid())) WITH CHECK (public.can_work_leads(auth.uid()));
CREATE POLICY "Managers can delete client projects" ON public.client_projects FOR DELETE TO authenticated USING (public.can_manage_business(auth.uid()));

CREATE TABLE public.client_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  kind text NOT NULL DEFAULT 'document',
  url text,
  proposal_id uuid REFERENCES public.proposals(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_documents TO authenticated;
GRANT ALL ON public.client_documents TO service_role;
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view client documents" ON public.client_documents FOR SELECT TO authenticated USING (public.has_workspace_access(auth.uid()));
CREATE POLICY "Sales team can create client documents" ON public.client_documents FOR INSERT TO authenticated WITH CHECK (public.can_work_leads(auth.uid()));
CREATE POLICY "Sales team can update client documents" ON public.client_documents FOR UPDATE TO authenticated USING (public.can_work_leads(auth.uid())) WITH CHECK (public.can_work_leads(auth.uid()));
CREATE POLICY "Managers can delete client documents" ON public.client_documents FOR DELETE TO authenticated USING (public.can_manage_business(auth.uid()));

CREATE TABLE public.client_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  sender text NOT NULL DEFAULT 'team',
  author_name text,
  body text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_messages TO authenticated;
GRANT ALL ON public.client_messages TO service_role;
ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view client messages" ON public.client_messages FOR SELECT TO authenticated USING (public.has_workspace_access(auth.uid()));
CREATE POLICY "Sales team can create client messages" ON public.client_messages FOR INSERT TO authenticated WITH CHECK (public.can_work_leads(auth.uid()));
CREATE POLICY "Managers can delete client messages" ON public.client_messages FOR DELETE TO authenticated USING (public.can_manage_business(auth.uid()));

CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_proposals_updated_at();
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.set_proposals_updated_at();
CREATE TRIGGER client_projects_updated_at BEFORE UPDATE ON public.client_projects FOR EACH ROW EXECUTE FUNCTION public.set_proposals_updated_at();

CREATE INDEX invoices_lead_id_idx ON public.invoices(lead_id);
CREATE INDEX clients_lead_id_idx ON public.clients(lead_id);
CREATE INDEX client_projects_client_id_idx ON public.client_projects(client_id);
CREATE INDEX client_documents_client_id_idx ON public.client_documents(client_id);
CREATE INDEX client_messages_client_id_idx ON public.client_messages(client_id);