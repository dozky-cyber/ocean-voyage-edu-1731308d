// Minimal dependency-free PDF writer for the Order Brief attachment.
// Runs both in the browser (download) and in the Worker runtime (email attachment).

import { briefFields, briefFileName, wibStamp, type OrderBriefData } from "./order-brief";

type Line = { text: string; size: number; bold: boolean };

const PAGE_H = 792;
const PAGE_W = 612;
const MARGIN = 56;
const LEADING = 16;
const MAX_LINES = Math.floor((PAGE_H - MARGIN * 2) / LEADING);

function sanitize(value: string) {
  // PDF base-14 fonts are single byte; drop anything outside Latin-1.
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/•/g, "-")
    .split("")
    .filter((char) => char.charCodeAt(0) < 256)
    .join("");
}

function escapeText(value: string) {
  return sanitize(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrap(text: string, max: number): string[] {
  const out: string[] = [];
  for (const raw of text.split("\n")) {
    if (raw.length <= max) {
      out.push(raw);
      continue;
    }
    let current = "";
    for (const word of raw.split(" ")) {
      if ((current + " " + word).trim().length > max) {
        if (current) out.push(current);
        current = word;
      } else {
        current = current ? `${current} ${word}` : word;
      }
    }
    if (current) out.push(current);
  }
  return out;
}

function buildLines(brief: OrderBriefData): Line[] {
  const stamp = wibStamp(brief.createdAt);
  const lines: Line[] = [
    { text: "KERJAKU", size: 20, bold: true },
    { text: `ORDER BRIEF KONSULTASI - V${brief.version}`, size: 12, bold: true },
    { text: `${stamp.date} · ${stamp.time}`, size: 10, bold: false },
    { text: "", size: 10, bold: false },
    { text: "DATA CUSTOMER", size: 12, bold: true },
  ];
  const push = (label: string, value: string) => {
    lines.push({ text: label.toUpperCase(), size: 9, bold: true });
    for (const wrapped of wrap(value || "-", 88)) {
      lines.push({ text: wrapped, size: 11, bold: false });
    }
    lines.push({ text: "", size: 10, bold: false });
  };
  push("Nama", brief.customerName);
  push("WhatsApp", brief.whatsapp || "-");
  push("Email", brief.email || "-");
  lines.push({ text: "ORDER BRIEF", size: 12, bold: true });
  for (const field of briefFields(brief)) push(field.label, field.value);
  lines.push({
    text: "Catatan: Order Brief ini adalah hasil konsultasi awal, bukan penawaran harga.",
    size: 9,
    bold: false,
  });
  lines.push({
    text: "Tim KERJAKU akan melakukan pengecekan kebutuhan sebelum memberikan penawaran.",
    size: 9,
    bold: false,
  });
  return lines;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Build a simple multi-page PDF document from the stored Order Brief data. */
export function buildOrderBriefPdf(brief: OrderBriefData): Uint8Array {
  const pages = chunk(buildLines(brief), MAX_LINES);
  const contents = pages.map((pageLines) => {
    let y = PAGE_H - MARGIN;
    const parts: string[] = ["BT"];
    for (const line of pageLines) {
      parts.push(`/${line.bold ? "F2" : "F1"} ${line.size} Tf`);
      parts.push(`1 0 0 1 ${MARGIN} ${y} Tm`);
      parts.push(`(${escapeText(line.text)}) Tj`);
      y -= LEADING;
    }
    parts.push("ET");
    return parts.join("\n");
  });

  const objects: string[] = [];
  const pageCount = Math.max(contents.length, 1);
  const pageIds = contents.map((_, index) => 5 + index * 2);

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageIds
    .map((id) => `${id} 0 R`)
    .join(" ")}] /Count ${pageCount} >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objects[4] =
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

  contents.forEach((content, index) => {
    const pageId = pageIds[index]!;
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
