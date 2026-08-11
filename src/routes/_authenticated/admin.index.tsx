import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Bot,
  FileText,
  Flame,
  KanbanSquare,
  Plus,
  Sparkle,
  TrendingUp,
  Users,
} from "lucide-react";

import { BarRows, Chip, Funnel, Kpi, SectionCard } from "@/components/admin/ui";
import { getAdminOverview, getProposalAnalytics } from "@/lib/admin.functions";
import {
  formatDate,
  leadSourceLabel,
  normalizeStage,
  stageClass,
  temperatureClass,
} from "@/lib/admin/pipeline";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: OverviewPage,
});

const QUICK_ACTIONS = [
  { label: "New Lead", to: "/", icon: Plus, hint: "form publik" },
  { label: "View Leads", to: "/admin/leads", icon: Users },
  { label: "Sales Pipeline", to: "/admin/pipeline", icon: KanbanSquare },
  { label: "Generate Proposal", to: "/admin/proposals", icon: FileText },
  { label: "Ask AI", to: "/admin/leads", icon: Bot, hint: "pilih lead" },
] as const;

function OverviewPage() {
  const fetchOverview = useServerFn(getAdminOverview);
  const fetchProposalStats = useServerFn(getProposalAnalytics);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => fetchOverview(),
  });
  const proposalStats = useQuery({
    queryKey: ["admin", "proposal-analytics"],
    queryFn: () => fetchProposalStats(),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Memuat analitik…</p>;
  if (error || !data)
    return <p className="text-sm text-destructive">Gagal memuat analitik bisnis.</p>;

  const conversion = data.totalLeads
    ? Number(((data.hot / data.totalLeads) * 100).toFixed(1))
    : 0;
  const maxMonth = Math.max(1, ...data.monthly.map((m) => m.leads));
  const stageCount = (stage: string) =>
    data.stageCounts.find((s) => s.stage === stage)?.count ?? 0;
  const closed = stageCount("Completed") + stageCount("Payment");


  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ringkasan performa lead, sumber, dan konversi KERJAKU.
          </p>
        </div>
        <Chip className="shrink-0 border-primary/30 bg-primary/10 text-primary">
          {data.totalLeads} lead
        </Chip>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="Total Leads" value={data.totalLeads} icon={Users} />
        <Kpi
          label="Hot Leads"
          value={data.hot}
          hint={`${conversion}% dari total`}
          icon={Flame}
          tone="hot"
        />
        <Kpi
          label="AI Conversations"
          value={data.aiLeads}
          hint={`${data.aiConversionRate}% via AI`}
          icon={Bot}
          tone="primary"
        />
        <Kpi
          label="Proposal Conversion"
          value={`${proposalStats.data?.conversionRate ?? 0}%`}
          hint={`${proposalStats.data?.approved ?? 0} approved`}
          icon={FileText}
          tone="primary"
        />
        <Kpi
          label="Rata-rata Skor"
          value={data.averageScore}
          hint="lead scoring 10–50"
          icon={TrendingUp}
        />
      </div>

      <SectionCard title="Quick Actions" description="Aksi cepat harian.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className="flex items-center gap-2 rounded-2xl border border-border/40 bg-background/40 px-3 py-2.5 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            >
              <action.icon className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0 truncate">{action.label}</span>
            </Link>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Lead Funnel" description="Perjalanan visitor sampai closing.">
          <Funnel
            steps={[
              { label: "Visitor", value: null, hint: "sesi dilacak di GA4" },
              { label: "AI Chat", value: data.aiLeads },
              { label: "Consultation", value: data.totalLeads },
              { label: "Proposal", value: proposalStats.data?.total ?? 0 },
              { label: "Closed", value: closed },
            ]}
          />
        </SectionCard>

        <SectionCard title="Lead Source Performance" description="Manual Form vs AI Consultant.">
          <BarRows items={data.sources.map((s) => ({ label: s.source, value: s.count }))} />
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Monthly Lead Trend" className="lg:col-span-2">
          <div className="flex h-40 items-end gap-2">
            {data.monthly.length === 0 ? (
              <p className="text-xs text-muted-foreground">Belum ada data.</p>
            ) : (
              data.monthly.map((m) => (
                <div key={m.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div className="flex h-32 w-full items-end justify-center">
                    <div
                      className="w-full max-w-8 rounded-t-md bg-gradient-to-t from-primary/30 to-primary/80"
                      style={{ height: `${(m.leads / maxMonth) * 100}%` }}
                      title={`${m.leads} leads`}
                    />
                  </div>
                  <span className="text-[0.6rem] text-muted-foreground">{m.month.slice(5)}</span>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Package Interest">
          <BarRows items={data.packages.map((p) => ({ label: p.name, value: p.count }))} />
        </SectionCard>
      </div>

      <SectionCard
        title="Recent Leads"
        action={
          <Link to="/admin/leads" className="text-xs text-primary hover:underline">
            Lihat semua
          </Link>
        }
      >
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
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
              {data.recent.map((lead) => (
                <tr key={lead.id} className="border-t border-border/30">
                  <td className="max-w-[12rem] truncate px-2 py-2.5">
                    <span className="font-medium">{lead.name}</span>
                    <span className="ml-2">
                      <Chip className={temperatureClass(lead.lead_temperature)}>
                        {lead.lead_temperature?.replace(" Lead", "")}
                      </Chip>
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
                  <td className="max-w-[10rem] truncate px-2 py-2.5 text-xs text-primary">
                    {lead.ai_recommended_package || "-"}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5 text-xs text-muted-foreground">
                    {formatDate(lead.created_at)}
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <Link
                      to="/admin/leads/$id"
                      params={{ id: lead.id }}
                      className="inline-flex items-center gap-1 rounded-lg border border-border/50 px-2 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                    >
                      <Sparkle className="h-3 w-3" /> Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.recent.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">Belum ada lead.</p>
        ) : null}
      </SectionCard>
    </div>
  );
}
