CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'Developer',
  avatar_url text,
  title text,
  active boolean NOT NULL DEFAULT true,
  capacity integer NOT NULL DEFAULT 6,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX team_members_email_key ON public.team_members (lower(email));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace can view team members"
ON public.team_members FOR SELECT TO authenticated
USING (public.has_workspace_access(auth.uid()));

CREATE POLICY "Managers can add team members"
ON public.team_members FOR INSERT TO authenticated
WITH CHECK (public.can_manage_business(auth.uid()));

CREATE POLICY "Managers can update team members"
ON public.team_members FOR UPDATE TO authenticated
USING (public.can_manage_business(auth.uid()))
WITH CHECK (public.can_manage_business(auth.uid()));

CREATE POLICY "Managers can remove team members"
ON public.team_members FOR DELETE TO authenticated
USING (public.can_manage_business(auth.uid()));

CREATE TRIGGER team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.set_proposals_updated_at();