import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import {
  getOrderBrief,
  markOrderBriefSent,
  prepareOrderBriefFile,
  sendOrderBriefByEmail,
} from "@/lib/order-brief.functions";
import { DocumentActions } from "@/components/admin/DocumentActions";
import {
  briefFields,
  briefFileName,
  buildFollowUpBody,
  buildFollowUpMessage,
  emailSubject,
  normalizeWhatsapp,
  waLink,
} from "@/lib/order-brief";
import { downloadOrderBriefPdf } from "@/lib/order-brief-pdf";
import { formatDate } from "@/lib/admin/pipeline";
import { cn } from "@/lib/utils";

type Props = {
  /** Source of the brief: AI conversation view or CRM lead detail. */
  conversationId?: string;
  leadId?: string;
  onClose: () => void;
};

export function OrderBriefDialog({ conversationId, leadId, onClose }: Props) {
  const target = conversationId ? { conversationId } : { leadId: leadId! };
  const targetKey = conversationId ?? leadId ?? "";
  const queryClient = useQueryClient();
  const load = useServerFn(getOrderBrief);
  const markSent = useServerFn(markOrderBriefSent);
  const sendEmail = useServerFn(sendOrderBriefByEmail);
  const prepareFile = useServerFn(prepareOrderBriefFile);
  const [confirm, setConfirm] = useState<"whatsapp" | "email" | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["order-brief", targetKey],
    queryFn: () => load({ data: target }),
  });

  const brief = query.data?.brief ?? null;
  const deliveries = query.data?.deliveries ?? [];
  const message = brief ? buildFollowUpBody(brief) : "";
  const fileName = brief ? briefFileName(brief.customerName) : "";
  const waNumber = normalizeWhatsapp(brief?.whatsapp);

  const whatsapp = useMutation({
    mutationFn: async () => {
      if (!brief) throw new Error("Order Brief belum tersedia.");
      if (!waNumber) throw new Error("Nomor WhatsApp customer tidak valid.");
      const file = await prepareFile({ data: target });
      setFileUrl(file.url);
      window.open(
        waLink(waNumber, buildFollowUpMessage(brief, { pdfUrl: file.url })),
        "_blank",
        "noopener",
      );
      return markSent({
        data: { ...target, channel: "whatsapp" as const, markContacted: true, pdfUrl: file.url },
      });
    },
    onSuccess: async () => {
      toast.success("Order Brief ditandai terkirim via WhatsApp. Status lead → Contacted.");
      setConfirm(null);
      await refresh();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Gagal mengirim."),
  });

  const email = useMutation({
    mutationFn: async () => {
      const file = await prepareFile({ data: target }).catch(() => null);
      if (file?.url) setFileUrl(file.url);
      return sendEmail({ data: { ...target, markContacted: true } });
    },
    onSuccess: async (result) => {
      setEmailError(null);
      toast.success(`Order Brief dikirim ke ${result.to}. Status lead → Contacted.`);
      setConfirm(null);
      await refresh();
    },
    onError: (error) => {
      const detail = error instanceof Error ? error.message : "Gagal mengirim email.";
      setEmailError(detail);
      setConfirm(null);
      toast.error(detail);
    },
  });

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["order-brief", targetKey] }),
      queryClient.invalidateQueries({ queryKey: ["admin"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] }),
      queryClient.invalidateQueries({ queryKey: ["ai-conversations"] }),
    ]);
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-background/80 p-3 backdrop-blur-sm sm:p-6">
      <div className="w-full max-w-3xl rounded-3xl border border-border/70 bg-card p-4 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Preview Order Brief</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Periksa isi brief sebelum dikirim ke customer.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Tutup
          </button>
        </div>

        {query.isLoading && <p className="mt-4 text-xs text-muted-foreground">Memuat brief…</p>}
        {!query.isLoading && !brief && (
          <p className="mt-4 text-xs text-muted-foreground">
            Order Brief belum tersedia untuk percakapan ini.
          </p>
        )}

        {brief && (
          <div className="mt-4 space-y-5 text-xs">
            <section>
              <SectionTitle>Customer Data · Order Brief v{brief.version}</SectionTitle>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <Field label="Nama" value={brief.customerName} />
                <Field label="WhatsApp" value={brief.whatsapp || "-"} />
                <Field label="Email" value={brief.email || "-"} />
              </div>
            </section>

            <section>
              <SectionTitle>Order Brief</SectionTitle>
              <div className="mt-2 space-y-2">
                {briefFields(brief).map((field) => (
                  <Field key={field.label} label={field.label} value={field.value} />
                ))}
              </div>
            </section>

            <section>
              <SectionTitle>Message Preview</SectionTitle>
              <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-background/60 p-3 text-foreground">
                {message}
              </pre>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Subject email: {emailSubject(brief)}
              </p>
            </section>

            <DocumentActions
              packet={{
                kind: "order-brief",
                subject: emailSubject(brief),
                customerName: brief.customerName,
                email: brief.email,
                whatsapp: waNumber,
                message,
                fileName,
                downloadUrl: fileUrl,
              }}
              onDownload={() => downloadOrderBriefPdf(brief)}
              onSendWhatsapp={() => setConfirm("whatsapp")}
              onSendEmail={() => setConfirm("email")}
              busy={whatsapp.isPending || email.isPending}
              emailError={emailError}
              deliveries={deliveries}
            />
          </div>
        )}

        {confirm && brief && (
          <div className="mt-4 rounded-2xl border border-primary/40 bg-primary/5 p-3 text-xs">
            <p className="font-medium text-foreground">
              Konfirmasi kirim via {confirm === "whatsapp" ? "WhatsApp" : "Email"}
            </p>
            <p className="mt-1 text-muted-foreground">Customer: {brief.customerName}</p>
            <p className="text-muted-foreground">
              {confirm === "whatsapp"
                ? `Nomor: ${waNumber ?? "tidak valid"}`
                : `Email: ${brief.email ?? "tidak tersedia"}`}
            </p>
            <p className="text-muted-foreground">Attachment: {fileName}</p>
            {confirm === "whatsapp" && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Pesan menyertakan link download PDF asli, jadi customer langsung menerima filenya.
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={whatsapp.isPending || email.isPending}
                onClick={() => (confirm === "whatsapp" ? whatsapp.mutate() : email.mutate())}
                className={cn(
                  "rounded-full border border-primary/60 bg-primary/10 px-4 py-1.5 text-primary",
                  (whatsapp.isPending || email.isPending) && "opacity-60",
                )}
              >
                {whatsapp.isPending || email.isPending ? "Mengirim…" : "Confirm Send"}
              </button>
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className="text-muted-foreground hover:underline"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{children}</p>;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-foreground">{value || "-"}</p>
    </div>
  );
}
