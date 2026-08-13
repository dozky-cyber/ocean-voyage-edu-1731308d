/**
 * KERJAKU Invoice V3 — payment type & payment schedule (client-safe helpers).
 *
 * An invoice is either paid in full (a single 100% term) or through a custom
 * schedule of terms. Every term can be entered as a percentage OR as a nominal
 * amount; the counterpart value is always derived from the invoice total so the
 * document can never drift away from the approved proposal.
 */

export const PAYMENT_TYPES = ["full", "custom"] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export type InstallmentStatus = "Pending" | "Paid";
export type InstallmentMode = "percent" | "amount";

export type Installment = {
  name: string;
  note: string;
  mode: InstallmentMode;
  percent: number;
  amount: number;
  status: InstallmentStatus;
  paid_at?: string | null;
};

export const SCHEDULE_PRESETS: { id: string; label: string; parts: number[] }[] = [
  { id: "full", label: "1x — Full Payment", parts: [100] },
  { id: "50-50", label: "2x — 50 / 50", parts: [50, 50] },
  { id: "30-40-30", label: "3x — 30 / 40 / 30", parts: [30, 40, 30] },
  { id: "25-25-50", label: "3x — 25 / 25 / 50", parts: [25, 25, 50] },
  { id: "50-30-20", label: "3x — 50 / 30 / 20", parts: [50, 30, 20] },
];

const DEFAULT_NAMES = ["DP Awal", "Progress Project", "Final Payment", "Pembayaran 4", "Pembayaran 5"];
const DEFAULT_NOTES = ["Kick Off Project", "Progress Development", "Go Live & Serah Terima", "", ""];

export function round(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function isPaymentType(value: unknown): value is PaymentType {
  return value === "full" || value === "custom";
}

export function parseSchedule(value: unknown): Installment[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const row = raw as Record<string, unknown>;
    return [
      {
        name: String(row["name"] ?? "Pembayaran"),
        note: String(row["note"] ?? ""),
        mode: row["mode"] === "amount" ? ("amount" as const) : ("percent" as const),
        percent: Number(row["percent"] ?? 0) || 0,
        amount: Number(row["amount"] ?? 0) || 0,
        status: row["status"] === "Paid" ? ("Paid" as const) : ("Pending" as const),
        paid_at: (row["paid_at"] as string | null) ?? null,
      },
    ];
  });
}

/** Recompute the derived side (amount from percent, or percent from amount). */
export function recalcSchedule(items: Installment[], total: number): Installment[] {
  const safeTotal = Number(total) || 0;
  return items.map((item) => {
    if (item.mode === "amount") {
      const amount = round(item.amount);
      return { ...item, amount, percent: safeTotal > 0 ? round((amount / safeTotal) * 100) : 0 };
    }
    const percent = round(item.percent);
    return { ...item, percent, amount: round((safeTotal * percent) / 100) };
  });
}

export function scheduleAllocated(items: Installment[]): number {
  return round(items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
}

export function scheduleRemaining(items: Installment[], total: number): number {
  return round((Number(total) || 0) - scheduleAllocated(items));
}

/**
 * PART 5 — when the admin only defines a down payment, the remaining balance is
 * appended automatically as "Pelunasan".
 */
export function withAutoRemaining(items: Installment[], total: number): Installment[] {
  const normalized = recalcSchedule(items, total);
  const remaining = scheduleRemaining(normalized, total);
  if (remaining <= 0.5) return normalized;
  const safeTotal = Number(total) || 0;
  return [
    ...normalized,
    {
      name: "Pelunasan",
      note: "Sisa pembayaran project",
      mode: "amount",
      amount: remaining,
      percent: safeTotal > 0 ? round((remaining / safeTotal) * 100) : 0,
      status: "Pending",
      paid_at: null,
    },
  ];
}

export function buildSchedule(parts: number[], total: number): Installment[] {
  return recalcSchedule(
    parts.map((percent, index) => ({
      name: parts.length === 1 ? "Full Payment" : (DEFAULT_NAMES[index] ?? `Pembayaran ${index + 1}`),
      note: parts.length === 1 ? "Pembayaran penuh" : (DEFAULT_NOTES[index] ?? ""),
      mode: "percent" as const,
      percent,
      amount: 0,
      status: "Pending" as const,
      paid_at: null,
    })),
    total,
  );
}

export function fullPaymentSchedule(total: number): Installment[] {
  return buildSchedule([100], total);
}

/** PART 7 — the schedule must always allocate exactly 100% of the invoice. */
export function validateSchedule(
  items: Installment[],
  total: number,
): { valid: boolean; message: string | null } {
  if (!items.length) return { valid: false, message: "Belum ada termin pembayaran." };
  if (items.some((item) => !item.name.trim())) {
    return { valid: false, message: "Setiap termin wajib memiliki nama pembayaran." };
  }
  const diff = scheduleRemaining(items, total);
  if (diff > 0.5) return { valid: false, message: "Masih ada sisa pembayaran yang belum dialokasikan." };
  if (diff < -0.5) return { valid: false, message: "Total pembayaran melebihi nilai invoice." };
  return { valid: true, message: null };
}

export function paidAmount(items: Installment[]): number {
  return round(
    items.filter((item) => item.status === "Paid").reduce((sum, item) => sum + item.amount, 0),
  );
}

export function paymentProgress(items: Installment[], total: number): number {
  const safeTotal = Number(total) || 0;
  if (safeTotal <= 0) return 0;
  return Math.min(100, Math.round((paidAmount(items) / safeTotal) * 100));
}

export type InvoicePaymentState = "Belum Bayar" | "Partial Payment" | "Fully Paid";

/** PART 10 — invoice level payment state derived from the term statuses. */
export function derivePaymentState(items: Installment[], total: number): InvoicePaymentState {
  const paid = paidAmount(items);
  if (paid <= 0) return "Belum Bayar";
  if (paid + 0.5 >= (Number(total) || 0)) return "Fully Paid";
  return "Partial Payment";
}

export function paymentStateClass(state: InvoicePaymentState): string {
  switch (state) {
    case "Fully Paid":
      return "bg-primary/15 text-primary border-primary/30";
    case "Partial Payment":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    default:
      return "bg-secondary/40 text-secondary-foreground border-border/60";
  }
}

export function progressLabel(items: Installment[], total: number): string {
  const progress = paymentProgress(items, total);
  return progress >= 100 ? "100% Completed" : `${progress}% Paid`;
}
