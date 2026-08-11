import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Brain, MessageSquarePlus, Trash2 } from "lucide-react";

import { GlassCard } from "@/components/admin/ui";
import {
  createAssistantThread,
  deleteAssistantThread,
  listAssistantThreads,
} from "@/lib/assistant.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/assistant")({
  head: () => ({
    meta: [
      { title: "AI Business Assistant — KERJAKU" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AssistantLayout,
});

function AssistantLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const listThreads = useServerFn(listAssistantThreads);
  const createThread = useServerFn(createAssistantThread);
  const removeThread = useServerFn(deleteAssistantThread);
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const threads = useQuery({
    queryKey: ["assistant-threads"],
    queryFn: () => listThreads(),
  });

  async function newThread() {
    const thread = await createThread({ data: {} });
    await queryClient.invalidateQueries({ queryKey: ["assistant-threads"] });
    navigate({ to: "/admin/assistant/$threadId", params: { threadId: thread.id } });
  }

  async function remove(id: string) {
    await removeThread({ data: { id } });
    await queryClient.invalidateQueries({ queryKey: ["assistant-threads"] });
    if (pathname.includes(id)) navigate({ to: "/admin/assistant" });
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold tracking-tight">AI Business Assistant</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Asisten bisnis dengan memori jangka panjang — mengingat percakapan, keputusan, dan
            rekomendasi sebelumnya.
          </p>
        </div>
        <Link
          to="/admin/memory"
          className="inline-flex items-center gap-2 rounded-xl border border-border/50 px-3 py-2 text-xs font-medium text-muted-foreground transition hover:text-foreground"
        >
          <Brain className="h-4 w-4" /> Memory
        </Link>
        <button
          type="button"
          onClick={() => void newThread()}
          className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/15 px-3 py-2 text-xs font-medium text-primary transition hover:bg-primary/25"
        >
          <MessageSquarePlus className="h-4 w-4" /> Percakapan baru
        </button>
      </header>

      <div className="grid gap-5 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <GlassCard className="max-h-[70vh] overflow-y-auto p-3">
          <p className="px-2 pb-2 text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
            Riwayat percakapan
          </p>
          <div className="flex flex-col gap-1">
            {(threads.data ?? []).length === 0 ? (
              <p className="px-2 py-3 text-xs text-muted-foreground">Belum ada percakapan.</p>
            ) : null}
            {(threads.data ?? []).map((thread) => {
              const active = pathname.endsWith(thread.id);
              return (
                <div
                  key={thread.id}
                  className={cn(
                    "group flex items-center gap-1 rounded-xl px-2 py-1.5 transition",
                    active ? "bg-primary/15 text-primary" : "hover:bg-muted/20",
                  )}
                >
                  <Link
                    to="/admin/assistant/$threadId"
                    params={{ threadId: thread.id }}
                    className="min-w-0 flex-1 truncate text-xs font-medium"
                  >
                    {thread.title}
                  </Link>
                  <button
                    type="button"
                    aria-label="Hapus percakapan"
                    onClick={() => void remove(thread.id)}
                    className="shrink-0 rounded-lg p-1 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="min-w-0">
          <Outlet />
        </GlassCard>
      </div>
    </div>
  );
}
