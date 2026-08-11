import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { GlassCard } from "@/components/admin/ui";
import { getLeadAiActivity, logLeadAiActivity } from "@/lib/admin.functions";
import {
  AI_ACTIONS,
  FOLLOW_UP_TYPES,
  buildFollowUp,
  buildLeadIntel,
  handleObjection,
  type FollowUpType,
  type SalesLead,
} from "@/lib/admin/sales-ai";
import { formatDate } from "@/lib/admin/pipeline";

type Tab = "intel" | "followup" | "objection" | "memory";

const TABS: { id: Tab; label: string }[] = [
  { id: "intel", label: "Lead Analysis" },
  { id: "followup", label: "Follow Up" },
  { id: "objection", label: "Objection" },
  { id: "memory", label: "AI Memory" },
];

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-background/40 p-4">
      <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
      <div className="mt-2 space-y-1.5 text-sm text-foreground">{children}</div>
    </div>
  );
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Disalin ke clipboard.");
  } catch {
    toast.error("Tidak bisa menyalin.");
  }
}

function CopyBox({
  title,
  text,
  onSave,
  saving,
}: {
  title: string;
  text: string;
  onSave?: () => void;
  saving?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-background/40 p-4">
      <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{text}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copyText(text)}
          className="rounded-xl border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
        >
          Copy
        </button>
        {onSave ? (
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-xl border border-primary/40 px-3 py-1.5 text-xs text-primary transition hover:bg-primary/10 disabled:opacity-60"
          >
            {saving ? "Menyimpan…" : "Simpan ke riwayat"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function SalesAssistant({
  lead,
  leadId,
  open: controlledOpen,
  onOpenChange,
}: {
  lead: SalesLead;
  leadId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (onOpenChange) onOpenChange(next);
    else setUncontrolledOpen(next);
  };

  const [tab, setTab] = useState<Tab>("intel");
  const [followUpType, setFollowUpType] = useState<FollowUpType>("First Response");
  const [objectionInput, setObjectionInput] = useState("");
  const [objectionText, setObjectionText] = useState("");

  const queryClient = useQueryClient();
  const fetchActivity = useServerFn(getLeadAiActivity);
  const saveActivity = useServerFn(logLeadAiActivity);

  const activity = useQuery({
    queryKey: ["admin", "lead-ai-activity", leadId],
    queryFn: () => fetchActivity({ data: { leadId } }),
    enabled: open,
  });

  const logMutation = useMutation({
    mutationFn: (input: { action: string; label: string; content: string }) =>
      saveActivity({
        data: { leadId, action: input.action, label: input.label, content: input.content, meta: {} },
      }),
    onSuccess: async () => {
      toast.success("Tersimpan di AI Sales Memory.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "lead-ai-activity", leadId] });
    },
    onError: () => toast.error("Gagal menyimpan ke riwayat."),
  });

  const intel = open ? buildLeadIntel(lead) : null;
  const followUp = open ? buildFollowUp(lead, followUpType) : null;
  const objection = objectionText ? handleObjection(lead, objectionText) : null;

  return (
    <GlassCard>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">AI Sales Engine</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Analisa lead, generator follow up, dan objection handler berbasis data CRM.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          {open ? "Sembunyikan analisa" : "Ask AI About This Lead"}
        </button>
      </div>

      {open && intel && followUp ? (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  tab === t.id
                    ? "border-primary/50 bg-primary/20 text-primary"
                    : "border-border/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "intel" ? (
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <Block title="Lead Summary">
                  <p className="text-sm text-muted-foreground">{intel.summary}</p>
                  <button
                    type="button"
                    onClick={() =>
                      logMutation.mutate({
                        action: AI_ACTIONS.intel,
                        label: "Lead summary",
                        content: `${intel.summary}\n\nNext best action: ${intel.nextBestAction}`,
                      })
                    }
                    disabled={logMutation.isPending}
                    className="mt-2 rounded-xl border border-primary/40 px-3 py-1.5 text-xs text-primary transition hover:bg-primary/10 disabled:opacity-60"
                  >
                    Simpan ke riwayat
                  </button>
                </Block>
              </div>

              <Block title="Customer Pain Points">
                <ul className="space-y-1.5">
                  {intel.painPoints.map((p) => (
                    <li key={p} className="text-sm text-muted-foreground">
                      • {p}
                    </li>
                  ))}
                </ul>
              </Block>

              <Block title="Buying Intent">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <p className="text-base font-semibold text-foreground">{intel.buyingIntent.level}</p>
                  <span className="text-sm font-semibold text-primary">
                    {intel.buyingIntent.score}
                    <span className="text-muted-foreground">/100</span>
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted/30">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${intel.buyingIntent.score}%` }}
                  />
                </div>
                <ul className="space-y-1.5">
                  {intel.buyingIntent.signals.map((s) => (
                    <li key={s} className="text-sm text-muted-foreground">
                      • {s}
                    </li>
                  ))}
                </ul>
              </Block>

              <Block title="Recommended Package">
                <p className="text-base font-semibold text-foreground">{intel.recommendedPackage}</p>
                <p className="text-sm text-muted-foreground">{intel.priority}</p>
              </Block>

              <Block title="Closing Probability">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted/30">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${intel.closingProbability}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    {intel.closingProbability}%
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {intel.probabilityReasons.map((r) => (
                    <li key={r} className="text-sm text-muted-foreground">
                      • {r}
                    </li>
                  ))}
                </ul>
              </Block>

              <Block title="Recommended Sales Strategy">
                <ul className="space-y-1.5">
                  {intel.strategy.map((s) => (
                    <li key={s} className="text-sm text-muted-foreground">
                      • {s}
                    </li>
                  ))}
                </ul>
              </Block>

              <Block title="Next Best Action">
                <p className="text-sm text-foreground">{intel.nextBestAction}</p>
              </Block>
            </div>
          ) : null}

          {tab === "followup" ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {FOLLOW_UP_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFollowUpType(t)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      followUpType === t
                        ? "border-primary/50 bg-primary/20 text-primary"
                        : "border-border/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                <CopyBox
                  title="WhatsApp Style"
                  text={followUp.whatsapp}
                  saving={logMutation.isPending}
                  onSave={() =>
                    logMutation.mutate({
                      action: AI_ACTIONS.followUp,
                      label: `${followUp.type} · WhatsApp`,
                      content: followUp.whatsapp,
                    })
                  }
                />
                <CopyBox
                  title={`Email Style — ${followUp.emailSubject}`}
                  text={followUp.email}
                  saving={logMutation.isPending}
                  onSave={() =>
                    logMutation.mutate({
                      action: AI_ACTIONS.followUp,
                      label: `${followUp.type} · Email`,
                      content: `Subject: ${followUp.emailSubject}\n\n${followUp.email}`,
                    })
                  }
                />
              </div>
            </div>
          ) : null}

          {tab === "objection" ? (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <input
                  value={objectionInput}
                  onChange={(e) => setObjectionInput(e.target.value)}
                  placeholder='Contoh: "Price terlalu mahal"'
                  className="w-full rounded-2xl border border-border/60 bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-primary/60"
                />
                <button
                  type="button"
                  onClick={() => setObjectionText(objectionInput.trim())}
                  disabled={!objectionInput.trim()}
                  className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                >
                  Generate jawaban
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Price terlalu mahal", "Nanti dulu", "Mau bandingkan vendor lain", "Diskusi dulu dengan tim"].map(
                  (sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => {
                        setObjectionInput(sample);
                        setObjectionText(sample);
                      }}
                      className="rounded-full border border-border/50 px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
                    >
                      {sample}
                    </button>
                  ),
                )}
              </div>

              {objection ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">“{objection.objection}”</p>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <Block title="Understanding Response">
                      <p className="text-sm text-muted-foreground">{objection.understanding}</p>
                    </Block>
                    <Block title="Value Explanation">
                      <p className="text-sm text-muted-foreground">{objection.value}</p>
                    </Block>
                    <Block title="Alternative Package">
                      <p className="text-sm text-muted-foreground">{objection.alternative}</p>
                    </Block>
                    <Block title="Closing Question">
                      <p className="text-sm text-foreground">{objection.closingQuestion}</p>
                    </Block>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        void copyText(
                          `${objection.understanding}\n\n${objection.value}\n\n${objection.alternative}\n\n${objection.closingQuestion}`,
                        )
                      }
                      className="rounded-xl border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
                    >
                      Copy semua
                    </button>
                    <button
                      type="button"
                      disabled={logMutation.isPending}
                      onClick={() =>
                        logMutation.mutate({
                          action: AI_ACTIONS.objection,
                          label: objection.objection,
                          content: `${objection.understanding}\n\n${objection.value}\n\n${objection.alternative}\n\n${objection.closingQuestion}`,
                        })
                      }
                      className="rounded-xl border border-primary/40 px-3 py-1.5 text-xs text-primary transition hover:bg-primary/10 disabled:opacity-60"
                    >
                      Simpan ke riwayat
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Tulis keberatan pelanggan, AI menyusun jawaban lengkap dengan pertanyaan penutup.
                </p>
              )}
            </div>
          ) : null}

          {tab === "memory" ? (
            <div className="space-y-3">
              {activity.isLoading ? (
                <p className="text-xs text-muted-foreground">Memuat riwayat…</p>
              ) : (activity.data ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Belum ada saran AI yang disimpan untuk lead ini.
                </p>
              ) : (
                (activity.data ?? []).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border/40 bg-background/40 p-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-primary">
                        {item.action}
                      </span>
                      {item.label ? <span>{item.label}</span> : null}
                      <span>· {formatDate(item.created_at)}</span>
                      <span>· {item.created_by_email || "sales user"}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                      {item.content}
                    </p>
                    <button
                      type="button"
                      onClick={() => void copyText(item.content)}
                      className="mt-3 rounded-xl border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
                    >
                      Copy
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </GlassCard>
  );
}
