import { createFileRoute } from "@tanstack/react-router";

import { Nav } from "@/components/careeros/Nav";
import { Hero } from "@/components/careeros/Hero";
import { TrustStrip } from "@/components/careeros/TrustStrip";
import { Understands } from "@/components/careeros/Understands";
import { Agents } from "@/components/careeros/Agents";
import { Opportunities } from "@/components/careeros/Opportunities";
import { SkillGap } from "@/components/careeros/SkillGap";
import { ApplicationPreview } from "@/components/careeros/ApplicationPreview";
import { CommandCenter } from "@/components/careeros/CommandCenter";
import { Loop } from "@/components/careeros/Loop";
import { Roadmap } from "@/components/careeros/Roadmap";
import { FinalCTA } from "@/components/careeros/FinalCTA";
import { Footer } from "@/components/careeros/Footer";

const TITLE = "CareerOS — Agentic AI Career Companion";
const DESCRIPTION =
  "CareerOS understands your profile, discovers the right opportunities, evaluates fit, and moves you from goals to growth.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen bg-background">
      <Nav />
      <main>
        <Hero />
        <TrustStrip />
        <Understands />
        <Agents />
        <Opportunities />
        <SkillGap />
        <ApplicationPreview />
        <CommandCenter />
        <Loop />
        <Roadmap />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
