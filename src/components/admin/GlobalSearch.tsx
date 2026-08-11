import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  SEARCH_CATEGORIES,
  SEARCH_CATEGORY_LABELS,
  type SearchCategory,
  type SearchResult,
} from "@/lib/admin/search";
import { searchWorkspaceFn } from "@/lib/workspace.functions";
import { cn } from "@/lib/utils";

function useDebounced(value: string, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function GlobalSearch() {
  const navigate = useNavigate();
  const runSearch = useServerFn(searchWorkspaceFn);
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [active, setActive] = useState<SearchCategory[]>([]);
  const debounced = useDebounced(term);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 10);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const enabled = debounced.trim().length >= 2;
  const { data, isFetching } = useQuery({
    queryKey: ["admin", "search", debounced.trim(), active.join(",")],
    queryFn: () => runSearch({ data: { term: debounced.trim(), categories: active } }),
    enabled,
    staleTime: 30_000,
  });

  const grouped = useMemo(() => {
    const map = new Map<SearchCategory, SearchResult[]>();
    for (const item of data ?? []) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return [...map.entries()];
  }, [data]);

  function go(href: string) {
    setOpen(false);
    setTerm("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    void navigate({ to: href as any });
  }

  return (
    <div ref={boxRef} className="relative min-w-0 flex-1">
      <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/50 px-3 py-2 backdrop-blur-xl">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          value={term}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          placeholder="Cari lead, klien, project, proposal, invoice…"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          aria-label="Global search"
        />
        {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : null}
        {term ? (
          <button
            type="button"
            aria-label="Bersihkan pencarian"
            onClick={() => setTerm("")}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <kbd className="hidden rounded border border-border/50 px-1.5 text-[0.6rem] text-muted-foreground sm:block">
            ⌘K
          </kbd>
        )}
      </div>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-border/40 bg-card/95 p-3 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-wrap gap-1.5">
            {SEARCH_CATEGORIES.map((cat) => {
              const on = active.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    setActive((prev) =>
                      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
                    )
                  }
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.14em] transition",
                    on
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-border/50 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {SEARCH_CATEGORY_LABELS[cat]}
                </button>
              );
            })}
          </div>

          <div className="mt-3 space-y-3">
            {!enabled ? (
              <p className="px-1 text-xs text-muted-foreground">
                Ketik minimal 2 karakter untuk mencari di seluruh workspace.
              </p>
            ) : grouped.length === 0 ? (
              <p className="px-1 text-xs text-muted-foreground">
                {isFetching ? "Mencari…" : "Tidak ada hasil."}
              </p>
            ) : (
              grouped.map(([cat, rows]) => (
                <div key={cat}>
                  <p className="px-1 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                    {SEARCH_CATEGORY_LABELS[cat]}
                  </p>
                  <ul className="mt-1 space-y-1">
                    {rows.map((row) => (
                      <li key={`${row.category}-${row.id}`}>
                        <button
                          type="button"
                          onClick={() => go(row.href)}
                          className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl px-2 py-2 text-left transition hover:bg-primary/10"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm text-foreground">
                              {row.title}
                            </span>
                            <span className="block truncate text-[0.7rem] text-muted-foreground">
                              {row.subtitle}
                            </span>
                          </span>
                          {row.meta ? (
                            <span className="shrink-0 text-[0.65rem] text-muted-foreground">
                              {row.meta}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
