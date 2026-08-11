import { createFileRoute } from "@tanstack/react-router";
import { faqSection } from "@/lib/consultation-content";
import { JourneyProvider } from "@/components/kerjaku/JourneyProvider";
import { JourneyPanels } from "@/components/kerjaku/JourneyPanels";
import { OceanScene } from "@/components/kerjaku/OceanScene";
import { SiteNav } from "@/components/kerjaku/SiteNav";
import { SectionJourneyTracker } from "@/components/kerjaku/SectionJourneyTracker";
import { SmoothScrollProvider } from "@/components/kerjaku/SmoothScrollProvider";
import { HeroStage } from "@/components/kerjaku/stages/HeroStage";
import { PastelStage } from "@/components/kerjaku/stages/PastelStage";
import { ShowcaseStage } from "@/components/kerjaku/stages/ShowcaseStage";
import { ProductsStage } from "@/components/kerjaku/stages/ProductsStage";
import { PortfolioCtaStage } from "@/components/kerjaku/stages/PortfolioCtaStage";
import { ProfileStage } from "@/components/kerjaku/stages/ProfileStage";
import { ServiceEntryStage } from "@/components/kerjaku/stages/ServiceEntryStage";

import { AboutStage } from "@/components/kerjaku/stages/AboutStage";
import { ProcessStage } from "@/components/kerjaku/stages/ProcessStage";
import { TrustCtaStage } from "@/components/kerjaku/stages/TrustCtaStage";
import { TrustReasonsStage } from "@/components/kerjaku/stages/TrustReasonsStage";
import { ServicesStage } from "@/components/kerjaku/stages/ServicesStage";
import { ServicePackageStage } from "@/components/kerjaku/stages/ServicePackageStage";
import { FaqStage } from "@/components/kerjaku/stages/FaqStage";
import { WhyStage } from "@/components/kerjaku/stages/WhyStage";
import { ConsultationStage } from "@/components/kerjaku/stages/ConsultationStage";
import { AiConsultantStage } from "@/components/kerjaku/stages/AiConsultantStage";
import { AiConsultantFab } from "@/components/kerjaku/AiConsultantFab";
import { FinalStage } from "@/components/kerjaku/stages/FinalStage";


const title = "KERJAKU | Jasa Pembuatan Website Profesional & Digital Solution";
const description =
  "KERJAKU menyediakan jasa pembuatan website profesional, website bisnis, landing page, dan aplikasi custom dengan desain modern, cepat, dan sesuai kebutuhan bisnis.";
const keywords =
  "jasa pembuatan website, website development, custom web application, aplikasi custom, AI automation, business system, digital transformation, software development Indonesia, landing page, dashboard bisnis, workflow automation, jasa developer website";
const ogImage = "https://kerjaku.space/og-image.png";
const socialTitle =
  "KERJAKU - Custom Digital Solutions, AI Automation & Business System Development";
const socialDescription =
  "KERJAKU membantu bisnis membangun website, custom application, AI automation, dan digital system sesuai kebutuhan operasional.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "keywords", content: keywords },
      { name: "author", content: "Adji Taufiq — KERJAKU" },
      { name: "language", content: "id-ID" },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: socialTitle },
      { property: "og:description", content: socialDescription },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "KERJAKU" },
      { property: "og:locale", content: "id_ID" },
      { property: "og:url", content: "https://kerjaku.space/" },
      { property: "og:image", content: ogImage },
      { property: "og:image:secure_url", content: ogImage },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: "KERJAKU — Custom digital solutions, AI automation & business system development",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: socialTitle },
      { name: "twitter:description", content: socialDescription },
      { name: "twitter:image", content: ogImage },
      {
        name: "twitter:image:alt",
        content: "KERJAKU — Custom digital solutions, AI automation & business system development",
      },
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
              logo: "https://kerjaku.space/og-image.png",
              areaServed: "ID",
              knowsLanguage: "id-ID",
              makesOffer: [
                "Jasa pembuatan website profesional",
                "Landing page bisnis",
                "Web application & dashboard custom",
                "AI & automation system",
              ].map((name) => ({
                "@type": "Offer",
                itemOffered: { "@type": "Service", name, serviceType: name },
              })),
              founder: { "@id": "https://kerjaku.space/#adji-taufiq" },
            },
            {
              "@type": "FAQPage",
              "@id": "https://kerjaku.space/#faq",
              mainEntity: faqSection.items.map((item) => ({
                "@type": "Question",
                name: item.q,
                acceptedAnswer: { "@type": "Answer", text: item.a },
              })),
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
      <SectionJourneyTracker />
      <main className="relative z-10">
        <HeroStage />
        <PastelStage />
        <ShowcaseStage />
        <ProductsStage />
        <PortfolioCtaStage />
        <ProfileStage />
        <ServiceEntryStage />
        
        <AboutStage />
        <ServicesStage />
        <ServicePackageStage />
        <ProcessStage />
        <WhyStage />
        <FaqStage />

        <TrustCtaStage />
        <TrustReasonsStage />
        <AiConsultantStage />
        <ConsultationStage />
        <FinalStage />
      </main>
      <AiConsultantFab />
      <JourneyPanels />
    </JourneyProvider>
  );
}
