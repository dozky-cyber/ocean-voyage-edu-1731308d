/**
 * Payment provider integration layer — server only.
 *
 * Every provider implements the same tiny adapter contract so the Business OS
 * never hardcodes a single processor. Adapters stay dormant until their
 * credentials exist; without credentials they return a manual instruction so
 * the sales team can still send bank-transfer details.
 */

import {
  PAYMENT_PROVIDERS,
  providerMeta,
  type PaymentProviderId,
} from "@/lib/admin/payments";

export type PaymentIntentInput = {
  invoiceId: string;
  number: string;
  title: string;
  amount: number;
  currency: string;
  clientName: string | null;
  clientEmail: string | null;
  dueDate: string | null;
  returnUrl?: string | null;
};

export type PaymentIntentResult = {
  provider: PaymentProviderId;
  /** Hosted checkout URL when the provider could mint one. */
  url: string | null;
  reference: string | null;
  /** Manual/next-step instruction shown to the sales team. */
  instruction: string;
  configured: boolean;
};

export type PaymentProviderAdapter = {
  id: PaymentProviderId;
  isConfigured: () => boolean;
  createPaymentLink: (input: PaymentIntentInput) => Promise<PaymentIntentResult>;
};

function missingSecretsResult(
  id: PaymentProviderId,
  missing: string[],
): PaymentIntentResult {
  const meta = providerMeta(id);
  return {
    provider: id,
    url: null,
    reference: null,
    configured: false,
    instruction:
      `${meta.label} belum aktif. Tambahkan kredensial (${missing.join(", ")}) untuk ` +
      `membuat payment link otomatis. Sementara ini kirim instruksi pembayaran manual.`,
  };
}

function readSecrets(keys: string[]): { values: Record<string, string>; missing: string[] } {
  const values: Record<string, string> = {};
  const missing: string[] = [];
  for (const key of keys) {
    const value = process.env[key];
    if (value) values[key] = value;
    else missing.push(key);
  }
  return { values, missing };
}

/** Manual transfer — always available, no external call. */
const manualAdapter: PaymentProviderAdapter = {
  id: "manual_transfer",
  isConfigured: () => true,
  createPaymentLink: async (input) => ({
    provider: "manual_transfer",
    url: null,
    reference: input.number,
    configured: true,
    instruction:
      `Kirim detail rekening KERJAKU beserta nomor invoice ${input.number} kepada klien, ` +
      `lalu tandai invoice sebagai Paid setelah dana diterima.`,
  }),
};

/** Xendit invoice API. */
const xenditAdapter: PaymentProviderAdapter = {
  id: "xendit",
  isConfigured: () => Boolean(process.env["XENDIT_SECRET_KEY"]),
  createPaymentLink: async (input) => {
    const { values, missing } = readSecrets(["XENDIT_SECRET_KEY"]);
    if (missing.length) return missingSecretsResult("xendit", missing);

    const response = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${values["XENDIT_SECRET_KEY"]}:`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        external_id: input.number,
        amount: Math.round(input.amount),
        currency: input.currency || "IDR",
        description: input.title,
        payer_email: input.clientEmail ?? undefined,
        success_redirect_url: input.returnUrl ?? undefined,
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Xendit gagal membuat invoice [${response.status}]: ${body}`);
    }
    const json = (await response.json()) as { id?: string; invoice_url?: string };
    return {
      provider: "xendit",
      url: json.invoice_url ?? null,
      reference: json.id ?? null,
      configured: true,
      instruction: "Payment link Xendit siap dikirim ke klien.",
    };
  },
};

/** Midtrans Snap transaction. */
const midtransAdapter: PaymentProviderAdapter = {
  id: "midtrans",
  isConfigured: () => Boolean(process.env["MIDTRANS_SERVER_KEY"]),
  createPaymentLink: async (input) => {
    const { values, missing } = readSecrets(["MIDTRANS_SERVER_KEY"]);
    if (missing.length) return missingSecretsResult("midtrans", missing);

    const production = process.env["MIDTRANS_ENVIRONMENT"] === "production";
    const host = production
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    const response = await fetch(host, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${values["MIDTRANS_SERVER_KEY"]}:`)}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: input.number,
          gross_amount: Math.round(input.amount),
        },
        customer_details: {
          first_name: input.clientName ?? "Client",
          email: input.clientEmail ?? undefined,
        },
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Midtrans gagal membuat transaksi [${response.status}]: ${body}`);
    }
    const json = (await response.json()) as { token?: string; redirect_url?: string };
    return {
      provider: "midtrans",
      url: json.redirect_url ?? null,
      reference: json.token ?? null,
      configured: true,
      instruction: "Snap payment page Midtrans siap dikirim ke klien.",
    };
  },
};

/** Stripe payment link (price created inline). */
const stripeAdapter: PaymentProviderAdapter = {
  id: "stripe",
  isConfigured: () => Boolean(process.env["STRIPE_SECRET_KEY"]),
  createPaymentLink: async (input) => {
    const { values, missing } = readSecrets(["STRIPE_SECRET_KEY"]);
    if (missing.length) return missingSecretsResult("stripe", missing);

    const zeroDecimal = ["IDR", "JPY", "VND"].includes((input.currency || "IDR").toUpperCase());
    const unitAmount = Math.round(zeroDecimal ? input.amount : input.amount * 100);

    const priceBody = new URLSearchParams({
      currency: (input.currency || "IDR").toLowerCase(),
      unit_amount: String(unitAmount),
      "product_data[name]": `${input.title} (${input.number})`,
    });
    const priceRes = await fetch("https://api.stripe.com/v1/prices", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${values["STRIPE_SECRET_KEY"]}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: priceBody,
    });
    if (!priceRes.ok) {
      throw new Error(`Stripe gagal membuat harga [${priceRes.status}]: ${await priceRes.text()}`);
    }
    const price = (await priceRes.json()) as { id?: string };

    const linkBody = new URLSearchParams({
      "line_items[0][price]": price.id ?? "",
      "line_items[0][quantity]": "1",
    });
    const linkRes = await fetch("https://api.stripe.com/v1/payment_links", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${values["STRIPE_SECRET_KEY"]}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: linkBody,
    });
    if (!linkRes.ok) {
      throw new Error(`Stripe gagal membuat link [${linkRes.status}]: ${await linkRes.text()}`);
    }
    const link = (await linkRes.json()) as { id?: string; url?: string };
    return {
      provider: "stripe",
      url: link.url ?? null,
      reference: link.id ?? null,
      configured: true,
      instruction: "Stripe payment link siap dikirim ke klien.",
    };
  },
};

/** PayPal order (checkout approval link). */
const paypalAdapter: PaymentProviderAdapter = {
  id: "paypal",
  isConfigured: () =>
    Boolean(process.env["PAYPAL_CLIENT_ID"] && process.env["PAYPAL_CLIENT_SECRET"]),
  createPaymentLink: async (input) => {
    const { values, missing } = readSecrets(["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"]);
    if (missing.length) return missingSecretsResult("paypal", missing);

    const host =
      process.env["PAYPAL_ENVIRONMENT"] === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";

    const tokenRes = await fetch(`${host}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${values["PAYPAL_CLIENT_ID"]}:${values["PAYPAL_CLIENT_SECRET"]}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    if (!tokenRes.ok) {
      throw new Error(`PayPal auth gagal [${tokenRes.status}]: ${await tokenRes.text()}`);
    }
    const token = (await tokenRes.json()) as { access_token?: string };

    const orderRes = await fetch(`${host}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: input.number,
            description: input.title.slice(0, 127),
            amount: {
              currency_code: (input.currency || "USD").toUpperCase(),
              value: input.amount.toFixed(2),
            },
          },
        ],
      }),
    });
    if (!orderRes.ok) {
      throw new Error(`PayPal gagal membuat order [${orderRes.status}]: ${await orderRes.text()}`);
    }
    const order = (await orderRes.json()) as {
      id?: string;
      links?: { rel: string; href: string }[];
    };
    return {
      provider: "paypal",
      url: order.links?.find((l) => l.rel === "approve")?.href ?? null,
      reference: order.id ?? null,
      configured: true,
      instruction: "PayPal approval link siap dikirim ke klien.",
    };
  },
};

const ADAPTERS: Record<PaymentProviderId, PaymentProviderAdapter> = {
  manual_transfer: manualAdapter,
  xendit: xenditAdapter,
  midtrans: midtransAdapter,
  stripe: stripeAdapter,
  paypal: paypalAdapter,
};

export function getPaymentAdapter(id: PaymentProviderId): PaymentProviderAdapter {
  return ADAPTERS[id] ?? manualAdapter;
}

/** Readiness snapshot rendered in the Business OS payment settings panel. */
export function providerStatuses() {
  return PAYMENT_PROVIDERS.map((meta) => ({
    id: meta.id,
    label: meta.label,
    description: meta.description,
    supportsHostedLink: meta.supportsHostedLink,
    requiredSecrets: meta.requiredSecrets,
    configured: getPaymentAdapter(meta.id).isConfigured(),
  }));
}
