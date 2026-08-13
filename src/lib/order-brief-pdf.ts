// Dependency-free PDF writer for the Order Brief attachment.
// Runs both in the browser (download) and in the Worker runtime (email attachment).

import { briefFields, briefFileName, wibStamp, type OrderBriefData } from "./order-brief";
import { buildBriefInsight, resolveAdminNeeds, type BriefInsight } from "./order-brief-insight";

export const PAGE_W = 595.28; // A4
export const PAGE_H = 841.89;
export const MARGIN = 48;
export const CONTENT_W = PAGE_W - MARGIN * 2;

export const INK = "0.09 0.11 0.15";
export const MUTED = "0.42 0.46 0.53";
export const BRAND = "0.05 0.62 0.63";
export const HEADER_BG = "0.05 0.11 0.16";
export const CARD_BG = "0.96 0.97 0.98";
export const LINE = "0.85 0.88 0.91";

export type Ops = string[];

function sanitize(value: string) {
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/•/g, "-")
    .split("")
    .filter((char) => char.charCodeAt(0) < 256)
    .join("");
}

function esc(value: string) {
  return sanitize(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Rough Helvetica width metric (good enough for wrapping). */
export function textWidth(text: string, size: number, bold: boolean) {
  return sanitize(text).length * size * (bold ? 0.55 : 0.5);
}

export function wrap(text: string, size: number, bold: boolean, maxWidth: number): string[] {
  const out: string[] = [];
  for (const raw of text.split("\n")) {
    if (!raw.trim()) {
      out.push("");
      continue;
    }
    let current = "";
    for (const word of raw.split(" ")) {
      const next = current ? `${current} ${word}` : word;
      if (textWidth(next, size, bold) > maxWidth && current) {
        out.push(current);
        current = word;
      } else {
        current = next;
      }
    }
    if (current) out.push(current);
  }
  return out;
}

export class Doc {
  pages: Ops[] = [];
  ops: Ops = [];
  y = PAGE_H - MARGIN;

  constructor() {
    this.newPage(false);
  }

  newPage(withHeaderSpace = true) {
    if (this.ops.length) this.pages.push(this.ops);
    this.ops = [];
    this.y = PAGE_H - (withHeaderSpace ? MARGIN : MARGIN);
  }

  ensure(space: number) {
    if (this.y - space < MARGIN + 40) this.newPage();
  }

  /** Usable vertical space on a single page. */
  static get usable() {
    return PAGE_H - MARGIN - (MARGIN + 40);
  }

  /** Dry-run a block on a throwaway document to know how tall it is. */
  measure(render: (doc: Doc) => void) {
    const probe = new Doc();
    const start = probe.y;
    render(probe);
    return start - probe.y + probe.pages.length * Doc.usable;
  }

  /**
   * PDF QUALITY CONTROL: render a block without splitting it across pages.
   * Blocks taller than one page flow normally instead of leaving a blank page.
   */
  keep(render: (doc: Doc) => void) {
    const height = this.measure(render);
    if (height > 0 && height <= Doc.usable) this.ensure(height);
    render(this);
  }


  rect(x: number, y: number, w: number, h: number, fill: string) {
    this.ops.push(`${fill} rg ${x} ${y} ${w} ${h} re f`);
  }

  line(x1: number, y1: number, x2: number, y2: number, color = LINE) {
    this.ops.push(`${color} RG 0.7 w ${x1} ${y1} m ${x2} ${y2} l S`);
  }

  text(value: string, x: number, y: number, size: number, bold: boolean, color = INK) {
    this.ops.push(
      `BT ${color} rg /${bold ? "F2" : "F1"} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${esc(value)}) Tj ET`,
    );
  }

  paragraph(
    value: string,
    x: number,
    size: number,
    bold: boolean,
    maxWidth: number,
    color = INK,
    leading = size + 5,
  ) {
    for (const row of wrap(value, size, bold, maxWidth)) {
      this.ensure(leading);
      if (row) this.text(row, x, this.y, size, bold, color);
      this.y -= leading;
    }
  }
}

function header(doc: Doc, brief: OrderBriefData) {
  const stamp = wibStamp(brief.createdAt);
  const h = 108;
  const top = PAGE_H - h;
  doc.rect(0, top, PAGE_W, h, HEADER_BG);
  doc.rect(0, top, 6, h, BRAND);
  // Logo mark
  doc.rect(MARGIN, top + h - 52, 26, 26, BRAND);
  doc.text("K", MARGIN + 8, top + h - 45, 16, true, "1 1 1");
  doc.text("KERJAKU", MARGIN + 38, top + h - 44, 22, true, "1 1 1");
  doc.text("TEAM KERJAKU CONSULTANT", MARGIN + 38, top + h - 60, 8, false, "0.62 0.86 0.87");
  doc.text("ORDER BRIEF KONSULTASI", MARGIN, top + 26, 11, true, "0.85 0.92 0.94");
  const right = `${stamp.date}  |  ${stamp.time}`;
  doc.text(right, PAGE_W - MARGIN - textWidth(right, 9, false), top + 27, 9, false, "0.66 0.72 0.78");
  const ver = `VERSI BRIEF V${brief.version}`;
  doc.text(ver, PAGE_W - MARGIN - textWidth(ver, 9, true), top + h - 44, 9, true, "0.62 0.86 0.87");
  doc.y = top - 28;
}

function sectionTitle(doc: Doc, title: string) {
  doc.ensure(34);
  doc.text(title.toUpperCase(), MARGIN, doc.y, 10, true, BRAND);
  doc.y -= 8;
  doc.line(MARGIN, doc.y, PAGE_W - MARGIN, doc.y);
  doc.y -= 16;
}

function customerCard(doc: Doc, brief: OrderBriefData) {
  const h = 76;
  doc.ensure(h + 12);
  const top = doc.y - h;
  doc.rect(MARGIN, top, CONTENT_W, h, CARD_BG);
  doc.rect(MARGIN, top, 3, h, BRAND);
  doc.text("CUSTOMER INFORMATION", MARGIN + 16, top + h - 20, 8, true, MUTED);
  const cols = [
    ["Nama", brief.customerName],
    ["WhatsApp", brief.whatsapp || "-"],
    ["Email", brief.email || "-"],
  ];
  const colW = (CONTENT_W - 32) / 3;
  cols.forEach(([label, value], index) => {
    const x = MARGIN + 16 + index * colW;
    doc.text(label!.toUpperCase(), x, top + h - 40, 7, false, MUTED);
    const lines = wrap(value!, 9.5, true, colW - 10).slice(0, 2);
    lines.forEach((row, i) => doc.text(row, x, top + h - 53 - i * 12, 9.5, true));
  });
  doc.y = top - 22;
}

function summaryBox(doc: Doc, brief: OrderBriefData) {
  const bodyLines = wrap(brief.project || "-", 10, false, CONTENT_W - 32);
  const goalLines = wrap(brief.goal || "-", 10, false, CONTENT_W - 32);
  const h = 46 + (bodyLines.length + goalLines.length) * 14;
  doc.ensure(h + 12);
  const top = doc.y - h;
  doc.rect(MARGIN, top, CONTENT_W, h, "0.94 0.98 0.98");
  doc.text("PROJECT SUMMARY", MARGIN + 16, top + h - 20, 8, true, BRAND);
  let y = top + h - 38;
  doc.text(`Bisnis: ${brief.business || "-"}`, MARGIN + 16, y, 10, true);
  y -= 16;
  bodyLines.forEach((row) => {
    doc.text(row, MARGIN + 16, y, 10, false);
    y -= 14;
  });
  goalLines.forEach((row) => {
    doc.text(row, MARGIN + 16, y, 10, false, MUTED);
    y -= 14;
  });
  doc.y = top - 22;
}

function bulletList(doc: Doc, items: string[]) {
  if (!items.length) {
    doc.paragraph("-", MARGIN + 4, 10, false, CONTENT_W - 8, MUTED);
    return;
  }
  for (const item of items) {
    const lines = wrap(item, 10, false, CONTENT_W - 26);
    lines.forEach((row, index) => {
      doc.ensure(15);
      if (index === 0) doc.text("-", MARGIN + 4, doc.y, 10, true, BRAND);
      doc.text(row, MARGIN + 18, doc.y, 10, false);
      doc.y -= 15;
    });
  }
}

function keyValueGrid(doc: Doc, rows: { label: string; value: string }[]) {
  for (const row of rows) {
    doc.ensure(30);
    doc.text(row.label.toUpperCase(), MARGIN, doc.y, 7.5, false, MUTED);
    doc.y -= 12;
    doc.paragraph(row.value || "-", MARGIN, 10, false, CONTENT_W);
    doc.y -= 4;
  }
}

function footer(doc: Doc) {
  for (const ops of [...doc.pages, doc.ops]) {
    ops.push(`${LINE} RG 0.7 w ${MARGIN} ${MARGIN + 26} m ${PAGE_W - MARGIN} ${MARGIN + 26} l S`);
    const note =
      "Order Brief ini adalah hasil konsultasi awal, bukan penawaran harga. Team KERJAKU akan melakukan";
    const note2 =
      "pengecekan kebutuhan sebelum memberikan rekomendasi solusi dan penawaran yang sesuai.";
    ops.push(
      `BT ${MUTED} rg /F1 8 Tf 1 0 0 1 ${MARGIN} ${MARGIN + 12} Tm (${esc(note)}) Tj ET`,
      `BT ${MUTED} rg /F1 8 Tf 1 0 0 1 ${MARGIN} ${MARGIN + 2} Tm (${esc(note2)}) Tj ET`,
      `BT ${BRAND} rg /F2 8 Tf 1 0 0 1 ${PAGE_W - MARGIN - 128} ${MARGIN + 12} Tm (TEAM KERJAKU CONSULTANT) Tj ET`,
    );
  }
}

/** Build a modern, proposal-style Order Brief PDF from stored data. */
export function buildOrderBriefPdf(brief: OrderBriefData): Uint8Array {
  const doc = new Doc();
  const insight = buildBriefInsight(brief);

  header(doc, brief);
  customerCard(doc, brief);
  summaryBox(doc, brief);

  doc.keep((d) => {
    sectionTitle(d, "Business Problems");
    bulletList(d, brief.problems);
    d.y -= 10;
  });

  doc.keep((d) => {
    sectionTitle(d, "Feature List");
    bulletList(d, brief.features);
    d.y -= 10;
  });

  doc.keep((d) => {
    sectionTitle(d, "Project Detail");
    keyValueGrid(d, [
      { label: "User Sistem", value: brief.usersScale || "Belum disampaikan saat konsultasi awal" },
      { label: "Kebutuhan Admin/Team", value: resolveAdminNeeds(brief) },
      { label: "Timeline", value: brief.timeline || "Belum ditentukan" },
      { label: "Budget", value: brief.budget || "Belum disampaikan" },
    ]);
  });

  packageRecommendation(doc, insight);
  readinessBlock(doc, insight);
  problemSolutionMap(doc, insight);
  consultantRecommendation(doc, insight);
  potentialFeatures(doc, insight);
  nextSteps(doc, insight);


  footer(doc);
  return serializePdf([...doc.pages, doc.ops].filter((ops) => ops.length));
}

/**
 * PACKAGE RECOMMENDATION — rendered as one unbreakable block:
 * package name + customer need + reason.
 */
function packageRecommendation(doc: Doc, insight: BriefInsight) {
  doc.keep((d) => {
    sectionTitle(d, "Package Recommendation");
    d.text(insight.packageName, MARGIN, d.y, 12, true, BRAND);
    d.y -= 24;

    if (insight.included.length) {
      d.text("CUSTOMER NEED (SESUAI ORDER BRIEF)", MARGIN, d.y, 7.5, false, MUTED);
      d.y -= 14;
      for (const item of insight.included) {
        wrap(item, 10, false, CONTENT_W - 26).forEach((row, index) => {
          if (index === 0) d.text("v", MARGIN + 4, d.y, 10, true, BRAND);
          d.text(row, MARGIN + 18, d.y, 10, false);
          d.y -= 15;
        });
      }
      d.y -= 10;
    }

    d.text("ALASAN", MARGIN, d.y, 7.5, false, MUTED);
    d.y -= 13;
    d.paragraph(insight.reason, MARGIN, 10, false, CONTENT_W);
    d.y -= 12;
  });
}

/** BUSINESS READINESS: konteks singkat sebelum masuk ke rekomendasi. */
function readinessBlock(doc: Doc, insight: BriefInsight) {
  doc.keep((d) => {
    sectionTitle(d, "Business Readiness");
    d.text(insight.readiness.level.toUpperCase(), MARGIN, d.y, 8, true, BRAND);
    d.y -= 16;
    insight.readiness.lines.forEach((line) => {
      d.paragraph(line, MARGIN, 10, false, CONTENT_W);
      d.y -= 4;
    });
    d.y -= 8;
  });
}

const MAP_SOURCE_LABEL: Record<string, string> = {
  scope: "Sudah ada di Feature List",
  core: "Core Solution",
  optional: "Opsional (pengembangan)",
  open: "Perlu dibahas lanjut",
};

/** PROBLEM -> SOLUTION MAP: bukti setiap masalah customer punya jawabannya. */
function problemSolutionMap(doc: Doc, insight: BriefInsight) {
  if (!insight.problemMap.length) return;
  doc.keep((d) => {
    sectionTitle(d, "Peta Masalah & Solusi");
    d.paragraph(
      "Setiap masalah yang customer sampaikan dipasangkan dengan solusi yang menanganinya.",
      MARGIN,
      9.5,
      false,
      CONTENT_W,
      MUTED,
    );
    d.y -= 10;
  });

  insight.problemMap.forEach((row) => {
    doc.keep((d) => {
      const colW = (CONTENT_W - 18) / 2;
      const left = wrap(row.problem, 9.5, false, colW - 8);
      const right = wrap(row.solution, 9.5, true, colW - 8);
      const rows = Math.max(left.length, right.length);
      const h = 26 + rows * 13;
      const top = d.y - h;
      d.rect(MARGIN, top, CONTENT_W, h, CARD_BG);
      d.rect(MARGIN, top, 3, h, BRAND);
      d.text("MASALAH", MARGIN + 14, top + h - 14, 7, false, MUTED);
      d.text("SOLUSI", MARGIN + 18 + colW, top + h - 14, 7, false, MUTED);
      left.forEach((line, i) => d.text(line, MARGIN + 14, top + h - 28 - i * 13, 9.5, false));
      right.forEach((line, i) =>
        d.text(line, MARGIN + 18 + colW, top + h - 28 - i * 13, 9.5, true),
      );
      const tag = MAP_SOURCE_LABEL[row.source] ?? "";
      d.text(tag, PAGE_W - MARGIN - textWidth(tag, 7, false) - 6, top + h - 14, 7, false, BRAND);
      d.y = top - 10;
    });
  });

  doc.y -= 8;
}


/** Consultant block: development option, reason, and benefit per feature. */
function consultantRecommendation(doc: Doc, insight: BriefInsight) {
  const consultant = insight.consultant;
  if (!consultant) return;

  // Heading + intro + first benefit stay together so a title never sits alone.
  const first = consultant.items[0];
  doc.keep((d) => {
    sectionTitle(d, "Team KERJAKU Consultant Recommendation");
    const hasCore = consultant.items.some((item) => item.solves);
    d.text(hasCore ? "CORE SOLUTION" : "PENYEMPURNAAN SCOPE", MARGIN, d.y, 7.5, false, MUTED);
    d.y -= 14;
    d.text(consultant.packageName, MARGIN, d.y, 12, true, INK);
    d.y -= 20;
    consultant.intro.forEach((line) => {
      d.paragraph(line, MARGIN, 10, false, CONTENT_W);
      d.y -= 4;
    });
    d.y -= 6;
    // Tanpa Core Solution, blok ini hanya validasi scope — tanpa daftar fitur.
    if (first) {
      d.text(
        hasCore ? "CORE SOLUTION (MENYELESAIKAN MASALAH UTAMA)" : "MANFAAT OPSI PENGEMBANGAN",
        MARGIN,
        d.y,
        7.5,
        false,
        MUTED,
      );
      d.y -= 16;
      consultantItem(d, first, 0);
    }

  });

  consultant.items.slice(1).forEach((item, index) => {
    doc.keep((d) => consultantItem(d, item, index + 1));
  });

  if (consultant.comparison.length) doc.keep((d) => {
    sectionTitle(d, "Perbandingan Solusi");
    consultant.comparison.forEach((column) => {
      d.text(column.name, MARGIN, d.y, 10.5, true, INK);
      d.y -= 15;
      d.text("COCOK UNTUK", MARGIN + 14, d.y, 7, false, MUTED);
      d.y -= 13;
      column.points.forEach((point) => {
        wrap(point, 10, false, CONTENT_W - 40).forEach((row, index) => {
          if (index === 0) d.text("v", MARGIN + 18, d.y, 10, true, BRAND);
          d.text(row, MARGIN + 32, d.y, 10, false);
          d.y -= 15;
        });
      });
      d.y -= 8;
    });
    d.paragraph(consultant.note, MARGIN, 9, false, CONTENT_W, MUTED);
    d.y -= 6;
  });
}

function consultantItem(
  doc: Doc,
  item: { title: string; benefit: string; optional?: boolean; solves?: string | null },
  index: number,
) {
  doc.text(
    `${index + 1}. ${item.title}${item.optional ? " (Opsional)" : ""}`,
    MARGIN,
    doc.y,
    10.5,
    true,
    INK,
  );
  doc.y -= 15;
  // CORE / GROWTH SPLIT RULE: core solution menyebut masalah yang diselesaikan.
  if (item.solves) {
    doc.text("MENYELESAIKAN", MARGIN + 14, doc.y, 7, false, MUTED);
    doc.y -= 12;
    doc.paragraph(item.solves, MARGIN + 14, 10, false, CONTENT_W - 14);
    doc.y -= 6;
  }
  doc.text("MANFAAT", MARGIN + 14, doc.y, 7, false, MUTED);
  doc.y -= 12;
  doc.paragraph(item.benefit, MARGIN + 14, 10, false, CONTENT_W - 14);
  doc.y -= 10;
}

/**
 * POTENTIAL FEATURE INTELLIGENCE: optional section — rendered only when the
 * consultant engine still has non-duplicate, relevant ideas left over.
 */
function potentialFeatures(doc: Doc, insight: BriefInsight) {
  if (!insight.optional.length) return;
  const items = insight.optional;

  doc.keep((d) => {
    sectionTitle(d, "Potential Feature Recommendation");
    d.paragraph(
      "Pengembangan tambahan yang relevan untuk bisnis Anda, bukan bagian dari penawaran utama dan tidak termasuk dalam harga.",
      MARGIN,
      9.5,
      false,
      CONTENT_W,
      MUTED,
    );
    d.y -= 2;
    d.paragraph(
      "Fase 1 dapat dikerjakan bersamaan dengan kebutuhan utama bila budget memungkinkan. Fase 2 disiapkan sebagai pengembangan lanjutan agar biaya awal tetap terkendali.",
      MARGIN,
      9.5,
      false,
      CONTENT_W,
      MUTED,
    );
    d.y -= 10;

    optionalItem(d, items[0]!, items.length > 1);
  });

  items.slice(1).forEach((item, index) => {
    doc.keep((d) => optionalItem(d, item, index + 2 < items.length));
  });

  doc.keep((d) => {
    d.y -= 6;
    const lines = wrap(insight.disclaimer, 9, false, CONTENT_W - 32);
    const h = 22 + lines.length * 12;
    const top = d.y - h;
    d.rect(MARGIN, top, CONTENT_W, h, CARD_BG);
    d.rect(MARGIN, top, 3, h, BRAND);
    let y = top + h - 16;
    lines.forEach((row) => {
      d.text(row, MARGIN + 16, y, 9, false, MUTED);
      y -= 12;
    });
    d.y = top - 18;
  });
}

function optionalItem(
  doc: Doc,
  item: {
    name: string;
    description: string;
    reason: string;
    impact?: string;
    relation?: string | null;
    priority?: number;
    phase?: 1 | 2;
  },
  divider: boolean,
) {
  doc.text("*", MARGIN, doc.y, 11, true, BRAND);
  doc.text(item.name, MARGIN + 14, doc.y, 10.5, true, INK);
  if (item.priority) {
    // PRIORITAS & FASE: membantu customer memilih tanpa menaikkan package.
    const tag = `PRIORITAS ${item.priority}  |  FASE ${item.phase ?? 2}`;
    doc.text(tag, PAGE_W - MARGIN - textWidth(tag, 7.5, true), doc.y, 7.5, true, BRAND);
  }
  doc.y -= 14;
  doc.paragraph(item.description, MARGIN + 14, 9.5, false, CONTENT_W - 14, MUTED);
  doc.y -= 8;
  doc.text("KENAPA RELEVAN", MARGIN + 14, doc.y, 7, false, MUTED);
  doc.y -= 13;
  doc.paragraph(item.reason, MARGIN + 14, 10, false, CONTENT_W - 14);
  doc.y -= 8;
  if (item.impact) {
    doc.text("DAMPAK BISNIS", MARGIN + 14, doc.y, 7, false, MUTED);
    doc.y -= 13;
    doc.paragraph(item.impact, MARGIN + 14, 10, false, CONTENT_W - 14);
    doc.y -= 8;
  }
  if (item.relation) {
    doc.text("KAITAN DENGAN ALUR BISNIS", MARGIN + 14, doc.y, 7, false, MUTED);
    doc.y -= 13;
    doc.paragraph(item.relation, MARGIN + 14, 10, false, CONTENT_W - 14);
    doc.y -= 8;
  }
  if (divider) {
    doc.line(MARGIN, doc.y + 4, PAGE_W - MARGIN, doc.y + 4);
    doc.y -= 14;
  }
}



function nextSteps(doc: Doc, insight: BriefInsight) {
  doc.keep((d) => {
    sectionTitle(d, "Langkah Selanjutnya");
    insight.nextSteps.forEach((line) => {
      if (!line.trim()) {
        d.y -= 6;
        return;
      }
      d.paragraph(line, MARGIN, 10, false, CONTENT_W);
    });
  });
}




/** Serialize page content streams into a minimal, valid PDF byte array. */
export function serializePdf(pages: Ops[]): Uint8Array {
  const objects: string[] = [];
  const pageIds = pages.map((_, index) => 5 + index * 2);
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objects[4] =
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

  pages.forEach((ops, index) => {
    const pageId = pageIds[index]!;
    const content = ops.join("\n");
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pageId + 1} 0 R >>`;
    objects[pageId + 1] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  });

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let i = 1; i < objects.length; i += 1) {
    const body = objects[i];
    if (!body) continue;
    offsets[i] = pdf.length;
    pdf += `${i} 0 obj\n${body}\nendobj\n`;
  }
  const xrefOffset = pdf.length;
  const total = objects.length;
  pdf += `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let i = 1; i < total; i += 1) {
    pdf += `${String(offsets[i] ?? 0).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i += 1) bytes[i] = pdf.charCodeAt(i) & 0xff;
  return bytes;
}


export function orderBriefPdfBase64(brief: OrderBriefData): string {
  const bytes = buildOrderBriefPdf(brief);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Browser-only: trigger a download of the generated Order Brief PDF. */
export function downloadOrderBriefPdf(brief: OrderBriefData) {
  const blob = new Blob([buildOrderBriefPdf(brief) as unknown as BlobPart], {
    type: "application/pdf",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = briefFileName(brief.customerName);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export { briefFields };
