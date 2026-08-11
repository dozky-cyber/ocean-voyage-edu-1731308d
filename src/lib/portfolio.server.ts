/**
 * KERJAKU Portfolio CMS — server-only data access.
 *
 * Touches only the new `portfolio_projects` table; no CRM, proposal, invoice,
 * client, or delivery data is read or written here.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import type { PortfolioProject } from "@/lib/admin/portfolio";

type Client = SupabaseClient<Database>;

export const PORTFOLIO_COLUMNS =
  "id, title, slug, category, client_type, thumbnail_url, gallery, description, problem, solution, features, tech_stack, result, testimonial_quote, testimonial_author, testimonial_role, seo_title, seo_description, og_image, published, position, created_at, updated_at";

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function mapPortfolioRow(row: Record<string, unknown>): PortfolioProject {
  return {
    ...(row as unknown as PortfolioProject),
    gallery: toStringArray(row['gallery']),
    features: toStringArray(row['features']),
    tech_stack: toStringArray(row['tech_stack']),
  };
}

export type PortfolioInput = {
  title: string;
  slug: string;
  category: string;
  client_type: string | null;
  thumbnail_url: string | null;
  gallery: string[];
  description: string | null;
  problem: string | null;
  solution: string | null;
  features: string[];
  tech_stack: string[];
  result: string | null;
  testimonial_quote: string | null;
  testimonial_author: string | null;
  testimonial_role: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  published: boolean;
  position: number;
};

export async function listPortfolio(supabase: Client): Promise<PortfolioProject[]> {
  const { data, error } = await supabase
    .from("portfolio_projects")
    .select(PORTFOLIO_COLUMNS)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapPortfolioRow(row as Record<string, unknown>));
}

export async function listPublishedPortfolio(supabase: Client): Promise<PortfolioProject[]> {
  const { data, error } = await supabase
    .from("portfolio_projects")
    .select(PORTFOLIO_COLUMNS)
    .eq("published", true)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapPortfolioRow(row as Record<string, unknown>));
}

export async function getPublishedPortfolioBySlug(
  supabase: Client,
  slug: string,
): Promise<PortfolioProject | null> {
  const { data, error } = await supabase
    .from("portfolio_projects")
    .select(PORTFOLIO_COLUMNS)
    .eq("published", true)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapPortfolioRow(data as Record<string, unknown>) : null;
}

export async function createPortfolio(
  supabase: Client,
  input: PortfolioInput,
  userId: string,
): Promise<PortfolioProject> {
  const { data, error } = await supabase
    .from("portfolio_projects")
    .insert({ ...input, created_by: userId })
    .select(PORTFOLIO_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return mapPortfolioRow(data as Record<string, unknown>);
}

export async function updatePortfolio(
  supabase: Client,
  id: string,
  input: PortfolioInput,
): Promise<PortfolioProject> {
  const { data, error } = await supabase
    .from("portfolio_projects")
    .update(input)
    .eq("id", id)
    .select(PORTFOLIO_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return mapPortfolioRow(data as Record<string, unknown>);
}

export async function setPortfolioPublished(
  supabase: Client,
  id: string,
  published: boolean,
): Promise<PortfolioProject> {
  const { data, error } = await supabase
    .from("portfolio_projects")
    .update({ published })
    .eq("id", id)
    .select(PORTFOLIO_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return mapPortfolioRow(data as Record<string, unknown>);
}

export async function deletePortfolio(supabase: Client, id: string): Promise<{ ok: true }> {
  const { error } = await supabase.from("portfolio_projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}
