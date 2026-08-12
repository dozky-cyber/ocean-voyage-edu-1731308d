CREATE TABLE public.assistant_owner_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  detail text,
  status text NOT NULL DEFAULT 'open',
  source text NOT NULL DEFAULT 'telegram',
  chat_id text,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assistant_owner_tasks TO authenticated;
GRANT ALL ON public.assistant_owner_tasks TO service_role;
ALTER TABLE public.assistant_owner_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace can read owner tasks" ON public.assistant_owner_tasks FOR SELECT TO authenticated USING (public.has_workspace_access(auth.uid()));
CREATE POLICY "managers insert owner tasks" ON public.assistant_owner_tasks FOR INSERT TO authenticated WITH CHECK (public.can_manage_business(auth.uid()));
CREATE POLICY "managers update owner tasks" ON public.assistant_owner_tasks FOR UPDATE TO authenticated USING (public.can_manage_business(auth.uid()));
CREATE POLICY "managers delete owner tasks" ON public.assistant_owner_tasks FOR DELETE TO authenticated USING (public.can_manage_business(auth.uid()));
CREATE TRIGGER assistant_owner_tasks_updated_at BEFORE UPDATE ON public.assistant_owner_tasks FOR EACH ROW EXECUTE FUNCTION public.set_proposals_updated_at();

CREATE TABLE public.assistant_daily_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_date date NOT NULL,
  chat_id text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error text,
  timezone text NOT NULL DEFAULT 'Asia/Jakarta',
  scheduled_for timestamptz,
  sent_at timestamptz NOT NULL DEFAULT now(),
  trigger_source text NOT NULL DEFAULT 'cron',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX assistant_daily_briefs_date_idx ON public.assistant_daily_briefs (brief_date DESC);
GRANT SELECT ON public.assistant_daily_briefs TO authenticated;
GRANT ALL ON public.assistant_daily_briefs TO service_role;
ALTER TABLE public.assistant_daily_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace can read daily briefs" ON public.assistant_daily_briefs FOR SELECT TO authenticated USING (public.has_workspace_access(auth.uid()));