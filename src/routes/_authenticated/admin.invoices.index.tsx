import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, CreditCard, Users, Wallet } from "lucide-react";

import { BarList, Chip, GlassCard, Kpi } from "@/components/admin/ui";
import { formatDate } from "@/lib/admin/pipeline";
import {
  formatMoney,
  paymentStatusClass,
  providerLabel,
} from "@/lib/admin/payments";
import { getBillingOverview, getInvoices, getPaymentProviderStatus } from "@/lib/billing.functions";

export const Route = createFileRoute("/_authenticated/admin/invoices/")({
  component: InvoicesPage,
});

function InvoicesPage() {
  const fetchInvoices = useServerFn(getInvoices);
  const fetchOverview = useServerFn(getBillingOverview);
  const fetchProviders = useServerFn(getPaymentProviderStatus);

  const list = useQuery({ queryKey: ["admin", "invoices"], queryFn: () => fetchInvoices() });
  const stats = useQuery({ queryKey: ["admin", "billing"], queryFn: () => fetchOverview() });
  const providers = useQuery({
    queryKey: ["admin", "payment-providers"],
    queryFn: () => fetchProviders(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payments & Invoices</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Approved proposal → invoice → pembayaran → klien aktif dengan portal.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total Invoice" value={stats.data?.invoices ?? 0} icon={CreditCard} />
        <Kpi
          label="Terbayar"
          value={formatMoney(stats.data?.paidAmount ?? 0)}
          hint={`${stats.data?.paid ?? 0} invoice`}
          icon={CheckCircle2}
          tone="primary"
        />
        <Kpi
          label="Outstanding"
          value={formatMoney(stats.data?.outstandingAmount ?? 0)}
          hint={`${stats.data?.pending ?? 0} menunggu`}
          icon={Wallet}
        />
        <Kpi
          label="Klien Aktif"
          value={stats.data?.clients ?? 0}
          hint={`${stats.data?.conversionRate ?? 0}% invoice terbayar`}
          icon={Users}
          tone="primary"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarList
          title="Status Pembayaran"
          items={(stats.data?.byStatus ?? []).map((s) => ({ label: s.status, value: s.count }))}
        />
        <GlassCard>
          <p className="text-sm font-medium">Payment Provider</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Layer integrasi siap; aktif otomatis begitu kredensial tersedia.
          </p>
          <ul className="mt-4 space-y-2">
            {(providers.data ?? []).map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/40 bg-card/30 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">{p.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.description}</p>
                </div>
                <Chip
                  className={
                    p.configured
                      ? "border-primary/30 bg-primary/15 text-primary"
                      : "border-border/60 bg-secondary/40 text-muted-foreground"
                  }
                >
                  {p.configured ? "Siap" : "Belum aktif"}
                </Chip>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>

      <GlassCard>
        {list.isLoading ? (
          <p className="text-sm text-muted-foreground">Memuat invoice…</p>
        ) : list.error ? (
          <p className="text-sm text-destructive">Gagal memuat invoice.</p>
        ) : (list.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada invoice. Buka proposal yang sudah Approved lalu klik “Buat Invoice”.
          </p>
        ) : (
          <div className="divide-y divide-border/40">
            {(list.data ?? []).map((inv) => (
              <Link
                key={inv.id}
                to="/admin/invoices/$id"
                params={{ id: inv.id }}
                className="flex flex-wrap items-center gap-3 py-3 transition hover:opacity-80"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {inv.number} · {inv.client_name ?? "Tanpa nama"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {providerLabel(inv.provider)} · jatuh tempo {inv.due_date ?? "-"} · dibuat{" "}
                    {formatDate(inv.created_at)}
                  </p>
                </div>
                <span className="text-sm tabular-nums">
                  {formatMoney(Number(inv.amount) || 0, inv.currency ?? "IDR")}
                </span>
                <Chip className={paymentStatusClass(inv.status)}>{inv.status}</Chip>
              </Link>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
