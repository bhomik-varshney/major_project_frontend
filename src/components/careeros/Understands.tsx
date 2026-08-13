import { useState } from "react";
import { Reveal, SectionHeading } from "./Reveal";

/*
 * Positions are kept inside a 16–84% band so labelled nodes never clip the
 * panel edge — the previous 4%/96% values pushed labels outside the container.
 */
const FACETS = [
  {
    label: "Skills",
    detail: "Docker · React · Systems design · TypeScript",
    x: 50,
    y: 16,
  },
  {
    label: "Projects",
    detail: "9 shipped products, 3 open-source repos",
    x: 82,
    y: 32,
  },
  {
    label: "Experience",
    detail: "6 years, 2 industries, 1 leadership arc",
    x: 79,
    y: 70,
  },
  {
    label: "Education",
    detail: "B.Tech CS · 4 specialised certifications",
    x: 50,
    y: 85,
  },
  { label: "Goals", detail: "Staff engineer within 18 months", x: 21, y: 70 },
  {
    label: "Interests",
    detail: "Applied AI, developer tooling, design",
    x: 18,
    y: 32,
  },
];

/** Section 03 — The career constellation. */
export function Understands() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <section id="understands" aria-labelledby="understands-title" className="section-y relative">
      <div className="shell">
        <SectionHeading
          index="03"
          eyebrow="The career constellation"
          title={
            <span id="understands-title">
              More than a résumé.
              <br />
              <span className="italic text-muted-foreground">A complete picture.</span>
            </span>
          }
          subtitle="Résumé, skills, goals, opportunities and applications stop being separate documents and become one connected structure the system can reason over."
        />

        <Reveal delay={120}>
          <div className="surface relative mx-auto mt-16 aspect-[4/5] w-full max-w-5xl overflow-hidden p-6 sm:aspect-[4/3] sm:p-10 md:aspect-[16/9]">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_50%,oklch(0.38_0.128_19/0.28),transparent_70%)]"
              aria-hidden="true"
            />

            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              {FACETS.map((f) => (
                <line
                  key={f.label}
                  x1="50"
                  y1="50"
                  x2={f.x}
                  y2={f.y}
                  stroke="var(--rose)"
                  strokeOpacity={active === f.label ? "0.75" : "0.2"}
                  strokeWidth="0.2"
                  vectorEffect="non-scaling-stroke"
                  className="animate-dash transition-all duration-500"
                />
              ))}
              {/* Perimeter arcs — the facets also relate to each other. */}
              {FACETS.map((f, i) => {
                const n = FACETS[(i + 1) % FACETS.length]!;
                return (
                  <line
                    key={`arc-${f.label}`}
                    x1={f.x}
                    y1={f.y}
                    x2={n.x}
                    y2={n.y}
                    stroke="var(--rose-gold)"
                    strokeOpacity="0.1"
                    strokeWidth="0.15"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </svg>

            <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-accent/30 bg-primary/30 backdrop-blur-md md:h-28 md:w-28">
              <span
                className="pointer-events-none absolute inset-0 rounded-full bg-accent/10 blur-2xl"
                aria-hidden="true"
              />
              <span className="relative font-display text-2xl">A.</span>
              <span className="relative text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                Profile
              </span>
            </div>

            {FACETS.map((f) => {
              const on = active === f.label;
              return (
                <button
                  key={f.label}
                  type="button"
                  onMouseEnter={() => setActive(f.label)}
                  onFocus={() => setActive(f.label)}
                  onMouseLeave={() => setActive(null)}
                  onBlur={() => setActive(null)}
                  className={`absolute w-[min(46vw,190px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border px-3 py-2 text-left backdrop-blur-md transition-all duration-500 ${
                    on
                      ? "border-accent/50 bg-secondary/90 shadow-[0_0_34px_-8px_var(--rose)]"
                      : "border-border bg-secondary/70"
                  }`}
                  style={{ left: `${f.x}%`, top: `${f.y}%` }}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rotate-45 rounded-[1px] transition-colors duration-500 ${
                        on ? "bg-accent" : "bg-accent/50"
                      }`}
                      aria-hidden="true"
                    />
                    <span className="text-xs font-semibold tracking-tight">{f.label}</span>
                  </span>
                  <span
                    className={`block overflow-hidden text-[11px] leading-snug text-muted-foreground transition-all duration-500 ${
                      on ? "mt-1.5 max-h-16 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    {f.detail}
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={200}>
          <p className="mt-8 text-center text-xs text-muted-foreground/70">
            Hover or focus a node to see what the system reads from it.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
