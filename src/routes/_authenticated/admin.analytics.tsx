import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { BarRows, Kpi, SectionCard } from "@/components/admin/ui";
import { getAdminOverview, getProposalAnalytics } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Business Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Detail kualifikasi lead, kategori bisnis, dan performa proposal.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Proposal Dibuat" value={proposalStats.data?.total ?? 0} />
        <Kpi
          label="Proposal Conversion"
          value={`${proposalStats.data?.conversionRate ?? 0}%`}
          hint={`${proposalStats.data?.approved ?? 0} approved`}
        />
        <Kpi label="Paket Tersukses" value={proposalStats.data?.topPackage ?? "-"} />
        <Kpi
          label="Lead → Proposal"
          value={`${proposalStats.data?.avgLeadToProposalHours ?? 0} jam`}
          hint="rata-rata waktu"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Kualifikasi Lead">
          <BarRows
            items={[
              { label: "Hot Lead", value: data.hot },
              { label: "Warm Lead", value: data.warm },
              { label: "Cold Lead", value: data.cold },
            ]}
          />
        </SectionCard>
        <SectionCard title="Pipeline Stage">
          <BarRows items={data.stageCounts.map((s) => ({ label: s.stage, value: s.count }))} />
        </SectionCard>
        <SectionCard title="Kategori Bisnis">
          <BarRows items={data.categories.map((c) => ({ label: c.name, value: c.count }))} />
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Paket Paling Diminati">
          <BarRows items={data.packages.map((p) => ({ label: p.name, value: p.count }))} />
        </SectionCard>
        <SectionCard title="Proposal per Status">
          <BarRows
            items={(proposalStats.data?.byStatus ?? []).map((s) => ({
              label: s.status,
              value: s.count,
            }))}
          />
        </SectionCard>
      </div>
    </div>
  );
}
