import { useState } from "react";
import { Reveal, SectionHeading } from "./Reveal";

const FACETS = [
  { label: "Skills", detail: "Docker, React, Systems design, TypeScript", x: 50, y: 4 },
  { label: "Projects", detail: "9 shipped products, 3 open-source repos", x: 92, y: 26 },
  { label: "Experience", detail: "6 years, 2 industries, 1 leadership arc", x: 86, y: 72 },
  { label: "Education", detail: "B.Tech CS · 4 specialised certifications", x: 50, y: 96 },
  { label: "Goals", detail: "Staff engineer within 18 months", x: 14, y: 72 },
  { label: "Interests", detail: "Applied AI, developer tooling, design", x: 8, y: 26 },
];

export function Understands() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <section id="understands" className="relative py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="It understands you"
          title={
            <>
              More than a resume.
              <br />
              <span className="italic text-muted-foreground">
                A complete career understanding.
              </span>
            </>
          }
          subtitle="Every signal you have ever produced becomes a living map of who you are and where you can go next."
        />

        <Reveal delay={120}>
          <div className="surface relative mx-auto mt-20 aspect-[4/3] w-full max-w-4xl overflow-hidden p-8 md:aspect-[16/9]">
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
              {FACETS.map((f) => (
                <line
                  key={f.label}
                  x1="50"
                  y1="50"
                  x2={f.x}
                  y2={f.y}
                  stroke="var(--rose)"
                  strokeOpacity={active === f.label ? "0.7" : "0.22"}
                  strokeWidth="0.22"
                  className="animate-dash transition-all duration-500"
                />
              ))}
            </svg>

            <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-accent/30 bg-primary/25 backdrop-blur-md">
              <span className="font-display text-xl">A.</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Profile
              </span>
            </div>

            {FACETS.map((f) => (
              <button
                key={f.label}
                type="button"
                onMouseEnter={() => setActive(f.label)}
                onFocus={() => setActive(f.label)}
                onMouseLeave={() => setActive(null)}
                onBlur={() => setActive(null)}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-secondary/70 px-3 py-2 text-left backdrop-blur-md transition-all duration-500 hover:border-accent/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{ left: `${f.x}%`, top: `${f.y}%`, maxWidth: 190 }}
              >
                <span className="block text-xs font-semibold tracking-wide">
                  {f.label}
                </span>
                <span
                  className={`block overflow-hidden text-[11px] leading-snug text-muted-foreground transition-all duration-500 ${
                    active === f.label ? "mt-1 max-h-16 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  {f.detail}
                </span>
              </button>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
