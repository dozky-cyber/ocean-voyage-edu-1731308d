import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Chip, GlassCard } from "@/components/admin/ui";
import { getAdminLeads, updateLeadStage } from "@/lib/admin.functions";
import {
  PIPELINE_STAGES,
  normalizeStage,
  temperatureClass,
  type PipelineStage,
} from "@/lib/admin/pipeline";

export const Route = createFileRoute("/_authenticated/admin/pipeline")({
  component: PipelinePage,
});

function PipelinePage() {
  const queryClient = useQueryClient();
  const fetchLeads = useServerFn(getAdminLeads);
  const saveStage = useServerFn(updateLeadStage);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "leads"],
    queryFn: () => fetchLeads(),
  });

  const mutation = useMutation({
    mutationFn: (input: { id: string; stage: PipelineStage }) => saveStage({ data: input }),
    onSuccess: async () => {
      toast.success("Stage diperbarui.");
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: () => toast.error("Gagal memperbarui stage."),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Memuat pipeline…</p>;
  if (error) return <p className="text-sm text-destructive">Gagal memuat pipeline.</p>;

  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sales Pipeline</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Geser lead melalui tahapan dengan tombol ← dan →.
        </p>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-4">
        <div className="flex min-w-max gap-4">
          {PIPELINE_STAGES.map((stage) => {
            const stageLeads = rows.filter((lead) => normalizeStage(lead.status) === stage);
            const index = PIPELINE_STAGES.indexOf(stage);
            return (
              <GlassCard key={stage} className="w-72 shrink-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    {stage}
                  </p>
                  <span className="text-xs text-muted-foreground">{stageLeads.length}</span>
                </div>
                <div className="mt-4 space-y-2">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="rounded-2xl border border-border/40 bg-background/40 p-3"
                    >
                      <Link
                        to="/admin/leads/$id"
                        params={{ id: lead.id }}
                        className="text-sm font-medium hover:text-primary"
                      >
                        {lead.name}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Chip className={temperatureClass(lead.lead_temperature)}>
                          {lead.lead_temperature}
                        </Chip>
                        <span className="text-[0.7rem] text-muted-foreground">
                          skor {lead.lead_score}
                        </span>
                      </div>
                      {lead.ai_recommended_package ? (
                        <p className="mt-1 truncate text-[0.7rem] text-primary">
                          {lead.ai_recommended_package}
                        </p>
                      ) : null}
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          disabled={index === 0 || mutation.isPending}
                          onClick={() =>
                            mutation.mutate({
                              id: lead.id,
                              stage: PIPELINE_STAGES[index - 1] as PipelineStage,
                            })
                          }
                          className="rounded-lg border border-border/50 px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground disabled:opacity-30"
                          aria-label="Mundur satu tahap"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          disabled={index === PIPELINE_STAGES.length - 1 || mutation.isPending}
                          onClick={() =>
                            mutation.mutate({
                              id: lead.id,
                              stage: PIPELINE_STAGES[index + 1] as PipelineStage,
                            })
                          }
                          className="rounded-lg border border-border/50 px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground disabled:opacity-30"
                          aria-label="Maju satu tahap"
                        >
                          →
                        </button>
                      </div>
                    </div>
                  ))}
                  {stageLeads.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Kosong</p>
                  ) : null}
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
