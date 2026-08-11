import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { SectionCard } from "@/components/admin/ui";
import { supabase } from "@/integrations/supabase/client";
import { getAdminAccess } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const access = useServerFn(getAdminAccess);
  const { data } = useQuery({
    queryKey: ["admin", "access"],
    queryFn: () => access(),
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Akun dan preferensi workspace.</p>
      </div>

      <SectionCard title="Akun" description="Sesi admin yang sedang aktif.">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
              Role
            </dt>
            <dd className="mt-1 text-sm">{data?.isAdmin ? "Admin" : "—"}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
              User ID
            </dt>
            <dd className="mt-1 break-all text-sm">{data?.userId ?? "—"}</dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard title="Sesi" description="Keluar dari Business OS pada perangkat ini.">
        <button
          type="button"
          onClick={signOut}
          className="rounded-xl border border-border/60 px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          Logout
        </button>
      </SectionCard>
    </div>
  );
}
