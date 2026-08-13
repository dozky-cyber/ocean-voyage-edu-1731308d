import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Chip, GlassCard } from "@/components/admin/ui";
import {
  deleteProposalFn,
  duplicateProposalFn,
  getAdminLead,
  getProposal,
  getProposalVersions,
  restoreProposalVersionFn,
  saveProposalFn,
  setProposalStatusFn,
} from "@/lib/admin.functions";
import { generateInvoice } from "@/lib/billing.functions";
import { markProposalSent, prepareProposalFile } from "@/lib/proposal.functions";
import { normalizeWhatsapp, waLink } from "@/lib/order-brief";
import { buildProposalWhatsappMessage, type ProposalDocData } from "@/lib/proposal-doc";
import { proposalPdfBlobUrl } from "@/lib/proposal-pdf";
import {
  buildTimelineBlock,
  enhancementsTotal,
  parseEnhancements,
  type EnhancementItem,
} from "@/lib/admin/proposal-logic";
import { formatDate } from "@/lib/admin/pipeline";

import {
  PROPOSAL_STATUSES,
  formatIDR,
  parsePricingItems,
  parseSections,
  pricingTotal,
  proposalStatusClass,
  type PricingItem,
  type ProposalSection,
  type ProposalStatus,
} from "@/lib/admin/sales-ai";

export const Route = createFileRoute("/_authenticated/admin/proposals/$id")({
  component: ProposalDetailPage,
});

type Tab = "document" | "editor" | "versions";

function ProposalDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const fetchProposal = useServerFn(getProposal);
  const fetchVersions = useServerFn(getProposalVersions);
  const fetchLead = useServerFn(getAdminLead);
  const save = useServerFn(saveProposalFn);
  const restore = useServerFn(restoreProposalVersionFn);
  const setStatus = useServerFn(setProposalStatusFn);
  const duplicate = useServerFn(duplicateProposalFn);
  const remove = useServerFn(deleteProposalFn);
  const createInvoice = useServerFn(generateInvoice);
  const prepareFile = useServerFn(prepareProposalFile);
  const markSent = useServerFn(markProposalSent);


  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "proposal", id],
    queryFn: () => fetchProposal({ data: { id } }),
  });

  const versions = useQuery({
    queryKey: ["admin", "proposal-versions", id],
    queryFn: () => fetchVersions({ data: { proposalId: id } }),
  });

  const lead = useQuery({
    queryKey: ["admin", "lead", data?.lead_id],
    queryFn: () => fetchLead({ data: { id: data!.lead_id } }),
    enabled: Boolean(data?.lead_id),
  });

  const [tab, setTab] = useState<Tab>("document");
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [pkg, setPkg] = useState("");
  const [currency, setCurrency] = useState("IDR");
  const [validUntil, setValidUntil] = useState("");
  const [investmentNote, setInvestmentNote] = useState("");
  const [timelineNote, setTimelineNote] = useState("");
  const [versionNote, setVersionNote] = useState("");
  const [sections, setSections] = useState<ProposalSection[]>([]);
  const [pricing, setPricing] = useState<PricingItem[]>([]);
  const [briefTimeline, setBriefTimeline] = useState("");
  const [estimatedTimeline, setEstimatedTimeline] = useState("");
  const [enhancements, setEnhancements] = useState<EnhancementItem[]>([]);
  const [previewVersion, setPreviewVersion] = useState<{ label: string; url: string } | null>(null);

  useEffect(() => {
    if (!data) return;
    setTitle(data.title);
    setClientName(data.client_name ?? "");
    setPkg(data.recommended_package ?? "");
    setCurrency(data.currency ?? "IDR");
    setValidUntil(data.valid_until ?? "");
    setInvestmentNote(data.investment_note ?? "");
    setTimelineNote(data.timeline_note ?? "");
    setSections(parseSections(data.content));
    setPricing(parsePricingItems(data.pricing_items));
    setBriefTimeline(data.brief_timeline ?? "");
    setEstimatedTimeline(data.estimated_timeline ?? "");
    setEnhancements(parseEnhancements(data.enhancements));
  }, [data]);

  const coreTotal = useMemo(() => pricingTotal(pricing), [pricing]);
  const optionalTotal = useMemo(() => enhancementsTotal(enhancements), [enhancements]);
  const total = coreTotal + optionalTotal;
  const timelineBlock = useMemo(
    () =>
      buildTimelineBlock({
        briefTimeline,
        estimatedTimeline,
        createdAt: data?.created_at ?? new Date().toISOString(),
      }),
    [briefTimeline, estimatedTimeline, data?.created_at],
  );

  const saveMutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          id,
          title,
          client_name: clientName || null,
          recommended_package: pkg || null,
          content: sections,
          pricing_items: pricing.map((p) => ({ ...p, amount: Number(p.amount) || 0 })),
          enhancements: enhancements.map((e) => ({
            name: e.name,
            benefit: e.benefit,
            amount: Number(e.amount) || 0,
          })),
          brief_timeline: briefTimeline || null,
          estimated_timeline: estimatedTimeline || null,
          currency,
          valid_until: validUntil || null,
          investment_note: investmentNote || null,
          timeline_note: timelineNote || null,
          version_note: versionNote || null,
        },
      }),
    onSuccess: async (result) => {
      toast.success(`Proposal disimpan — versi ${result.version}.`);
      setVersionNote("");
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: () => toast.error("Gagal menyimpan proposal."),
  });

  const restoreMutation = useMutation({
    mutationFn: (versionId: string) => restore({ data: { proposalId: id, versionId } }),
    onSuccess: async () => {
      toast.success("Versi dipulihkan.");
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: () => toast.error("Gagal memulihkan versi."),
  });

  const statusMutation = useMutation({
    mutationFn: (status: ProposalStatus) => setStatus({ data: { id, status } }),
    onSuccess: async () => {
      toast.success("Status proposal diperbarui.");
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: () => toast.error("Gagal memperbarui status."),
  });

  const invoiceMutation = useMutation({
    mutationFn: () => createInvoice({ data: { proposalId: id } }),
    onSuccess: async (invoice) => {
      toast.success(`Invoice ${invoice.number} dibuat.`);
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      navigate({ to: "/admin/invoices/$id", params: { id: invoice.id } });
    },
    onError: () => toast.error("Gagal membuat invoice."),
  });


  const duplicateMutation = useMutation({
    mutationFn: () => duplicate({ data: { id } }),
    onSuccess: async (result) => {
      toast.success("Proposal diduplikasi.");
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      navigate({ to: "/admin/proposals/$id", params: { id: result.id } });
    },
    onError: () => toast.error("Gagal menduplikasi proposal."),
  });

  const whatsappMutation = useMutation({
    mutationFn: async () => {
      const prepared = await prepareFile({ data: { id } });
      const number = normalizeWhatsapp(prepared.whatsapp ?? lead.data?.whatsapp ?? null);
      const message = buildProposalWhatsappMessage({
        clientName: lead.data?.name ?? prepared.clientName,
        fileName: prepared.fileName,
        previewUrl: prepared.url,
      });
      if (typeof window !== "undefined") {
        window.open(
          number ? waLink(number, message) : `https://wa.me/?text=${encodeURIComponent(message)}`,
          "_blank",
          "noopener",
        );
      }
      await markSent({
        data: { id, channel: "whatsapp", fileName: prepared.fileName, url: prepared.url },
      });
      return prepared;
    },
    onSuccess: async (prepared) => {
      toast.success(`WhatsApp disiapkan — ${prepared.fileName}`);
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Gagal menyiapkan WhatsApp proposal."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => remove({ data: { id } }),
    onSuccess: async () => {
      toast.success("Proposal dihapus.");
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      navigate({ to: "/admin/proposals" });
    },
    onError: () => toast.error("Gagal menghapus proposal."),
  });

  const mailtoHref = useMemo(() => {
    const email = lead.data?.email ?? "";
    const greeting = `Halo ${lead.data?.name ?? ""},`.trim();
    const body = [
      greeting,
      "",
      `Berikut proposal solusi digital dari KERJAKU untuk ${clientName || "bisnis Anda"}.`,
      "",
      ...sections.map((s) => `${s.heading.toUpperCase()}\n${s.body}`),
      "",
      pricing.length
        ? `INVESTASI\n${pricing
            .map((p) => `- ${p.item}: ${formatIDR(p.amount, currency)}`)
            .join("\n")}\nTotal: ${formatIDR(total, currency)}`
        : "",
      "",
      "Salam,",
      "KERJAKU — Work, made your way.",
      "kerjaku.space",
    ]
      .filter(Boolean)
      .join("\n");
    return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
      title,
    )}&body=${encodeURIComponent(body)}`;
  }, [lead.data, clientName, sections, pricing, currency, total, title]);

  type VersionRow = {
    id: string;
    version: number;
    title: string;
    recommended_package: string | null;
    content: unknown;
    pricing_items: unknown;
    investment_note: string | null;
    timeline_note: string | null;
    brief_timeline?: string | null;
    estimated_timeline?: string | null;
    enhancements?: unknown;
    created_at: string;
  };

  function openVersionPreview(v: VersionRow) {
    const doc: ProposalDocData = {
      title: v.title,
      version: v.version,
      clientName: data?.client_name ?? lead.data?.name ?? "Client",
      contactName: lead.data?.name ?? data?.client_name ?? "Client",
      email: lead.data?.email ?? null,
      whatsapp: lead.data?.whatsapp ?? null,
      recommendedPackage: v.recommended_package,
      currency: data?.currency ?? "IDR",
      validUntil: data?.valid_until ?? null,
      investmentNote: v.investment_note,
      timelineNote: v.timeline_note,
      sections: parseSections(v.content),
      pricing: parsePricingItems(v.pricing_items),
      briefTimeline: v.brief_timeline ?? null,
      estimatedTimeline: v.estimated_timeline ?? null,
      enhancements: parseEnhancements(v.enhancements),
      createdAt: v.created_at,
    };
    if (previewVersion) URL.revokeObjectURL(previewVersion.url);
    setPreviewVersion({ label: `Versi ${v.version} · ${v.title}`, url: proposalPdfBlobUrl(doc) });
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Memuat proposal…</p>;
  if (error || !data) return <p className="text-sm text-destructive">Proposal tidak ditemukan.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <Link to="/admin/proposals" className="text-xs text-muted-foreground hover:text-foreground">
          ← Semua proposal
        </Link>
        <Link
          to="/admin/leads/$id"
          params={{ id: data.lead_id }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Lihat lead
        </Link>
        <Chip className={proposalStatusClass(data.status)}>{data.status}</Chip>
        <Chip className="border-border/60 bg-secondary/40">v{data.version ?? 1}</Chip>
      </div>

      <GlassCard className="print:hidden">
        <p className="text-sm font-medium">Proposal Management</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {PROPOSAL_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate(s)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-60 ${
                s === data.status
                  ? "border-primary/50 bg-primary/20 text-primary"
                  : "border-border/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {saveMutation.isPending ? "Menyimpan…" : "Simpan versi"}
          </button>
          <button
            type="button"
            onClick={() => duplicateMutation.mutate()}
            disabled={duplicateMutation.isPending}
            className="rounded-xl border border-border/60 px-3 py-1.5 text-xs transition hover:text-foreground disabled:opacity-60"
          >
            {duplicateMutation.isPending ? "Menyalin…" : "Copy Proposal"}
          </button>
          <button
            type="button"
            onClick={() => whatsappMutation.mutate()}
            disabled={whatsappMutation.isPending}
            className="rounded-xl border border-primary/50 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-60"
          >
            {whatsappMutation.isPending ? "Menyiapkan…" : "Kirim WhatsApp"}
          </button>
          <button
            type="button"
            onClick={() => invoiceMutation.mutate()}
            disabled={invoiceMutation.isPending}
            className="rounded-xl border border-primary/50 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-60"
          >
            {invoiceMutation.isPending ? "Membuat…" : "Buat Invoice"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl border border-border/60 px-3 py-1.5 text-xs transition hover:text-foreground"
          >
            Export PDF / Print
          </button>

          <a
            href={mailtoHref}
            className="rounded-xl border border-border/60 px-3 py-1.5 text-xs transition hover:text-foreground"
          >
            Kirim via email
          </a>
          <button
            type="button"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="rounded-xl border border-destructive/40 px-3 py-1.5 text-xs text-destructive transition hover:bg-destructive/10"
          >
            Hapus
          </button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Dibuat {formatDate(data.created_at)} · diperbarui {formatDate(data.updated_at)}
          {data.sent_at ? ` · dikirim ${formatDate(data.sent_at)}` : ""}
          {data.approved_at ? ` · disetujui ${formatDate(data.approved_at)}` : ""}
        </p>
      </GlassCard>

      <div className="flex flex-wrap gap-2 print:hidden">
        {(
          [
            ["document", "Dokumen"],
            ["editor", "Editor"],
            ["versions", "Versi"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
              tab === key
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-border/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "editor" ? (
        <div className="space-y-6 print:hidden">
          <GlassCard>
            <p className="text-sm font-medium">Informasi proposal</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Judul" value={title} onChange={setTitle} />
              <Field label="Nama klien" value={clientName} onChange={setClientName} />
              <Field label="Paket rekomendasi" value={pkg} onChange={setPkg} />
              <Field label="Mata uang" value={currency} onChange={setCurrency} />
              <Field label="Berlaku sampai" value={validUntil} onChange={setValidUntil} type="date" />
              <Field
                label="Catatan versi (opsional)"
                value={versionNote}
                onChange={setVersionNote}
              />
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium">Investasi</p>
              <button
                type="button"
                onClick={() =>
                  setPricing((prev) => [...prev, { item: "", detail: "", amount: 0 }])
                }
                className="rounded-xl border border-border/60 px-3 py-1.5 text-xs transition hover:text-foreground"
              >
                + Tambah baris
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {pricing.map((row, index) => (
                <div
                  key={index}
                  className="grid gap-2 rounded-2xl border border-border/40 bg-background/30 p-3 sm:grid-cols-[1.2fr_1.6fr_0.9fr_auto]"
                >
                  <input
                    value={row.item}
                    placeholder="Item"
                    onChange={(e) =>
                      setPricing((prev) =>
                        prev.map((p, i) => (i === index ? { ...p, item: e.target.value } : p)),
                      )
                    }
                    className="rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none focus:border-primary/60"
                  />
                  <input
                    value={row.detail}
                    placeholder="Deskripsi"
                    onChange={(e) =>
                      setPricing((prev) =>
                        prev.map((p, i) => (i === index ? { ...p, detail: e.target.value } : p)),
                      )
                    }
                    className="rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none focus:border-primary/60"
                  />
                  <input
                    value={String(row.amount)}
                    inputMode="numeric"
                    placeholder="0"
                    onChange={(e) =>
                      setPricing((prev) =>
                        prev.map((p, i) =>
                          i === index
                            ? { ...p, amount: Number(e.target.value.replace(/[^\d]/g, "")) || 0 }
                            : p,
                        ),
                      )
                    }
                    className="rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none focus:border-primary/60"
                  />
                  <button
                    type="button"
                    onClick={() => setPricing((prev) => prev.filter((_, i) => i !== index))}
                    className="rounded-xl border border-destructive/40 px-3 py-2 text-xs text-destructive transition hover:bg-destructive/10"
                  >
                    Hapus
                  </button>
                </div>
              ))}
              {!pricing.length ? (
                <p className="text-xs text-muted-foreground">Belum ada rincian investasi.</p>
              ) : null}
            </div>
            <p className="mt-3 text-sm font-semibold text-primary">
              Total: {formatIDR(total, currency)}
            </p>
            <div className="mt-4 grid gap-3">
              <Area label="Catatan investasi" value={investmentNote} onChange={setInvestmentNote} />
              <Area label="Catatan timeline" value={timelineNote} onChange={setTimelineNote} />
            </div>
          </GlassCard>

          <GlassCard>
            <p className="text-sm font-medium">Timeline</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field
                label="Final Order Brief Timeline (client)"
                value={briefTimeline}
                onChange={setBriefTimeline}
              />
              <Field
                label="KERJAKU Estimated Timeline (contoh: 1-2 minggu)"
                value={estimatedTimeline}
                onChange={setEstimatedTimeline}
              />
            </div>
            <div className="mt-3 rounded-2xl border border-border/40 bg-background/30 p-3 text-xs text-muted-foreground">
              {timelineBlock ? (
                <p className="whitespace-pre-wrap">{timelineBlock.lines.join("\n")}</p>
              ) : (
                <p>Belum ada timeline. Isi salah satu field di atas.</p>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Kosong: memakai timeline Final Order Brief. Terisi: memakai estimasi KERJAKU dan
              deadline produksi dihitung otomatis.
            </p>
          </GlassCard>

          <GlassCard>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium">Recommended Enhancement</p>
              <button
                type="button"
                onClick={() =>
                  setEnhancements((prev) => [...prev, { name: "", benefit: "", amount: 0 }])
                }
                className="rounded-xl border border-border/60 px-3 py-1.5 text-xs transition hover:text-foreground"
              >
                + Tambah enhancement
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {enhancements.map((row, index) => (
                <div
                  key={index}
                  className="grid gap-2 rounded-2xl border border-border/40 bg-background/30 p-3 sm:grid-cols-[1.2fr_1.6fr_0.9fr_auto]"
                >
                  <input
                    value={row.name}
                    placeholder="Nama fitur"
                    onChange={(e) =>
                      setEnhancements((prev) =>
                        prev.map((p, i) => (i === index ? { ...p, name: e.target.value } : p)),
                      )
                    }
                    className="rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none focus:border-primary/60"
                  />
                  <input
                    value={row.benefit}
                    placeholder="Benefit"
                    onChange={(e) =>
                      setEnhancements((prev) =>
                        prev.map((p, i) => (i === index ? { ...p, benefit: e.target.value } : p)),
                      )
                    }
                    className="rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none focus:border-primary/60"
                  />
                  <input
                    value={String(row.amount)}
                    inputMode="numeric"
                    placeholder="0"
                    onChange={(e) =>
                      setEnhancements((prev) =>
                        prev.map((p, i) =>
                          i === index
                            ? { ...p, amount: Number(e.target.value.replace(/[^\d]/g, "")) || 0 }
                            : p,
                        ),
                      )
                    }
                    className="rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none focus:border-primary/60"
                  />
                  <button
                    type="button"
                    onClick={() => setEnhancements((prev) => prev.filter((_, i) => i !== index))}
                    className="rounded-xl border border-destructive/40 px-3 py-2 text-xs text-destructive transition hover:bg-destructive/10"
                  >
                    Hapus
                  </button>
                </div>
              ))}
              {!enhancements.length ? (
                <p className="text-xs text-muted-foreground">Belum ada enhancement.</p>
              ) : null}
            </div>
            <p className="mt-3 text-sm font-semibold text-primary">
              Optional Enhancement: {formatIDR(optionalTotal, currency)}
            </p>
          </GlassCard>

          <GlassCard>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium">Isi proposal</p>
              <button
                type="button"
                onClick={() => setSections((prev) => [...prev, { heading: "", body: "" }])}
                className="rounded-xl border border-border/60 px-3 py-1.5 text-xs transition hover:text-foreground"
              >
                + Tambah bagian
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {sections.map((section, index) => (
                <div key={index} className="rounded-2xl border border-border/40 bg-background/30 p-3">
                  <div className="flex gap-2">
                    <input
                      value={section.heading}
                      onChange={(e) =>
                        setSections((prev) =>
                          prev.map((s, i) =>
                            i === index ? { ...s, heading: e.target.value } : s,
                          ),
                        )
                      }
                      className="w-full rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm font-semibold outline-none focus:border-primary/60"
                    />
                    <button
                      type="button"
                      onClick={() => setSections((prev) => prev.filter((_, i) => i !== index))}
                      className="shrink-0 rounded-xl border border-destructive/40 px-3 py-2 text-xs text-destructive transition hover:bg-destructive/10"
                    >
                      Hapus
                    </button>
                  </div>
                  <textarea
                    value={section.body}
                    rows={Math.min(16, Math.max(4, section.body.split("\n").length + 1))}
                    onChange={(e) =>
                      setSections((prev) =>
                        prev.map((s, i) => (i === index ? { ...s, body: e.target.value } : s)),
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-border/60 bg-background/40 p-3 text-sm outline-none focus:border-primary/60"
                  />
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      ) : null}

      {tab === "versions" ? (
        <GlassCard className="print:hidden">
          <p className="text-sm font-medium">Riwayat versi</p>
          {versions.isLoading ? (
            <p className="mt-3 text-xs text-muted-foreground">Memuat versi…</p>
          ) : !versions.data?.length ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Belum ada versi tersimpan. Setiap kali menyimpan, versi sebelumnya diarsipkan di sini.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {versions.data.map((v) => (
                <li
                  key={v.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/40 bg-background/30 p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      Versi {v.version} · {v.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(v.created_at)}
                      {v.note ? ` · ${v.note}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openVersionPreview(v)}
                    className="rounded-xl border border-primary/50 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    disabled={restoreMutation.isPending}
                    onClick={() => restoreMutation.mutate(v.id)}
                    className="rounded-xl border border-border/60 px-3 py-1.5 text-xs transition hover:text-foreground disabled:opacity-60"
                  >
                    Pulihkan
                  </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      ) : null}

      <div
        className={`proposal-print-doc overflow-hidden rounded-3xl border border-border/40 bg-card/40 backdrop-blur-xl ${
          tab === "document" ? "" : "hidden print:block"
        }`}
      >
        <div className="border-b border-border/40 bg-background/40 px-6 py-8 sm:px-10">
          <p className="text-[0.65rem] uppercase tracking-[0.35em] text-primary">KERJAKU</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>Digital Solution Proposal</span>
            <span>·</span>
            <span className="text-primary">{pkg || "-"}</span>
            {clientName ? (
              <>
                <span>·</span>
                <span>{clientName}</span>
              </>
            ) : null}
            {validUntil ? (
              <>
                <span>·</span>
                <span>Berlaku sampai {validUntil}</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="space-y-6 px-6 py-8 sm:px-10">
          {sections.map((section, index) => (
            <section key={index} className="proposal-section">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                {section.heading}
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {section.body}
              </p>
            </section>
          ))}

          {enhancements.length ? (
            <section className="proposal-section">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Recommended Enhancement
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {enhancements.map((row, index) => (
                  <li key={index} className="flex flex-wrap justify-between gap-2">
                    <span>
                      <span className="font-medium">{row.name}</span>
                      {row.benefit ? (
                        <span className="block text-xs text-muted-foreground">{row.benefit}</span>
                      ) : null}
                    </span>
                    <span className="whitespace-nowrap text-primary">
                      {formatIDR(row.amount, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {timelineBlock ? (
            <section className="proposal-section">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                {timelineBlock.heading}
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {timelineBlock.lines.join("\n")}
              </p>
            </section>
          ) : null}

          {pricing.length || enhancements.length ? (
            <section className="proposal-section">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Rincian Investasi
              </h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/40 text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-3">Item</th>
                      <th className="py-2 pr-3">Deskripsi</th>
                      <th className="py-2 text-right">Nilai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricing.length ? (
                      <tr>
                        <td className="pt-3 pb-1 text-xs font-semibold uppercase tracking-wide" colSpan={3}>
                          Core Solution
                        </td>
                      </tr>
                    ) : null}
                    {pricing.map((row, index) => (
                      <tr key={`core-${index}`} className="border-b border-border/20">
                        <td className="py-2 pr-3 font-medium">{row.item}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{row.detail}</td>
                        <td className="py-2 text-right whitespace-nowrap">
                          {formatIDR(row.amount, currency)}
                        </td>
                      </tr>
                    ))}
                    {pricing.length ? (
                      <tr>
                        <td className="py-2 pr-3 text-xs text-muted-foreground" colSpan={2}>
                          Subtotal Core Solution
                        </td>
                        <td className="py-2 text-right font-medium whitespace-nowrap">
                          {formatIDR(coreTotal, currency)}
                        </td>
                      </tr>
                    ) : null}
                    {enhancements.length ? (
                      <tr>
                        <td className="pt-4 pb-1 text-xs font-semibold uppercase tracking-wide" colSpan={3}>
                          Optional Enhancement
                        </td>
                      </tr>
                    ) : null}
                    {enhancements.map((row, index) => (
                      <tr key={`opt-${index}`} className="border-b border-border/20">
                        <td className="py-2 pr-3 font-medium">{row.name}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{row.benefit}</td>
                        <td className="py-2 text-right whitespace-nowrap">
                          {formatIDR(row.amount, currency)}
                        </td>
                      </tr>
                    ))}
                    {enhancements.length ? (
                      <tr>
                        <td className="py-2 pr-3 text-xs text-muted-foreground" colSpan={2}>
                          Subtotal Optional Enhancement
                        </td>
                        <td className="py-2 text-right font-medium whitespace-nowrap">
                          {formatIDR(optionalTotal, currency)}
                        </td>
                      </tr>
                    ) : null}
                    <tr>
                      <td className="py-2 pr-3 font-semibold" colSpan={2}>
                        Total Investment
                      </td>
                      <td className="py-2 text-right font-semibold text-primary whitespace-nowrap">
                        {formatIDR(total, currency)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {investmentNote ? (
                <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                  {investmentNote}
                </p>
              ) : null}
            </section>
          ) : null}
        </div>

        <div className="border-t border-border/40 px-6 py-6 text-xs text-muted-foreground sm:px-10">
          KERJAKU · Business System Consultant · kerjaku.space
        </div>
      </div>

      {previewVersion ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-background/95 p-3 backdrop-blur print:hidden">
          <div className="flex items-center justify-between gap-3 pb-3">
            <p className="truncate text-sm font-medium">{previewVersion.label}</p>
            <button
              type="button"
              onClick={() => {
                URL.revokeObjectURL(previewVersion.url);
                setPreviewVersion(null);
              }}
              className="rounded-xl border border-border/60 px-3 py-1.5 text-xs transition hover:text-foreground"
            >
              Tutup
            </button>
          </div>
          <object
            data={previewVersion.url}
            type="application/pdf"
            className="flex-1 rounded-2xl border border-border/40"
          >
            <iframe src={previewVersion.url} title={previewVersion.label} className="h-full w-full" />
          </object>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-xs text-muted-foreground">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60"
      />
    </label>
  );
}

function Area({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-xs text-muted-foreground">
      {label}
      <textarea
        value={value}
        rows={4}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border/60 bg-background/40 p-3 text-sm text-foreground outline-none focus:border-primary/60"
      />
    </label>
  );
}
