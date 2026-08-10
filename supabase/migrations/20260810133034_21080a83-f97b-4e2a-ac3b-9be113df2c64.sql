CREATE TABLE public.consultations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  project_type TEXT NOT NULL,
  requirement TEXT NOT NULL,
  budget TEXT NOT NULL,
  timeline TEXT NOT NULL,
  business_name TEXT,
  features TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT ALL ON public.consultations TO service_role;

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages consultations"
  ON public.consultations FOR ALL TO service_role
  USING (true) WITH CHECK (true);