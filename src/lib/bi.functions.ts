import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getExecutiveIntelligence = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertWorkspace } = await import("./admin.server");
    const { fetchExecutiveIntelligence } = await import("./bi.server");
    await assertWorkspace(context.supabase, context.userId);
    return fetchExecutiveIntelligence(context.supabase);
  });
