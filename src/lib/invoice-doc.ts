// Client-safe helpers for KERJAKU Invoice documents (naming, slug, WhatsApp copy).
// Branding is always "KERJAKU — Team KERJAKU Consultant".

import type { Installment, PaymentType } from "@/lib/admin/invoice-schedule";
import { customerEmail, customerWhatsapp } from "@/lib/proposal-doc";

export { customerEmail, customerWhatsapp };

export type InvoiceLine = { item: string; detail: string; amount: number };

/** Estimasi pengembangan opsional dari proposal — informatif, tidak masuk total. */
export type InvoiceEstimate = { name: string; note: string; amount: number };

export type InvoiceDocData = {
  number: string;
  issueDate: string;
  dueDate: string | null;
  status: string;
  paymentState: string;
  /** Nama orang / kontak (bukan nama bisnis). */
  clientName: string;
  businessName: string | null;
  email: string | null;
  whatsapp: string | null;
  projectName: string;
  packageName: string | null;
  /** "Proposal V5 — INV ref" untuk jejak dokumen. */
  proposalRef: string | null;
  currency: string;
  core: InvoiceLine[];
  optional: InvoiceLine[];
  /** Estimasi pengembangan opsional (belum termasuk total). */
  estimates: InvoiceEstimate[];
  total: number;
  paymentType: PaymentType;
  schedule: Installment[];
  paymentMethod: string | null;
  paymentLink: string | null;
  notes: string | null;
};

/**
 * Nama kontak yang rapi untuk penamaan file/slug:
 * membuang bagian dalam kurung dan membatasi panjangnya.
 */
export function cleanContactName(value: string | null | undefined): string {
  const base = (value ?? "")
    .replace(/\(.*?\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!base) return "Client";
  const words = base.split(" ").slice(0, 4).join(" ");
  return words.length > 40 ? words.slice(0, 40).trim() : words;
}

function safeName(value: string) {
  return (
    cleanContactName(value)
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
  const slug = cleanContactName(clientName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug ? `invoice-${slug}` : "invoice-kerjaku";
}

/** Rp 28.000.000 — format konsisten dengan dokumen KERJAKU lainnya. */
export function invoiceMoney(amount: number, currency = "IDR") {
  const value = Math.round(Number(amount) || 0).toLocaleString("id-ID");
  return currency === "IDR" ? `Rp ${value}` : `${currency} ${value}`;
}

/** PART 8 — professional WhatsApp message with clean file name + short link. */
export function buildInvoiceWhatsappMessage(input: {
  clientName: string;
  invoiceNumber?: string | null;
  projectName: string;
  total: number;
  currency: string;
  paymentType: PaymentType;
  schedule: Installment[];
  dueDate?: string | null;
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
    `Halo Kak ${cleanContactName(input.clientName)},`,
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
  ];
  if (input.invoiceNumber) lines.push(`🧾 Nomor Invoice: ${input.invoiceNumber}`, "");
  lines.push(`💰 Total Investment: ${invoiceMoney(input.total, input.currency)}`, "");
  if (input.dueDate) lines.push(`🗓️ Jatuh tempo: ${input.dueDate}`, "");
  lines.push("📌 Payment Schedule:", ...scheduleLines);
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
