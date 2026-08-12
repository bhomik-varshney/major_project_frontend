import { useState } from "react";
import { Brain, Compass, FileCheck2, Radar, Send, Target } from "lucide-react";
import { Reveal, SectionHeading } from "./Reveal";

const AGENTS = [
  { name: "Planner", icon: Compass, desc: "Turns your ambition into a sequenced, realistic plan." },
  { name: "Researcher", icon: Radar, desc: "Continuously scans the market for relevant motion." },
  { name: "Matcher", icon: Target, desc: "Scores every opportunity against your true profile." },
  { name: "Skills Analyst", icon: Brain, desc: "Finds the gaps that quietly cost you offers." },
  { name: "Application Agent", icon: Send, desc: "Prepares tailored applications for your approval." },
  { name: "Tracker", icon: FileCheck2, desc: "Follows every thread so nothing goes cold." },
];

export function Agents() {
  const [active, setActive] = useState(0);

  return (
    <section id="agents" className="relative py-28 lg:py-36">
      <div className="pointer-events-none absolute inset-x-0 top-0 hairline" />
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="Agentic workflow"
          title={
            <>
              You set the goal.
              <br />
              <span className="italic text-muted-foreground">
                The agents handle the journey.
              </span>
            </>
          }
        />

        <div className="relative mt-20">
          <svg
            viewBox="0 0 1200 60"
            className="absolute inset-x-0 top-10 hidden h-16 w-full lg:block"
            aria-hidden="true"
          >
            <path
              d="M40 40 C 260 -10, 420 70, 620 30 S 980 60, 1160 20"
              fill="none"
              stroke="var(--rose)"
              strokeOpacity="0.3"
              strokeWidth="1.2"
              className="animate-dash"
            />
          </svg>

          <ol className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
            {AGENTS.map((a, i) => {
              const Icon = a.icon;
              return (
                <Reveal as="li" key={a.name} delay={i * 70}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    className={`surface lift h-full w-full p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      active === i ? "border-accent/40" : ""
                    }`}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/25 bg-primary/25">
                      <Icon className="h-4.5 w-4.5 text-accent" />
                    </span>
                    <span className="mt-5 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Step {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="mt-1 block font-display text-xl tracking-tight">
                      {a.name}
                    </span>
                    <span
                      className={`mt-2 block text-sm leading-relaxed text-muted-foreground transition-all duration-500 ${
                        active === i ? "opacity-100" : "opacity-55"
                      }`}
                    >
                      {a.desc}
                    </span>
                  </button>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
