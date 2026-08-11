import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const portfolioFields = {
  title: z.string().min(1).max(160),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
  category: z.string().min(1).max(80),
  client_type: z.string().max(120).nullable(),
  thumbnail_url: z.string().max(1000).nullable(),
  gallery: z.array(z.string().max(1000)).max(20),
  description: z.string().max(4000).nullable(),
  problem: z.string().max(4000).nullable(),
  solution: z.string().max(4000).nullable(),
  features: z.array(z.string().max(300)).max(30),
  tech_stack: z.array(z.string().max(80)).max(40),
  result: z.string().max(4000).nullable(),
  testimonial_quote: z.string().max(2000).nullable(),
  testimonial_author: z.string().max(160).nullable(),
  testimonial_role: z.string().max(160).nullable(),
  seo_title: z.string().max(200).nullable(),
  seo_description: z.string().max(400).nullable(),
  og_image: z.string().max(1000).nullable(),
  published: z.boolean(),
  position: z.number().int().min(0).max(999),
};

/* ------------------------------ Admin (gated) ----------------------------- */

export const getPortfolioList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertWorkspace } = await import("./admin.server");
    const { listPortfolio } = await import("./portfolio.server");
    await assertWorkspace(context.supabase, context.userId);
    return listPortfolio(context.supabase);
  });

export const createPortfolioFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object(portfolioFields).parse(data))
  .handler(async ({ data, context }) => {
    const { assertManage } = await import("./admin.server");
    const { createPortfolio } = await import("./portfolio.server");
    await assertManage(context.supabase, context.userId);
    return createPortfolio(context.supabase, data, context.userId);
  });

export const updatePortfolioFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), ...portfolioFields }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertManage } = await import("./admin.server");
    const { updatePortfolio } = await import("./portfolio.server");
    await assertManage(context.supabase, context.userId);
    const { id, ...input } = data;
    return updatePortfolio(context.supabase, id, input);
  });

export const setPortfolioPublishedFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), published: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertManage } = await import("./admin.server");
    const { setPortfolioPublished } = await import("./portfolio.server");
    await assertManage(context.supabase, context.userId);
    return setPortfolioPublished(context.supabase, data.id, data.published);
  });

export const deletePortfolioFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertManage } = await import("./admin.server");
    const { deletePortfolio } = await import("./portfolio.server");
    await assertManage(context.supabase, context.userId);
    return deletePortfolio(context.supabase, data.id);
  });

/* -------------------------------- Public ---------------------------------- */

export const listPublicPortfolio = createServerFn({ method: "GET" }).handler(async () => {
  const { publicSupabase } = await import("./portfolio-public.server");
  const { listPublishedPortfolio } = await import("./portfolio.server");
  return listPublishedPortfolio(publicSupabase());
});

export const getPublicPortfolioProject = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(data))
  .handler(async ({ data }) => {
    const { publicSupabase } = await import("./portfolio-public.server");
    const { getPublishedPortfolioBySlug } = await import("./portfolio.server");
    return getPublishedPortfolioBySlug(publicSupabase(), data.slug);
  });
