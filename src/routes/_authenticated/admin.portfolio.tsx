import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Eye, EyeOff, Images, Pencil, Plus, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Chip, GlassCard, MetricTile, SectionCard } from "@/components/admin/ui";
import {
  PORTFOLIO_CATEGORIES,
  slugify,
  splitLines,
  type PortfolioProject,
} from "@/lib/admin/portfolio";
import {
  createPortfolioFn,
  deletePortfolioFn,
  getPortfolioList,
  setPortfolioPublishedFn,
  updatePortfolioFn,
} from "@/lib/portfolio.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/portfolio")({
  component: PortfolioAdminPage,
});

const inputClass =
  "w-full rounded-xl border border-border/50 bg-background/40 px-3 py-2 text-sm outline-none transition focus:border-primary/60";

type Draft = {
  id: string | null;
  title: string;
  slug: string;
  category: string;
  client_type: string;
  thumbnail_url: string;
  gallery: string;
  description: string;
  problem: string;
  solution: string;
  features: string;
  tech_stack: string;
  result: string;
  testimonial_quote: string;
  testimonial_author: string;
  testimonial_role: string;
  seo_title: string;
  seo_description: string;
  og_image: string;
  published: boolean;
  position: number;
};

const emptyDraft: Draft = {
  id: null,
  title: "",
  slug: "",
  category: PORTFOLIO_CATEGORIES[0],
  client_type: "",
  thumbnail_url: "",
  gallery: "",
  description: "",
  problem: "",
  solution: "",
  features: "",
  tech_stack: "",
  result: "",
  testimonial_quote: "",
  testimonial_author: "",
  testimonial_role: "",
  seo_title: "",
  seo_description: "",
  og_image: "",
  published: false,
  position: 0,
};

function toDraft(project: PortfolioProject): Draft {
  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
    category: project.category,
    client_type: project.client_type ?? "",
    thumbnail_url: project.thumbnail_url ?? "",
    gallery: project.gallery.join("\n"),
    description: project.description ?? "",
    problem: project.problem ?? "",
    solution: project.solution ?? "",
    features: project.features.join("\n"),
    tech_stack: project.tech_stack.join(", "),
    result: project.result ?? "",
    testimonial_quote: project.testimonial_quote ?? "",
    testimonial_author: project.testimonial_author ?? "",
    testimonial_role: project.testimonial_role ?? "",
    seo_title: project.seo_title ?? "",
    seo_description: project.seo_description ?? "",
    og_image: project.og_image ?? "",
    published: project.published,
    position: project.position,
  };
}

function nullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toPayload(draft: Draft) {
  return {
    title: draft.title.trim(),
    slug: slugify(draft.slug.trim() || draft.title),
    category: draft.category,
    client_type: nullable(draft.client_type),
    thumbnail_url: nullable(draft.thumbnail_url),
    gallery: splitLines(draft.gallery),
    description: nullable(draft.description),
    problem: nullable(draft.problem),
    solution: nullable(draft.solution),
    features: splitLines(draft.features),
    tech_stack: draft.tech_stack
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    result: nullable(draft.result),
    testimonial_quote: nullable(draft.testimonial_quote),
    testimonial_author: nullable(draft.testimonial_author),
    testimonial_role: nullable(draft.testimonial_role),
    seo_title: nullable(draft.seo_title),
    seo_description: nullable(draft.seo_description),
    og_image: nullable(draft.og_image),
    published: draft.published,
    position: Number.isFinite(draft.position) ? draft.position : 0,
  };
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint ? <span className="mt-1 block text-[0.65rem] text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function PortfolioAdminPage() {
  const queryClient = useQueryClient();
  const list = useServerFn(getPortfolioList);
  const create = useServerFn(createPortfolioFn);
  const update = useServerFn(updatePortfolioFn);
  const togglePublish = useServerFn(setPortfolioPublishedFn);
  const remove = useServerFn(deletePortfolioFn);

  const [draft, setDraft] = useState<Draft | null>(null);

  const query = useQuery({ queryKey: ["admin", "portfolio"], queryFn: () => list() });
  const projects = query.data ?? [];

  const stats = useMemo(
    () => ({
      total: projects.length,
      published: projects.filter((p) => p.published).length,
      draft: projects.filter((p) => !p.published).length,
    }),
    [projects],
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "portfolio"] });

  const saveMutation = useMutation({
    mutationFn: async (value: Draft) => {
      const payload = toPayload(value);
      if (!payload.title) throw new Error("Judul project wajib diisi.");
      if (!payload.slug) throw new Error("Slug tidak valid.");
      return value.id
        ? update({ data: { id: value.id, ...payload } })
        : create({ data: payload });
    },
    onSuccess: async () => {
      toast.success("Portfolio tersimpan");
      setDraft(null);
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const publishMutation = useMutation({
    mutationFn: (vars: { id: string; published: boolean }) => togglePublish({ data: vars }),
    onSuccess: async (_data, vars) => {
      toast.success(vars.published ? "Project dipublish" : "Project di-unpublish");
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: async () => {
      toast.success("Project dihapus");
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight">Portfolio & Case Study</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola case study yang tampil di halaman publik KERJAKU.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDraft(emptyDraft)}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary/90 px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Project baru</span>
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricTile label="Total project" value={stats.total} icon={Images} />
        <MetricTile label="Published" value={stats.published} icon={Eye} tone="primary" />
        <MetricTile label="Draft" value={stats.draft} icon={EyeOff} />
      </div>

      {draft ? (
        <SectionCard
          title={draft.id ? "Edit case study" : "Case study baru"}
          description="Problem → Solution → Features → Result akan tampil di halaman publik."
          action={
            <button
              type="button"
              aria-label="Tutup form"
              onClick={() => setDraft(null)}
              className="grid h-8 w-8 place-items-center rounded-lg border border-border/50"
            >
              <X className="h-4 w-4" />
            </button>
          }
        >
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              saveMutation.mutate(draft);
            }}
          >
            <Field label="Judul project">
              <input
                className={inputClass}
                value={draft.title}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    title: e.target.value,
                    slug: draft.id ? draft.slug : slugify(e.target.value),
                  })
                }
              />
            </Field>
            <Field label="Slug" hint="URL publik: /portfolio/{slug}">
              <input
                className={inputClass}
                value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
              />
            </Field>
            <Field label="Kategori">
              <select
                className={inputClass}
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              >
                {PORTFOLIO_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tipe klien">
              <input
                className={inputClass}
                value={draft.client_type}
                onChange={(e) => setDraft({ ...draft, client_type: e.target.value })}
              />
            </Field>
            <Field label="Thumbnail URL">
              <input
                className={inputClass}
                value={draft.thumbnail_url}
                onChange={(e) => setDraft({ ...draft, thumbnail_url: e.target.value })}
              />
            </Field>
            <Field label="Gallery images" hint="Satu URL per baris">
              <textarea
                rows={3}
                className={inputClass}
                value={draft.gallery}
                onChange={(e) => setDraft({ ...draft, gallery: e.target.value })}
              />
            </Field>
            <Field label="Deskripsi project">
              <textarea
                rows={3}
                className={inputClass}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </Field>
            <Field label="Business problem">
              <textarea
                rows={3}
                className={inputClass}
                value={draft.problem}
                onChange={(e) => setDraft({ ...draft, problem: e.target.value })}
              />
            </Field>
            <Field label="Solution">
              <textarea
                rows={3}
                className={inputClass}
                value={draft.solution}
                onChange={(e) => setDraft({ ...draft, solution: e.target.value })}
              />
            </Field>
            <Field label="Main features" hint="Satu fitur per baris">
              <textarea
                rows={3}
                className={inputClass}
                value={draft.features}
                onChange={(e) => setDraft({ ...draft, features: e.target.value })}
              />
            </Field>
            <Field label="Technology stack" hint="Pisahkan dengan koma">
              <input
                className={inputClass}
                value={draft.tech_stack}
                onChange={(e) => setDraft({ ...draft, tech_stack: e.target.value })}
              />
            </Field>
            <Field label="Project result">
              <textarea
                rows={3}
                className={inputClass}
                value={draft.result}
                onChange={(e) => setDraft({ ...draft, result: e.target.value })}
              />
            </Field>
            <Field label="Testimonial">
              <textarea
                rows={3}
                className={inputClass}
                value={draft.testimonial_quote}
                onChange={(e) => setDraft({ ...draft, testimonial_quote: e.target.value })}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama pemberi testimoni">
                <input
                  className={inputClass}
                  value={draft.testimonial_author}
                  onChange={(e) => setDraft({ ...draft, testimonial_author: e.target.value })}
                />
              </Field>
              <Field label="Jabatan">
                <input
                  className={inputClass}
                  value={draft.testimonial_role}
                  onChange={(e) => setDraft({ ...draft, testimonial_role: e.target.value })}
                />
              </Field>
            </div>
            <Field label="SEO title">
              <input
                className={inputClass}
                value={draft.seo_title}
                onChange={(e) => setDraft({ ...draft, seo_title: e.target.value })}
              />
            </Field>
            <Field label="SEO description">
              <textarea
                rows={2}
                className={inputClass}
                value={draft.seo_description}
                onChange={(e) => setDraft({ ...draft, seo_description: e.target.value })}
              />
            </Field>
            <Field label="Open Graph image URL">
              <input
                className={inputClass}
                value={draft.og_image}
                onChange={(e) => setDraft({ ...draft, og_image: e.target.value })}
              />
            </Field>
            <Field label="Urutan tampil">
              <input
                type="number"
                min={0}
                className={inputClass}
                value={draft.position}
                onChange={(e) => setDraft({ ...draft, position: Number(e.target.value) })}
              />
            </Field>

            <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2">
              <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={draft.published}
                  onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
                />
                Publish ke halaman publik
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDraft(null)}
                  className="rounded-xl border border-border/50 px-3 py-2 text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="rounded-xl bg-primary/90 px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary disabled:opacity-60"
                >
                  {saveMutation.isPending ? "Menyimpan…" : "Simpan"}
                </button>
              </div>
            </div>
          </form>
        </SectionCard>
      ) : null}

      <GlassCard>
        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">Memuat portfolio…</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada case study. Tambahkan project pertama untuk tampil di halaman publik.
          </p>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="grid gap-3 rounded-2xl border border-border/40 bg-background/30 p-4 sm:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{project.title}</p>
                    <Chip
                      className={cn(
                        project.published
                          ? "border-primary/40 bg-primary/15 text-primary"
                          : "border-border/60 bg-muted/30 text-muted-foreground",
                      )}
                    >
                      {project.published ? "Published" : "Draft"}
                    </Chip>
                    <Chip className="border-border/60 bg-muted/20 text-muted-foreground">
                      {project.category}
                    </Chip>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">/portfolio/{project.slug}</p>
                  {project.description ? (
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                      {project.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-start gap-2">
                  <button
                    type="button"
                    aria-label={project.published ? "Unpublish" : "Publish"}
                    onClick={() =>
                      publishMutation.mutate({ id: project.id, published: !project.published })
                    }
                    className="grid h-9 w-9 place-items-center rounded-xl border border-border/50 transition hover:bg-muted/20"
                  >
                    {project.published ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label="Edit project"
                    onClick={() => setDraft(toDraft(project))}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-border/50 transition hover:bg-muted/20"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Hapus project"
                    onClick={() => {
                      if (confirm(`Hapus case study "${project.title}"?`)) {
                        deleteMutation.mutate(project.id);
                      }
                    }}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-destructive/40 text-destructive transition hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
