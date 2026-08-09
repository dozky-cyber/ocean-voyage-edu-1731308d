import { createFileRoute } from "@tanstack/react-router";
import { EduProvider } from "@/components/edu/EduProvider";
import { EduPanels } from "@/components/edu/EduPanels";
import { OceanScene } from "@/components/edu/OceanScene";
import { SiteNav } from "@/components/edu/SiteNav";
import { SmoothScrollProvider } from "@/components/edu/SmoothScrollProvider";
import { HeroStage } from "@/components/edu/stages/HeroStage";
import { PastelStage } from "@/components/edu/stages/PastelStage";
import { ShowcaseStage } from "@/components/edu/stages/ShowcaseStage";
import { ProductsStage } from "@/components/edu/stages/ProductsStage";
import { ProfileStage } from "@/components/edu/stages/ProfileStage";
import { AiStage } from "@/components/edu/stages/AiStage";
import { FinalStage } from "@/components/edu/stages/FinalStage";

const title = "KERJAKU — Work, made your way.";
const description =
  "Portofolio digital KERJAKU: aplikasi, sistem kerja, eksperimen AI, dan produk digital seperti RO Memory, Material Estimator, dan Dompet Gue.";

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
    <EduProvider>
      <SmoothScrollProvider />
      <OceanScene />
      <SiteNav />
      <main className="relative z-10">
        <HeroStage />
        <PastelStage />
        <ShowcaseStage />
        <ProductsStage />
        <ProfileStage />
        <AiStage />
        <FinalStage />
      </main>
      <EduPanels />
    </EduProvider>
  );
}
