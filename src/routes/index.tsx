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
import { LabStage } from "@/components/kerjaku/stages/LabStage";
import { FinalStage } from "@/components/kerjaku/stages/FinalStage";

const title = "KERJAKU — Work, made your way.";
const description =
  "Portofolio digital KERJAKU oleh Adji Taufiq: RO Memory, Dompet Gue, Material Estimator, serta eksperimen AI dan automation.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
        <LabStage />
        <FinalStage />
      </main>
      <JourneyPanels />
    </JourneyProvider>
  );
}
