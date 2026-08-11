import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Chip, GlassCard } from "@/components/admin/ui";
import {
  deleteProposalFn,
  duplicateProposalFn,
  getProposal,
  saveProposalFn,
  setProposalStatusFn,
} from "@/lib/admin.functions";
import { formatDate } from "@/lib/admin/pipeline";
import {
  PROPOSAL_STATUSES,
  parseSections,
  proposalStatusClass,
  type ProposalSection,
  type ProposalStatus,
} from "@/lib/admin/sales-ai";

export const Route = createFileRoute("/_authenticated/admin/proposals/$id")({
  component: ProposalDetailPage,
});

function ProposalDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const fetchProposal = useServerFn(getProposal);
  const save = useServerFn(saveProposalFn);
  const setStatus = useServerFn(setProposalStatusFn);
  const duplicate = useServerFn(duplicateProposalFn);
  const remove = useServerFn(deleteProposalFn);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "proposal", id],
    queryFn: () => fetchProposal({ data: { id } }),
  });

  const [title, setTitle] = useState("");
  const [pkg, setPkg] = useState("");
  const [sections, setSections] = useState<ProposalSection[]>([]);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!data) return;
    setTitle(data.title);
    setPkg(data.recommended_package ?? "");
    setSections(parseSections(data.content));
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      save({ data: { id, title, recommended_package: pkg || null, content: sections } }),
    onSuccess: async () => {
      toast.success("Proposal disimpan.");
      setEditing(false);
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: () => toast.error("Gagal menyimpan proposal."),
  });

  const statusMutation = useMutation({
    mutationFn: (status: ProposalStatus) => setStatus({ data: { id, status } }),
    onSuccess: async () => {
      toast.success("Status proposal diperbarui.");
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: () => toast.error("Gagal memperbarui status."),
  });

  const duplicateMutation = useMutation({
    mutationFn: () => duplicate({ data: { id } }),
    onSuccess: async (result) => {
      toast.success("Proposal diduplikasi.");
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      navigate({ to: "/admin/proposals/$id", params: { id: result.id } });
    },
    onError: () => toast.error("Gagal menduplikasi proposal."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => remove({ data: { id } }),
    onSuccess: async () => {
      toast.success("Proposal dihapus.");
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      navigate({ to: "/admin/proposals" });
    },
    onError: () => toast.error("Gagal menghapus proposal."),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Memuat proposal…</p>;
  if (error || !data) return <p className="text-sm text-destructive">Proposal tidak ditemukan.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <Link
          to="/admin/proposals"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Semua proposal
        </Link>
        <Link
          to="/admin/leads/$id"
          params={{ id: data.lead_id }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Lihat lead
        </Link>
        <Chip className={proposalStatusClass(data.status)}>{data.status}</Chip>
      </div>

      <GlassCard className="print:hidden">
        <p className="text-sm font-medium">Proposal Management</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {PROPOSAL_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate(s)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-60 ${
                s === data.status
                  ? "border-primary/50 bg-primary/20 text-primary"
                  : "border-border/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="rounded-xl border border-border/60 px-3 py-1.5 text-xs transition hover:text-foreground"
          >
            {editing ? "Selesai edit" : "Edit proposal"}
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {saveMutation.isPending ? "Menyimpan…" : "Simpan"}
          </button>
          <button
            type="button"
            onClick={() => duplicateMutation.mutate()}
            disabled={duplicateMutation.isPending}
            className="rounded-xl border border-border/60 px-3 py-1.5 text-xs transition hover:text-foreground"
          >
            Duplikasi
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl border border-border/60 px-3 py-1.5 text-xs transition hover:text-foreground"
          >
            Export PDF
          </button>
          <a
            href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(
              sections.map((s) => `${s.heading}\n${s.body}`).join("\n\n"),
            )}`}
            className="rounded-xl border border-border/60 px-3 py-1.5 text-xs transition hover:text-foreground"
          >
            Kirim via email
          </a>
          <button
            type="button"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="rounded-xl border border-destructive/40 px-3 py-1.5 text-xs text-destructive transition hover:bg-destructive/10"
          >
            Hapus
          </button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Dibuat {formatDate(data.created_at)} · diperbarui {formatDate(data.updated_at)}
          {data.sent_at ? ` · dikirim ${formatDate(data.sent_at)}` : ""}
        </p>
      </GlassCard>

      <div className="overflow-hidden rounded-3xl border border-border/40 bg-card/40 backdrop-blur-xl">
        <div className="border-b border-border/40 bg-background/40 px-6 py-8 sm:px-10">
          <p className="text-[0.65rem] uppercase tracking-[0.35em] text-primary">KERJAKU</p>
          {editing ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-3 w-full rounded-xl border border-border/60 bg-background/40 p-2 text-lg font-semibold outline-none focus:border-primary/60"
            />
          ) : (
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>Digital Solution Proposal</span>
            <span>·</span>
            {editing ? (
              <input
                value={pkg}
                onChange={(e) => setPkg(e.target.value)}
                placeholder="Recommended package"
                className="rounded-lg border border-border/60 bg-background/40 px-2 py-1 outline-none focus:border-primary/60"
              />
            ) : (
              <span className="text-primary">{pkg || "-"}</span>
            )}
          </div>
        </div>

        <div className="space-y-6 px-6 py-8 sm:px-10">
          {sections.map((section, index) => (
            <section key={index}>
              {editing ? (
                <input
                  value={section.heading}
                  onChange={(e) =>
                    setSections((prev) =>
                      prev.map((s, i) => (i === index ? { ...s, heading: e.target.value } : s)),
                    )
                  }
                  className="w-full rounded-xl border border-border/60 bg-background/40 p-2 text-sm font-semibold outline-none focus:border-primary/60"
                />
              ) : (
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  {section.heading}
                </h2>
              )}
              {editing ? (
                <textarea
                  value={section.body}
                  rows={Math.min(14, Math.max(3, section.body.split("\n").length + 1))}
                  onChange={(e) =>
                    setSections((prev) =>
                      prev.map((s, i) => (i === index ? { ...s, body: e.target.value } : s)),
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-border/60 bg-background/40 p-3 text-sm outline-none focus:border-primary/60"
                />
              ) : (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {section.body}
                </p>
              )}
            </section>
          ))}
        </div>

        <div className="border-t border-border/40 px-6 py-6 text-xs text-muted-foreground sm:px-10">
          KERJAKU · Work, made your way. · kerjaku.space
        </div>
      </div>
    </div>
  );
}
