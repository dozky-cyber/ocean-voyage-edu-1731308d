import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { saveOrderBrief } from "@/lib/order-brief.functions";
import type { OrderBriefData } from "@/lib/order-brief";

type Props = {
  brief: OrderBriefData;
  conversationId?: string;
  leadId?: string;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

const toLines = (items: string[]) => items.join("\n");
const fromLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);

/** Admin edit form: saves the Order Brief as a new version (V+1). */
export function OrderBriefEditDialog({ brief, conversationId, leadId, onClose, onSaved }: Props) {
  const queryClient = useQueryClient();
  const save = useServerFn(saveOrderBrief);
  const [form, setForm] = useState({
    customerName: brief.customerName,
    whatsapp: brief.whatsapp ?? "",
    email: brief.email ?? "",
    business: brief.business,
    project: brief.project,
    goal: brief.goal ?? "",
    problems: toLines(brief.problems),
    usersScale: brief.usersScale ?? "",
    adminNeeds: brief.adminNeeds ?? "",
    features: toLines(brief.features),
    timeline: brief.timeline ?? "",
    budget: brief.budget ?? "",
    recommendation: brief.recommendation ?? "",
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const mutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          ...(conversationId ? { conversationId } : {}),
          ...(leadId ? { leadId } : {}),
          customerName: form.customerName.trim() || "Customer",
          whatsapp: form.whatsapp.trim() || null,
          email: form.email.trim() || null,
          business: form.business.trim(),
          project: form.project.trim(),
          goal: form.goal.trim() || null,
          problems: fromLines(form.problems),
          usersScale: form.usersScale.trim() || null,
          adminNeeds: form.adminNeeds.trim() || null,
          features: fromLines(form.features),
          timeline: form.timeline.trim() || null,
          budget: form.budget.trim() || null,
          recommendation: form.recommendation.trim() || null,
        },
      }),
    onSuccess: async (result) => {
      toast.success(`Order Brief disimpan sebagai v${result.version}. PDF ikut diperbarui.`);
      await queryClient.invalidateQueries({ queryKey: ["order-brief"] });
      await onSaved();
      onClose();
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan Order Brief."),
  });

  return (
    <div className="fixed inset-0 z-[130] flex items-start justify-center overflow-y-auto bg-background/80 p-3 backdrop-blur-sm sm:p-6">
      <div className="w-full max-w-3xl rounded-3xl border border-border/70 bg-card p-4 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Edit Order Brief</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Perubahan disimpan sebagai versi baru (v{brief.version + 1}). Data lama tetap
              tersimpan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Tutup
          </button>
        </div>

        <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
          <Input label="Nama Customer" value={form.customerName} onChange={set("customerName")} />
          <Input label="WhatsApp" value={form.whatsapp} onChange={set("whatsapp")} />
          <Input label="Email" value={form.email} onChange={set("email")} />
        </div>

        <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
          <Input label="Bisnis" value={form.business} onChange={set("business")} />
          <Input label="Project" value={form.project} onChange={set("project")} />
        </div>

        <div className="mt-3 grid gap-3 text-xs">
          <Textarea label="Tujuan" value={form.goal} onChange={set("goal")} rows={2} />
          <Textarea
            label="Masalah Bisnis (satu per baris)"
            value={form.problems}
            onChange={set("problems")}
            rows={4}
          />
          <Textarea
            label="Fitur (satu per baris)"
            value={form.features}
            onChange={set("features")}
            rows={5}
          />
        </div>

        <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
          <Input label="User Sistem" value={form.usersScale} onChange={set("usersScale")} />
          <Input
            label="Kebutuhan Admin/Team"
            value={form.adminNeeds}
            onChange={set("adminNeeds")}
          />
          <Input label="Timeline" value={form.timeline} onChange={set("timeline")} />
          <Input label="Budget" value={form.budget} onChange={set("budget")} />
        </div>

        <div className="mt-3 text-xs">
          <Input
            label="AI Recommendation"
            value={form.recommendation}
            onChange={set("recommendation")}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-3 border-t border-border/60 pt-4 text-xs">
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            className="rounded-full border border-primary/60 bg-primary/10 px-4 py-1.5 text-primary disabled:opacity-60"
          >
            {mutation.isPending ? "Menyimpan…" : "Simpan Versi Baru"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:underline"
          >
            Batal
          </button>
        </div>
      </div>
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
      <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-background/60 px-3 py-2 text-foreground outline-none focus:border-primary/60"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-background/60 px-3 py-2 text-foreground outline-none focus:border-primary/60"
      />
    </label>
  );
}
