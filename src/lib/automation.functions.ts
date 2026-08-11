import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TASK_COLUMNS =
  "id, rule_key, kind, title, detail, status, priority, due_at, assignee, lead_id, proposal_id, invoice_id, project_id, client_id, created_at, completed_at";
const LOG_COLUMNS =
  "id, rule_key, category, event, status, title, detail, entity_type, entity_id, created_at";

export const getAutomationCenter = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertWorkspace } = await import("./admin.server");
    const role = await assertWorkspace(context.supabase, context.userId);

    const [rules, tasks, logs] = await Promise.all([
      context.supabase
        .from("automation_rules")
        .select("id, key, category, label, description, enabled, config, updated_at")
        .order("category", { ascending: true })
        .order("key", { ascending: true }),
      context.supabase
        .from("automation_tasks")
        .select(TASK_COLUMNS)
        .order("status", { ascending: true })
        .order("due_at", { ascending: true })
        .limit(120),
      context.supabase
        .from("automation_logs")
        .select(LOG_COLUMNS)
        .order("created_at", { ascending: false })
        .limit(80),
    ]);

    if (rules.error) throw new Error(rules.error.message);

    return {
      role,
      rules: (rules.data ?? []).map((r) => ({
        ...r,
        config: (r.config ?? {}) as Record<string, unknown>,
      })),
      tasks: tasks.data ?? [],
      logs: logs.data ?? [],
    };
  });

export const setAutomationRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        key: z.string().min(3).max(80),
        enabled: z.boolean().optional(),
        config: z.record(z.string(), z.number().int().min(0).max(365)).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertManage } = await import("./admin.server");
    await assertManage(context.supabase, context.userId);

    const patch: Record<string, unknown> = {};
    if (typeof data.enabled === "boolean") patch["enabled"] = data.enabled;
    if (data.config) patch["config"] = data.config;

    const { error } = await context.supabase
      .from("automation_rules")
      .update(patch as never)
      .eq("key", data.key);
    if (error) throw new Error(error.message);

    const { logAutomation } = await import("./automation.server");
    await logAutomation({
      ruleKey: data.key,
      event: "rule.updated",
      title:
        typeof data.enabled === "boolean"
          ? `Rule ${data.enabled ? "diaktifkan" : "dinonaktifkan"}`
          : "Pengaturan rule diperbarui",
      detail: data.key,
    });

    return { ok: true as const };
  });

export const setAutomationTaskStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "done", "dismissed"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertLeadWork } = await import("./admin.server");
    await assertLeadWork(context.supabase, context.userId);

    const { error } = await context.supabase
      .from("automation_tasks")
      .update({
        status: data.status,
        completed_at: data.status === "pending" ? null : new Date().toISOString(),
        completed_by: data.status === "pending" ? null : context.userId,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const runAutomationScan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertLeadWork } = await import("./admin.server");
    await assertLeadWork(context.supabase, context.userId);
    const { scanAutomationDue } = await import("./automation.server");
    return scanAutomationDue();
  });
