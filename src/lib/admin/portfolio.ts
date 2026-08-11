/** Client-safe helpers for the KERJAKU Portfolio & Case Study CMS. */

export const PORTFOLIO_CATEGORIES = [
  "Web App",
  "Landing Page",
  "Business System",
  "Automation",
  "AI Solution",
  "Mobile App",
] as const;
export type PortfolioCategory = (typeof PORTFOLIO_CATEGORIES)[number];

export type PortfolioProject = {
  id: string;
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
  created_at: string;
  updated_at: string;
};

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}

export function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
