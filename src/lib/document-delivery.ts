// Reusable document delivery model for every KERJAKU document type
// (Order Brief, Proposal, Invoice, Quotation, Report).
// Pure client-safe formatting helpers — no AI Consultant / CRM logic here.

export type DocumentKind = "order-brief" | "proposal" | "invoice" | "quotation" | "report";

export const documentLabel: Record<DocumentKind, string> = {
  "order-brief": "Order Brief KERJAKU",
  proposal: "Proposal KERJAKU",
  invoice: "Invoice KERJAKU",
  quotation: "Quotation KERJAKU",
  report: "Report KERJAKU",
};

/** Everything needed to preview, copy, or send one document. */
export type DocumentPacket = {
  kind: DocumentKind;
  /** Display title, defaults to documentLabel[kind]. */
  title?: string;
  subject: string;
  customerName: string;
  email?: string | null;
  whatsapp?: string | null;
  /** Plain-text body shared by WhatsApp + email. */
  message: string;
  fileName: string;
  downloadUrl?: string | null;
};

export function packetTitle(packet: DocumentPacket) {
  return packet.title ?? documentLabel[packet.kind];
}

/**
 * Clean attachment block appended to outgoing messages.
 * Never prints a raw signed-storage path inline with the body text.
 */
export function attachmentBlock(packet: DocumentPacket) {
  const lines = [`📎 ${packetTitle(packet)}`, "", "File:", packet.fileName];
  if (packet.downloadUrl) lines.push("", "Download PDF:", packet.downloadUrl);
  return lines.join("\n");
}

/** Full WhatsApp message: body + clean attachment block. */
export function whatsappMessage(packet: DocumentPacket) {
  return `${packet.message.trim()}\n\n${attachmentBlock(packet)}`;
}

/** Clipboard payload: subject, customer, message, attachment, download link. */
export function copyPayload(packet: DocumentPacket) {
  const lines = [
    "Subject:",
    packet.subject,
    "",
    "Customer:",
    packet.customerName,
    "",
    "Message:",
    packet.message.trim(),
    "",
    "Attachment:",
    packet.fileName,
  ];
  if (packet.downloadUrl) lines.push("", "Download:", packet.downloadUrl);
  return lines.join("\n");
}

/** Short, human-friendly label for a signed download link. */
export function downloadLabel(url: string | null | undefined) {
  return url ? "Download PDF" : "Link belum tersedia";
}

/** Copy text to the clipboard with a textarea fallback for older browsers. */
export async function copyText(value: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const area = document.createElement("textarea");
    area.value = value;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}
