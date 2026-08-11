import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bell, CheckCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  NOTIFICATION_LABELS,
  loadReadIds,
  notificationToneClass,
  saveReadIds,
} from "@/lib/admin/search";
import { getWorkspaceNotifications } from "@/lib/workspace.functions";
import { cn } from "@/lib/utils";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (Number.isNaN(mins)) return "-";
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} mnt lalu`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.round(hours / 24)} hari lalu`;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const fetchNotifications = useServerFn(getWorkspaceNotifications);
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [tab, setTab] = useState<"unread" | "all">("unread");
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setReadIds(loadReadIds()), []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const { data } = useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: () => fetchNotifications(),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const items = useMemo(() => data ?? [], [data]);
  const readSet = useMemo(() => new Set(readIds), [readIds]);
  const unreadCount = items.filter((n) => !readSet.has(n.id)).length;
  const visible = tab === "unread" ? items.filter((n) => !readSet.has(n.id)) : items;

  function markRead(ids: string[]) {
    setReadIds((prev) => {
      const next = Array.from(new Set([...prev, ...ids]));
      saveReadIds(next);
      return next;
    });
  }

  return (
    <div ref={boxRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="Notifikasi"
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-xl border border-border/50 bg-background/50 text-muted-foreground transition hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[0.6rem] font-semibold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-border/40 bg-card/95 p-3 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1">
              {(["unread", "all"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.14em] transition",
                    tab === t
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-border/50 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t === "unread" ? `Belum dibaca (${unreadCount})` : "Riwayat"}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => markRead(items.map((n) => n.id))}
              className="inline-flex items-center gap-1 text-[0.65rem] text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Tandai dibaca
            </button>
          </div>

          <ul className="mt-3 space-y-1.5">
            {visible.length === 0 ? (
              <li className="px-1 py-4 text-xs text-muted-foreground">
                {tab === "unread" ? "Semua notifikasi sudah dibaca." : "Belum ada notifikasi."}
              </li>
            ) : (
              visible.map((n) => {
                const isRead = readSet.has(n.id);
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => {
                        markRead([n.id]);
                        setOpen(false);
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        void navigate({ to: n.href as any });
                      }}
                      className={cn(
                        "w-full rounded-xl border px-3 py-2 text-left transition hover:border-primary/40",
                        isRead
                          ? "border-border/30 bg-background/20 opacity-70"
                          : "border-border/50 bg-background/40",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "shrink-0 rounded-full border px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.12em]",
                            notificationToneClass(n.kind),
                          )}
                        >
                          {NOTIFICATION_LABELS[n.kind]}
                        </span>
                        <span className="ml-auto shrink-0 text-[0.6rem] text-muted-foreground">
                          {timeAgo(n.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-foreground">{n.title}</p>
                      {n.detail ? (
                        <p className="truncate text-[0.7rem] text-muted-foreground">{n.detail}</p>
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
