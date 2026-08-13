// KERJAKU Proposal PDF — same corporate style as the Order Brief document.
// Navy header, teal accent, card sections, footer + page numbers.

import {
  BRAND,
  CARD_BG,
  CONTENT_W,
  Doc,
  HEADER_BG,
  INK,
  LINE,
  MARGIN,
  MUTED,
  PAGE_H,
  PAGE_W,
  serializePdf,
  textWidth,
  wrap,
} from "./order-brief-pdf";
import { buildPaymentTermsLines, buildTimelineBlock } from "./admin/proposal-logic";
import { proposalFileName, type ProposalDocData } from "./proposal-doc";

function money(amount: number, currency: string) {
  const value = Math.round(Number(amount) || 0).toLocaleString("id-ID");
  return `${currency || "IDR"} ${value}`;
}

function wibStamp(iso: string) {
  const date = new Date(iso);
  const tz = "Asia/Jakarta";
  return {
    date: date.toLocaleDateString("id-ID", {
      timeZone: tz,
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    time: `${date.toLocaleTimeString("id-ID", { timeZone: tz, hour: "2-digit", minute: "2-digit" })} WIB`,
  };
}

function header(doc: Doc, data: ProposalDocData) {
  const stamp = wibStamp(data.createdAt);
  const h = 112;
  const top = PAGE_H - h;
  doc.rect(0, top, PAGE_W, h, HEADER_BG);
  doc.rect(0, top, 6, h, BRAND);
  doc.rect(MARGIN, top + h - 52, 26, 26, BRAND);
  doc.text("K", MARGIN + 8, top + h - 45, 16, true, "1 1 1");
  doc.text("KERJAKU", MARGIN + 38, top + h - 44, 22, true, "1 1 1");
  doc.text("BUSINESS SYSTEM CONSULTANT", MARGIN + 38, top + h - 60, 8, false, "0.62 0.86 0.87");
  doc.text("PROPOSAL SOLUSI DIGITAL", MARGIN, top + 26, 11, true, "0.85 0.92 0.94");
  const right = `${stamp.date}  |  ${stamp.time}`;
  doc.text(right, PAGE_W - MARGIN - textWidth(right, 9, false), top + 27, 9, false, "0.66 0.72 0.78");
  const ver = `VERSI PROPOSAL V${data.version}`;
  doc.text(ver, PAGE_W - MARGIN - textWidth(ver, 9, true), top + h - 44, 9, true, "0.62 0.86 0.87");
  doc.y = top - 28;
}

function clientCard(doc: Doc, data: ProposalDocData) {
  const h = 82;
  doc.ensure(h + 12);
  const top = doc.y - h;
  doc.rect(MARGIN, top, CONTENT_W, h, CARD_BG);
  doc.rect(MARGIN, top, 3, h, BRAND);
  doc.text("CLIENT INFORMATION", MARGIN + 16, top + h - 20, 8, true, MUTED);
  const cols: [string, string][] = [
    ["Client", data.clientName || "-"],
    ["Kontak", data.contactName || "-"],
    ["WhatsApp / Email", data.whatsapp || data.email || "-"],
  ];
  const colW = (CONTENT_W - 32) / 3;
  cols.forEach(([label, value], index) => {
    const x = MARGIN + 16 + index * colW;
    doc.text(label.toUpperCase(), x, top + h - 40, 7, false, MUTED);
    wrap(value, 9.5, true, colW - 10)
      .slice(0, 2)
      .forEach((row, i) => doc.text(row, x, top + h - 53 - i * 12, 9.5, true));
  });
  doc.y = top - 22;
}

function summaryBox(doc: Doc, data: ProposalDocData) {
  const rows: [string, string][] = [
    ["Judul Proposal", data.title || "-"],
    ["Rekomendasi Paket", data.recommendedPackage || "-"],
    ["Berlaku Sampai", data.validUntil || "-"],
  ];
  const h = 38 + rows.length * 24;
  doc.ensure(h + 12);
  const top = doc.y - h;
  doc.rect(MARGIN, top, CONTENT_W, h, "0.94 0.98 0.98");
  doc.text("PROPOSAL SUMMARY", MARGIN + 16, top + h - 18, 8, true, BRAND);
  let y = top + h - 38;
  rows.forEach(([label, value]) => {
    doc.text(label.toUpperCase(), MARGIN + 16, y, 7, false, MUTED);
    const line = wrap(value, 10, true, CONTENT_W - 40)[0] ?? "-";
    doc.text(line, MARGIN + 16, y - 13, 10, true);
    y -= 24;
  });
  doc.y = top - 22;
}

function sectionTitle(doc: Doc, title: string) {
  doc.ensure(36);
  doc.text(title.toUpperCase(), MARGIN, doc.y, 10, true, BRAND);
  doc.y -= 8;
  doc.line(MARGIN, doc.y, PAGE_W - MARGIN, doc.y);
  doc.y -= 16;
}

function bodyBlock(doc: Doc, body: string) {
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (!line) {
      doc.y -= 6;
      continue;
    }
    if (line.startsWith("•") || line.startsWith("-")) {
      const text = line.replace(/^[•-]\s*/, "");
      wrap(text, 10, false, CONTENT_W - 26).forEach((row, index) => {
        doc.ensure(15);
        if (index === 0) doc.text("-", MARGIN + 4, doc.y, 10, true, BRAND);
        doc.text(row, MARGIN + 18, doc.y, 10, false);
        doc.y -= 15;
      });
    } else {
      doc.paragraph(line, MARGIN, 10, false, CONTENT_W, INK, 15);
    }
  }
  doc.y -= 8;
}

type Row = { item: string; detail: string; amount: number };

function groupHeader(doc: Doc, label: string) {
  doc.ensure(34);
  doc.text(label.toUpperCase(), MARGIN, doc.y, 8.5, true, INK);
  doc.y -= 8;
  doc.line(MARGIN, doc.y, PAGE_W - MARGIN, doc.y);
  doc.y -= 16;
}

function priceRows(doc: Doc, rows: Row[], currency: string) {
  const itemW = CONTENT_W - 132;
  let subtotal = 0;
  for (const row of rows) {
    subtotal += Number(row.amount) || 0;
    const detailLines = row.detail ? wrap(row.detail, 9, false, itemW) : [];
    doc.ensure(38 + detailLines.length * 12);
    const amount = money(row.amount, currency);
    doc.text(row.item || "-", MARGIN, doc.y, 10, true);
    doc.text(amount, PAGE_W - MARGIN - textWidth(amount, 10, false), doc.y, 10, false);
    doc.y -= 14;
    detailLines.forEach((line) => {
      doc.text(line, MARGIN, doc.y, 9, false, MUTED);
      doc.y -= 12;
    });
    doc.y -= 6;
    doc.line(MARGIN, doc.y, PAGE_W - MARGIN, doc.y, "0.92 0.94 0.96");
    doc.y -= 12;
  }
  return subtotal;
}

function subtotalLine(doc: Doc, label: string, value: number, currency: string) {
  doc.ensure(24);
  const text = money(value, currency);
  doc.text(label.toUpperCase(), MARGIN, doc.y, 8.5, true, MUTED);
  doc.text(text, PAGE_W - MARGIN - textWidth(text, 10, true), doc.y, 10, true, INK);
  doc.y -= 22;
}

function enhancementSection(doc: Doc, data: ProposalDocData) {
  const items = data.enhancements ?? [];
  if (!items.length) return;
  sectionTitle(doc, "Feature Recommendation");
  doc.paragraph(
    "Rekomendasi fitur tambahan hasil analisa kebutuhan bisnis KERJAKU. Fitur yang sudah dipilih client tidak ditampilkan kembali. Bersifat opsional dan dapat dikerjakan bertahap.",
    MARGIN,
    9.5,
    false,
    CONTENT_W,
    MUTED,
    14,
  );
  doc.y -= 6;
  for (const item of items) {
    const benefitLines = item.benefit ? wrap(item.benefit, 9, false, CONTENT_W - 140) : [];
    doc.ensure(34 + benefitLines.length * 12);
    const amount = money(item.amount, data.currency);
    doc.text(`${item.recommended ? "* " : ""}${item.name || "-"}`, MARGIN, doc.y, 10, true);
    doc.text(amount, PAGE_W - MARGIN - textWidth(amount, 10, false), doc.y, 10, false, BRAND);
    doc.y -= 14;
    benefitLines.forEach((line) => {
      doc.text(line, MARGIN, doc.y, 9, false, MUTED);
      doc.y -= 12;
    });
    doc.y -= 10;
  }
}

function coreSolutionSection(doc: Doc, data: ProposalDocData) {
  const features = data.coreFeatures ?? [];
  if (!features.length) return;
  sectionTitle(doc, "Core Solution");
  doc.text(data.recommendedPackage || "Core Solution", MARGIN, doc.y, 11, true, INK);
  doc.y -= 20;
  doc.text("INCLUDED FEATURE", MARGIN, doc.y, 8, true, MUTED);
  doc.y -= 16;
  for (const feature of features) {
    const lines = feature.description ? wrap(feature.description, 9, false, CONTENT_W - 26) : [];
    doc.ensure(20 + lines.length * 12);
    doc.text("-", MARGIN + 4, doc.y, 10, true, BRAND);
    doc.text(feature.name || "-", MARGIN + 18, doc.y, 10, true);
    doc.y -= 14;
    lines.forEach((line) => {
      doc.text(line, MARGIN + 18, doc.y, 9, false, MUTED);
      doc.y -= 12;
    });
    doc.y -= 4;
  }
  doc.y -= 6;
}

function timelineSection(doc: Doc, data: ProposalDocData) {
  const block = buildTimelineBlock({
    briefTimeline: data.briefTimeline ?? null,
    estimatedTimeline: data.estimatedTimeline ?? null,
    createdAt: data.createdAt,
  });
  if (!block) return;
  sectionTitle(doc, block.heading);
  bodyBlock(doc, block.lines.join("\n"));
}

function pricingTable(doc: Doc, data: ProposalDocData) {
  const core = data.pricing;
  const optional = (data.enhancements ?? []).map((e) => ({
    item: e.name,
    detail: e.benefit,
    amount: Number(e.amount) || 0,
  }));
  if (!core.length && !optional.length) return;

  sectionTitle(doc, "Investment");

  let coreTotal = 0;
  if (core.length) {
    groupHeader(doc, "Core Solution");
    coreTotal = priceRows(doc, core, data.currency);
    subtotalLine(doc, "Subtotal Core Solution", coreTotal, data.currency);
  }

  let optionalTotal = 0;
  if (optional.length) {
    groupHeader(doc, "Optional Feature");
    optionalTotal = priceRows(doc, optional, data.currency);
    subtotalLine(doc, "Subtotal Optional Feature", optionalTotal, data.currency);
  }

  doc.ensure(34);
  const totalLabel = "TOTAL INVESTMENT";
  const totalValue = money(coreTotal + optionalTotal, data.currency);
  const boxTop = doc.y - 30;
  doc.rect(MARGIN, boxTop, CONTENT_W, 30, CARD_BG);
  doc.text(totalLabel, MARGIN + 14, boxTop + 11, 9, true, MUTED);
  doc.text(totalValue, PAGE_W - MARGIN - 14 - textWidth(totalValue, 12, true), boxTop + 9, 12, true, BRAND);
  doc.y = boxTop - 20;

  if (data.investmentNote) {
    doc.paragraph(data.investmentNote, MARGIN, 9.5, false, CONTENT_W, MUTED, 14);
    doc.y -= 6;
  }
}

function paymentTerms(doc: Doc, data: ProposalDocData) {
  const lines = buildPaymentTermsLines({
    type: data.paymentType,
    dpPercent: data.paymentDpPercent ?? null,
    customText: data.paymentTermsText ?? null,
  });
  sectionTitle(doc, "Payment Terms");
  bodyBlock(
    doc,
    [
      ...lines.map((line) => (line.trim() ? `- ${line.replace(/^[-\u2022]\s*/, "")}` : "")),
      "Pembayaran melalui transfer bank atau payment link resmi KERJAKU.",
    ].join("\n"),
  );
}

function footer(doc: Doc, clientName: string) {
  const pages = [...doc.pages, doc.ops].filter((ops) => ops.length);
  const escName = proposalFileName(clientName);
  pages.forEach((ops, index) => {
    ops.push(`${LINE} RG 0.7 w ${MARGIN} ${MARGIN + 24} m ${PAGE_W - MARGIN} ${MARGIN + 24} l S`);
    ops.push(
      `BT ${MUTED} rg /F1 8 Tf 1 0 0 1 ${MARGIN} ${MARGIN + 10} Tm (${escName}) Tj ET`,
      `BT ${MUTED} rg /F1 8 Tf 1 0 0 1 ${PAGE_W / 2 - 40} ${MARGIN + 10} Tm (Halaman ${index + 1} dari ${pages.length}) Tj ET`,
      `BT ${BRAND} rg /F2 8 Tf 1 0 0 1 ${PAGE_W - MARGIN - 62} ${MARGIN + 10} Tm (KERJAKU.SPACE) Tj ET`,
    );
  });
  return pages;
}

/** Build the branded KERJAKU proposal PDF. */
export function buildProposalPdf(data: ProposalDocData): Uint8Array {
  const doc = new Doc();
  header(doc, data);
  clientCard(doc, data);
  summaryBox(doc, data);

  const hasCoreFeatures = Boolean(data.coreFeatures?.length);
  const isCoreHeading = (heading: string) => heading.trim().toLowerCase() === "core solution";
  const isNextSteps = (heading: string) => heading.trim().toLowerCase() === "next steps";
  const mainSections = data.sections.filter(
    (s) => !(hasCoreFeatures && isCoreHeading(s.heading)) && !isNextSteps(s.heading),
  );
  const closing = data.sections.filter((s) => isNextSteps(s.heading));

  for (const section of mainSections) {
    if (!section.heading && !section.body) continue;
    sectionTitle(doc, section.heading || "Bagian");
    bodyBlock(doc, section.body || "-");
  }

  enhancementSection(doc, data);
  coreSolutionSection(doc, data);
  timelineSection(doc, data);
  pricingTable(doc, data);
  paymentTerms(doc, data);

  for (const section of closing) {
    sectionTitle(doc, section.heading || "Next Steps");
    bodyBlock(doc, section.body || "-");
  }

  return serializePdf(footer(doc, data.clientName));
}

export function proposalPdfBase64(data: ProposalDocData): string {
  const bytes = buildProposalPdf(data);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Browser-only: open the proposal PDF (preview) in a new tab. */
export function proposalPdfBlobUrl(data: ProposalDocData): string {
  const blob = new Blob([buildProposalPdf(data) as unknown as BlobPart], {
    type: "application/pdf",
  });
  return URL.createObjectURL(blob);
}
