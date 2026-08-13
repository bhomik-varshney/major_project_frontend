import { createFileRoute } from "@tanstack/react-router";

import { Nav } from "@/components/careeros/Nav";
import { Hero } from "@/components/careeros/Hero";
import { TrustStrip } from "@/components/careeros/TrustStrip";
import { Problem } from "@/components/careeros/Problem";
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
      {/* Fixed atmospheric ground + grain, behind everything. */}
      <div className="atmosphere" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <div className="relative z-2">
        <Nav />
        <main>
          <Hero />
          <TrustStrip />
          {/* 01 the problem → 02 the companion → 03 the constellation */}
          <Problem />
          <Agents />
          <Understands />
          {/* 04 discover → 05 understand → 06 act */}
          <Opportunities />
          <SkillGap />
          <ApplicationPreview />
          {/* 07 the surface → 08 the loop → horizon */}
          <CommandCenter />
          <Loop />
          <Roadmap />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </div>
  );
}
