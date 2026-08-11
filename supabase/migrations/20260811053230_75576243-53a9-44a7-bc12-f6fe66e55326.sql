CREATE TABLE public.portfolio_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'Web App',
  client_type text,
  thumbnail_url text,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  description text,
  problem text,
  solution text,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  tech_stack jsonb NOT NULL DEFAULT '[]'::jsonb,
  result text,
  testimonial_quote text,
  testimonial_author text,
  testimonial_role text,
  seo_title text,
  seo_description text,
  og_image text,
  published boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.portfolio_projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_projects TO authenticated;
GRANT ALL ON public.portfolio_projects TO service_role;

ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published portfolio is public"
ON public.portfolio_projects FOR SELECT
USING (published = true);

CREATE POLICY "Workspace can read all portfolio"
ON public.portfolio_projects FOR SELECT TO authenticated
USING (public.has_workspace_access(auth.uid()));

CREATE POLICY "Managers can insert portfolio"
ON public.portfolio_projects FOR INSERT TO authenticated
WITH CHECK (public.can_manage_business(auth.uid()));

CREATE POLICY "Managers can update portfolio"
ON public.portfolio_projects FOR UPDATE TO authenticated
USING (public.can_manage_business(auth.uid()))
WITH CHECK (public.can_manage_business(auth.uid()));

CREATE POLICY "Managers can delete portfolio"
ON public.portfolio_projects FOR DELETE TO authenticated
USING (public.can_manage_business(auth.uid()));

CREATE TRIGGER portfolio_projects_updated_at
BEFORE UPDATE ON public.portfolio_projects
FOR EACH ROW EXECUTE FUNCTION public.set_proposals_updated_at();

CREATE INDEX portfolio_projects_published_idx ON public.portfolio_projects (published, position);