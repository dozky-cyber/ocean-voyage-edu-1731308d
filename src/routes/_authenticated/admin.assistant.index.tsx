import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";

import { createAssistantThread, listAssistantThreads } from "@/lib/assistant.functions";

export const Route = createFileRoute("/_authenticated/admin/assistant/")({
  component: AssistantIndex,
});

function AssistantIndex() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const listThreads = useServerFn(listAssistantThreads);
  const createThread = useServerFn(createAssistantThread);

  const threads = useQuery({ queryKey: ["assistant-threads"], queryFn: () => listThreads() });

  useEffect(() => {
    if (!threads.isSuccess) return;
    const existing = threads.data?.[0];
    if (existing) {
      navigate({
        to: "/admin/assistant/$threadId",
        params: { threadId: existing.id },
        replace: true,
      });
      return;
    }
    let cancelled = false;
    void createThread({ data: {} }).then(async (thread) => {
      if (cancelled) return;
      await queryClient.invalidateQueries({ queryKey: ["assistant-threads"] });
      navigate({
        to: "/admin/assistant/$threadId",
        params: { threadId: thread.id },
        replace: true,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [threads.isSuccess, threads.data, navigate, createThread, queryClient]);

  return <p className="p-6 text-sm text-muted-foreground">Menyiapkan percakapan…</p>;
}
