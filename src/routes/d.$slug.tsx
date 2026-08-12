import { createFileRoute } from "@tanstack/react-router";

/**
 * Short, readable download link for KERJAKU documents:
 * https://kerjaku.space/d/order-brief-kerjaku-candra
 * Resolves the slug server-side and redirects to a freshly signed PDF URL.
 */
export const Route = createFileRoute("/d/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const slug = String(params.slug ?? "")
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "");
        if (!slug) return new Response("Link tidak valid.", { status: 400 });

        const { resolveDocumentShortLink } = await import("@/lib/order-brief.server");
        const url = await resolveDocumentShortLink(slug);
        if (!url) return new Response("Dokumen tidak ditemukan atau sudah dihapus.", { status: 404 });

        return new Response(null, {
          status: 302,
          headers: { Location: url, "Cache-Control": "no-store" },
        });
      },
    },
  },
});
