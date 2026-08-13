import { createFileRoute } from "@tanstack/react-router";

import { getDocumentLink } from "@/lib/document-link.functions";

/**
 * Branded invoice preview link:
 * https://kerjaku.space/i/invoice-candra
 * Opens the invoice PDF in-browser; downloading stays opt-in.
 */
export const Route = createFileRoute("/i/$slug")({
  loader: ({ params }) => getDocumentLink({ data: { slug: params.slug } }),
  head: () => ({
    meta: [
      { title: "Invoice KERJAKU — Preview" },
      {
        name: "description",
        content: "Lihat invoice KERJAKU langsung di browser, unduh bila diperlukan.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Invoice KERJAKU — Preview" },
      { property: "og:description", content: "Lihat invoice KERJAKU langsung di browser." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InvoiceViewerPage,
});

function InvoiceViewerPage() {
  const doc = Route.useLoaderData();

  if (!doc) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <h1 className="text-lg font-semibold text-foreground">Invoice tidak ditemukan</h1>
        <p className="text-sm text-muted-foreground">
          Link ini sudah tidak berlaku atau invoicenya telah diperbarui.
        </p>
        <a
          href="/"
          className="rounded-full border border-border px-4 py-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Kembali ke KERJAKU
        </a>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            KERJAKU · Business System Consultant
          </p>
          <h1 className="truncate text-sm font-semibold text-foreground">{doc.fileName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              window.history.length > 1 ? window.history.back() : window.location.assign("/")
            }
            className="rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Kembali
          </button>
          <a
            href={doc.downloadUrl}
            className="rounded-full border border-primary/60 bg-primary/10 px-4 py-1.5 text-xs text-primary"
          >
            Download PDF
          </a>
        </div>
      </header>

      <div className="flex-1">
        <object data={doc.viewUrl} type="application/pdf" className="h-[calc(100dvh-64px)] w-full">
          <iframe src={doc.viewUrl} title={doc.fileName} className="h-[calc(100dvh-64px)] w-full" />
        </object>
      </div>

      <p className="px-4 py-3 text-center text-[11px] text-muted-foreground sm:hidden">
        Tidak tampil di perangkat Kakak?{" "}
        <a href={doc.viewUrl} className="underline">
          Buka invoice di tab baru
        </a>
      </p>
    </main>
  );
}
