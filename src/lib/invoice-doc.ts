// Client-safe helpers for KERJAKU Invoice documents (naming, slug, WhatsApp copy).
// Branding is always "KERJAKU — Business System Consultant".

import type { Installment, PaymentType } from "@/lib/admin/invoice-schedule";

export type InvoiceLine = { item: string; detail: string; amount: number };

export type InvoiceDocData = {
  number: string;
  issueDate: string;
  dueDate: string | null;
  status: string;
  paymentState: string;
  clientName: string;
  businessName: string | null;
  email: string | null;
  whatsapp: string | null;
  projectName: string;
  currency: string;
  core: InvoiceLine[];
  optional: InvoiceLine[];
  total: number;
  paymentType: PaymentType;
  schedule: Installment[];
  notes: string | null;
};

function safeName(value: string) {
  return (
    value
      .trim()
      .replace(/[^A-Za-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "Client"
  );
}

/** Invoice_KERJAKU_Candra.pdf */
export function invoiceFileName(clientName: string) {
  return `Invoice_KERJAKU_${safeName(clientName)}.pdf`;
}

/** invoice-candra → https://kerjaku.space/i/invoice-candra */
export function invoiceSlugBase(clientName: string) {
  const slug = clientName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug ? `invoice-${slug}` : "invoice-kerjaku";
}

export function invoiceMoney(amount: number, currency = "IDR") {
  const value = Math.round(Number(amount) || 0).toLocaleString("id-ID");
  return currency === "IDR" ? `Rp${value}` : `${currency} ${value}`;
}

/** PART 8 — professional WhatsApp message with clean file name + short link. */
export function buildInvoiceWhatsappMessage(input: {
  clientName: string;
  projectName: string;
  total: number;
  currency: string;
  paymentType: PaymentType;
  schedule: Installment[];
  fileName: string;
  previewUrl?: string | null;
}) {
  const scheduleLines =
    input.paymentType === "full" || input.schedule.length <= 1
      ? [`Full Payment — 100% — ${invoiceMoney(input.total, input.currency)}`]
      : input.schedule.map(
          (item, index) =>
            `${index + 1}. ${item.name} — ${Math.round(item.percent)}% — ${invoiceMoney(
              item.amount,
              input.currency,
            )} (${item.status === "Paid" ? "Lunas" : "Pending"})`,
        );

  const lines = [
    `Halo Kak ${input.clientName || "Client"},`,
    "",
    "Terima kasih sudah mempercayakan kebutuhan digital kepada KERJAKU Business System Consultant.",
    "",
    "Invoice project:",
    "",
    input.projectName || "Project Digital",
    "",
    "sudah kami siapkan.",
    "",
    "Detail pembayaran:",
    "",
    `💰 Total Investment: ${invoiceMoney(input.total, input.currency)}`,
    "",
    "📌 Payment Schedule:",
    ...scheduleLines,
    "",
    "📎 Invoice:",
    input.fileName,
  ];
  if (input.previewUrl) lines.push("", "📥 Lihat Invoice:", input.previewUrl);
  lines.push(
    "",
    "Silakan melakukan pengecekan invoice.",
    "",
    "Terima kasih.",
    "",
    "KERJAKU",
    "Business System Consultant",
  );
  return lines.join("\n");
}
