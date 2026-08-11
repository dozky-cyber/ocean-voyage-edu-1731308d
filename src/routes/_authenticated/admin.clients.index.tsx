import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { Chip, GlassCard } from "@/components/admin/ui";
import { formatDate } from "@/lib/admin/pipeline";
import { getClients } from "@/lib/billing.functions";

export const Route = createFileRoute("/_authenticated/admin/clients/")({
  component: ClientsPage,
});

function ClientsPage() {
  const fetchClients = useServerFn(getClients);
  const list = useQuery({ queryKey: ["admin", "clients"], queryFn: () => fetchClients() });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lead yang sudah membayar otomatis menjadi klien dengan portal sendiri.
        </p>
      </div>

      <GlassCard>
        {list.isLoading ? (
          <p className="text-sm text-muted-foreground">Memuat klien…</p>
        ) : (list.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada klien. Konfirmasi pembayaran invoice untuk mengonversi lead.
          </p>
        ) : (
          <div className="divide-y divide-border/40">
            {(list.data ?? []).map((client) => (
              <Link
                key={client.id}
                to="/admin/clients/$id"
                params={{ id: client.id }}
                className="flex flex-wrap items-center gap-3 py-3 transition hover:opacity-80"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{client.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {client.company || client.email} · klien sejak {formatDate(client.converted_at)}
                  </p>
                </div>
                {client.package ? <Chip>{client.package}</Chip> : null}
                <Chip className="border-primary/30 bg-primary/15 text-primary">{client.status}</Chip>
              </Link>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
