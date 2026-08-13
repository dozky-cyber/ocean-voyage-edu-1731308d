// AI Business Recommendation block for the Order Brief PDF.
// Derives everything from the stored Order Brief + Master Feature Library.
// It never invents features and never changes existing brief data.

import {
  coreSolutionFeatures,
  detectSelectedFeatures,
  recommendFeatures,
  resolvePackage,
  type LibraryFeature,
  type PackageDefinition,
} from "./admin/feature-library";
import type { OrderBriefData } from "./order-brief";

export type BriefInsight = {
  packageName: string;
  reason: string;
  included: string[];
  optional: { name: string; description: string }[];
  disclaimer: string;
};

export const OPTIONAL_DISCLAIMER =
  "Rekomendasi fitur tambahan merupakan hasil analisa kebutuhan bisnis dan dapat dikembangkan sesuai kebutuhan. Fitur ini bukan bagian dari scope utama sebelum dilakukan persetujuan lebih lanjut.";

function complexityLabel(pkg: PackageDefinition) {
  switch (pkg.key) {
    case "Landing Page":
      return "kebutuhan sistem yang masih sederhana";
    case "Professional System":
      return "kebutuhan pengelolaan data dan customer yang mulai berkembang";
    case "Digital Workflow Solution":
      return "kebutuhan digitalisasi proses operasional harian";
    default:
      return "kebutuhan sistem yang kompleks dan terintegrasi";
  }
}

function buildReason(brief: OrderBriefData, pkg: PackageDefinition) {
  const business = brief.business?.trim() || "bisnis Anda";
  const goal = brief.goal?.trim();
  const project = brief.project?.trim();
  const parts = [
    `Berdasarkan kebutuhan ${business}, website difokuskan untuk ${
      goal || project || "memperkenalkan bisnis dan memudahkan calon customer terhubung"
    }.`,
    `Rekomendasi paket ${pkg.key} dipilih karena ${complexityLabel(pkg)}${
      brief.usersScale?.trim() ? ` dengan cakupan pengguna ${brief.usersScale.trim()}` : ""
    }.`,
  ];
  if (pkg.benefits.length) parts.push(`${pkg.benefits.join(", ")}.`);
  return parts.join(" ");
}

function describeFeature(feature: LibraryFeature, brief: OrderBriefData) {
  const business = brief.business?.trim() || "bisnis Anda";
  return `${feature.description} Membantu ${business} mengembangkan proses ini secara lebih terstruktur.`;
}

export function buildBriefInsight(brief: OrderBriefData): BriefInsight {
  const pkg = resolvePackage(brief.recommendation);
  const context = [
    brief.business,
    brief.project,
    brief.goal,
    brief.adminNeeds,
    ...brief.features,
    ...brief.problems,
  ]
    .filter(Boolean)
    .join(" | ");

  const selected = detectSelectedFeatures([context]);
  const core = coreSolutionFeatures(brief.recommendation, selected);
  const optional = recommendFeatures({
    selected,
    excludeIds: core.map((f) => f.id),
    context,
    limit: 3,
  });

  return {
    packageName: pkg.key,
    reason: buildReason(brief, pkg),
    included: core.map((f) => f.name),
    optional: optional.map((f) => ({ name: f.name, description: describeFeature(f, brief) })),
    disclaimer: OPTIONAL_DISCLAIMER,
  };
}
