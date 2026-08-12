import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { OrderBriefDialog } from "@/components/admin/OrderBriefDialog";
import { OrderBriefEditDialog } from "@/components/admin/OrderBriefEditDialog";
import { Chip, GlassCard } from "@/components/admin/ui";
import {
  getOrderBrief,
  markOrderBriefReviewed,
  markOrderBriefSent,
  prepareOrderBriefFile,
  sendOrderBriefByEmail,
} from "@/lib/order-brief.functions";
import {
  briefFields,
  briefFileName,
  buildFollowUpMessage,
  normalizeWhatsapp,
  waLink,
} from "@/lib/order-brief";
import { downloadOrderBriefPdf } from "@/lib/order-brief-pdf";
import { formatDate } from "@/lib/admin/pipeline";

type Props = { leadId: string };

const FLOW = ["Generated", "Reviewed", "Sent WhatsApp", "Sent Email"] as const;

/** Order Brief delivery block shown inside the existing CRM lead detail page. */
export function LeadOrderBriefCard({ leadId }: Props) {
  const queryClient = useQueryClient();
  const load = useServerFn(getOrderBrief);
  const markSent = useServerFn(markOrderBriefSent);
  const markReviewed = useServerFn(markOrderBriefReviewed);
  const prepareFile = useServerFn(prepareOrderBriefFile);
  const sendEmail = useServerFn(sendOrderBriefByEmail);
  const [preview, setPreview] = useState(false);
  const [edit, setEdit] = useState(false);
  const [confirm, setConfirm] = useState<"whatsapp" | "email" | null>(null);

  const query = useQuery({
    queryKey: ["order-brief", leadId],
    queryFn: () => load({ data: { leadId } }),
  });

  const brief = query.data?.brief ?? null;
  const deliveries = query.data?.deliveries ?? [];
  const status = query.data?.status ?? "None";
  const fileName = brief ? briefFileName(brief.customerName) : "";
  const waNumber = normalizeWhatsapp(brief?.whatsapp);

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["order-brief", leadId] }),
      queryClient.invalidateQueries({ queryKey: ["admin"] }),
    ]);
  }

  async function openReviewed(open: () => void) {
    open();
    try {
      await markReviewed({ data: { leadId } });
      await refresh();
    } catch {
      /* status update is best-effort */
    }
  }

  const whatsapp = useMutation({
    mutationFn: async () => {
      if (!brief) throw new Error("Order Brief belum tersedia.");
      if (!waNumber) throw new Error("Nomor WhatsApp customer tidak valid.");
      const file = await prepareFile({ data: { leadId } });
      window.open(
        waLink(waNumber, buildFollowUpMessage(brief, { pdfUrl: file.url })),
        "_blank",
        "noopener",
      );
      return markSent({
        data: {
          leadId,
          channel: "whatsapp" as const,
          markContacted: true,
          pdfUrl: file.url,
        },
      });
    },
    onSuccess: async () => {
      toast.success("Order Brief + link PDF dikirim via WhatsApp. Status lead → Contacted.");
      setConfirm(null);
      await refresh();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Gagal mengirim."),
  });

  const email = useMutation({
    mutationFn: () => sendEmail({ data: { leadId, markContacted: true } }),
    onSuccess: async (result) => {
      toast.success(`Order Brief dikirim ke ${result.to}. Status lead → Contacted.`);
      setConfirm(null);
      await refresh();
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Gagal mengirim email."),
  });

  const busy = whatsapp.isPending || email.isPending;
  const activeIndex = FLOW.indexOf(status as (typeof FLOW)[number]);

  return (
    <GlassCard>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Order Brief KERJAKU</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Dikirim dari data lead aktif dan Order Brief tersimpan.
          </p>
        </div>
        <Chip
          className={
            status.startsWith("Sent")
              ? "bg-primary/15 text-primary border-primary/30"
              : "bg-secondary/40 text-secondary-foreground border-border/60"
          }
        >
          {status === "None" ? "Belum tersedia" : status}
        </Chip>
      </div>

      {query.isLoading ? (
        <p className="mt-4 text-xs text-muted-foreground">Memuat Order Brief…</p>
      ) : !brief ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Order Brief belum tersedia untuk lead ini.
        </p>
      ) : (
        <div className="mt-4 space-y-4 text-xs">
          <section>
            <Label>Order Brief Status</Label>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {FLOW.map((step, index) => (
                <span key={step} className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 ${
                      index <= activeIndex
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground"
                    }`}
                  >
                    {step}
                  </span>
                  {index < FLOW.length - 1 && <span className="text-muted-foreground">→</span>}
                </span>
              ))}
            </div>
          </section>

          <section>
            <Label>Customer Data</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <Item label="Nama Customer" value={brief.customerName} />
              <Item label="WhatsApp" value={brief.whatsapp || "-"} />
              <Item label="Email" value={brief.email || "-"} />
            </div>
          </section>

          <section>
            <Label>Order Brief Data · v{brief.version}</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {briefFields(brief).map((field) => (
                <Item key={field.label} label={field.label} value={field.value} />
              ))}
            </div>
          </section>

          <section>
            <Label>Attachment</Label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-border px-3 py-1 text-foreground">
                📎 {fileName}
              </span>
              <button
                type="button"
                onClick={() => downloadOrderBriefPdf(brief)}
                className="text-primary hover:underline"
              >
                Download PDF
              </button>
            </div>
          </section>

          <div className="flex flex-wrap gap-3 border-t border-border/60 pt-4">
            <button
              type="button"
              onClick={() => void openReviewed(() => setPreview(true))}
              className="rounded-full border border-border px-4 py-1.5 text-foreground"
            >
              Preview Brief
            </button>
            <button
              type="button"
              onClick={() => void openReviewed(() => setEdit(true))}
              className="rounded-full border border-border px-4 py-1.5 text-foreground"
            >
              Edit Brief
            </button>
            <button
              type="button"
              onClick={() => setConfirm("whatsapp")}
              className="rounded-full border border-primary/60 bg-primary/10 px-4 py-1.5 text-primary"
            >
              Send WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setConfirm("email")}
              className="rounded-full border border-border px-4 py-1.5 text-foreground"
            >
              Send Email
            </button>
          </div>

          {confirm && (
            <div className="rounded-2xl border border-primary/40 bg-primary/5 p-3">
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
                  Pesan WhatsApp menyertakan link download PDF asli (berlaku 1 tahun) sehingga
                  customer langsung menerima filenya.
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => (confirm === "whatsapp" ? whatsapp.mutate() : email.mutate())}
                  className="rounded-full border border-primary/60 bg-primary/10 px-4 py-1.5 text-primary disabled:opacity-60"
                >
                  {busy ? "Mengirim…" : "Confirm Send"}
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

          <section>
            <Label>Delivery History</Label>
            {deliveries.length === 0 ? (
              <p className="mt-2 text-muted-foreground">Belum ada pengiriman.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {deliveries.map((row) => (
                  <li key={row.id} className="rounded-xl border border-border/70 p-2">
                    <p className="text-foreground">
                      Order Brief dikirim melalui {row.channel === "email" ? "Email" : "WhatsApp"} ·{" "}
                      <span className={row.status === "failed" ? "text-destructive" : "text-primary"}>
                        {row.status === "failed" ? "Gagal" : "Berhasil"}
                      </span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatDate(row.created_at)} · {row.created_by_email ?? "admin"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">File: {row.file_name}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {preview && <OrderBriefDialog leadId={leadId} onClose={() => setPreview(false)} />}
      {edit && brief && (
        <OrderBriefEditDialog
          brief={brief}
          leadId={leadId}
          onClose={() => setEdit(false)}
          onSaved={refresh}
        />
      )}
    </GlassCard>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{children}</p>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-foreground">{value || "-"}</p>
    </div>
  );
}
