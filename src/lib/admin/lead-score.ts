/** Client-safe helpers that explain how a lead score was produced. */

import { LEAD_SCORE_RULES } from "@/lib/lead-journey";

export type ScoreFactor = {
  label: string;
  points: number;
  earned: boolean;
  detail?: string;
};

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export type ScoreLeadInput = {
  lead_score?: number | null;
  lead_temperature?: string | null;
  clicked_ctas?: unknown;
  viewed_products?: unknown;
  selected_package?: string | null;
  ai_qualification_status?: string | null;
  ai_conversation?: unknown;
  visit_duration_seconds?: number | null;
  visited_pages?: unknown;
};

export function explainLeadScore(lead: ScoreLeadInput): {
  total: number;
  max: number;
  factors: ScoreFactor[];
} {
  const ctas = list(lead.clicked_ctas);
  const products = list(lead.viewed_products);
  const aiTurns = Array.isArray(lead.ai_conversation) ? lead.ai_conversation.length : 0;

  const factors: ScoreFactor[] = [
    {
      label: "Membuka form konsultasi",
      points: LEAD_SCORE_RULES.open_consultation_form,
      earned: ctas.length > 0,
      detail: ctas.length ? `${ctas.length} CTA diklik` : undefined,
    },
    {
      label: "Melihat paket layanan",
      points: LEAD_SCORE_RULES.click_service_package,
      earned: Boolean(lead.selected_package),
      detail: lead.selected_package || undefined,
    },
    {
      label: "Menjelajah portfolio produk",
      points: LEAD_SCORE_RULES.view_portfolio_product,
      earned: products.length > 0,
      detail: products.length ? products.join(", ") : undefined,
    },
    {
      label: "Menyelesaikan AI consultation",
      points: LEAD_SCORE_RULES.complete_ai_consultation,
      earned: aiTurns > 0,
      detail: aiTurns ? `${aiTurns} pertanyaan dijawab` : undefined,
    },
    {
      label: "Submit form konsultasi",
      points: LEAD_SCORE_RULES.submit_consultation_form,
      earned: true,
    },
  ];

  const max = factors.reduce((sum, f) => sum + f.points, 0);
  return { total: lead.lead_score ?? 0, max, factors };
}

export function temperatureReason(temperature: string | null | undefined, score: number): string {
  if (temperature === "Hot Lead")
    return `Skor ${score} — intent tinggi, prioritaskan follow-up hari ini.`;
  if (temperature === "Warm Lead")
    return `Skor ${score} — tertarik namun belum yakin, butuh edukasi & bukti hasil.`;
  return `Skor ${score} — masih eksplorasi, nurture dengan konten dan contoh project.`;
}
