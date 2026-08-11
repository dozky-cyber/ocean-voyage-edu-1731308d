import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { AssistantChat } from "@/components/admin/AssistantChat";
import { getAssistantThread } from "@/lib/assistant.functions";
import type { AssistantStoredMessage } from "@/lib/assistant/memory";

export const Route = createFileRoute("/_authenticated/admin/assistant/$threadId")({
  component: AssistantThreadPage,
});

function AssistantThreadPage() {
  const { threadId } = Route.useParams();
  const queryClient = useQueryClient();
  const loadThread = useServerFn(getAssistantThread);

  const thread = useQuery({
    queryKey: ["assistant-thread", threadId],
    queryFn: () => loadThread({ data: { id: threadId } }),
  });

  if (thread.isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Memuat percakapan…</p>;
  }
  if (!thread.data?.thread) {
    return <p className="p-6 text-sm text-muted-foreground">Percakapan tidak ditemukan.</p>;
  }

  return (
    <div className="p-4 sm:p-5">
      <AssistantChat
        key={threadId}
        threadId={threadId}
        initialMessages={(thread.data.messages ?? []) as AssistantStoredMessage[]}
        onExchange={() => {
          void queryClient.invalidateQueries({ queryKey: ["assistant-threads"] });
          void queryClient.invalidateQueries({ queryKey: ["assistant-memories"] });
        }}
      />
    </div>
  );
}
