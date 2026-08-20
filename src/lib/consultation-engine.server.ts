// Central consultation orchestration layer.
// AI and manual form flows should provide ConsultationResult only.

export type ConsultationResult = {
  sessionId: string;
  source: "ai" | "manual";
  name?: string;
  email?: string;
  whatsapp?: string;
  businessCategory?: string;
  projectType?: string;
  summary: string;
  budget?: string;
  timeline?: string;
  features?: string[];
  requirements?: string[];
  problems?: string[];
  packageName?: string;
};

function normalize(result: ConsultationResult) {
  return {
    ...result,
    sessionId: result.sessionId.trim(),
    summary: result.summary.trim(),
    features: result.features ?? [],
    requirements: result.requirements ?? [],
    problems: result.problems ?? [],
  };
}

function validate(result: ConsultationResult) {
  if (!result.sessionId) throw new Error("consultation session id required");
  if (!result.summary) throw new Error("consultation summary required");
}

export async function processConsultation(result: ConsultationResult) {
  console.info("consultation_engine_started");

  const consultation = normalize(result);
  validate(consultation);

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const leadPayload = {
    name: consultation.name?.trim() || `Prospek ${consultation.source}`,
    email: consultation.email?.trim() || null,
    whatsapp: consultation.whatsapp?.trim() || null,
    project_type: consultation.projectType || "Lainnya",
    requirement: consultation.summary,
    budget: consultation.budget || "Belum ditentukan",
    timeline: consultation.timeline || "Belum ditentukan",
    business_name: consultation.businessCategory || null,
    features: consultation.features.join(", "),
    lead_source: consultation.source,
    ai_summary: consultation.summary,
    ai_recommended_package: consultation.packageName || null,
    ai_business_category: consultation.businessCategory || null,
    ai_problems: consultation.problems,
    ai_requirements: consultation.requirements,
  };

  const { data: existing } = await supabaseAdmin
    .from("consultations")
    .select("id")
    .eq("consultation_session_id", consultation.sessionId)
    .maybeSingle();

  let leadId = existing?.id ?? null;

  if (leadId) {
    await supabaseAdmin.from("consultations").update(leadPayload).eq("id", leadId);
    console.info("lead_updated");
  } else {
    const { data, error } = await supabaseAdmin
      .from("consultations")
      .insert({ ...leadPayload, consultation_session_id: consultation.sessionId })
      .select("id")
      .single();

    if (error) throw error;
    leadId = data.id;
    console.info("lead_created");
  }

  if (leadId) {
    const { notifyLeadFromCrm } = await import("./lead-notify.server");
    await notifyLeadFromCrm(leadId);
    console.info("notification_triggered");
  }

  return { ok: true as const, leadId, consultation };
}
