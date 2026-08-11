import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { useMemo, useState } from "react";

import { Chip, GlassCard, SectionCard } from "@/components/admin/ui";
import {
  deleteLeadPermanently,
  getAdminLeads,
  setLeadArchiveState,
} from "@/lib/admin.functions";
import {
  PIPELINE_STAGES,
  formatDate,
  leadSourceLabel,
  normalizeStage,
  stageClass,
  temperatureClass,
} from "@/lib/admin/pipeline";

export const Route = createFileRoute("/_authenticated/admin/leads/")({
  component: LeadsPage,
});

function LeadsPage() {
  const fetchLeads = useServerFn(getAdminLeads);
  const queryClient = useQueryClient();
  const archiveFn = useServerFn(setLeadArchiveState);
  const deleteFn = useServerFn(deleteLeadPermanently);
  const [view, setView] = useState<"active" | "archived">("active");
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "leads"],
    queryFn: () => fetchLeads(),
  });
  const [search, setSearch] = useState("");
  const [temperature, setTemperature] = useState("all");
  const [stage, setStage] = useState("all");
  const [source, setSource] = useState("all");

  const leads = useMemo(() => {
    const rows = data ?? [];
    const q = search.trim().toLowerCase();
    return rows.filter((lead) => {
      if (view === "active" ? Boolean(lead.archived_at) : !lead.archived_at) return false;
      if (temperature !== "all" && lead.lead_temperature !== temperature) return false;
      if (stage !== "all" && normalizeStage(lead.status) !== stage) return false;
      if (source !== "all" && lead.lead_source !== source) return false;
      if (!q) return true;
      return [lead.name, lead.email, lead.whatsapp, lead.company, lead.business_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [data, search, temperature, stage, source, view]);

  const archive = useMutation({
    mutationFn: (input: { id: string; archived: boolean }) => archiveFn({ data: input }),
    onSuccess: async (_r, input) => {
      toast.success(input.archived ? "Lead diarsipkan." : "Lead dipulihkan.");
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui lead."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: async () => {
      toast.success("Lead dihapus permanen.");
      setPendingDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Gagal menghapus lead."),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Memuat leads…</p>;
  if (error) return <p className="text-sm text-destructive">Gagal memuat leads.</p>;

  const selectClass =
    "rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none focus:border-primary/60";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">AI Lead CRM</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {leads.length} dari {(data ?? []).length} lead ditampilkan.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          ["active", "Active Leads"],
          ["archived", "Archived Leads"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setView(value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              view === value
                ? "border-primary/50 bg-primary/20 text-primary"
                : "border-border/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <GlassCard className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, WhatsApp…"
            className="w-full rounded-xl border border-border/60 bg-background/40 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/60"
          />
        </div>
        <select
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
          className={selectClass}
        >
          <option value="all">Semua temperatur</option>
          <option value="Hot Lead">Hot Lead</option>
          <option value="Warm Lead">Warm Lead</option>
          <option value="Cold Lead">Cold Lead</option>
        </select>
        <select value={stage} onChange={(e) => setStage(e.target.value)} className={selectClass}>
          <option value="all">Semua stage</option>
          {PIPELINE_STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)} className={selectClass}>
          <option value="all">Semua sumber</option>
          <option value="ai_consultant">AI Consultant</option>
          <option value="manual_form">Manual Form</option>
        </select>
      </GlassCard>

      <SectionCard title="Leads" description="Klik baris untuk membuka lead workspace.">
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
            <thead>
              <tr className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                <th className="px-2 py-2 font-medium">Name</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Source</th>
                <th className="px-2 py-2 font-medium">Score</th>
                <th className="px-2 py-2 font-medium">Package</th>
                <th className="px-2 py-2 font-medium">Date</th>
                <th className="px-2 py-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-t border-border/30 transition hover:bg-background/40"
                >
                  <td className="max-w-[14rem] px-2 py-2.5">
                    <Link
                      to="/admin/leads/$id"
                      params={{ id: lead.id }}
                      className="block truncate font-medium hover:text-primary"
                    >
                      {lead.name}
                    </Link>
                    <span className="mt-1 inline-flex gap-2">
                      <Chip className={temperatureClass(lead.lead_temperature)}>
                        {lead.lead_temperature?.replace(" Lead", "")}
                      </Chip>
                      <span className="truncate text-[0.7rem] text-muted-foreground">
                        {lead.email}
                      </span>
                    </span>
                  </td>
                  <td className="px-2 py-2.5">
                    <Chip className={stageClass(normalizeStage(lead.status))}>
                      {normalizeStage(lead.status)}
                    </Chip>
                  </td>
                  <td className="px-2 py-2.5 text-xs text-muted-foreground">
                    {leadSourceLabel(lead.lead_source)}
                  </td>
                  <td className="px-2 py-2.5 text-xs">{lead.lead_score}</td>
                  <td className="max-w-[11rem] truncate px-2 py-2.5 text-xs text-primary">
                    {lead.ai_recommended_package || "-"}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5 text-xs text-muted-foreground">
                    {formatDate(lead.created_at)}
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <Link
                        to="/admin/leads/$id"
                        params={{ id: lead.id }}
                        className="rounded-lg border border-border/50 px-2 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                      >
                        Buka
                      </Link>
                      <button
                        type="button"
                        disabled={archive.isPending}
                        onClick={() =>
                          archive.mutate({ id: lead.id, archived: !lead.archived_at })
                        }
                        className="rounded-lg border border-border/50 px-2 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:opacity-60"
                      >
                        {lead.archived_at ? "Restore" : "Archive"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete({ id: lead.id, name: lead.name })}
                        className="rounded-lg border border-destructive/40 px-2 py-1 text-xs text-destructive transition hover:bg-destructive/10"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {leads.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Tidak ada lead yang cocok.</p>
        ) : null}
      </SectionCard>

      {pendingDelete ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-border/70 bg-card p-5 shadow-2xl">
            <p className="text-sm font-semibold">Apakah Anda yakin ingin menghapus lead ini?</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {pendingDelete.name} — percakapan, requirement preview, order brief version, dan
              delivery history akan ikut terhapus permanen.
            </p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-xl border border-border/60 px-3 py-2 text-xs text-muted-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() => remove.mutate(pendingDelete.id)}
                className="rounded-xl bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground disabled:opacity-60"
              >
                {remove.isPending ? "Menghapus…" : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
