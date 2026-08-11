import { useState } from "react";
import { toast } from "sonner";

import { GlassCard } from "@/components/admin/ui";
import { buildSalesBrief, type SalesLead } from "@/lib/admin/sales-ai";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-background/40 p-4">
      <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
      <div className="mt-2 space-y-1.5 text-sm text-foreground">{children}</div>
    </div>
  );
}

export function SalesAssistant({
  lead,
  open: controlledOpen,
  onOpenChange,
}: {
  lead: SalesLead;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (onOpenChange) onOpenChange(next);
    else setUncontrolledOpen(next);
  };
  const brief = open ? buildSalesBrief(lead) : null;


  async function copyFollowUp(message: string) {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Pesan follow-up disalin.");
    } catch {
      toast.error("Tidak bisa menyalin pesan.");
    }
  }

  return (
    <GlassCard>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">AI Sales Assistant</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Analisa strategi penjualan berdasarkan data lead ini.
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

      {brief ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <Block title="Sales Strategy">
            <p className="text-xs text-primary">{brief.priority}</p>
            <ul className="space-y-1.5">
              {brief.strategy.map((s) => (
                <li key={s} className="text-sm text-muted-foreground">
                  • {s}
                </li>
              ))}
            </ul>
          </Block>

          <Block title="Recommended Package">
            <p className="text-base font-semibold text-foreground">{brief.recommendedPackage}</p>
            <p className="text-sm text-muted-foreground">{brief.investment}</p>
            <p className="text-sm text-muted-foreground">{brief.timeline}</p>
          </Block>

          <Block title="Key Pain Points">
            <ul className="space-y-1.5">
              {brief.painPoints.map((p) => (
                <li key={p} className="text-sm text-muted-foreground">
                  • {p}
                </li>
              ))}
            </ul>
          </Block>

          <Block title="Suggested Follow-up Message">
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {brief.followUpMessage}
            </p>
            <button
              type="button"
              onClick={() => void copyFollowUp(brief.followUpMessage)}
              className="mt-2 rounded-xl border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
            >
              Salin pesan
            </button>
          </Block>

          <div className="lg:col-span-2">
            <Block title="Objection Handling">
              <div className="grid gap-3 sm:grid-cols-2">
                {brief.objections.map((o) => (
                  <div key={o.objection} className="rounded-xl border border-border/40 p-3">
                    <p className="text-sm font-medium text-foreground">“{o.objection}”</p>
                    <p className="mt-1 text-sm text-muted-foreground">{o.response}</p>
                  </div>
                ))}
              </div>
            </Block>
          </div>
        </div>
      ) : null}
    </GlassCard>
  );
}
