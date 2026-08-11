import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { BarList, Chip, GlassCard, Kpi } from "@/components/admin/ui";
import { getProposalAnalytics, getProposals } from "@/lib/admin.functions";
import { formatDate } from "@/lib/admin/pipeline";
import { proposalStatusClass } from "@/lib/admin/sales-ai";

export const Route = createFileRoute("/_authenticated/admin/proposals/")({
  component: ProposalsPage,
});

function ProposalsPage() {
  const fetchProposals = useServerFn(getProposals);
  const fetchAnalytics = useServerFn(getProposalAnalytics);

  const list = useQuery({ queryKey: ["admin", "proposals"], queryFn: () => fetchProposals() });
  const stats = useQuery({
    queryKey: ["admin", "proposal-analytics"],
    queryFn: () => fetchAnalytics(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Proposal Generator</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Semua proposal yang dibuat dari data CRM KERJAKU.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total Proposal" value={stats.data?.total ?? 0} />
        <Kpi
          label="Conversion Rate"
          value={`${stats.data?.conversionRate ?? 0}%`}
          hint={`${stats.data?.approved ?? 0} approved`}
        />
        <Kpi label="Paket Tersukses" value={stats.data?.topPackage ?? "-"} />
        <Kpi
          label="Lead → Proposal"
          value={`${stats.data?.avgLeadToProposalHours ?? 0} jam`}
          hint="rata-rata waktu"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarList
          title="Status Proposal"
          items={(stats.data?.byStatus ?? []).map((s) => ({ label: s.status, value: s.count }))}
        />
        <BarList
          title="Paket pada Proposal"
          items={(stats.data?.packages ?? []).map((p) => ({ label: p.name, value: p.count }))}
        />
      </div>

      <GlassCard>
        {list.isLoading ? (
          <p className="text-sm text-muted-foreground">Memuat proposal…</p>
        ) : list.error ? (
          <p className="text-sm text-destructive">Gagal memuat proposal.</p>
        ) : (list.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada proposal. Buka salah satu lead lalu klik “Generate Proposal”.
          </p>
        ) : (
          <div className="divide-y divide-border/40">
            {(list.data ?? []).map((p) => (
              <Link
                key={p.id}
                to="/admin/proposals/$id"
                params={{ id: p.id }}
                className="flex flex-wrap items-center gap-3 py-3 transition hover:opacity-80"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {p.recommended_package || "-"} · dibuat {formatDate(p.created_at)}
                  </p>
                </div>
                <Chip className={proposalStatusClass(p.status)}>{p.status}</Chip>
              </Link>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
