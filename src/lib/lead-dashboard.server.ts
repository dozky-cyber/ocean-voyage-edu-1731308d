/**
 * Internal lead analytics aggregation (server-only).
 *
 * Prepares the data structure behind a future internal lead dashboard:
 * totals, conversion rate, most viewed product, most clicked CTA, source
 * performance and monthly inquiry trend. Not exposed as a public endpoint —
 * call it from trusted server code only.
 */

export type LeadStatus = "New" | "Contacted" | "Proposal Sent" | "Negotiation" | "Closed";

export const LEAD_STATUSES: LeadStatus[] = [
  "New",
  "Contacted",
  "Proposal Sent",
  "Negotiation",
  "Closed",
];

export type LeadDashboard = {
  totalVisitors: number;
  totalLeads: number;
  conversionRate: number;
  temperature: { cold: number; warm: number; hot: number };
  statusBreakdown: Record<LeadStatus, number>;
  mostViewedProduct: { product: string; views: number } | null;
  mostClickedCta: { cta: string; clicks: number } | null;
  sourcePerformance: { source: string; campaign: string; leads: number; avgScore: number }[];
  monthlyTrend: { month: string; leads: number; avgScore: number }[];
  averageVisitDurationSeconds: number;
  ai: {
    leadsWithAiConsultation: number;
    aiToConsultationRate: number;
    averageAiScore: number;
    packageFrequency: { package: string; count: number }[];
    businessCategories: { category: string; count: number }[];
    qualification: { cold: number; warm: number; hot: number };
  };
};

type ConsultationRow = {
  status: string | null;
  lead_score: number | null;
  lead_temperature: string | null;
  visitor_source: string | null;
  utm_campaign: string | null;
  viewed_products: unknown;
  clicked_ctas: unknown;
  visit_duration_seconds: number | null;
  created_at: string;
  ai_recommended_package: string | null;
  ai_business_category: string | null;
  ai_lead_score: number | null;
  ai_qualification_status: string | null;
};

function asStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function topOf(counts: Map<string, number>) {
  let best: { key: string; count: number } | null = null;
  for (const [key, count] of counts) {
    if (!best || count > best.count) best = { key, count };
  }
  return best;
}

/**
 * @param totalVisitors optional visitor count (from GA4) used for conversion rate.
 */
export async function getLeadDashboard(totalVisitors = 0): Promise<LeadDashboard> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("consultations")
    .select(
      "status, lead_score, lead_temperature, visitor_source, utm_campaign, viewed_products, clicked_ctas, visit_duration_seconds, created_at, ai_recommended_package, ai_business_category, ai_lead_score, ai_qualification_status",
    )
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) throw new Error(`[lead-dashboard] query failed: ${error.message}`);

  const rows = (data ?? []) as unknown as ConsultationRow[];
  const statusBreakdown = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0])) as Record<
    LeadStatus,
    number
  >;
  const temperature = { cold: 0, warm: 0, hot: 0 };
  const products = new Map<string, number>();
  const ctas = new Map<string, number>();
  const sources = new Map<string, { leads: number; score: number; campaign: string }>();
  const months = new Map<string, { leads: number; score: number }>();
  let durationTotal = 0;
  const aiPackages = new Map<string, number>();
  const aiCategories = new Map<string, number>();
  const aiQualification = { cold: 0, warm: 0, hot: 0 };
  let aiLeads = 0;
  let aiScoreTotal = 0;

  for (const row of rows) {
    const status = (LEAD_STATUSES as string[]).includes(row.status ?? "")
      ? (row.status as LeadStatus)
      : "New";
    statusBreakdown[status] += 1;

    if (row.lead_temperature === "Hot Lead") temperature.hot += 1;
    else if (row.lead_temperature === "Warm Lead") temperature.warm += 1;
    else temperature.cold += 1;

    for (const product of asStrings(row.viewed_products)) {
      products.set(product, (products.get(product) ?? 0) + 1);
    }
    for (const cta of asStrings(row.clicked_ctas)) {
      ctas.set(cta, (ctas.get(cta) ?? 0) + 1);
    }

    const sourceKey = row.visitor_source || "direct";
    const source = sources.get(sourceKey) ?? { leads: 0, score: 0, campaign: row.utm_campaign ?? "-" };
    source.leads += 1;
    source.score += row.lead_score ?? 0;
    sources.set(sourceKey, source);

    const month = row.created_at.slice(0, 7);
    const bucket = months.get(month) ?? { leads: 0, score: 0 };
    bucket.leads += 1;
    bucket.score += row.lead_score ?? 0;
    months.set(month, bucket);

    durationTotal += row.visit_duration_seconds ?? 0;

    if (row.ai_recommended_package) {
      aiLeads += 1;
      aiScoreTotal += row.ai_lead_score ?? 0;
      aiPackages.set(
        row.ai_recommended_package,
        (aiPackages.get(row.ai_recommended_package) ?? 0) + 1,
      );
      if (row.ai_business_category) {
        aiCategories.set(
          row.ai_business_category,
          (aiCategories.get(row.ai_business_category) ?? 0) + 1,
        );
      }
      if (row.ai_qualification_status === "Hot Lead") aiQualification.hot += 1;
      else if (row.ai_qualification_status === "Warm Lead") aiQualification.warm += 1;
      else aiQualification.cold += 1;
    }
  }

  const topProduct = topOf(products);
  const topCta = topOf(ctas);

  return {
    totalVisitors,
    totalLeads: rows.length,
    conversionRate: totalVisitors > 0 ? Number(((rows.length / totalVisitors) * 100).toFixed(2)) : 0,
    temperature,
    statusBreakdown,
    mostViewedProduct: topProduct ? { product: topProduct.key, views: topProduct.count } : null,
    mostClickedCta: topCta ? { cta: topCta.key, clicks: topCta.count } : null,
    sourcePerformance: [...sources.entries()]
      .map(([source, value]) => ({
        source,
        campaign: value.campaign,
        leads: value.leads,
        avgScore: Number((value.score / value.leads).toFixed(1)),
      }))
      .sort((a, b) => b.leads - a.leads),
    monthlyTrend: [...months.entries()]
      .map(([month, value]) => ({
        month,
        leads: value.leads,
        avgScore: Number((value.score / value.leads).toFixed(1)),
      }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    averageVisitDurationSeconds: rows.length
      ? Math.round(durationTotal / rows.length)
      : 0,
    ai: {
      leadsWithAiConsultation: aiLeads,
      aiToConsultationRate: rows.length
        ? Number(((aiLeads / rows.length) * 100).toFixed(2))
        : 0,
      averageAiScore: aiLeads ? Number((aiScoreTotal / aiLeads).toFixed(1)) : 0,
      packageFrequency: [...aiPackages.entries()]
        .map(([pkg, count]) => ({ package: pkg, count }))
        .sort((a, b) => b.count - a.count),
      businessCategories: [...aiCategories.entries()]
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count),
      qualification: aiQualification,
    },
  };
}
