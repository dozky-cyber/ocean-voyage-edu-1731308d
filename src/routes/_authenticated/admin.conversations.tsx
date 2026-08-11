import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { GlassCard } from "@/components/admin/ui";
import {
  listAiConversations,
  setAiConversationStatus,
  type AiConversationRow,
} from "@/lib/ai-conversation.functions";
import { cn } from "@/lib/utils";

type Filter = "all" | "draft" | "qualified_lead" | "closed";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "draft", label: "Draft" },
  { key: "qualified_lead", label: "Qualified" },
  { key: "closed", label: "Closed" },
];

export const Route = createFileRoute("/_authenticated/admin/conversations")({
  head: () => ({
    meta: [
      { title: "AI Conversations — KERJAKU" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ConversationsPage,
});

function ConversationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const list = useServerFn(listAiConversations);
  const setStatus = useServerFn(setAiConversationStatus);

  const conversations = useQuery({
    queryKey: ["ai-conversations", filter],
    queryFn: () => list({ data: { status: filter } }),
  });

  async function close(id: string) {
    try {
      await setStatus({ data: { id, status: "closed" } });
      await queryClient.invalidateQueries({ queryKey: ["ai-conversations"] });
      toast.success("Conversation ditandai closed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui status.");
    }
  }

  const rows = conversations.data?.conversations ?? [];

  return (
    <div className="space-y-5 p-4 sm:p-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">AI Conversations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Percakapan AI Consultant. Draft belum dihitung sebagai lead — hanya conversation
          qualified yang masuk ke Lead CRM.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs transition-colors",
              filter === item.key
                ? "border-primary/60 bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {conversations.isLoading && <p className="text-sm text-muted-foreground">Memuat…</p>}
      {!conversations.isLoading && rows.length === 0 && (
        <p className="text-sm text-muted-foreground">Belum ada percakapan.</p>
      )}

      <div className="grid gap-3">
        {rows.map((row) => (
          <ConversationCard
            key={row.id}
            row={row}
            open={openId === row.id}
            onToggle={() => setOpenId(openId === row.id ? null : row.id)}
            onClose={() => close(row.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ConversationCard({
  row,
  open,
  onToggle,
  onClose,
}: {
  row: AiConversationRow;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const qualified = row.status === "qualified_lead";
  return (
    <GlassCard className="p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            {row.business_category || "Belum teridentifikasi"}
          </p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {row.summary || "Percakapan masih berjalan / belum ada ringkasan."}
          </p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {row.message_count} pesan · intent {row.intent} · score {row.score}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[11px]",
            qualified
              ? "border-primary/50 bg-primary/10 text-primary"
              : "border-border text-muted-foreground",
          )}
        >
          {row.status}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        <button type="button" onClick={onToggle} className="text-primary hover:underline">
          {open ? "Sembunyikan transcript" : "Lihat transcript"}
        </button>
        {row.lead_id && (
          <Link
            to="/admin/leads/$id"
            params={{ id: row.lead_id }}
            className="text-primary hover:underline"
          >
            Buka lead
          </Link>
        )}
        {row.status !== "closed" && (
          <button type="button" onClick={onClose} className="text-muted-foreground hover:underline">
            Tandai closed
          </button>
        )}
      </div>

      {row.status === "qualified_lead" && <RequirementPreviewPanel conversationId={row.id} />}

      {open && (
        <div className="mt-4 max-h-80 space-y-3 overflow-y-auto rounded-2xl border border-border/70 bg-card/40 p-3">
          {(row.messages ?? []).map((message, index) => (
            <div key={index} className="text-xs">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {message.role === "user" ? "User" : "AI"}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-foreground">{message.text}</p>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
