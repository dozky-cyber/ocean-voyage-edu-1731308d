import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";

import { Chip, GlassCard } from "@/components/admin/ui";
import { getAdminLeads } from "@/lib/admin.functions";
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
      if (temperature !== "all" && lead.lead_temperature !== temperature) return false;
      if (stage !== "all" && normalizeStage(lead.status) !== stage) return false;
      if (source !== "all" && lead.lead_source !== source) return false;
      if (!q) return true;
      return [lead.name, lead.email, lead.whatsapp, lead.company, lead.business_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [data, search, temperature, stage, source]);

  if (isLoading) return <p className="text-sm text-muted-foreground">Memuat leads…</p>;
  if (error) return <p className="text-sm text-destructive">Gagal memuat leads.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Lead CRM</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {leads.length} dari {(data ?? []).length} lead ditampilkan.
        </p>
      </div>

      <GlassCard className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama, email, WhatsApp…"
          className="min-w-52 flex-1 rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none focus:border-primary/60"
        />
        <select
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
          className="rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none"
        >
          <option value="all">Semua temperatur</option>
          <option value="Hot Lead">Hot Lead</option>
          <option value="Warm Lead">Warm Lead</option>
          <option value="Cold Lead">Cold Lead</option>
        </select>
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          className="rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none"
        >
          <option value="all">Semua stage</option>
          {PIPELINE_STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none"
        >
          <option value="all">Semua sumber</option>
          <option value="ai_consultant">AI Consultant</option>
          <option value="manual_form">Manual Form</option>
        </select>
      </GlassCard>

      <div className="space-y-2">
        {leads.map((lead) => (
          <Link
            key={lead.id}
            to="/admin/leads/$id"
            params={{ id: lead.id }}
            className="block rounded-2xl border border-border/40 bg-card/40 p-4 backdrop-blur-xl transition hover:border-primary/40"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold">{lead.name}</span>
              <Chip className={temperatureClass(lead.lead_temperature)}>
                {lead.lead_temperature}
              </Chip>
              <Chip className={stageClass(normalizeStage(lead.status))}>
                {normalizeStage(lead.status)}
              </Chip>
              <span className="ml-auto text-xs text-muted-foreground">
                {formatDate(lead.created_at)}
              </span>
            </div>
            <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
              <span className="truncate">{lead.email}</span>
              <span>{lead.whatsapp}</span>
              <span className="truncate">
                {lead.company || lead.business_name || lead.project_type}
              </span>
              <span>
                {leadSourceLabel(lead.lead_source)} · skor {lead.lead_score}
              </span>
            </div>
            {lead.ai_recommended_package ? (
              <p className="mt-2 text-xs text-primary">
                AI: {lead.ai_recommended_package}
                {lead.ai_business_category ? ` · ${lead.ai_business_category}` : ""}
              </p>
            ) : null}
          </Link>
        ))}
        {leads.length === 0 ? (
          <GlassCard>
            <p className="text-sm text-muted-foreground">Tidak ada lead yang cocok.</p>
          </GlassCard>
        ) : null}
      </div>
    </div>
  );
}
