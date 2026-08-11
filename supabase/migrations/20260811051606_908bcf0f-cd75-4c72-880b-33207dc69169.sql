-- 1) Delivery stage on existing projects (non-breaking, defaulted + backfilled)
ALTER TABLE public.client_projects
  ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'Planning';

UPDATE public.client_projects SET stage = CASE
  WHEN status = 'Completed' THEN 'Completed'
  WHEN status = 'Live' THEN 'Client Approval'
  WHEN status = 'Testing' THEN 'Review'
  WHEN status IN ('Design','Development') THEN 'In Progress'
  ELSE 'Planning'
END;

-- 2) Identity helpers: map an auth user to a team_members row by email
CREATE OR REPLACE FUNCTION public.team_member_name(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tm.name
  FROM public.team_members tm
  JOIN auth.users u ON lower(u.email) = lower(tm.email)
  WHERE u.id = _user_id AND tm.active
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_project_member(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.client_projects p
    WHERE p.id = _project_id
      AND public.team_member_name(_user_id) IS NOT NULL
      AND (
        p.team ? public.team_member_name(_user_id)
        OR EXISTS (
          SELECT 1 FROM public.project_tasks t
          WHERE t.project_id = p.id
            AND lower(t.assignee) = lower(public.team_member_name(_user_id))
        )
      )
  )
$$;

-- 3) Scope project reads: managers see all, members see assigned only
DROP POLICY IF EXISTS "Team can view client projects" ON public.client_projects;
CREATE POLICY "Team can view client projects" ON public.client_projects
FOR SELECT TO authenticated
USING (public.can_manage_business(auth.uid()) OR public.is_project_member(auth.uid(), id));

DROP POLICY IF EXISTS "Team can view project tasks" ON public.project_tasks;
CREATE POLICY "Team can view project tasks" ON public.project_tasks
FOR SELECT TO authenticated
USING (public.can_manage_business(auth.uid()) OR public.is_project_member(auth.uid(), project_id));

DROP POLICY IF EXISTS "Team can view project activities" ON public.project_activities;
CREATE POLICY "Team can view project activities" ON public.project_activities
FOR SELECT TO authenticated
USING (public.can_manage_business(auth.uid()) OR public.is_project_member(auth.uid(), project_id));

-- Assigned members may update their own tasks
DROP POLICY IF EXISTS "Sales team can update project tasks" ON public.project_tasks;
CREATE POLICY "Sales team can update project tasks" ON public.project_tasks
FOR UPDATE TO authenticated
USING (public.can_work_leads(auth.uid()) OR public.is_project_member(auth.uid(), project_id))
WITH CHECK (public.can_work_leads(auth.uid()) OR public.is_project_member(auth.uid(), project_id));

-- Assigned members may log activity on their projects
DROP POLICY IF EXISTS "Sales team can create project activities" ON public.project_activities;
CREATE POLICY "Sales team can create project activities" ON public.project_activities
FOR INSERT TO authenticated
WITH CHECK (public.can_work_leads(auth.uid()) OR public.is_project_member(auth.uid(), project_id));

-- 4) Task comments / internal discussion
CREATE TABLE IF NOT EXISTS public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT 'KERJAKU Team',
  body text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_comments TO authenticated;
GRANT ALL ON public.task_comments TO service_role;

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view task comments" ON public.task_comments
FOR SELECT TO authenticated
USING (public.can_manage_business(auth.uid()) OR public.is_project_member(auth.uid(), project_id));

CREATE POLICY "Team can add task comments" ON public.task_comments
FOR INSERT TO authenticated
WITH CHECK (
  (public.can_work_leads(auth.uid()) OR public.is_project_member(auth.uid(), project_id))
  AND created_by = auth.uid()
);

CREATE POLICY "Authors and managers can delete task comments" ON public.task_comments
FOR DELETE TO authenticated
USING (public.can_manage_business(auth.uid()) OR created_by = auth.uid());

CREATE INDEX IF NOT EXISTS task_comments_task_id_idx ON public.task_comments(task_id, created_at);