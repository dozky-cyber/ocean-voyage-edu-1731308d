import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Link2, Mail, Printer, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Chip, GlassCard } from "@/components/admin/ui";
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
  setInvoiceStatusFn,
} from "@/lib/billing.functions";

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
  const createLink = useServerFn(createPaymentLinkFn);

  const invoice = useQuery({
    queryKey: ["admin", "invoice", id],
    queryFn: () => fetchInvoice({ data: { id } }),
  });

  const [form, setForm] = useState({
    title: "",
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

  useEffect(() => {
    const data = invoice.data;
    if (!data) return;
    setForm({
      title: data.title ?? "",
      client_name: data.client_name ?? "",
      client_email: data.client_email ?? "",
      client_whatsapp: data.client_whatsapp ?? "",
      client_company: data.client_company ?? "",
      packageName: data.package ?? "",
      currency: data.currency ?? "IDR",
      due_date: data.due_date ?? "",
      notes: data.notes ?? "",
      provider: isPaymentProvider(data.provider) ? data.provider : "manual_transfer",
    });
    setItems(parsePricingItems(data.items));
  }, [invoice.data]);

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
          client_name: form.client_name || null,
          client_email: form.client_email || null,
          client_whatsapp: form.client_whatsapp || null,
          client_company: form.client_company || null,
          package: form.packageName || null,
          items,
          currency: form.currency || "IDR",
          due_date: form.due_date || null,
          notes: form.notes || null,
          provider: form.provider,
        },
      }),
    onSuccess: () => {
      toast.success("Invoice tersimpan.");
      refresh();
    },
    onError: () => toast.error("Gagal menyimpan invoice."),
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

  if (invoice.isLoading) {
    return <p className="text-sm text-muted-foreground">Memuat invoice…</p>;
  }
  if (!invoice.data) {
    return <p className="text-sm text-destructive">Invoice tidak ditemukan.</p>;
  }

  const data = invoice.data;
  const total = invoiceTotal(items);

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
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-border/50 px-3 py-2 text-sm hover:bg-muted/20"
          >
            <Printer className="h-4 w-4" /> PDF / Print
          </button>
          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> Simpan
          </button>
        </div>
      </div>

      {/* Payment control */}
      <GlassCard className="print:hidden">
        <p className="text-sm font-medium">Payment</p>
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
              Status pembayaran
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
            <a
              href={`mailto:${data.client_email ?? ""}?subject=${encodeURIComponent(
                `Invoice ${data.number} — KERJAKU`,
              )}&body=${encodeURIComponent(
                `Halo ${data.client_name ?? ""},\n\nBerikut invoice ${data.number} sebesar ${formatMoney(
                  Number(data.amount) || 0,
                  data.currency ?? "IDR",
                )} dengan jatuh tempo ${data.due_date ?? "-"}.\n${
                  data.payment_link ? `\nLink pembayaran: ${data.payment_link}\n` : ""
                }\nTerima kasih,\nKERJAKU`,
              )}`}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border/50 px-3 py-2 text-sm hover:bg-muted/20"
            >
              <Mail className="h-4 w-4" /> Kirim via email
            </a>
          </div>
        </div>
      </GlassCard>

      {/* Editor */}
      <GlassCard className="print:hidden">
        <p className="text-sm font-medium">Detail invoice</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Judul" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} />
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
            label="Perusahaan"
            value={form.client_company}
            onChange={(v) => setForm((f) => ({ ...f, client_company: v }))}
          />
          <Field
            label="Paket"
            value={form.packageName}
            onChange={(v) => setForm((f) => ({ ...f, packageName: v }))}
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

        <p className="mt-6 text-sm font-medium">Item pembayaran</p>
        <div className="mt-3 space-y-3">
          {items.map((item, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px]">
              <input
                className={inputClass}
                value={item.item}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((it, i) => (i === index ? { ...it, item: e.target.value } : it)),
                  )
                }
              />
              <input
                className={inputClass}
                value={item.detail}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((it, i) => (i === index ? { ...it, detail: e.target.value } : it)),
                  )
                }
              />
              <div className="flex gap-2">
                <input
                  className={inputClass}
                  inputMode="numeric"
                  value={item.amount}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((it, i) =>
                        i === index ? { ...it, amount: Number(e.target.value) || 0 } : it,
                      ),
                    )
                  }
                />
                <button
                  type="button"
                  aria-label="Hapus item"
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                  className="shrink-0 rounded-xl border border-border/50 px-3 text-xs text-muted-foreground hover:bg-muted/20"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, { item: "", detail: "", amount: 0 }])}
            className="rounded-xl border border-border/50 px-3 py-2 text-xs hover:bg-muted/20"
          >
            + Tambah item
          </button>
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
            <p className="text-xs text-muted-foreground">Work, made your way.</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">INVOICE {data.number}</p>
            <p className="text-xs text-muted-foreground">
              Jatuh tempo: {form.due_date || "-"} · Status: {data.status}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="proposal-section">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ditagihkan kepada</p>
            <p className="mt-1 text-sm font-medium">{form.client_name || "-"}</p>
            <p className="text-xs text-muted-foreground">{form.client_company || "-"}</p>
            <p className="text-xs text-muted-foreground">{form.client_email || "-"}</p>
            <p className="text-xs text-muted-foreground">{form.client_whatsapp || "-"}</p>
          </div>
          <div className="proposal-section sm:text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Paket</p>
            <p className="mt-1 text-sm font-medium">{form.packageName || "-"}</p>
            <p className="text-xs text-muted-foreground">{form.title}</p>
          </div>
        </div>

        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/40 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <th className="py-2">Item</th>
              <th className="py-2">Detail</th>
              <th className="py-2 text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b border-border/20 align-top">
                <td className="py-2 pr-3">{item.item}</td>
                <td className="py-2 pr-3 text-muted-foreground">{item.detail}</td>
                <td className="py-2 text-right tabular-nums">
                  {formatMoney(item.amount, form.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total</p>
            <p className="text-xl font-semibold tabular-nums">{formatMoney(total, form.currency)}</p>
          </div>
        </div>

        {form.notes ? (
          <p className="proposal-section mt-6 whitespace-pre-wrap text-xs text-muted-foreground">
            {form.notes}
          </p>
        ) : null}
      </GlassCard>
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
