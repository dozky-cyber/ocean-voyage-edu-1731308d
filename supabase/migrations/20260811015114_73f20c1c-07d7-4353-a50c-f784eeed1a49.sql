ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS referrer text,
  ADD COLUMN IF NOT EXISTS landing_page text,
  ADD COLUMN IF NOT EXISTS visited_pages jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS visitor_source text,
  ADD COLUMN IF NOT EXISTS selected_package text,
  ADD COLUMN IF NOT EXISTS viewed_products jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS clicked_ctas jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS journey jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS visit_duration_seconds integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS device_type text,
  ADD COLUMN IF NOT EXISTS lead_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lead_temperature text NOT NULL DEFAULT 'Cold Lead';

ALTER TABLE public.consultations ALTER COLUMN status SET DEFAULT 'New';
UPDATE public.consultations SET status = 'New' WHERE status = 'new';

CREATE INDEX IF NOT EXISTS consultations_created_at_idx ON public.consultations (created_at DESC);
CREATE INDEX IF NOT EXISTS consultations_source_idx ON public.consultations (visitor_source);

CREATE OR REPLACE VIEW public.lead_source_performance AS
SELECT
  COALESCE(NULLIF(visitor_source, ''), 'direct') AS source,
  COALESCE(NULLIF(utm_campaign, ''), '-') AS campaign,
  count(*)::bigint AS leads,
  round(avg(lead_score)::numeric, 1) AS avg_score,
  count(*) FILTER (WHERE lead_temperature = 'Hot Lead')::bigint AS hot_leads
FROM public.consultations
GROUP BY 1, 2;

CREATE OR REPLACE VIEW public.lead_monthly_trend AS
SELECT
  date_trunc('month', created_at) AS month,
  count(*)::bigint AS leads,
  round(avg(lead_score)::numeric, 1) AS avg_score
FROM public.consultations
GROUP BY 1
ORDER BY 1;

CREATE OR REPLACE VIEW public.lead_product_interest AS
SELECT
  product::text AS product,
  count(*)::bigint AS views
FROM public.consultations, LATERAL jsonb_array_elements_text(viewed_products) AS product
GROUP BY 1
ORDER BY 2 DESC;

CREATE OR REPLACE VIEW public.lead_cta_performance AS
SELECT
  cta::text AS cta,
  count(*)::bigint AS clicks
FROM public.consultations, LATERAL jsonb_array_elements_text(clicked_ctas) AS cta
GROUP BY 1
ORDER BY 2 DESC;

REVOKE ALL ON public.lead_source_performance, public.lead_monthly_trend, public.lead_product_interest, public.lead_cta_performance FROM anon, authenticated;
GRANT SELECT ON public.lead_source_performance, public.lead_monthly_trend, public.lead_product_interest, public.lead_cta_performance TO service_role;