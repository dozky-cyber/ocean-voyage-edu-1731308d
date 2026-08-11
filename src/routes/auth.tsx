import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { provisionWorkspaceAccess } from "@/lib/admin.functions";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Masuk — KERJAKU Business OS" },
      { name: "description", content: "Area internal KERJAKU. Khusus tim." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Masuk — KERJAKU Business OS" },
      { property: "og:description", content: "Area internal KERJAKU. Khusus tim." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const provision = useServerFn(provisionWorkspaceAccess);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Grants the workspace role only when the account is on the approved team list.
      await provision().catch(() => undefined);
      navigate({ to: "/admin", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal masuk.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-abyss px-4 py-16">
      <div className="w-full max-w-sm rounded-3xl border border-border/40 bg-card/40 p-8 shadow-2xl backdrop-blur-xl">
        <p className="text-[0.65rem] uppercase tracking-[0.35em] text-muted-foreground">
          KERJAKU Business OS
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-foreground">Masuk workspace</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Area internal. Hanya akun tim yang sudah disetujui yang dapat masuk.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-medium text-muted-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-background/40 px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary/60"
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-medium text-muted-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-background/40 px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary/60"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Memproses…" : "Masuk"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Pendaftaran publik dinonaktifkan. Hubungi owner KERJAKU untuk mendapatkan akses.
        </p>
      </div>
    </main>
  );
}

