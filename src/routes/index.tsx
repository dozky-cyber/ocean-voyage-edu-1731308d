import { createFileRoute } from "@tanstack/react-router";
import { EduProvider } from "@/components/edu/EduProvider";
import { EduPanels } from "@/components/edu/EduPanels";
import { OceanScene } from "@/components/edu/OceanScene";
import { SiteNav } from "@/components/edu/SiteNav";
import { SmoothScrollProvider } from "@/components/edu/SmoothScrollProvider";
import { HeroStage } from "@/components/edu/stages/HeroStage";
import { PastelStage } from "@/components/edu/stages/PastelStage";
import { ShowcaseStage } from "@/components/edu/stages/ShowcaseStage";
import { AiStage } from "@/components/edu/stages/AiStage";
import { FinalStage } from "@/components/edu/stages/FinalStage";

const title = "EDU CHANCE — Pelayaran Belajar SMP & SMA";
const description =
  "EDU CHANCE (PELUANG): pengalaman belajar sinematik bawah laut untuk siswa SMP dan SMA — materi, misi harian, tantangan, dan AI pendamping.";

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
        <AiStage />
        <FinalStage />
      </main>
      <EduPanels />
    </EduProvider>
  );
}
