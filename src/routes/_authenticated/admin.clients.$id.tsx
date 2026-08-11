import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Copy, FileText, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Chip, GlassCard } from "@/components/admin/ui";
import { formatDate } from "@/lib/admin/pipeline";
import {
  PROJECT_STATUSES,
  formatMoney,
  paymentStatusClass,
  timelineProgress,
  type ProjectStatus,
  type TimelineStep,
} from "@/lib/admin/payments";
import {
  addClientDocumentFn,
  getClientWorkspace,
  postClientMessage,
  saveClientProject,
} from "@/lib/billing.functions";

export const Route = createFileRoute("/_authenticated/admin/clients/$id")({
  component: ClientDetailPage,
});

const inputClass =
  "w-full rounded-xl border border-border/50 bg-background/40 px-3 py-2 text-sm outline-none focus:border-primary/60";

function ClientDetailPage() {
  const { id } = useParams({ from: "/_authenticated/admin/clients/$id" });
  const queryClient = useQueryClient();

  const fetchWorkspace = useServerFn(getClientWorkspace);
  const saveProject = useServerFn(saveClientProject);
  const sendMessage = useServerFn(postClientMessage);
  const addDocument = useServerFn(addClientDocumentFn);

  const workspace = useQuery({
    queryKey: ["admin", "client", id],
    queryFn: () => fetchWorkspace({ data: { id } }),
  });

  const project = workspace.data?.projects[0] ?? null;
  const [projectForm, setProjectForm] = useState<{
    name: string;
    status: ProjectStatus;
    summary: string;
    target_date: string;
    timeline: TimelineStep[];
  }>({ name: "", status: "Onboarding", summary: "", target_date: "", timeline: [] });
  const [message, setMessage] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [docUrl, setDocUrl] = useState("");

  useEffect(() => {
    if (!project) return;
    setProjectForm({
      name: project.name,
      status: (PROJECT_STATUSES as readonly string[]).includes(project.status)
        ? (project.status as ProjectStatus)
        : "Onboarding",
      summary: project.summary ?? "",
      target_date: project.target_date ?? "",
      timeline: project.timeline,
    });
  }, [project]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "client", id] });

  const projectMutation = useMutation({
    mutationFn: () =>
      saveProject({
        data: {
          id: project!.id,
          name: projectForm.name,
          status: projectForm.status,
          summary: projectForm.summary || null,
          target_date: projectForm.target_date || null,
          timeline: projectForm.timeline,
        },
      }),
    onSuccess: () => {
      toast.success("Project diperbarui.");
      void refresh();
    },
    onError: () => toast.error("Gagal memperbarui project."),
  });

  const messageMutation = useMutation({
    mutationFn: () => sendMessage({ data: { clientId: id, body: message } }),
    onSuccess: () => {
      setMessage("");
      toast.success("Pesan terkirim ke portal klien.");
      void refresh();
    },
    onError: () => toast.error("Gagal mengirim pesan."),
  });

  const documentMutation = useMutation({
    mutationFn: () =>
      addDocument({
        data: { clientId: id, title: docTitle, url: docUrl || null, kind: "document" },
      }),
    onSuccess: () => {
      setDocTitle("");
      setDocUrl("");
      toast.success("Dokumen ditambahkan.");
      void refresh();
    },
    onError: () => toast.error("Gagal menambahkan dokumen."),
  });

  if (workspace.isLoading) return <p className="text-sm text-muted-foreground">Memuat klien…</p>;
  if (workspace.error || !workspace.data) {
    return <p className="text-sm text-destructive">Klien tidak ditemukan.</p>;
  }

  const { client, documents, messages, invoices } = workspace.data;
  const portalUrl =
    typeof window !== "undefined" ? `${window.location.origin}/portal/${client.portal_token}` : "";

  return (
    <div className="space-y-6">
      <Link
        to="/admin/clients"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Semua klien
      </Link>

      <GlassCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight">{client.name}</h1>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {client.company || "-"} · {client.email}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {client.package ? <Chip>{client.package}</Chip> : null}
            <Chip className="border-primary/30 bg-primary/15 text-primary">{client.status}</Chip>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border/40 bg-card/30 px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{portalUrl}</span>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(portalUrl);
              toast.success("Link portal disalin.");
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-border/50 px-3 py-1.5 text-xs hover:bg-muted/20"
          >
            <Copy className="h-3.5 w-3.5" /> Salin link portal
          </button>
        </div>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <p className="text-sm font-medium">Project</p>
          {project ? (
            <div className="mt-4 space-y-3">
              <input
                className={inputClass}
                value={projectForm.name}
                onChange={(e) => setProjectForm((f) => ({ ...f, name: e.target.value }))}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  className={inputClass}
                  value={projectForm.status}
                  onChange={(e) =>
                    setProjectForm((f) => ({ ...f, status: e.target.value as ProjectStatus }))
                  }
                >
                  {PROJECT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  className={inputClass}
                  value={projectForm.target_date}
                  onChange={(e) =>
                    setProjectForm((f) => ({ ...f, target_date: e.target.value }))
                  }
                />
              </div>
              <textarea
                rows={3}
                className={inputClass}
                value={projectForm.summary}
                onChange={(e) => setProjectForm((f) => ({ ...f, summary: e.target.value }))}
              />

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Timeline · {timelineProgress(projectForm.timeline)}%
                </p>
                {projectForm.timeline.map((step, index) => (
                  <label
                    key={index}
                    className="flex items-start gap-3 rounded-2xl border border-border/40 bg-card/30 px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={step.done}
                      onChange={(e) =>
                        setProjectForm((f) => ({
                          ...f,
                          timeline: f.timeline.map((s, i) =>
                            i === index ? { ...s, done: e.target.checked } : s,
                          ),
                        }))
                      }
                      className="mt-1"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{step.title}</span>
                      <span className="block text-xs text-muted-foreground">{step.detail}</span>
                    </span>
                  </label>
                ))}
              </div>

              <button
                type="button"
                disabled={projectMutation.isPending}
                onClick={() => projectMutation.mutate()}
                className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                Simpan project
              </button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Belum ada project untuk klien ini.</p>
          )}
        </GlassCard>

        <div className="space-y-4">
          <GlassCard>
            <p className="text-sm font-medium">Pembayaran</p>
            <div className="mt-3 divide-y divide-border/40">
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada invoice.</p>
              ) : (
                invoices.map((inv) => (
                  <Link
                    key={inv.id}
                    to="/admin/invoices/$id"
                    params={{ id: inv.id }}
                    className="flex flex-wrap items-center gap-2 py-2 text-sm hover:opacity-80"
                  >
                    <span className="min-w-0 flex-1 truncate">{inv.number}</span>
                    <span className="tabular-nums">
                      {formatMoney(Number(inv.amount) || 0, inv.currency ?? "IDR")}
                    </span>
                    <Chip className={paymentStatusClass(inv.status)}>{inv.status}</Chip>
                  </Link>
                ))
              )}
            </div>
          </GlassCard>

          <GlassCard>
            <p className="text-sm font-medium">Dokumen</p>
            <ul className="mt-3 space-y-2">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{doc.title}</span>
                  <span className="text-xs text-muted-foreground">{doc.kind}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <input
                className={inputClass}
                placeholder="Judul dokumen"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="URL (opsional)"
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
              />
              <button
                type="button"
                disabled={!docTitle || documentMutation.isPending}
                onClick={() => documentMutation.mutate()}
                className="rounded-xl border border-border/50 px-3 py-2 text-sm hover:bg-muted/20 disabled:opacity-50"
              >
                Tambah
              </button>
            </div>
          </GlassCard>
        </div>
      </div>

      <GlassCard>
        <p className="text-sm font-medium">Messages</p>
        <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-2xl border px-3 py-2 text-sm ${
                msg.sender === "team"
                  ? "border-primary/30 bg-primary/10"
                  : "border-border/40 bg-card/30"
              }`}
            >
              <p className="text-xs text-muted-foreground">
                {msg.author_name ?? msg.sender} · {formatDate(msg.created_at)}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{msg.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            className={inputClass}
            placeholder="Tulis pesan untuk klien…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            type="button"
            disabled={!message || messageMutation.isPending}
            onClick={() => messageMutation.mutate()}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            <Send className="h-4 w-4" /> Kirim
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
