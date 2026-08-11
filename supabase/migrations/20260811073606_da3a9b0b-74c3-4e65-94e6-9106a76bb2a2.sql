CREATE TABLE public.assistant_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Percakapan baru',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.assistant_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.assistant_threads(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL DEFAULT '',
  parts jsonb NOT NULL DEFAULT '[]'::jsonb,
  client_message_id text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.assistant_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('business','sales','project','operational')),
  title text NOT NULL,
  content text NOT NULL,
  importance integer NOT NULL DEFAULT 3,
  source_thread_id uuid REFERENCES public.assistant_threads(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX assistant_threads_owner_idx ON public.assistant_threads (created_by, last_message_at DESC);
CREATE INDEX assistant_messages_thread_idx ON public.assistant_messages (thread_id, created_at);
CREATE INDEX assistant_memories_category_idx ON public.assistant_memories (category, updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assistant_threads TO authenticated;
GRANT ALL ON public.assistant_threads TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assistant_messages TO authenticated;
GRANT ALL ON public.assistant_messages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assistant_memories TO authenticated;
GRANT ALL ON public.assistant_memories TO service_role;

ALTER TABLE public.assistant_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assistant_threads_select" ON public.assistant_threads FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.can_manage_business(auth.uid()));
CREATE POLICY "assistant_threads_insert" ON public.assistant_threads FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.has_workspace_access(auth.uid()));
CREATE POLICY "assistant_threads_update" ON public.assistant_threads FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.can_manage_business(auth.uid()))
  WITH CHECK (created_by = auth.uid() OR public.can_manage_business(auth.uid()));
CREATE POLICY "assistant_threads_delete" ON public.assistant_threads FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.can_manage_business(auth.uid()));

CREATE POLICY "assistant_messages_select" ON public.assistant_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.assistant_threads t WHERE t.id = thread_id
    AND (t.created_by = auth.uid() OR public.can_manage_business(auth.uid()))));
CREATE POLICY "assistant_messages_insert" ON public.assistant_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.assistant_threads t WHERE t.id = thread_id AND t.created_by = auth.uid()));
CREATE POLICY "assistant_messages_delete" ON public.assistant_messages FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.assistant_threads t WHERE t.id = thread_id
    AND (t.created_by = auth.uid() OR public.can_manage_business(auth.uid()))));

CREATE POLICY "assistant_memories_select" ON public.assistant_memories FOR SELECT TO authenticated
  USING (public.has_workspace_access(auth.uid()));
CREATE POLICY "assistant_memories_insert" ON public.assistant_memories FOR INSERT TO authenticated
  WITH CHECK (public.can_work_leads(auth.uid()));
CREATE POLICY "assistant_memories_update" ON public.assistant_memories FOR UPDATE TO authenticated
  USING (public.can_work_leads(auth.uid())) WITH CHECK (public.can_work_leads(auth.uid()));
CREATE POLICY "assistant_memories_delete" ON public.assistant_memories FOR DELETE TO authenticated
  USING (public.can_manage_business(auth.uid()));

CREATE TRIGGER assistant_threads_updated_at BEFORE UPDATE ON public.assistant_threads
  FOR EACH ROW EXECUTE FUNCTION public.set_proposals_updated_at();
CREATE TRIGGER assistant_memories_updated_at BEFORE UPDATE ON public.assistant_memories
  FOR EACH ROW EXECUTE FUNCTION public.set_proposals_updated_at();