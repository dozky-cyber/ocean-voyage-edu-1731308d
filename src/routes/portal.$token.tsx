import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Circle, FileText, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { formatMoney, paymentStatusClass } from "@/lib/admin/payments";
import {
  approvePortalMilestone,
  getClientPortal,
  sendClientPortalMessage,
} from "@/lib/portal.functions";

export const Route = createFileRoute("/portal/$token")({
  head: () => ({
    meta: [
      { title: "Client Portal — KERJAKU" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Portal klien KERJAKU: progres project, pembayaran, dokumen, dan komunikasi." },
    ],
  }),
  component: ClientPortalPage,
});

function ClientPortalPage() {
  const { token } = useParams({ from: "/portal/$token" });
  const queryClient = useQueryClient();
  const fetchPortal = useServerFn(getClientPortal);
  const sendMessage = useServerFn(sendClientPortalMessage);
  const approveMilestone = useServerFn(approvePortalMilestone);
  const [body, setBody] = useState("");

  const portal = useQuery({
    queryKey: ["portal", token],
    queryFn: () => fetchPortal({ data: { token } }),
  });

  const messageMutation = useMutation({
    mutationFn: () => sendMessage({ data: { token, body } }),
    onSuccess: () => {
      setBody("");
      toast.success("Pesan terkirim ke tim KERJAKU.");
      void queryClient.invalidateQueries({ queryKey: ["portal", token] });
    },
    onError: () => toast.error("Gagal mengirim pesan."),
  });

  const approveMutation = useMutation({
    mutationFn: (input: { projectId: string; index: number }) =>
      approveMilestone({ data: { token, ...input } }),
    onSuccess: (result) => {
      toast.success(`Milestone "${result.title}" disetujui.`);
      void queryClient.invalidateQueries({ queryKey: ["portal", token] });
    },
    onError: () => toast.error("Gagal menyetujui milestone."),
  });

  if (portal.isLoading) {
    return <Shell><p className="text-sm text-white/60">Memuat portal…</p></Shell>;
  }
  if (!portal.data?.found) {
    return (
      <Shell>
        <h1 className="text-xl font-semibold">Portal tidak ditemukan</h1>
        <p className="mt-2 text-sm text-white/60">
          Link portal tidak valid atau sudah tidak aktif. Hubungi tim KERJAKU.
        </p>
      </Shell>
    );
  }

  const { client, projects, documents, messages, invoices } = portal.data;

  return (
    <Shell>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-white/40">Client Portal</p>
          <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight">{client.name}</h1>
          <p className="text-sm text-white/60">
            {client.company || "KERJAKU Client"} · {client.package ?? "Custom Project"}
          </p>
        </div>
        <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
          {client.status}
        </span>
      </header>

      <section className="mt-8 space-y-4">
        <h2 className="text-sm uppercase tracking-[0.2em] text-white/40">Project & Timeline</h2>
        {projects.length === 0 ? (
          <Card><p className="text-sm text-white/60">Project akan tampil di sini setelah kickoff.</p></Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="min-w-0 truncate text-base font-medium">{project.name}</p>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs">
                  {project.status}
                </span>
              </div>
              {project.summary ? (
                <p className="mt-2 text-sm text-white/60">{project.summary}</p>
              ) : null}
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-cyan-400/80 transition-all"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-white/50">{project.progress}% selesai</p>

              <ol className="mt-4 space-y-3">
                {project.timeline.map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    {step.done ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-white/25" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{step.title}</p>
                      <p className="text-xs text-white/50">{step.detail}</p>
                      {step.done ? (
                        step.approved ? (
                          <span className="mt-1 inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[0.65rem] text-cyan-200">
                            Disetujui klien
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={approveMutation.isPending}
                            onClick={() =>
                              approveMutation.mutate({ projectId: project.id, index })
                            }
                            className="mt-1 inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[0.65rem] text-white/70 transition hover:border-cyan-400/50 hover:text-cyan-200 disabled:opacity-50"
                          >
                            Setujui milestone
                          </button>
                        )
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          ))
        )}
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-sm uppercase tracking-[0.2em] text-white/40">Pembayaran</h2>
        <Card>
          {invoices.length === 0 ? (
            <p className="text-sm text-white/60">Belum ada tagihan.</p>
          ) : (
            <ul className="divide-y divide-white/10">
              {invoices.map((inv) => (
                <li key={inv.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{inv.number}</p>
                    <p className="text-xs text-white/50">
                      Jatuh tempo {inv.due_date ?? "-"}
                    </p>
                  </div>
                  <span className="text-sm tabular-nums">
                    {formatMoney(Number(inv.amount) || 0, inv.currency ?? "IDR")}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${paymentStatusClass(inv.status)}`}
                  >
                    {inv.status}
                  </span>
                  {inv.payment_link && inv.status !== "Paid" ? (
                    <a
                      href={inv.payment_link}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-cyan-400/90 px-3 py-1 text-xs font-medium text-slate-950"
                    >
                      Bayar
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-sm uppercase tracking-[0.2em] text-white/40">Dokumen</h2>
        <Card>
          {documents.length === 0 ? (
            <p className="text-sm text-white/60">Belum ada dokumen.</p>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 shrink-0 text-white/40" />
                  {doc.url ? (
                    <a href={doc.url} target="_blank" rel="noreferrer" className="truncate underline">
                      {doc.title}
                    </a>
                  ) : (
                    <span className="min-w-0 flex-1 truncate">{doc.title}</span>
                  )}
                  <span className="text-xs text-white/40">{doc.kind}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section className="mt-8 space-y-4 pb-16">
        <h2 className="text-sm uppercase tracking-[0.2em] text-white/40">Messages</h2>
        <Card>
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-2xl border px-3 py-2 text-sm ${
                  msg.sender === "team"
                    ? "border-cyan-400/25 bg-cyan-400/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <p className="text-xs text-white/45">{msg.author_name ?? msg.sender}</p>
                <p className="mt-1 whitespace-pre-wrap">{msg.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Tulis pesan untuk tim KERJAKU…"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-cyan-400/60"
            />
            <button
              type="button"
              disabled={!body || messageMutation.isPending}
              onClick={() => messageMutation.mutate()}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-cyan-400/90 px-3 py-2 text-sm font-medium text-slate-950 disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> Kirim
            </button>
          </div>
        </Card>
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#050b16] text-white">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">{children}</div>
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-lg backdrop-blur-xl">
      {children}
    </div>
  );
}
