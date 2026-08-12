import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Public: resolve a KERJAKU short document slug into viewable + downloadable URLs. */
export const getDocumentLink = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        slug: z
          .string()
          .min(1)
          .max(120)
          .transform((value) => value.toLowerCase().replace(/[^a-z0-9-]/g, "")),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    if (!data.slug) return null;
    const { resolveDocumentShortLinkDetail } = await import("@/lib/order-brief.server");
    return resolveDocumentShortLinkDetail(data.slug);
  });
