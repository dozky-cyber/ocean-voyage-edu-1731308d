/**
 * KERJAKU Payment & Client Conversion — client-safe constants and pure helpers.
 *
 * The payment layer is provider-agnostic: the UI only ever talks about a
 * provider id, and the server-side adapter registry decides how a payment link
 * is produced (PayPal, Stripe, Xendit, Midtrans or a manual bank transfer).
 */

import { formatIDR, pricingTotal, type PricingItem } from "@/lib/admin/sales-ai";

export const PAYMENT_STATUSES = [
  "Pending",
  "Payment Link Sent",
  "Paid",
  "Failed",
  "Refunded",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export function isPaymentStatus(value: unknown): value is PaymentStatus {
  return typeof value === "string" && (PAYMENT_STATUSES as readonly string[]).includes(value);
}

export function paymentStatusClass(status: string): string {
  switch (status) {
    case "Paid":
      return "bg-primary/15 text-primary border-primary/30";
    case "Failed":
      return "bg-destructive/15 text-destructive border-destructive/30";
    case "Refunded":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "Payment Link Sent":
      return "bg-accent/20 text-accent-foreground border-accent/30";
    default:
      return "bg-secondary/40 text-secondary-foreground border-border/60";
  }
}

export const PAYMENT_PROVIDER_IDS = [
  "manual_transfer",
  "paypal",
  "stripe",
  "xendit",
  "midtrans",
] as const;

export type PaymentProviderId = (typeof PAYMENT_PROVIDER_IDS)[number];

export function isPaymentProvider(value: unknown): value is PaymentProviderId {
  return typeof value === "string" && (PAYMENT_PROVIDER_IDS as readonly string[]).includes(value);
}

export type PaymentProviderMeta = {
  id: PaymentProviderId;
  label: string;
  description: string;
  /** Currencies the provider is normally used with. */
  currencies: string[];
  /** True when the adapter can mint a checkout link automatically. */
  supportsHostedLink: boolean;
  /** Env keys the server adapter needs before it can go live. */
  requiredSecrets: string[];
};

export const PAYMENT_PROVIDERS: PaymentProviderMeta[] = [
  {
    id: "manual_transfer",
    label: "Manual Transfer",
    description: "Transfer bank / e-wallet, dikonfirmasi manual oleh tim KERJAKU.",
    currencies: ["IDR"],
    supportsHostedLink: false,
    requiredSecrets: [],
  },
  {
    id: "xendit",
    label: "Xendit",
    description: "Invoice link Indonesia (VA, QRIS, e-wallet, kartu).",
    currencies: ["IDR"],
    supportsHostedLink: true,
    requiredSecrets: ["XENDIT_SECRET_KEY"],
  },
  {
    id: "midtrans",
    label: "Midtrans",
    description: "Snap payment page untuk pasar Indonesia.",
    currencies: ["IDR"],
    supportsHostedLink: true,
    requiredSecrets: ["MIDTRANS_SERVER_KEY"],
  },
  {
    id: "stripe",
    label: "Stripe",
    description: "Checkout internasional dengan kartu dan metode lokal.",
    currencies: ["USD", "SGD", "EUR", "IDR"],
    supportsHostedLink: true,
    requiredSecrets: ["STRIPE_SECRET_KEY"],
  },
  {
    id: "paypal",
    label: "PayPal",
    description: "Pembayaran lintas negara untuk klien luar Indonesia.",
    currencies: ["USD", "EUR", "SGD"],
    supportsHostedLink: true,
    requiredSecrets: ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"],
  },
];

export function providerMeta(id: string): PaymentProviderMeta {
  return PAYMENT_PROVIDERS.find((p) => p.id === id) ?? PAYMENT_PROVIDERS[0]!;
}

export function providerLabel(id: string): string {
  return providerMeta(id).label;
}

/** INV-YYYYMM-XXXX — human readable and sortable. */
export function buildInvoiceNumber(seed = Date.now()): string {
  const now = new Date(seed);
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const suffix = String(Math.floor(1000 + Math.random() * 9000));
  return `INV-${stamp}-${suffix}`;
}

export function invoiceTotal(items: PricingItem[]): number {
  return pricingTotal(items);
}

export function formatMoney(amount: number, currency = "IDR"): string {
  return formatIDR(amount, currency);
}

export function dueDateFromNow(days = 7): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Client project lifecycle used by the client portal timeline. */
export const PROJECT_STATUSES = [
  "Onboarding",
  "Discovery",
  "Design",
  "Development",
  "Testing",
  "Live",
  "Completed",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type TimelineStep = { title: string; detail: string; done: boolean; date?: string | null };

export function parseTimeline(value: unknown): TimelineStep[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((step) =>
    step && typeof step === "object"
      ? [
          {
            title: String((step as { title?: unknown }).title ?? ""),
            detail: String((step as { detail?: unknown }).detail ?? ""),
            done: Boolean((step as { done?: unknown }).done),
            date: ((step as { date?: unknown }).date as string | null) ?? null,
          },
        ]
      : [],
  );
}

/** Default onboarding timeline created when a lead converts into a client. */
export function defaultTimeline(): TimelineStep[] {
  return [
    { title: "Kickoff & Onboarding", detail: "Alignment tujuan, akses, dan channel komunikasi.", done: true },
    { title: "Discovery & Blueprint", detail: "Pemetaan alur kerja dan struktur data.", done: false },
    { title: "Design & Prototype", detail: "UI/UX dan alur utama disetujui klien.", done: false },
    { title: "Development", detail: "Pembangunan sistem dan integrasi.", done: false },
    { title: "Testing & UAT", detail: "Pengujian bersama tim klien.", done: false },
    { title: "Go Live", detail: "Deployment, pelatihan, dan pendampingan.", done: false },
  ];
}

export function timelineProgress(steps: TimelineStep[]): number {
  if (steps.length === 0) return 0;
  return Math.round((steps.filter((s) => s.done).length / steps.length) * 100);
}
