import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { BarList, Chip, GlassCard, Kpi } from "@/components/admin/ui";
import { getAdminOverview } from "@/lib/admin.functions";
import { formatDate, leadSourceLabel, temperatureClass } from "@/lib/admin/pipeline";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: OverviewPage,
});

function OverviewPage() {
  const fetchOverview = useServerFn(getAdminOverview);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => fetchOverview(),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Memuat analitik…</p>;
  if (error || !data)
    return <p className="text-sm text-destructive">Gagal memuat analitik bisnis.</p>;

  const conversion = data.totalLeads
    ? Number(((data.hot / data.totalLeads) * 100).toFixed(1))
    : 0;
  const maxMonth = Math.max(1, ...data.monthly.map((m) => m.leads));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Business Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ringkasan performa lead, sumber, dan minat paket KERJAKU.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total Leads" value={data.totalLeads} />
        <Kpi label="Hot Leads" value={data.hot} hint={`${conversion}% dari total`} />
        <Kpi label="AI Conversations" value={data.aiLeads} hint={`${data.aiConversionRate}% via AI`} />
        <Kpi label="Rata-rata Skor" value={data.averageScore} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <BarList
          title="Kualifikasi Lead"
          items={[
            { label: "Hot Lead", value: data.hot },
            { label: "Warm Lead", value: data.warm },
            { label: "Cold Lead", value: data.cold },
          ]}
        />
        <BarList
          title="Lead Source"
          items={data.sources.map((s) => ({ label: s.source, value: s.count }))}
        />
        <BarList
          title="Paket Paling Diminati"
          items={data.packages.map((p) => ({ label: p.name, value: p.count }))}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <p className="text-sm font-medium">Tren Bulanan</p>
          <div className="mt-6 flex h-40 items-end gap-2">
            {data.monthly.length === 0 ? (
              <p className="text-xs text-muted-foreground">Belum ada data.</p>
            ) : (
              data.monthly.map((m) => (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-32 w-full items-end justify-center">
                    <div
                      className="w-full max-w-8 rounded-t-md bg-primary/60"
                      style={{ height: `${(m.leads / maxMonth) * 100}%` }}
                      title={`${m.leads} leads`}
                    />
                  </div>
                  <span className="text-[0.6rem] text-muted-foreground">{m.month.slice(5)}</span>
                </div>
              ))
            )}
          </div>
        </GlassCard>
        <BarList
          title="Kategori Bisnis"
          items={data.categories.map((c) => ({ label: c.name, value: c.count }))}
        />
      </div>

      <GlassCard>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Lead Terbaru</p>
          <Link to="/admin/leads" className="text-xs text-primary hover:underline">
            Lihat semua
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {data.recent.map((lead) => (
            <Link
              key={lead.id}
              to="/admin/leads/$id"
              params={{ id: lead.id }}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/30 bg-background/30 px-4 py-3 transition hover:border-primary/40"
            >
              <span className="text-sm font-medium">{lead.name}</span>
              <Chip className={temperatureClass(lead.lead_temperature)}>
                {lead.lead_temperature}
              </Chip>
              <span className="text-xs text-muted-foreground">
                {leadSourceLabel(lead.lead_source)}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">
                {formatDate(lead.created_at)}
              </span>
            </Link>
          ))}
          {data.recent.length === 0 ? (
            <p className="text-xs text-muted-foreground">Belum ada lead.</p>
          ) : null}
        </div>
      </GlassCard>
    </div>
  );
}
