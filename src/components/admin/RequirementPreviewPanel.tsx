import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { OrderBriefDialog } from "@/components/admin/OrderBriefDialog";
import {
  addRequirementVersion,
  listRequirementVersions,
  type RequirementVersionRow,
} from "@/lib/requirements.functions";
import { cn } from "@/lib/utils";

type Props = { conversationId: string };

function toLines(items: string[]) {
  return items.join("\n");
}

function fromLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);
}

export function RequirementPreviewPanel({ conversationId }: Props) {
  const queryClient = useQueryClient();
  const list = useServerFn(listRequirementVersions);
  const addVersion = useServerFn(addRequirementVersion);
  const [mode, setMode] = useState<"preview" | "edit" | "prompt">("preview");
  const [draft, setDraft] = useState<Partial<RequirementVersionRow> | null>(null);
  const [featuresText, setFeaturesText] = useState("");
  const [changeNote, setChangeNote] = useState("");
  const [notify, setNotify] = useState(false);

  const versions = useQuery({
    queryKey: ["requirement-versions", conversationId],
    queryFn: () => list({ data: { conversationId } }),
  });

  const rows = versions.data?.versions ?? [];
  const latest = rows[0] ?? null;

  const save = useMutation({
    mutationFn: async () => {
      if (!latest && !draft) throw new Error("Belum ada requirement.");
      const base = { ...(latest ?? {}), ...(draft ?? {}) } as RequirementVersionRow;
      return addVersion({
        data: {
          conversationId,
          business: base.business ?? "",
          project: base.project ?? "",
          features: fromLines(featuresText),
          problems: base.problems ?? [],
          packageName: base.package_name ?? null,
          timeline: base.timeline ?? null,
          budget: base.budget ?? null,
          usersScale: base.users_scale ?? null,
          intent: base.intent ?? "medium",
          score: base.score ?? 0,
          contactName: base.contact_name ?? null,
          contactEmail: base.contact_email ?? null,
          contactWhatsapp: base.contact_whatsapp ?? null,
          summary: base.summary ?? null,
          changeNote: changeNote.trim() || null,
          notifyTelegram: notify,
        },
      });
    },
    onSuccess: async (result) => {
      toast.success(`Requirement versi ${result.version} tersimpan.`);
      setMode("preview");
      setDraft(null);
      setChangeNote("");
      await queryClient.invalidateQueries({ queryKey: ["requirement-versions", conversationId] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan requirement."),
  });

  if (versions.isLoading) {
    return <p className="mt-3 text-xs text-muted-foreground">Memuat requirement…</p>;
  }

  if (!latest) {
    return (
      <p className="mt-3 text-xs text-muted-foreground">
        Requirement preview akan dibuat otomatis saat AI mengubah percakapan ini menjadi
        qualified lead.
      </p>
    );
  }

  function startEdit() {
    setDraft({ ...latest });
    setFeaturesText(toLines(latest?.features ?? []));
    setMode("edit");
  }

  return (
    <div className="mt-4 rounded-2xl border border-border/70 bg-card/40 p-3">
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Requirement · v{latest.version}
        </span>
        {(["preview", "edit", "prompt"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => (key === "edit" ? startEdit() : setMode(key))}
            className={cn(
              "rounded-full border px-3 py-1 transition-colors",
              mode === key
                ? "border-primary/60 bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {key === "preview"
              ? "Preview"
              : key === "edit"
                ? "Update Requirement"
                : "Generate Final Prompt"}
          </button>
        ))}
      </div>

      {mode === "preview" && (
        <div className="mt-3 space-y-2 text-xs">
          <Field label="Business" value={latest.business} />
          <Field label="Project" value={latest.project} />
          <Field label="Features" value={(latest.features ?? []).map((f) => `- ${f}`).join("\n")} />
          <Field label="Package" value={latest.package_name ?? "-"} />
          <Field label="Timeline" value={latest.timeline ?? "-"} />
          <Field label="Budget" value={latest.budget ?? "-"} />
          <Field
            label="Kontak"
            value={
              [latest.contact_name, latest.contact_whatsapp, latest.contact_email]
                .filter(Boolean)
                .join(" · ") || "-"
            }
          />
          <Field label="Ringkasan AI" value={latest.summary ?? "-"} />
          {rows.length > 1 && (
            <p className="pt-1 text-[11px] text-muted-foreground">
              {rows.length} versi tersimpan · versi awal tetap utuh.
            </p>
          )}
        </div>
      )}

      {mode === "edit" && draft && (
        <div className="mt-3 space-y-2 text-xs">
          <Input
            label="Business"
            value={draft.business ?? ""}
            onChange={(value) => setDraft({ ...draft, business: value })}
          />
          <Input
            label="Project"
            value={draft.project ?? ""}
            onChange={(value) => setDraft({ ...draft, project: value })}
          />
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Features (satu per baris)
            </span>
            <textarea
              value={featuresText}
              onChange={(event) => setFeaturesText(event.target.value)}
              rows={5}
              className="mt-1 w-full rounded-xl border border-border bg-background/60 p-2 text-xs"
            />
          </label>
          <Input
            label="Package"
            value={draft.package_name ?? ""}
            onChange={(value) => setDraft({ ...draft, package_name: value })}
          />
          <Input
            label="Timeline"
            value={draft.timeline ?? ""}
            onChange={(value) => setDraft({ ...draft, timeline: value })}
          />
          <Input
            label="Budget"
            value={draft.budget ?? ""}
            onChange={(value) => setDraft({ ...draft, budget: value })}
          />
          <Input
            label="WhatsApp"
            value={draft.contact_whatsapp ?? ""}
            onChange={(value) => setDraft({ ...draft, contact_whatsapp: value })}
          />
          <Input
            label="Catatan perubahan"
            value={changeNote}
            onChange={setChangeNote}
          />
          <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <input
              type="checkbox"
              checked={notify}
              onChange={(event) => setNotify(event.target.checked)}
            />
            Kirim versi ini ke Telegram
          </label>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              disabled={save.isPending}
              onClick={() => save.mutate()}
              className="rounded-full border border-primary/60 bg-primary/10 px-3 py-1 text-primary disabled:opacity-60"
            >
              {save.isPending ? "Menyimpan…" : `Simpan versi ${latest.version + 1}`}
            </button>
            <button
              type="button"
              onClick={() => setMode("preview")}
              className="text-muted-foreground hover:underline"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {mode === "prompt" && (
        <div className="mt-3 space-y-2 text-xs">
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-background/60 p-3">
            {latest.final_prompt ?? "-"}
          </pre>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(latest.final_prompt ?? "");
              toast.success("Final prompt disalin.");
            }}
            className="text-primary hover:underline"
          >
            Salin prompt
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-foreground">{value || "-"}</p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-background/60 p-2 text-xs"
      />
    </label>
  );
}
