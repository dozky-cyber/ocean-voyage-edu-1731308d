import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PROJECT_STATUSES } from "@/lib/admin/payments";
import { PROJECT_TEMPLATES, TASK_PRIORITIES, TASK_STATUSES } from "@/lib/admin/projects";

const templateIds = PROJECT_TEMPLATES.map((t) => t.id) as [string, ...string[]];

const timelineSchema = z
  .array(
    z.object({
      title: z.string().max(200),
      detail: z.string().max(600),
      done: z.boolean(),
      date: z.string().max(30).nullable().optional(),
    }),
  )
  .max(30);

export const getProjectBoard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertWorkspace } = await import("./admin.server");
    const { fetchProjectBoard } = await import("./projects.server");
    await assertWorkspace(context.supabase, context.userId);
    return fetchProjectBoard(context.supabase);
  });

export const getProjectWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertWorkspace } = await import("./admin.server");
    const { fetchProjectWorkspace } = await import("./projects.server");
    await assertWorkspace(context.supabase, context.userId);
    return fetchProjectWorkspace(context.supabase, data.id);
  });

export const getProjectAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertWorkspace } = await import("./admin.server");
    const { buildProjectAnalytics } = await import("./projects.server");
    await assertWorkspace(context.supabase, context.userId);
    return buildProjectAnalytics(context.supabase);
  });

export const saveProjectDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().min(1).max(200),
        status: z.enum(PROJECT_STATUSES),
        summary: z.string().max(4000).nullable(),
        scope: z.string().max(4000).nullable(),
        team: z.array(z.string().min(1).max(80)).max(20),
        timeline: timelineSchema,
        start_date: z.string().max(20).nullable(),
        target_date: z.string().max(20).nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertLeadWork } = await import("./admin.server");
    const { updateProjectDetails } = await import("./projects.server");
    await assertLeadWork(context.supabase, context.userId);
    return updateProjectDetails(context.supabase, data, context.userId);
  });

export const applyTemplateFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), templateId: z.enum(templateIds) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertLeadWork } = await import("./admin.server");
    const { applyProjectTemplate } = await import("./projects.server");
    await assertLeadWork(context.supabase, context.userId);
    return applyProjectTemplate(context.supabase, data, context.userId);
  });

const taskFields = {
  title: z.string().min(1).max(200),
  description: z.string().max(4000).nullable(),
  assignee: z.string().max(120).nullable(),
  priority: z.enum(TASK_PRIORITIES),
  status: z.enum(TASK_STATUSES),
  due_date: z.string().max(20).nullable(),
};

export const createTaskFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ projectId: z.string().uuid(), ...taskFields }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertLeadWork } = await import("./admin.server");
    const { createProjectTask } = await import("./projects.server");
    await assertLeadWork(context.supabase, context.userId);
    return createProjectTask(context.supabase, data, context.userId);
  });

export const updateTaskFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ id: z.string().uuid(), ...taskFields, notes: z.string().max(4000).nullable() })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertLeadWork } = await import("./admin.server");
    const { updateProjectTask } = await import("./projects.server");
    await assertLeadWork(context.supabase, context.userId);
    return updateProjectTask(context.supabase, data, context.userId);
  });

export const setTaskStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(TASK_STATUSES) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertLeadWork } = await import("./admin.server");
    const { setProjectTaskStatus } = await import("./projects.server");
    await assertLeadWork(context.supabase, context.userId);
    return setProjectTaskStatus(context.supabase, data, context.userId);
  });

export const deleteTaskFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertManage } = await import("./admin.server");
    const { deleteProjectTask } = await import("./projects.server");
    await assertManage(context.supabase, context.userId);
    return deleteProjectTask(context.supabase, data.id);
  });

export const addProjectActivityFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        action: z.string().min(1).max(200),
        detail: z.string().max(2000).nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertLeadWork } = await import("./admin.server");
    const { logProjectActivity } = await import("./projects.server");
    await assertLeadWork(context.supabase, context.userId);
    return logProjectActivity(context.supabase, data, context.userId);
  });
