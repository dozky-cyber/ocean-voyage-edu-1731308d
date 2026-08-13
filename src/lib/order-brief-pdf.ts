// Dependency-free PDF writer for the Order Brief attachment.
// Runs both in the browser (download) and in the Worker runtime (email attachment).

import { briefFields, briefFileName, wibStamp, type OrderBriefData } from "./order-brief";
import { buildBriefInsight } from "./order-brief-insight";

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
  doc.text("AI CONSULTANT", MARGIN + 38, top + h - 60, 8, false, "0.62 0.86 0.87");
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
      "Order Brief ini adalah hasil konsultasi awal, bukan penawaran harga. Tim KERJAKU akan melakukan";
    const note2 =
      "pengecekan kebutuhan sebelum memberikan rekomendasi solusi dan penawaran yang sesuai.";
    ops.push(
      `BT ${MUTED} rg /F1 8 Tf 1 0 0 1 ${MARGIN} ${MARGIN + 12} Tm (${esc(note)}) Tj ET`,
      `BT ${MUTED} rg /F1 8 Tf 1 0 0 1 ${MARGIN} ${MARGIN + 2} Tm (${esc(note2)}) Tj ET`,
      `BT ${BRAND} rg /F2 8 Tf 1 0 0 1 ${PAGE_W - MARGIN - 60} ${MARGIN + 12} Tm (KERJAKU.SPACE) Tj ET`,
    );
  }
}

/** Build a modern, proposal-style Order Brief PDF from stored data. */
export function buildOrderBriefPdf(brief: OrderBriefData): Uint8Array {
  const doc = new Doc();
  header(doc, brief);
  customerCard(doc, brief);
  summaryBox(doc, brief);

  sectionTitle(doc, "Business Problems");
  bulletList(doc, brief.problems);
  doc.y -= 10;

  sectionTitle(doc, "Feature List");
  bulletList(doc, brief.features);
  doc.y -= 10;

  sectionTitle(doc, "Project Detail");
  keyValueGrid(doc, [
    { label: "User Sistem", value: brief.usersScale || "-" },
    { label: "Kebutuhan Admin/Team", value: brief.adminNeeds || "-" },
    { label: "Timeline", value: brief.timeline || "-" },
    { label: "Budget", value: brief.budget || "-" },
  ]);

  sectionTitle(doc, "Recommendation");
  doc.paragraph(brief.recommendation || "-", MARGIN, 11, true, CONTENT_W, BRAND);
  doc.y -= 10;

  aiRecommendation(doc, brief);

  footer(doc);
  return serializePdf([...doc.pages, doc.ops].filter((ops) => ops.length));
}

/** Extra explanatory block: package reason, package scope, optional feature ideas. */
function aiRecommendation(doc: Doc, brief: OrderBriefData) {
  const insight = buildBriefInsight(brief);

  sectionTitle(doc, "AI Business Recommendation");

  doc.text("AI RECOMMENDATION", MARGIN, doc.y, 7.5, false, MUTED);
  doc.y -= 14;
  doc.text(insight.packageName, MARGIN, doc.y, 12, true, INK);
  doc.y -= 20;
  doc.text("ALASAN", MARGIN, doc.y, 7.5, false, MUTED);
  doc.y -= 13;
  doc.paragraph(insight.reason, MARGIN, 10, false, CONTENT_W);
  doc.y -= 12;

  if (insight.included.length) {
    doc.ensure(30);
    doc.text(`Package ${insight.packageName}`, MARGIN, doc.y, 10, true, INK);
    doc.y -= 15;
    doc.text("INCLUDED", MARGIN, doc.y, 7.5, false, MUTED);
    doc.y -= 14;
    for (const item of insight.included) {
      const lines = wrap(item, 10, false, CONTENT_W - 26);
      lines.forEach((row, index) => {
        doc.ensure(15);
        if (index === 0) doc.text("v", MARGIN + 4, doc.y, 10, true, BRAND);
        doc.text(row, MARGIN + 18, doc.y, 10, false);
        doc.y -= 15;
      });
    }
    doc.y -= 10;
  }

  if (insight.optional.length) {
    sectionTitle(doc, "Potential Feature Recommendation");
    doc.paragraph(
      "Contoh pengembangan tambahan yang relevan untuk bisnis Anda. Fitur ini bukan bagian dari penawaran utama dan tidak termasuk dalam harga.",
      MARGIN,
      9.5,
      false,
      CONTENT_W,
      MUTED,
    );
    doc.y -= 8;

    insight.optional.forEach((item, index) => {
      doc.ensure(80);
      doc.text("*", MARGIN, doc.y, 11, true, BRAND);
      doc.text(item.name, MARGIN + 14, doc.y, 10.5, true, INK);
      doc.y -= 15;
      doc.text("DESKRIPSI", MARGIN + 14, doc.y, 7, false, MUTED);
      doc.y -= 12;
      doc.paragraph(item.description, MARGIN + 14, 10, false, CONTENT_W - 14);
      doc.y -= 6;
      doc.text("ALASAN RELEVANSI", MARGIN + 14, doc.y, 7, false, MUTED);
      doc.y -= 12;
      doc.paragraph(item.reason, MARGIN + 14, 10, false, CONTENT_W - 14);
      doc.y -= 6;
      if (index < insight.optional.length - 1) {
        doc.ensure(14);
        doc.line(MARGIN, doc.y + 4, PAGE_W - MARGIN, doc.y + 4);
        doc.y -= 12;
      }
    });

    doc.y -= 6;
    const lines = wrap(insight.disclaimer, 9, false, CONTENT_W - 32);
    const h = 22 + lines.length * 12;
    doc.ensure(h + 10);
    const top = doc.y - h;
    doc.rect(MARGIN, top, CONTENT_W, h, CARD_BG);
    doc.rect(MARGIN, top, 3, h, BRAND);
    let y = top + h - 16;
    lines.forEach((row) => {
      doc.text(row, MARGIN + 16, y, 9, false, MUTED);
      y -= 12;
    });
    doc.y = top - 18;
  }
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
