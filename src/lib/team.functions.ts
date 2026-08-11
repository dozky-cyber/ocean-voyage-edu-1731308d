import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TEAM_ROLES } from "@/lib/admin/team";

const memberFields = {
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  role: z.enum(TEAM_ROLES),
  avatar_url: z.string().max(600).nullable(),
  title: z.string().max(120).nullable(),
  active: z.boolean(),
  capacity: z.number().int().min(1).max(50),
  notes: z.string().max(2000).nullable(),
};

export const getTeamWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertWorkspace } = await import("./admin.server");
    const { fetchTeamWorkspace } = await import("./team.server");
    await assertWorkspace(context.supabase, context.userId);
    return fetchTeamWorkspace(context.supabase);
  });

export const getTeamMembersFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertWorkspace } = await import("./admin.server");
    const { fetchTeamMembers } = await import("./team.server");
    await assertWorkspace(context.supabase, context.userId);
    return fetchTeamMembers(context.supabase);
  });

export const createTeamMemberFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object(memberFields).parse(data))
  .handler(async ({ data, context }) => {
    const { assertManage } = await import("./admin.server");
    const { createTeamMember } = await import("./team.server");
    await assertManage(context.supabase, context.userId);
    return createTeamMember(context.supabase, data, context.userId);
  });

export const updateTeamMemberFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), ...memberFields }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertManage } = await import("./admin.server");
    const { updateTeamMember } = await import("./team.server");
    await assertManage(context.supabase, context.userId);
    return updateTeamMember(context.supabase, data);
  });

export const deleteTeamMemberFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertManage } = await import("./admin.server");
    const { deleteTeamMember } = await import("./team.server");
    await assertManage(context.supabase, context.userId);
    return deleteTeamMember(context.supabase, data.id);
  });
