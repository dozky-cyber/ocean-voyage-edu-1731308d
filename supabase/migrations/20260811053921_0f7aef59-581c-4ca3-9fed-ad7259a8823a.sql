CREATE TABLE public.automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  category text NOT NULL,
  label text NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.automation_rules TO authenticated;
GRANT ALL ON public.automation_rules TO service_role;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automation_rules_select" ON public.automation_rules
  FOR SELECT TO authenticated USING (public.has_workspace_access(auth.uid()));
CREATE POLICY "automation_rules_insert" ON public.automation_rules
  FOR INSERT TO authenticated WITH CHECK (public.can_manage_business(auth.uid()));
CREATE POLICY "automation_rules_update" ON public.automation_rules
  FOR UPDATE TO authenticated USING (public.can_manage_business(auth.uid()))
  WITH CHECK (public.can_manage_business(auth.uid()));

CREATE TRIGGER automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_proposals_updated_at();

CREATE TABLE public.automation_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key text NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  detail text,
  status text NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'normal',
  due_at timestamptz NOT NULL DEFAULT now(),
  assignee text,
  lead_id uuid REFERENCES public.consultations(id) ON DELETE CASCADE,
  proposal_id uuid REFERENCES public.proposals(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.client_projects(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz,
  completed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX automation_tasks_status_due_idx ON public.automation_tasks (status, due_at);
CREATE INDEX automation_tasks_lead_idx ON public.automation_tasks (lead_id);
CREATE INDEX automation_tasks_project_idx ON public.automation_tasks (project_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_tasks TO authenticated;
GRANT ALL ON public.automation_tasks TO service_role;
ALTER TABLE public.automation_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automation_tasks_select" ON public.automation_tasks
  FOR SELECT TO authenticated USING (public.has_workspace_access(auth.uid()));
CREATE POLICY "automation_tasks_insert" ON public.automation_tasks
  FOR INSERT TO authenticated WITH CHECK (public.can_work_leads(auth.uid()));
CREATE POLICY "automation_tasks_update" ON public.automation_tasks
  FOR UPDATE TO authenticated USING (public.can_work_leads(auth.uid()))
  WITH CHECK (public.can_work_leads(auth.uid()));
CREATE POLICY "automation_tasks_delete" ON public.automation_tasks
  FOR DELETE TO authenticated USING (public.can_manage_business(auth.uid()));

CREATE TRIGGER automation_tasks_updated_at
  BEFORE UPDATE ON public.automation_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_proposals_updated_at();

CREATE TABLE public.automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key text NOT NULL,
  category text NOT NULL,
  event text NOT NULL,
  status text NOT NULL DEFAULT 'success',
  title text NOT NULL,
  detail text,
  entity_type text,
  entity_id uuid,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX automation_logs_created_idx ON public.automation_logs (created_at DESC);

GRANT SELECT, INSERT ON public.automation_logs TO authenticated;
GRANT ALL ON public.automation_logs TO service_role;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automation_logs_select" ON public.automation_logs
  FOR SELECT TO authenticated USING (public.has_workspace_access(auth.uid()));
CREATE POLICY "automation_logs_insert" ON public.automation_logs
  FOR INSERT TO authenticated WITH CHECK (public.can_work_leads(auth.uid()));
CREATE POLICY "automation_logs_delete" ON public.automation_logs
  FOR DELETE TO authenticated USING (public.can_manage_business(auth.uid()));

INSERT INTO public.automation_rules (key, category, label, description, config) VALUES
  ('lead.new_notification', 'lead', 'Notifikasi lead baru', 'Kirim notifikasi ke Telegram setiap lead baru masuk.', '{}'::jsonb),
  ('lead.scoring', 'lead', 'Auto lead scoring', 'Hitung ulang skor & temperatur lead saat lead masuk atau diperbarui.', '{}'::jsonb),
  ('lead.follow_up_reminder', 'lead', 'Reminder follow-up lead', 'Buat tugas follow-up otomatis untuk lead baru.', '{"delayHours": 24}'::jsonb),
  ('lead.hot_alert', 'lead', 'Hot lead alert', 'Alert khusus untuk lead dengan skor tinggi.', '{"minScore": 70}'::jsonb),
  ('sales.proposal_sent_reminder', 'sales', 'Reminder proposal terkirim', 'Ingatkan tim menindaklanjuti proposal yang sudah dikirim.', '{"delayDays": 3}'::jsonb),
  ('sales.follow_up_schedule', 'sales', 'Penjadwalan follow-up sales', 'Jadwalkan follow-up berikutnya saat status lead berubah.', '{"delayDays": 2}'::jsonb),
  ('sales.negotiation_reminder', 'sales', 'Reminder negosiasi', 'Ingatkan tim menutup deal yang sedang dinegosiasikan.', '{"delayDays": 2}'::jsonb),
  ('sales.deal_closed', 'sales', 'Notifikasi deal closed', 'Kirim notifikasi saat proposal disetujui atau invoice lunas.', '{}'::jsonb),
  ('project.create_on_paid', 'project', 'Buat project saat invoice lunas', 'Invoice berstatus paid otomatis membuat workflow project.', '{}'::jsonb),
  ('project.apply_template', 'project', 'Terapkan template project', 'Timeline & task otomatis dari template project.', '{}'::jsonb),
  ('project.deadline_reminder', 'project', 'Reminder deadline', 'Ingatkan deadline project & task yang mendekat.', '{"leadDays": 3}'::jsonb),
  ('project.milestone_notification', 'project', 'Notifikasi milestone', 'Notifikasi saat milestone project tercapai.', '{}'::jsonb),
  ('client.milestone_complete', 'client', 'Notifikasi milestone ke klien', 'Beritahu klien saat milestone selesai.', '{}'::jsonb),
  ('client.approval_request', 'client', 'Permintaan approval klien', 'Minta approval klien pada milestone tertentu.', '{}'::jsonb),
  ('client.project_update', 'client', 'Update progress project', 'Kirim update progress project ke klien.', '{}'::jsonb);