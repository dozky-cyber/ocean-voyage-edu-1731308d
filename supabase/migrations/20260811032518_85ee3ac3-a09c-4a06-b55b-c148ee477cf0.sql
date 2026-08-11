-- Approved team list (whitelist)
CREATE TABLE public.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  role public.app_role NOT NULL DEFAULT 'viewer',
  invited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_members TO authenticated;
GRANT ALL ON public.workspace_members TO service_role;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.has_workspace_access(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('owner','admin','sales','viewer')
  )
$$;

CREATE OR REPLACE FUNCTION public.can_manage_business(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('owner','admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.can_work_leads(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('owner','admin','sales')
  )
$$;

-- Seed the allowlist with existing admins as owners so current access keeps working
INSERT INTO public.workspace_members (email, role)
SELECT lower(u.email), 'owner'::public.app_role
FROM auth.users u
JOIN public.user_roles r ON r.user_id = u.id
WHERE r.role = 'admin' AND u.email IS NOT NULL
ON CONFLICT (email) DO NOTHING;

-- Promote existing admins to owner role as well (keep admin row too)
INSERT INTO public.user_roles (user_id, role)
SELECT r.user_id, 'owner'::public.app_role FROM public.user_roles r WHERE r.role = 'admin'
ON CONFLICT (user_id, role) DO NOTHING;

-- workspace_members policies
CREATE POLICY "Managers can view members" ON public.workspace_members
  FOR SELECT TO authenticated USING (public.can_manage_business(auth.uid()));
CREATE POLICY "Managers can add members" ON public.workspace_members
  FOR INSERT TO authenticated WITH CHECK (public.can_manage_business(auth.uid()));
CREATE POLICY "Managers can update members" ON public.workspace_members
  FOR UPDATE TO authenticated USING (public.can_manage_business(auth.uid()))
  WITH CHECK (public.can_manage_business(auth.uid()));
CREATE POLICY "Managers can remove members" ON public.workspace_members
  FOR DELETE TO authenticated USING (public.can_manage_business(auth.uid()));

-- Consultations: role-aware access
DROP POLICY IF EXISTS "Admins can view leads" ON public.consultations;
DROP POLICY IF EXISTS "Admins can update leads" ON public.consultations;
CREATE POLICY "Team can view leads" ON public.consultations
  FOR SELECT TO authenticated USING (public.has_workspace_access(auth.uid()));
CREATE POLICY "Sales team can update leads" ON public.consultations
  FOR UPDATE TO authenticated USING (public.can_work_leads(auth.uid()))
  WITH CHECK (public.can_work_leads(auth.uid()));

-- Proposals: role-aware access
DROP POLICY IF EXISTS "Admins can view proposals" ON public.proposals;
DROP POLICY IF EXISTS "Admins can create proposals" ON public.proposals;
DROP POLICY IF EXISTS "Admins can update proposals" ON public.proposals;
DROP POLICY IF EXISTS "Admins can delete proposals" ON public.proposals;
CREATE POLICY "Team can view proposals" ON public.proposals
  FOR SELECT TO authenticated USING (public.has_workspace_access(auth.uid()));
CREATE POLICY "Sales team can create proposals" ON public.proposals
  FOR INSERT TO authenticated WITH CHECK (public.can_work_leads(auth.uid()));
CREATE POLICY "Sales team can update proposals" ON public.proposals
  FOR UPDATE TO authenticated USING (public.can_work_leads(auth.uid()))
  WITH CHECK (public.can_work_leads(auth.uid()));
CREATE POLICY "Managers can delete proposals" ON public.proposals
  FOR DELETE TO authenticated USING (public.can_manage_business(auth.uid()));

-- Remove the insecure bootstrap
DROP FUNCTION IF EXISTS public.claim_first_admin();