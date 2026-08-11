import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { getAdminAccess } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Business OS — KERJAKU" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Overview", exact: true },
  { to: "/admin/leads", label: "AI Lead CRM", exact: false },
  { to: "/admin/pipeline", label: "Sales Pipeline", exact: false },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const access = useServerFn(getAdminAccess);
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    let active = true;
    void access()
      .then((result) => {
        if (active) setState(result.isAdmin ? "ok" : "denied");
      })
      .catch(() => {
        if (active) setState("denied");
      });
    return () => {
      active = false;
    };
  }, [access]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-abyss text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/40 bg-background/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/admin" className="text-sm font-semibold tracking-tight">
            KERJAKU <span className="text-muted-foreground">Business OS</span>
          </Link>
          <nav className="flex flex-1 flex-wrap items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact }}
                activeProps={{ className: "bg-primary/15 text-primary" }}
                className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={signOut}
            className="rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
          >
            Keluar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {state === "loading" ? (
          <p className="text-sm text-muted-foreground">Memuat workspace…</p>
        ) : state === "denied" ? (
          <div className="rounded-3xl border border-border/40 bg-card/40 p-8 backdrop-blur-xl">
            <h1 className="text-lg font-semibold">Akses ditolak</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Akun ini belum memiliki role admin KERJAKU.
            </p>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
