import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Chip, GlassCard, SectionCard } from "@/components/admin/ui";
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
                  <td className="px-2 py-2.5 text-right">
                    <Link
                      to="/admin/leads/$id"
                      params={{ id: lead.id }}
                      className="rounded-lg border border-border/50 px-2 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                    >
                      Buka
                    </Link>
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
    </div>
  );
}
