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
import {
  proposalFileName,
  type ProposalDocData,
  type ProposalEnhancementItem,
} from "./proposal-doc";

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
  doc.text("TEAM KERJAKU CONSULTANT", MARGIN + 38, top + h - 60, 8, false, "0.62 0.86 0.87");
  doc.text("PROPOSAL SOLUSI DIGITAL", MARGIN, top + 26, 11, true, "0.85 0.92 0.94");
  const right = `${stamp.date}  |  ${stamp.time}`;
  doc.text(right, PAGE_W - MARGIN - textWidth(right, 9, false), top + 27, 9, false, "0.66 0.72 0.78");
  const ver = `VERSI PROPOSAL V${data.version}`;
  doc.text(ver, PAGE_W - MARGIN - textWidth(ver, 9, true), top + h - 44, 9, true, "0.62 0.86 0.87");
  doc.y = top - 28;
}

/**
 * CLIENT DATA INTEGRITY: hanya data customer yang valid yang ditampilkan.
 * Field kosong disembunyikan (tidak ada "-", tidak ada email internal),
 * dan nama bisnis panjang dibungkus multi-baris tanpa terpotong.
 */
function clientCard(doc: Doc, data: ProposalDocData) {
  const business = (data.clientName ?? "").trim();
  const person = (data.contactName ?? "").trim();
  const wa = (data.whatsapp ?? "").trim();
  const mail = (data.email ?? "").trim();

  const fields: [string, string][] = [];
  if (business) fields.push(["Nama Bisnis", business]);
  if (person && person.toLowerCase() !== business.toLowerCase()) fields.push(["Nama Client", person]);
  if (wa) fields.push(["WhatsApp", wa]);
  if (mail) fields.push(["Email", mail]);
  if (!fields.length) return;

  const colW = (CONTENT_W - 32) / 2;
  const cells = fields.map(([label, value]) => ({
    label,
    lines: wrap(value, 9, true, colW - 10),
  }));

  // Tinggi kartu mengikuti isi, dua kolom per baris.
  const rowHeights: number[] = [];
  for (let i = 0; i < cells.length; i += 2) {
    const left = cells[i];
    const right = cells[i + 1];
    const lines = Math.max(left?.lines.length ?? 1, right?.lines.length ?? 1);
    rowHeights.push(13 + lines * 12 + 8);
  }
  const h = 34 + rowHeights.reduce((sum, v) => sum + v, 0);

  doc.ensure(h + 12);
  const top = doc.y - h;
  doc.rect(MARGIN, top, CONTENT_W, h, CARD_BG);
  doc.rect(MARGIN, top, 3, h, BRAND);
  doc.text("CLIENT INFORMATION", MARGIN + 16, top + h - 20, 8, true, MUTED);

  let y = top + h - 40;
  for (let i = 0; i < cells.length; i += 2) {
    const pair = [cells[i], cells[i + 1]];
    pair.forEach((cell, index) => {
      if (!cell) return;
      const x = MARGIN + 16 + index * colW;
      doc.text(cell.label.toUpperCase(), x, y, 7, false, MUTED);
      cell.lines.forEach((line, li) => doc.text(line, x, y - 13 - li * 12, 9, true));
    });
    y -= rowHeights[i / 2];
  }
  doc.y = top - 22;
}

function summaryBox(doc: Doc, data: ProposalDocData) {
  const rows: [string, string][] = [
    ["Judul Proposal", (data.title ?? "").trim()],
    ["Rekomendasi Paket", (data.recommendedPackage ?? "").trim()],
    ["Berlaku Sampai", (data.validUntil ?? "").trim()],
  ].filter((row): row is [string, string] => Boolean(row[1]));
  if (!rows.length) return;
  // Judul panjang dibungkus penuh — tidak dipotong.
  const wrapped = rows.map(([label, value]) => ({
    label,
    lines: wrap(value, 10, true, CONTENT_W - 40),
  }));
  const h = 38 + wrapped.reduce((sum, row) => sum + 12 + row.lines.length * 13, 0);
  doc.ensure(h + 12);
  const top = doc.y - h;
  doc.rect(MARGIN, top, CONTENT_W, h, "0.94 0.98 0.98");
  doc.text("PROPOSAL SUMMARY", MARGIN + 16, top + h - 18, 8, true, BRAND);
  let y = top + h - 38;
  wrapped.forEach((row) => {
    doc.text(row.label.toUpperCase(), MARGIN + 16, y, 7, false, MUTED);
    y -= 13;
    (row.lines.length ? row.lines : ["-"]).forEach((line) => {
      doc.text(line, MARGIN + 16, y, 10, true);
      y -= 13;
    });
    y -= 1;
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

function enhancementItem(doc: Doc, item: ProposalEnhancementItem, currency: string) {
  const amount = money(item.amount, currency);
  doc.text("*", MARGIN, doc.y, 11, true, BRAND);
  doc.text(item.name || "-", MARGIN + 14, doc.y, 10.5, true, INK);
  doc.text(amount, PAGE_W - MARGIN - textWidth(amount, 10, false), doc.y, 10, false, BRAND);
  doc.y -= 14;
  if (item.priority) {
    const tag = `PRIORITAS ${item.priority}  |  FASE ${item.phase ?? 2}`;
    doc.text(tag, MARGIN + 14, doc.y, 7.5, true, BRAND);
    doc.y -= 13;
  }
  if (item.benefit) {
    doc.paragraph(item.benefit, MARGIN + 14, 9.5, false, CONTENT_W - 14, MUTED, 13);
    doc.y -= 4;
  }
  const blocks: [string, string | null | undefined][] = [
    ["KENAPA RELEVAN", item.reason],
    ["DAMPAK BISNIS", item.impact],
    ["KAITAN DENGAN ALUR BISNIS", item.relation],
  ];
  for (const [label, value] of blocks) {
    if (!value) continue;
    doc.text(label, MARGIN + 14, doc.y, 7, false, MUTED);
    doc.y -= 13;
    doc.paragraph(value, MARGIN + 14, 10, false, CONTENT_W - 14);
    doc.y -= 6;
  }
  doc.y -= 6;
}

/** Feature Recommendation = mirror Potential Feature pada Order Brief. */
function enhancementSection(doc: Doc, data: ProposalDocData) {
  const items = data.enhancements ?? [];
  if (!items.length) return;
  const first = items[0];
  doc.keep((d) => {
    sectionTitle(d, "Feature Recommendation");
    d.paragraph(
      "Rekomendasi pengembangan lanjutan hasil analisa Team KERJAKU Consultant, mengikuti Order Brief. Fitur yang sudah masuk Core Solution tidak diulang. Fase 1 dapat dikerjakan bersamaan bila budget memungkinkan, Fase 2 menyusul sebagai pengembangan berikutnya.",
      MARGIN,
      9.5,
      false,
      CONTENT_W,
      MUTED,
      14,
    );
    d.y -= 6;
    if (first) enhancementItem(d, first, data.currency);
  });
  items.slice(1).forEach((item) => doc.keep((d) => enhancementItem(d, item, data.currency)));
}

function coreSolutionSection(doc: Doc, data: ProposalDocData) {
  const features = data.coreFeatures ?? [];
  if (!features.length) return;
  doc.keep((d) => sectionTitle(d, "Core Solution"));
  doc.keep((d) => {
    d.text(data.recommendedPackage || "Core Solution", MARGIN, d.y, 11, true, INK);
    d.y -= 20;
    d.text("INCLUDED FEATURE (SESUAI FEATURE LIST ORDER BRIEF)", MARGIN, d.y, 8, true, MUTED);
    d.y -= 16;
  });
  for (const feature of features) {
    doc.keep((d) => {
      const lines = feature.description ? wrap(feature.description, 9, false, CONTENT_W - 26) : [];
      d.text("-", MARGIN + 4, d.y, 10, true, BRAND);
      wrap(feature.name || "-", 10, true, CONTENT_W - 26).forEach((row) => {
        d.text(row, MARGIN + 18, d.y, 10, true);
        d.y -= 13;
      });
      d.y -= 1;
      lines.forEach((line) => {
        d.text(line, MARGIN + 18, d.y, 9, false, MUTED);
        d.y -= 12;
      });
      if (feature.solves) {
        d.y -= 2;
        d.text("MENJAWAB MASALAH", MARGIN + 18, d.y, 7, false, MUTED);
        d.y -= 12;
        wrap(feature.solves, 9, false, CONTENT_W - 26).forEach((line) => {
          d.text(line, MARGIN + 18, d.y, 9, false, INK);
          d.y -= 12;
        });
      }
      d.y -= 6;
    });
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
  const stagesAt = block.lines.findIndex((line) => line.startsWith("Tahapan pengerjaan"));
  const head = stagesAt >= 0 ? block.lines.slice(0, stagesAt) : block.lines;
  const rest = stagesAt >= 0 ? block.lines.slice(stagesAt) : [];
  doc.keep((d) => {
    sectionTitle(d, block.heading);
    if (head.length) bodyBlock(d, head.join("\n"));
  });
  if (rest.length) doc.keep((d) => bodyBlock(d, rest.join("\n")));
}

function pricingTable(doc: Doc, data: ProposalDocData) {
  const core = data.pricing;
  // ANTI-DUPLICATE: deskripsi panjang hanya di Feature Recommendation.
  const optional = (data.enhancements ?? []).map((e) => ({
    item: e.name,
    detail: e.priority ? `Fase ${e.phase ?? 2} — opsional` : "Opsional",
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
  const full = proposalFileName(clientName);
  // Nama file panjang dipangkas agar tidak menabrak nomor halaman.
  const escName = full.length > 46 ? `${full.slice(0, 43)}...` : full;
  pages.forEach((ops, index) => {
    ops.push(`${LINE} RG 0.7 w ${MARGIN} ${MARGIN + 24} m ${PAGE_W - MARGIN} ${MARGIN + 24} l S`);
    ops.push(
      `BT ${MUTED} rg /F1 8 Tf 1 0 0 1 ${MARGIN} ${MARGIN + 10} Tm (${escName}) Tj ET`,
      `BT ${MUTED} rg /F1 8 Tf 1 0 0 1 ${PAGE_W - MARGIN - 190} ${MARGIN + 10} Tm (Halaman ${index + 1} dari ${pages.length}) Tj ET`,
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

  const isMapping = (heading: string) =>
    heading.trim().toLowerCase() === "problem & solution mapping";
  const isBudget = (heading: string) => heading.trim().toLowerCase() === "budget alignment";
  const hasCoreFeatures = Boolean(data.coreFeatures?.length);
  const isCoreHeading = (heading: string) => heading.trim().toLowerCase() === "core solution";
  const isNextSteps = (heading: string) => heading.trim().toLowerCase() === "next steps";
  const mainSections = data.sections.filter(
    (s) =>
      !(hasCoreFeatures && isCoreHeading(s.heading)) &&
      !isNextSteps(s.heading) &&
      !isBudget(s.heading),
  );
  const closing = data.sections.filter((s) => isNextSteps(s.heading));
  const budget = data.sections.find((s) => isBudget(s.heading));

  for (const section of mainSections) {
    if (!section.heading && !section.body) continue;
    // Mapping problem-solution tidak boleh pecah antar halaman.
    if (isMapping(section.heading)) {
      doc.keep((d) => {
        sectionTitle(d, section.heading);
        bodyBlock(d, section.body || "-");
      });
      continue;
    }
    sectionTitle(doc, section.heading || "Bagian");
    bodyBlock(doc, section.body || "-");
  }

  enhancementSection(doc, data);
  coreSolutionSection(doc, data);
  timelineSection(doc, data);
  pricingTable(doc, data);
  if (budget?.body) {
    doc.keep((d) => {
      sectionTitle(d, budget.heading || "Budget Alignment");
      bodyBlock(d, budget.body);
    });
  }
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
