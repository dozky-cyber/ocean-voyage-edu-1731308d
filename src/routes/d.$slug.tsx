import { createFileRoute } from "@tanstack/react-router";

import { getDocumentLink } from "@/lib/document-link.functions";

/**
 * Short, readable link for KERJAKU documents:
 * https://kerjaku.space/d/order-brief-kerjaku-candra
 * Opens an in-browser PDF viewer first; downloading is opt-in.
 */
export const Route = createFileRoute("/d/$slug")({
  loader: ({ params }) => getDocumentLink({ data: { slug: params.slug } }),
  head: () => ({
    meta: [
      { title: "Dokumen KERJAKU — Preview PDF" },
      { name: "description", content: "Baca dokumen KERJAKU langsung di browser, unduh bila perlu." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Dokumen KERJAKU — Preview PDF" },
      { property: "og:description", content: "Baca dokumen KERJAKU langsung di browser." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DocumentViewerPage,
});

function DocumentViewerPage() {
  const doc = Route.useLoaderData();

  if (!doc) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <h1 className="text-lg font-semibold text-foreground">Dokumen tidak ditemukan</h1>
        <p className="text-sm text-muted-foreground">
          Link ini sudah tidak berlaku atau dokumennya telah dihapus.
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
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">KERJAKU</p>
          <h1 className="truncate text-sm font-semibold text-foreground">{doc.fileName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? window.history.back() : window.location.assign("/"))}
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
          Buka PDF di tab baru
        </a>
      </p>
    </main>
  );
}
