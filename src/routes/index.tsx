import { createFileRoute } from "@tanstack/react-router";
import { JourneyProvider } from "@/components/kerjaku/JourneyProvider";
import { JourneyPanels } from "@/components/kerjaku/JourneyPanels";
import { OceanScene } from "@/components/kerjaku/OceanScene";
import { SiteNav } from "@/components/kerjaku/SiteNav";
import { SmoothScrollProvider } from "@/components/kerjaku/SmoothScrollProvider";
import { HeroStage } from "@/components/kerjaku/stages/HeroStage";
import { PastelStage } from "@/components/kerjaku/stages/PastelStage";
import { ShowcaseStage } from "@/components/kerjaku/stages/ShowcaseStage";
import { ProductsStage } from "@/components/kerjaku/stages/ProductsStage";
import { ProfileStage } from "@/components/kerjaku/stages/ProfileStage";
import { ServiceEntryStage } from "@/components/kerjaku/stages/ServiceEntryStage";
import { LabStage } from "@/components/kerjaku/stages/LabStage";
import { FinalStage } from "@/components/kerjaku/stages/FinalStage";

const title = "KERJAKU — Website, Web App & Sistem Digital";
const description =
  "KERJAKU membangun produk digital, website, web application, dashboard kerja, sistem pencatatan, AI dan automation berdasarkan kebutuhan nyata.";
const ogImage = "https://kerjaku.space/og-image.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "KERJAKU — Work, made your way." },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "KERJAKU" },
      { property: "og:url", content: "https://kerjaku.space/" },
      { property: "og:image", content: ogImage },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "KERJAKU — Work, made your way." },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: ogImage },
    ],
    links: [{ rel: "canonical", href: "https://kerjaku.space/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              name: "KERJAKU",
              url: "https://kerjaku.space/",
              inLanguage: "id-ID",
              publisher: { "@id": "https://kerjaku.space/#organization" },
            },
            {
              "@type": "Organization",
              "@id": "https://kerjaku.space/#organization",
              name: "KERJAKU",
              url: "https://kerjaku.space/",
              email: "cs@kerjaku.space",
              slogan: "Work, made your way.",
              description,
              founder: { "@id": "https://kerjaku.space/#adji-taufiq" },
            },
            {
              "@type": "Person",
              "@id": "https://kerjaku.space/#adji-taufiq",
              name: "Adji Taufiq",
              jobTitle: "Digital Product Builder",
              url: "https://kerjaku.space/",
              worksFor: { "@id": "https://kerjaku.space/#organization" },
            },
          ],
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <JourneyProvider>
      <SmoothScrollProvider />
      <OceanScene />
      <SiteNav />
      <main className="relative z-10">
        <HeroStage />
        <PastelStage />
        <ShowcaseStage />
        <ProductsStage />
        <ProfileStage />
        <ServiceEntryStage />
        <LabStage />
        <FinalStage />
      </main>
      <JourneyPanels />
    </JourneyProvider>
  );
}
