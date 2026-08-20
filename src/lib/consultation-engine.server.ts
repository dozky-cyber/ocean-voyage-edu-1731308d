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
  const consultation = normalize(result);
  validate(consultation);

  // Phase 1 foundation: persistence ownership moves here.
  // Lead, Order Brief, and notification orchestration will be completed
  // behind this boundary.
  return {
    ok: true,
    consultation,
  };
}
