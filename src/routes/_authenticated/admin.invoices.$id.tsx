import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Link2, Mail, MessageCircle, Printer, Save, Settings2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Chip, GlassCard } from "@/components/admin/ui";
import {
  SCHEDULE_PRESETS,
  buildSchedule,
  derivePaymentState,
  fullPaymentSchedule,
  isPaymentType,
  parseSchedule,
  paymentStateClass,
  progressLabel,
  recalcSchedule,
  scheduleRemaining,
  validateSchedule,
  withAutoRemaining,
  type Installment,
  type PaymentType,
} from "@/lib/admin/invoice-schedule";
import {
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
  formatMoney,
  invoiceTotal,
  isPaymentProvider,
  paymentStatusClass,
  type PaymentProviderId,
  type PaymentStatus,
} from "@/lib/admin/payments";
import { parsePricingItems, type PricingItem } from "@/lib/admin/sales-ai";
import {
  createPaymentLinkFn,
  getInvoice,
  saveInvoiceFn,
  setInstallmentStatusFn,
  setInvoiceStatusFn,
} from "@/lib/billing.functions";
import { prepareInvoiceFile } from "@/lib/invoice.functions";
import { normalizeWhatsapp, waLink } from "@/lib/order-brief";

export const Route = createFileRoute("/_authenticated/admin/invoices/$id")({
  component: InvoiceDetailPage,
});

const inputClass =
  "w-full rounded-xl border border-border/50 bg-background/40 px-3 py-2 text-sm outline-none focus:border-primary/60";

function InvoiceDetailPage() {
  const { id } = useParams({ from: "/_authenticated/admin/invoices/$id" });
  const queryClient = useQueryClient();

  const fetchInvoice = useServerFn(getInvoice);
  const save = useServerFn(saveInvoiceFn);
  const setStatus = useServerFn(setInvoiceStatusFn);
  const setInstallment = useServerFn(setInstallmentStatusFn);
  const createLink = useServerFn(createPaymentLinkFn);
  const prepareFile = useServerFn(prepareInvoiceFile);

  const invoice = useQuery({
    queryKey: ["admin", "invoice", id],
    queryFn: () => fetchInvoice({ data: { id } }),
  });

  const [form, setForm] = useState({
    title: "",
    project_name: "",
    client_name: "",
    client_email: "",
    client_whatsapp: "",
    client_company: "",
    packageName: "",
    currency: "IDR",
    due_date: "",
    notes: "",
    provider: "manual_transfer" as PaymentProviderId,
  });
  const [items, setItems] = useState<PricingItem[]>([]);
  const [optionalItems, setOptionalItems] = useState<PricingItem[]>([]);
  const [paymentType, setPaymentType] = useState<PaymentType>("full");
  const [schedule, setSchedule] = useState<Installment[]>([]);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  useEffect(() => {
    const data = invoice.data as Record<string, unknown> | null | undefined;
    if (!data) return;
    setForm({
      title: (data["title"] as string) ?? "",
      project_name: (data["project_name"] as string) ?? (data["package"] as string) ?? "",
      client_name: (data["client_name"] as string) ?? "",
      client_email: (data["client_email"] as string) ?? "",
      client_whatsapp: (data["client_whatsapp"] as string) ?? "",
      client_company: (data["client_company"] as string) ?? "",
      packageName: (data["package"] as string) ?? "",
      currency: (data["currency"] as string) ?? "IDR",
      due_date: (data["due_date"] as string) ?? "",
      notes: (data["notes"] as string) ?? "",
      provider: isPaymentProvider(data["provider"]) ? data["provider"] : "manual_transfer",
    });
    setItems(parsePricingItems(data["items"]));
    setOptionalItems(parsePricingItems(data["optional_items"]));
    const type = isPaymentType(data["payment_type"]) ? data["payment_type"] : "full";
    setPaymentType(type);
    const stored = parseSchedule(data["schedule"]);
    const total = Number(data["amount"]) || 0;
    setSchedule(stored.length ? recalcSchedule(stored, total) : fullPaymentSchedule(total));
  }, [invoice.data]);

  const coreTotal = invoiceTotal(items);
  const optionalTotal = invoiceTotal(optionalItems);
  const total = coreTotal + optionalTotal;

  // Keep derived nominals in sync whenever the investment total changes.
  const normalizedSchedule = useMemo(() => recalcSchedule(schedule, total), [schedule, total]);
  const validity = validateSchedule(normalizedSchedule, total);
  const remaining = scheduleRemaining(normalizedSchedule, total);
  const paymentState = derivePaymentState(normalizedSchedule, total);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "invoice", id] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "invoices"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "billing"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "clients"] });
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          id,
          title: form.title,
          project_name: form.project_name || null,
          client_name: form.client_name || null,
          client_email: form.client_email || null,
          client_whatsapp: form.client_whatsapp || null,
          client_company: form.client_company || null,
          package: form.packageName || null,
          items,
          optional_items: optionalItems,
          currency: form.currency || "IDR",
          due_date: form.due_date || null,
          notes: form.notes || null,
          provider: form.provider,
          payment_type: paymentType,
          schedule: normalizedSchedule,
        },
      }),
    onSuccess: () => {
      toast.success("Invoice tersimpan.");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message || "Gagal menyimpan invoice."),
  });

  const statusMutation = useMutation({
    mutationFn: (status: PaymentStatus) => setStatus({ data: { id, status } }),
    onSuccess: (result, status) => {
      toast.success(
        status === "Paid" && result.clientId
          ? "Pembayaran dikonfirmasi — lead dikonversi menjadi klien."
          : `Status pembayaran: ${status}.`,
      );
      refresh();
    },
    onError: () => toast.error("Gagal memperbarui status."),
  });

  const installmentMutation = useMutation({
    mutationFn: (input: { index: number; status: "Pending" | "Paid" }) =>
      setInstallment({ data: { id, ...input } }),
    onSuccess: (result) => {
      toast.success(`Payment progress: ${result.state}.`);
      refresh();
    },
    onError: (error: Error) => toast.error(error.message || "Gagal memperbarui termin."),
  });

  const linkMutation = useMutation({
    mutationFn: () =>
      createLink({
        data: {
          id,
          provider: form.provider,
          returnUrl: typeof window !== "undefined" ? window.location.origin : null,
        },
      }),
    onSuccess: (result) => {
      toast[result.url ? "success" : "message"](result.instruction);
      refresh();
    },
    onError: (error: Error) => toast.error(error.message || "Gagal membuat payment link."),
  });

  const shareMutation = useMutation({
    mutationFn: () => prepareFile({ data: { id } }),
    onSuccess: (prepared) => {
      const number = normalizeWhatsapp(prepared.whatsapp ?? form.client_whatsapp ?? null);
      window.open(
        number
          ? waLink(number, prepared.message)
          : `https://wa.me/?text=${encodeURIComponent(prepared.message)}`,
        "_blank",
        "noopener",
      );
    },
    onError: (error: Error) => toast.error(error.message || "Gagal menyiapkan invoice."),
  });

  if (invoice.isLoading) {
    return <p className="text-sm text-muted-foreground">Memuat invoice…</p>;
  }
  if (!invoice.data) {
    return <p className="text-sm text-destructive">Invoice tidak ditemukan.</p>;
  }

  const data = invoice.data;
  const savedSchedule = recalcSchedule(
    parseSchedule((data as Record<string, unknown>)["schedule"]),
    Number(data.amount) || 0,
  );

  function applyPreset(presetId: string) {
    const preset = SCHEDULE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setPaymentType(preset.parts.length === 1 ? "full" : "custom");
    setSchedule(buildSchedule(preset.parts, total));
  }

  function patchInstallment(index: number, patch: Partial<Installment>) {
    setSchedule((prev) =>
      recalcSchedule(
        prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
        total,
      ),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          to="/admin/invoices"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Semua invoice
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Chip className={paymentStatusClass(data.status)}>{data.status}</Chip>
          <Chip className={paymentStateClass(paymentState)}>
            {progressLabel(savedSchedule, Number(data.amount) || 0)}
          </Chip>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-border/50 px-3 py-2 text-sm hover:bg-muted/20"
          >
            <Printer className="h-4 w-4" /> PDF / Print
          </button>
          <button
            type="button"
            disabled={saveMutation.isPending || !validity.valid}
            onClick={() => saveMutation.mutate()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> Simpan
          </button>
          <a
            href={`mailto:${data.client_email ?? ""}?subject=${encodeURIComponent(
              `Invoice ${data.number} — KERJAKU`,
            )}&body=${encodeURIComponent(
              `Halo Kak ${data.client_name ?? ""},\n\nBerikut invoice untuk project ${
                form.project_name || "Anda"
              } sebesar ${formatMoney(Number(data.amount) || 0, data.currency ?? "IDR")}.\n\nTerima kasih,\nKERJAKU\nBusiness System Consultant`,
            )}`}
            className="inline-flex items-center gap-2 rounded-xl border border-border/50 px-3 py-2 text-sm hover:bg-muted/20"
          >
            <Mail className="h-4 w-4" /> Email
          </a>
          <button
            type="button"
            disabled={shareMutation.isPending}
            onClick={() => shareMutation.mutate()}
            className="inline-flex items-center gap-2 rounded-xl border border-primary/50 bg-primary/10 px-3 py-2 text-sm text-primary disabled:opacity-60"
          >
            <MessageCircle className="h-4 w-4" />
            {shareMutation.isPending ? "Menyiapkan…" : "Share WhatsApp"}
          </button>
        </div>
      </div>

      {/* Payment schedule */}
      <GlassCard className="print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Payment Schedule</p>
            <p className="text-xs text-muted-foreground">
              Total invoice mengikuti proposal approved: {formatMoney(total, form.currency)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setScheduleOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-xl border border-border/50 px-3 py-2 text-sm hover:bg-muted/20"
          >
            <Settings2 className="h-4 w-4" />
            {scheduleOpen ? "Tutup" : schedule.length > 1 ? "Edit Payment" : "Setting Payment"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["full", "custom"] as PaymentType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setPaymentType(type);
                if (type === "full") setSchedule(fullPaymentSchedule(total));
                else if (schedule.length <= 1) setSchedule(buildSchedule([50, 50], total));
                setScheduleOpen(type === "custom");
              }}
              className={`rounded-xl border px-3 py-1.5 text-xs transition ${
                paymentType === type
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground hover:bg-muted/20"
              }`}
            >
              {type === "full" ? "Full Payment" : "Custom Payment Schedule"}
            </button>
          ))}
        </div>

        {scheduleOpen && (
          <div className="mt-4 space-y-4 rounded-2xl border border-border/40 p-4">
            <div className="flex flex-wrap gap-2">
              {SCHEDULE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className="rounded-xl border border-border/50 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/20"
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSchedule((prev) => withAutoRemaining(prev, total))}
                className="rounded-xl border border-primary/40 px-3 py-1.5 text-xs text-primary hover:bg-primary/10"
              >
                Auto pelunasan sisa
              </button>
            </div>

            {normalizedSchedule.map((item, index) => (
              <div
                key={index}
                className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_110px_140px_auto]"
              >
                <input
                  className={inputClass}
                  placeholder="Nama termin"
                  value={item.name}
                  onChange={(e) => patchInstallment(index, { name: e.target.value })}
                />
                <input
                  className={inputClass}
                  placeholder="Keterangan"
                  value={item.note}
                  onChange={(e) => patchInstallment(index, { note: e.target.value })}
                />
                <select
                  className={inputClass}
                  value={item.mode}
                  onChange={(e) =>
                    patchInstallment(index, { mode: e.target.value as Installment["mode"] })
                  }
                >
                  <option value="percent">Persentase</option>
                  <option value="amount">Nominal</option>
                </select>
                <input
                  className={inputClass}
                  inputMode="numeric"
                  value={item.mode === "percent" ? item.percent : item.amount}
                  onChange={(e) =>
                    patchInstallment(
                      index,
                      item.mode === "percent"
                        ? { percent: Number(e.target.value) || 0 }
                        : { amount: Number(e.target.value) || 0 },
                    )
                  }
                />
                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {Math.round(item.percent)}% · {formatMoney(item.amount, form.currency)}
                  </span>
                  <button
                    type="button"
                    aria-label="Hapus termin"
                    onClick={() => setSchedule((prev) => prev.filter((_, i) => i !== index))}
                    className="rounded-xl border border-border/50 px-2 py-1 text-xs text-muted-foreground hover:bg-muted/20"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setSchedule((prev) => [
                  ...prev,
                  {
                    name: `Pembayaran ${prev.length + 1}`,
                    note: "",
                    mode: "percent",
                    percent: 0,
                    amount: 0,
                    status: "Pending",
                    paid_at: null,
                  },
                ])
              }
              className="rounded-xl border border-border/50 px-3 py-2 text-xs hover:bg-muted/20"
            >
              + Tambah termin
            </button>
          </div>
        )}

        <div className="mt-4 space-y-2">
          {savedSchedule.map((item, index) => (
            <div
              key={index}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/40 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  DP {index + 1} · {item.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.note || "-"} · {Math.round(item.percent)}% ·{" "}
                  {formatMoney(item.amount, data.currency ?? "IDR")}
                </p>
              </div>
              <button
                type="button"
                disabled={installmentMutation.isPending}
                onClick={() =>
                  installmentMutation.mutate({
                    index,
                    status: item.status === "Paid" ? "Pending" : "Paid",
                  })
                }
                className={`rounded-xl border px-3 py-1.5 text-xs ${
                  item.status === "Paid"
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/50 text-muted-foreground"
                }`}
              >
                {item.status === "Paid" ? "Paid" : "Tandai Paid"}
              </button>
            </div>
          ))}
        </div>

        {!validity.valid && (
          <p className="mt-3 text-xs text-destructive">
            {validity.message} {remaining !== 0 ? `(${formatMoney(Math.abs(remaining), form.currency)})` : ""}
          </p>
        )}
      </GlassCard>

      {/* Payment provider */}
      <GlassCard className="print:hidden">
        <p className="text-sm font-medium">Payment Provider</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Provider
            </label>
            <select
              value={form.provider}
              onChange={(e) =>
                setForm((f) => ({ ...f, provider: e.target.value as PaymentProviderId }))
              }
              className={`${inputClass} mt-2`}
            >
              {PAYMENT_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={linkMutation.isPending}
              onClick={() => linkMutation.mutate()}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border/50 px-3 py-2 text-sm hover:bg-muted/20 disabled:opacity-60"
            >
              <Link2 className="h-4 w-4" /> Buat payment link
            </button>
            {data.payment_link ? (
              <a
                href={data.payment_link}
                target="_blank"
                rel="noreferrer"
                className="mt-3 block truncate text-xs text-primary underline"
              >
                {data.payment_link}
              </a>
            ) : null}
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Status invoice
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PAYMENT_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate(status)}
                  className={`rounded-xl border px-3 py-1.5 text-xs transition hover:opacity-80 ${
                    data.status === status
                      ? paymentStatusClass(status)
                      : "border-border/50 text-muted-foreground"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Editor */}
      <GlassCard className="print:hidden">
        <p className="text-sm font-medium">Detail invoice</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Judul" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} />
          <Field
            label="Project"
            value={form.project_name}
            onChange={(v) => setForm((f) => ({ ...f, project_name: v }))}
          />
          <Field
            label="Nama klien"
            value={form.client_name}
            onChange={(v) => setForm((f) => ({ ...f, client_name: v }))}
          />
          <Field
            label="Email"
            value={form.client_email}
            onChange={(v) => setForm((f) => ({ ...f, client_email: v }))}
          />
          <Field
            label="WhatsApp"
            value={form.client_whatsapp}
            onChange={(v) => setForm((f) => ({ ...f, client_whatsapp: v }))}
          />
          <Field
            label="Business name"
            value={form.client_company}
            onChange={(v) => setForm((f) => ({ ...f, client_company: v }))}
          />
          <Field
            label="Mata uang"
            value={form.currency}
            onChange={(v) => setForm((f) => ({ ...f, currency: v.toUpperCase() }))}
          />
          <Field
            label="Jatuh tempo"
            type="date"
            value={form.due_date}
            onChange={(v) => setForm((f) => ({ ...f, due_date: v }))}
          />
        </div>

        <LineEditor
          title="Core Solution"
          items={items}
          currency={form.currency}
          onChange={setItems}
        />
        <LineEditor
          title="Optional Enhancement"
          items={optionalItems}
          currency={form.currency}
          onChange={setOptionalItems}
        />

        <div className="mt-4 rounded-xl border border-border/40 px-3 py-3 text-sm">
          <Row label="Core Solution" value={formatMoney(coreTotal, form.currency)} />
          <Row label="Optional Enhancement" value={formatMoney(optionalTotal, form.currency)} />
          <Row label="Total Investment" value={formatMoney(total, form.currency)} strong />
        </div>

        <div className="mt-4">
          <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Catatan
          </label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className={`${inputClass} mt-2`}
          />
        </div>
      </GlassCard>

      {/* Printable document */}
      <GlassCard className="proposal-print-doc">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-lg font-semibold tracking-tight">KERJAKU</p>
            <p className="text-xs text-muted-foreground">Business System Consultant</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">INVOICE {data.number}</p>
            <p className="text-xs text-muted-foreground">
              Jatuh tempo: {form.due_date || "-"} · {paymentState}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="proposal-section">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Bill To</p>
            <p className="mt-1 text-sm font-medium">{form.client_name || "-"}</p>
            <p className="text-xs text-muted-foreground">{form.client_company || "-"}</p>
            <p className="text-xs text-muted-foreground">{form.client_email || "-"}</p>
            <p className="text-xs text-muted-foreground">{form.client_whatsapp || "-"}</p>
          </div>
          <div className="proposal-section sm:text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Project</p>
            <p className="mt-1 text-sm font-medium">{form.project_name || "-"}</p>
          </div>
        </div>

        <PrintTable title="Core Solution" items={items} currency={form.currency} />
        <PrintTable title="Optional Enhancement" items={optionalItems} currency={form.currency} />

        <div className="mt-4 flex justify-end">
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Total Investment
            </p>
            <p className="text-xl font-semibold tabular-nums">{formatMoney(total, form.currency)}</p>
          </div>
        </div>

        <p className="mt-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Payment Terms
        </p>
        <table className="mt-2 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/40 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <th className="py-2">Tahap</th>
              <th className="py-2">Keterangan</th>
              <th className="py-2 text-right">%</th>
              <th className="py-2 text-right">Jumlah</th>
              <th className="py-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {normalizedSchedule.map((item, index) => (
              <tr key={index} className="border-b border-border/20">
                <td className="py-2 pr-3">
                  {paymentType === "full" ? "Full Payment" : `DP ${index + 1} · ${item.name}`}
                </td>
                <td className="py-2 pr-3 text-muted-foreground">{item.note || "-"}</td>
                <td className="py-2 text-right tabular-nums">{Math.round(item.percent)}%</td>
                <td className="py-2 text-right tabular-nums">
                  {formatMoney(item.amount, form.currency)}
                </td>
                <td className="py-2 text-right">{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {form.notes ? (
          <p className="proposal-section mt-6 whitespace-pre-wrap text-xs text-muted-foreground">
            {form.notes}
          </p>
        ) : null}
      </GlassCard>
    </div>
  );
}

function PrintTable({
  title,
  items,
  currency,
}: {
  title: string;
  items: PricingItem[];
  currency: string;
}) {
  if (!items.length) return null;
  return (
    <>
      <p className="mt-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
      <table className="mt-2 w-full text-left text-sm">
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="border-b border-border/20 align-top">
              <td className="py-2 pr-3">{item.item}</td>
              <td className="py-2 pr-3 text-muted-foreground">{item.detail}</td>
              <td className="py-2 text-right tabular-nums">{formatMoney(item.amount, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function LineEditor({
  title,
  items,
  currency,
  onChange,
}: {
  title: string;
  items: PricingItem[];
  currency: string;
  onChange: (items: PricingItem[]) => void;
}) {
  return (
    <>
      <p className="mt-6 text-sm font-medium">
        {title}{" "}
        <span className="text-xs text-muted-foreground">
          ({formatMoney(invoiceTotal(items), currency)})
        </span>
      </p>
      <div className="mt-3 space-y-3">
        {items.map((item, index) => (
          <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px]">
            <input
              className={inputClass}
              value={item.item}
              onChange={(e) =>
                onChange(items.map((it, i) => (i === index ? { ...it, item: e.target.value } : it)))
              }
            />
            <input
              className={inputClass}
              value={item.detail}
              onChange={(e) =>
                onChange(
                  items.map((it, i) => (i === index ? { ...it, detail: e.target.value } : it)),
                )
              }
            />
            <div className="flex gap-2">
              <input
                className={inputClass}
                inputMode="numeric"
                value={item.amount}
                onChange={(e) =>
                  onChange(
                    items.map((it, i) =>
                      i === index ? { ...it, amount: Number(e.target.value) || 0 } : it,
                    ),
                  )
                }
              />
              <button
                type="button"
                aria-label="Hapus item"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                className="shrink-0 rounded-xl border border-border/50 px-3 text-xs text-muted-foreground hover:bg-muted/20"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...items, { item: "", detail: "", amount: 0 }])}
          className="rounded-xl border border-border/50 px-3 py-2 text-xs hover:bg-muted/20"
        >
          + Tambah item
        </button>
      </div>
    </>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={strong ? "font-medium" : "text-muted-foreground"}>{label}</span>
      <span className={`tabular-nums ${strong ? "font-semibold" : ""}`}>{value}</span>
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
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} mt-2`}
      />
    </div>
  );
}
