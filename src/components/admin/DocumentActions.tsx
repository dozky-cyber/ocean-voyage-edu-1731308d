import { useState } from "react";
import { toast } from "sonner";

import { formatDate } from "@/lib/admin/pipeline";
import { copyPayload, copyText, packetTitle, type DocumentPacket } from "@/lib/document-delivery";

export type DocumentDeliveryRow = {
  id: string;
  channel: string;
  file_name: string;
  created_at: string;
  created_by_email: string | null;
  status: string;
};

type Props = {
  packet: DocumentPacket;
  onPreview?: () => void;
  onEdit?: () => void;
  onDownload?: () => void;
  onSendWhatsapp?: () => void;
  onSendEmail?: () => void;
  busy?: boolean;
  /** Set when the last email attempt failed — shows the manual-send fallback. */
  emailError?: string | null;
  deliveries?: DocumentDeliveryRow[];
  showHistory?: boolean;
};

const pill =
  "rounded-full border border-border px-4 py-1.5 text-foreground transition hover:border-primary/50 disabled:opacity-60";
const primaryPill =
  "rounded-full border border-primary/60 bg-primary/10 px-4 py-1.5 text-primary transition hover:bg-primary/20 disabled:opacity-60";
const ghost = "text-primary hover:underline disabled:opacity-60";

/**
 * Shared document action bar used by every KERJAKU document type
 * (Order Brief, Proposal, Invoice, Quotation, Report).
 */
export function DocumentActions({
  packet,
  onPreview,
  onEdit,
  onDownload,
  onSendWhatsapp,
  onSendEmail,
  busy,
  emailError,
  deliveries = [],
  showHistory = true,
}: Props) {
  const [copyOpen, setCopyOpen] = useState(false);

  async function copy(label: string, value: string | null | undefined) {
    if (!value) {
      toast.error(`${label} belum tersedia.`);
      return;
    }
    const ok = await copyText(value);
    toast[ok ? "success" : "error"](ok ? `${label} disalin.` : `Gagal menyalin ${label}.`);
  }

  return (
    <div className="space-y-4 text-xs">
      <section>
        <Label>Attachment</Label>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-border px-3 py-1 text-foreground">
            📎 {packet.fileName}
          </span>
          {onDownload && (
            <button type="button" onClick={onDownload} className={ghost}>
              Download PDF
            </button>
          )}
          {packet.downloadUrl && (
            <a
              href={packet.downloadUrl}
              target="_blank"
              rel="noreferrer noopener"
              className={ghost}
            >
              Buka link file
            </a>
          )}
        </div>
      </section>

      <div className="flex flex-wrap gap-3 border-t border-border/60 pt-4">
        {onPreview && (
          <button type="button" onClick={onPreview} className={pill}>
            Preview
          </button>
        )}
        {onEdit && (
          <button type="button" onClick={onEdit} className={pill}>
            Edit Document
          </button>
        )}
        {onDownload && (
          <button type="button" onClick={onDownload} className={pill}>
            Download
          </button>
        )}
        <button type="button" onClick={() => setCopyOpen((open) => !open)} className={pill}>
          Copy
        </button>
        {onSendWhatsapp && (
          <button type="button" disabled={busy} onClick={onSendWhatsapp} className={primaryPill}>
            Send WhatsApp
          </button>
        )}
        {onSendEmail && (
          <button type="button" disabled={busy} onClick={onSendEmail} className={pill}>
            Send Email
          </button>
        )}
      </div>

      {copyOpen && (
        <div className="rounded-2xl border border-border/70 bg-background/60 p-3">
          <p className="font-medium text-foreground">Copy {packetTitle(packet)}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <button
              type="button"
              className={primaryPill}
              onClick={() => void copy("Informasi pengiriman", copyPayload(packet))}
            >
              Copy semua
            </button>
            <button
              type="button"
              className={pill}
              onClick={() => void copy("Message", packet.message)}
            >
              Copy message
            </button>
            <button
              type="button"
              className={pill}
              onClick={() => void copy("Email customer", packet.email)}
            >
              Copy email
            </button>
            <button
              type="button"
              className={pill}
              onClick={() => void copy("Link PDF", packet.downloadUrl)}
            >
              Copy link PDF
            </button>
            <button
              type="button"
              className={pill}
              onClick={() => void copy("Nama file", packet.fileName)}
            >
              Copy nama file
            </button>
          </div>
          <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-card p-3 text-foreground">
            {copyPayload(packet)}
          </pre>
        </div>
      )}

      {emailError && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-3">
          <p className="font-medium text-destructive">Email gagal terkirim</p>
          <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{emailError}</p>
          <p className="mt-2 text-muted-foreground">
            Gunakan tombol di bawah untuk mengirim manual sementara domain pengirim belum
            terverifikasi.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              className={pill}
              onClick={() => void copy("Email customer", packet.email)}
            >
              Copy Email
            </button>
            <button
              type="button"
              className={pill}
              onClick={() => void copy("Link PDF", packet.downloadUrl)}
            >
              Copy Link PDF
            </button>
            <button
              type="button"
              className={pill}
              onClick={() => void copy("Message", packet.message)}
            >
              Copy Message
            </button>
            <button
              type="button"
              className={pill}
              onClick={() => void copy("Subject", packet.subject)}
            >
              Copy Subject
            </button>
          </div>
        </div>
      )}

      {showHistory && (
        <section>
          <Label>Delivery History</Label>
          {deliveries.length === 0 ? (
            <p className="mt-2 text-muted-foreground">Belum ada pengiriman.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {deliveries.map((row) => (
                <li key={row.id} className="rounded-xl border border-border/70 p-2">
                  <p className="text-foreground">
                    {packetTitle(packet)} dikirim melalui{" "}
                    {row.channel === "email" ? "Email" : "WhatsApp"} ·{" "}
                    <span className={row.status === "failed" ? "text-destructive" : "text-primary"}>
                      {row.status === "failed" ? "Gagal" : "Berhasil"}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {formatDate(row.created_at)} · {row.created_by_email ?? "admin"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">📎 {row.file_name}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{children}</p>;
}
