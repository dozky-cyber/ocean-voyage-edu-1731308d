import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SEARCH_CATEGORIES, type SearchCategory } from "@/lib/admin/search";

const searchInput = z.object({
  term: z.string().max(120),
  categories: z.array(z.enum(SEARCH_CATEGORIES)).max(7).optional(),
});

export const searchWorkspaceFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => searchInput.parse(data))
  .handler(async ({ data, context }) => {
    const { assertWorkspace } = await import("./admin.server");
    await assertWorkspace(context.supabase, context.userId);
    const { searchWorkspace } = await import("./workspace.server");
    return searchWorkspace(
      context.supabase,
      data.term,
      (data.categories ?? []) as SearchCategory[],
    );
  });

export const getWorkspaceNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertWorkspace } = await import("./admin.server");
    await assertWorkspace(context.supabase, context.userId);
    const { buildNotifications } = await import("./workspace.server");
    return buildNotifications(context.supabase);
  });
