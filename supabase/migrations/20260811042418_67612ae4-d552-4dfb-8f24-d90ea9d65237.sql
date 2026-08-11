ALTER TABLE public.client_projects
  ADD COLUMN IF NOT EXISTS template text NOT NULL DEFAULT 'website_development',
  ADD COLUMN IF NOT EXISTS phase text NOT NULL DEFAULT 'Kickoff & Onboarding',
  ADD COLUMN IF NOT EXISTS scope text,
  ADD COLUMN IF NOT EXISTS team jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assignee text,
  priority text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'Todo',
  due_date date,
  notes text,
  position integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_tasks TO authenticated;
GRANT ALL ON public.project_tasks TO service_role;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view project tasks" ON public.project_tasks
  FOR SELECT TO authenticated USING (public.has_workspace_access(auth.uid()));
CREATE POLICY "Sales team can create project tasks" ON public.project_tasks
  FOR INSERT TO authenticated WITH CHECK (public.can_work_leads(auth.uid()));
CREATE POLICY "Sales team can update project tasks" ON public.project_tasks
  FOR UPDATE TO authenticated USING (public.can_work_leads(auth.uid())) WITH CHECK (public.can_work_leads(auth.uid()));
CREATE POLICY "Managers can delete project tasks" ON public.project_tasks
  FOR DELETE TO authenticated USING (public.can_manage_business(auth.uid()));

CREATE TRIGGER project_tasks_updated_at
  BEFORE UPDATE ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_proposals_updated_at();

CREATE INDEX IF NOT EXISTS project_tasks_project_id_idx ON public.project_tasks (project_id);

CREATE TABLE IF NOT EXISTS public.project_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
  actor text NOT NULL DEFAULT 'KERJAKU Team',
  action text NOT NULL,
  detail text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.project_activities TO authenticated;
GRANT ALL ON public.project_activities TO service_role;
ALTER TABLE public.project_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view project activities" ON public.project_activities
  FOR SELECT TO authenticated USING (public.has_workspace_access(auth.uid()));
CREATE POLICY "Sales team can create project activities" ON public.project_activities
  FOR INSERT TO authenticated WITH CHECK (public.can_work_leads(auth.uid()));
CREATE POLICY "Managers can delete project activities" ON public.project_activities
  FOR DELETE TO authenticated USING (public.can_manage_business(auth.uid()));

CREATE INDEX IF NOT EXISTS project_activities_project_id_idx ON public.project_activities (project_id);