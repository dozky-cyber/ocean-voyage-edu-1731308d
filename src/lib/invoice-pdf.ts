// KERJAKU Invoice PDF — same corporate style as the Proposal document.
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
import { invoiceFileName, invoiceMoney, type InvoiceDocData, type InvoiceLine } from "./invoice-doc";

function wibDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function header(doc: Doc, data: InvoiceDocData) {
  const h = 112;
  const top = PAGE_H - h;
  doc.rect(0, top, PAGE_W, h, HEADER_BG);
  doc.rect(0, top, 6, h, BRAND);
  doc.rect(MARGIN, top + h - 52, 26, 26, BRAND);
  doc.text("K", MARGIN + 8, top + h - 45, 16, true, "1 1 1");
  doc.text("KERJAKU", MARGIN + 38, top + h - 44, 22, true, "1 1 1");
  doc.text("TEAM KERJAKU CONSULTANT", MARGIN + 38, top + h - 60, 8, false, "0.62 0.86 0.87");
  doc.text("INVOICE", MARGIN, top + 26, 11, true, "0.85 0.92 0.94");
  const right = data.number;
  doc.text(right, PAGE_W - MARGIN - textWidth(right, 11, true), top + 25, 11, true, "0.62 0.86 0.87");
  doc.y = top - 28;
}

function metaCard(doc: Doc, data: InvoiceDocData) {
  const h = data.proposalRef ? 82 : 62;
  doc.ensure(h + 12);
  const top = doc.y - h;
  doc.rect(MARGIN, top, CONTENT_W, h, CARD_BG);
  doc.rect(MARGIN, top, 3, h, BRAND);
  const cols: [string, string][] = [
    ["Invoice Number", data.number],
    ["Issue Date", wibDate(data.issueDate)],
    ["Due Date", data.dueDate ? wibDate(data.dueDate) : "-"],
    ["Payment Status", data.paymentState],
  ];
  const colW = (CONTENT_W - 32) / 4;
  cols.forEach(([label, value], index) => {
    const x = MARGIN + 16 + index * colW;
    doc.text(label.toUpperCase(), x, top + h - 22, 7, false, MUTED);
    const line = wrap(value || "-", 9.5, true, colW - 10)[0] ?? "-";
    doc.text(line, x, top + h - 38, 9.5, true);
  });
  if (data.proposalRef) {
    doc.text("REFERENSI DOKUMEN", MARGIN + 16, top + h - 58, 7, false, MUTED);
    const ref = wrap(data.proposalRef, 9, false, CONTENT_W - 32)[0] ?? "";
    doc.text(ref, MARGIN + 16, top + h - 71, 9, false, INK);
  }
  doc.y = top - 22;
}

function billTo(doc: Doc, data: InvoiceDocData) {
  // Kolom kiri = identitas client, kolom kanan = kontak. Field kosong
  // (termasuk email/WhatsApp internal sistem) tidak ditampilkan sama sekali.
  const colW = (CONTENT_W - 32) / 2;
  const left: [string, string[]][] = [
    ["Client Name", wrap(data.clientName, 9.5, true, colW - 14).slice(0, 2)],
  ];
  if (data.businessName) {
    left.push(["Business Name", wrap(data.businessName, 9.5, true, colW - 14).slice(0, 2)]);
  }
  const right: [string, string[]][] = [];
  if (data.email) right.push(["Email", wrap(data.email, 9.5, true, colW - 14).slice(0, 1)]);
  if (data.whatsapp) right.push(["WhatsApp", [data.whatsapp]]);

  const blockHeight = (rows: [string, string[]][]) =>
    rows.reduce((sum, [, value]) => sum + 15 + value.length * 13 + 8, 0);
  const bodyH = Math.max(blockHeight(left), blockHeight(right));
  const h = 30 + bodyH;
  doc.ensure(h + 12);
  const top = doc.y - h;
  doc.rect(MARGIN, top, CONTENT_W, h, "0.94 0.98 0.98");
  doc.text("BILL TO", MARGIN + 16, top + h - 18, 8, true, BRAND);

  [left, right].forEach((rows, colIndex) => {
    let y = top + h - 38;
    const x = MARGIN + 16 + colIndex * colW;
    rows.forEach(([label, value]) => {
      doc.text(label.toUpperCase(), x, y, 7, false, MUTED);
      value.forEach((line, i) => doc.text(line, x, y - 13 - i * 13, 9.5, true));
      y -= 15 + value.length * 13 + 8;
    });
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

function projectBlock(doc: Doc, data: InvoiceDocData) {
  sectionTitle(doc, "Project");
  doc.ensure(24);
  doc.text(data.projectName || "-", MARGIN, doc.y, 11, true, INK);
  doc.y -= 14;
  if (data.packageName && data.packageName !== data.projectName) {
    doc.text(`Paket solusi: ${data.packageName}`, MARGIN, doc.y, 9, false, MUTED);
    doc.y -= 14;
  }
  doc.y -= 12;
}


function groupHeader(doc: Doc, label: string) {
  doc.ensure(34);
  doc.text(label.toUpperCase(), MARGIN, doc.y, 8.5, true, INK);
  doc.y -= 8;
  doc.line(MARGIN, doc.y, PAGE_W - MARGIN, doc.y);
  doc.y -= 16;
}

function priceRows(doc: Doc, rows: InvoiceLine[], currency: string) {
  const itemW = CONTENT_W - 132;
  let subtotal = 0;
  for (const row of rows) {
    subtotal += Number(row.amount) || 0;
    const detailLines = row.detail ? wrap(row.detail, 9, false, itemW) : [];
    doc.ensure(38 + detailLines.length * 12);
    const amount = invoiceMoney(row.amount, currency);
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
  const text = invoiceMoney(value, currency);
  doc.text(label.toUpperCase(), MARGIN, doc.y, 8.5, true, MUTED);
  doc.text(text, PAGE_W - MARGIN - textWidth(text, 10, true), doc.y, 10, true, INK);
  doc.y -= 22;
}

function investment(doc: Doc, data: InvoiceDocData) {
  sectionTitle(doc, "Investment Detail");

  let core = 0;
  if (data.core.length) {
    groupHeader(doc, "Core Solution");
    core = priceRows(doc, data.core, data.currency);
    subtotalLine(doc, "Subtotal Core Solution", core, data.currency);
  }

  let optional = 0;
  if (data.optional.length) {
    groupHeader(doc, "Optional Enhancement");
    optional = priceRows(doc, data.optional, data.currency);
    subtotalLine(doc, "Subtotal Optional Enhancement", optional, data.currency);
  }

  doc.ensure(34);
  const label = "TOTAL INVESTMENT";
  const value = invoiceMoney(data.total || core + optional, data.currency);
  const boxTop = doc.y - 30;
  doc.rect(MARGIN, boxTop, CONTENT_W, 30, CARD_BG);
  doc.text(label, MARGIN + 14, boxTop + 11, 9, true, MUTED);
  doc.text(value, PAGE_W - MARGIN - 14 - textWidth(value, 12, true), boxTop + 9, 12, true, BRAND);
  doc.y = boxTop - 22;

  estimatesBlock(doc, data);
}

/** Mirror proposal: pengembangan opsional tampil informatif, di luar total. */
function estimatesBlock(doc: Doc, data: InvoiceDocData) {
  if (!data.estimates.length) return;
  groupHeader(doc, "Pengembangan Opsional (Belum Termasuk Total)");
  let sum = 0;
  for (const row of data.estimates) {
    sum += row.amount;
    doc.ensure(34);
    const amount = invoiceMoney(row.amount, data.currency);
    doc.text(row.name, MARGIN, doc.y, 10, true);
    doc.text(amount, PAGE_W - MARGIN - textWidth(amount, 10, false), doc.y, 10, false);
    doc.y -= 13;
    if (row.note) {
      doc.text(row.note, MARGIN, doc.y, 8.5, false, MUTED);
      doc.y -= 12;
    }
    doc.y -= 4;
    doc.line(MARGIN, doc.y, PAGE_W - MARGIN, doc.y, "0.92 0.94 0.96");
    doc.y -= 12;
  }
  subtotalLine(doc, "Estimasi Pengembangan Opsional", sum, data.currency);
  doc.paragraph(
    "Item pengembangan opsional hanya masuk tagihan setelah Anda menyetujuinya dan dikonfirmasi ulang oleh tim KERJAKU.",
    MARGIN,
    8.5,
    false,
    CONTENT_W,
    MUTED,
    12,
  );
  doc.y -= 10;
}


function paymentTerms(doc: Doc, data: InvoiceDocData) {
  sectionTitle(doc, "Payment Terms");

  if (data.paymentType === "full" || data.schedule.length <= 1) {
    doc.ensure(40);
    const boxTop = doc.y - 34;
    const value = invoiceMoney(data.total, data.currency);
    doc.rect(MARGIN, boxTop, CONTENT_W, 34, "0.94 0.98 0.98");
    doc.text("TOTAL PAYMENT (FULL PAYMENT)", MARGIN + 14, boxTop + 13, 9, true, MUTED);
    doc.text(value, PAGE_W - MARGIN - 14 - textWidth(value, 12, true), boxTop + 11, 12, true, BRAND);
    doc.y = boxTop - 22;
    return;
  }

  // Table: Tahap | Keterangan | Persentase | Jumlah | Status
  const cols = [
    { label: "Tahap", w: 96 },
    { label: "Keterangan", w: CONTENT_W - 96 - 66 - 96 - 56 },
    { label: "Persentase", w: 66 },
    { label: "Jumlah", w: 96 },
    { label: "Status", w: 56 },
  ];
  const xs: number[] = [];
  let cursor = MARGIN;
  for (const col of cols) {
    xs.push(cursor);
    cursor += col.w;
  }

  doc.ensure(30);
  const headTop = doc.y - 20;
  doc.rect(MARGIN, headTop, CONTENT_W, 20, CARD_BG);
  cols.forEach((col, index) => {
    doc.text(col.label.toUpperCase(), (xs[index] ?? MARGIN) + 6, headTop + 7, 7.5, true, MUTED);
  });
  doc.y = headTop - 6;

  data.schedule.forEach((item, index) => {
    const noteLines = item.note ? wrap(item.note, 9, false, (cols[1]?.w ?? 120) - 12) : [];
    const rowH = Math.max(20, 8 + noteLines.length * 12);
    doc.ensure(rowH + 10);
    const rowTop = doc.y - rowH;
    const baseline = rowTop + rowH - 12;
    const stageName = (item.name || "").trim();
    const stage = wrap(stageName || `DP ${index + 1}`, 9.5, true, (cols[0]?.w ?? 96) - 12)[0] ?? `DP ${index + 1}`;
    doc.text(stage, (xs[0] ?? MARGIN) + 6, baseline, 9.5, true);
    noteLines.forEach((line, i) => {
      doc.text(line, (xs[1] ?? MARGIN) + 6, baseline - i * 12, 9, false, MUTED);
    });
    doc.text(`${Math.round(item.percent)}%`, (xs[2] ?? MARGIN) + 6, baseline, 9.5, false);
    doc.text(invoiceMoney(item.amount, data.currency), (xs[3] ?? MARGIN) + 6, baseline, 9.5, false);
    doc.text(item.status, (xs[4] ?? MARGIN) + 6, baseline, 9, true, item.status === "Paid" ? BRAND : MUTED);
    doc.y = rowTop - 4;
    doc.line(MARGIN, doc.y, PAGE_W - MARGIN, doc.y, "0.92 0.94 0.96");
    doc.y -= 10;
  });

  doc.ensure(34);
  const totalTop = doc.y - 30;
  const totalValue = invoiceMoney(data.total, data.currency);
  doc.rect(MARGIN, totalTop, CONTENT_W, 30, CARD_BG);
  doc.text("TOTAL", MARGIN + 14, totalTop + 11, 9, true, MUTED);
  doc.text(
    totalValue,
    PAGE_W - MARGIN - 14 - textWidth(totalValue, 12, true),
    totalTop + 9,
    12,
    true,
    BRAND,
  );
  doc.y = totalTop - 22;
}

function paymentInfo(doc: Doc, data: InvoiceDocData) {
  sectionTitle(doc, "Metode Pembayaran & Catatan");

  if (data.paymentMethod) {
    doc.ensure(24);
    doc.text("METODE PEMBAYARAN", MARGIN, doc.y, 7.5, false, MUTED);
    doc.y -= 13;
    doc.text(data.paymentMethod, MARGIN, doc.y, 10, true, INK);
    doc.y -= 18;
  }

  if (data.paymentLink) {
    doc.ensure(24);
    doc.text("LINK PEMBAYARAN", MARGIN, doc.y, 7.5, false, MUTED);
    doc.y -= 13;
    doc.paragraph(data.paymentLink, MARGIN, 9, false, CONTENT_W, BRAND, 12);
    doc.y -= 6;
  }

  if (data.notes) {
    doc.ensure(24);
    doc.text("CATATAN", MARGIN, doc.y, 7.5, false, MUTED);
    doc.y -= 13;
    for (const raw of data.notes.split("\n")) {
      const line = raw.trim();
      if (!line) {
        doc.y -= 6;
        continue;
      }
      doc.paragraph(line, MARGIN, 10, false, CONTENT_W, INK, 15);
    }
    doc.y -= 6;
  }

  doc.paragraph(
    "Mohon konfirmasi setelah pembayaran dilakukan agar tim KERJAKU dapat langsung menjadwalkan pengerjaan. Terima kasih atas kepercayaan Anda kepada KERJAKU Business System Consultant.",
    MARGIN,
    9,
    false,
    CONTENT_W,
    MUTED,
    13,
  );
  doc.y -= 8;
}

function footer(doc: Doc, clientName: string) {
  const pages = [...doc.pages, doc.ops].filter((ops) => ops.length);
  const escName = invoiceFileName(clientName);
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

/** Build the branded KERJAKU invoice PDF. */
export function buildInvoicePdf(data: InvoiceDocData): Uint8Array {
  const doc = new Doc();
  header(doc, data);
  metaCard(doc, data);
  billTo(doc, data);
  projectBlock(doc, data);
  investment(doc, data);
  paymentTerms(doc, data);
  paymentInfo(doc, data);
  return serializePdf(footer(doc, data.clientName));
}


/** Browser-only: open the invoice PDF preview in a new tab. */
export function invoicePdfBlobUrl(data: InvoiceDocData): string {
  const blob = new Blob([buildInvoicePdf(data) as unknown as BlobPart], {
    type: "application/pdf",
  });
  return URL.createObjectURL(blob);
}
