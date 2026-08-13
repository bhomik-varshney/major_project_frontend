import { useState } from "react";
import { Reveal, SectionHeading } from "./Reveal";

const SKILLS = [
  { name: "React", level: 94, note: "Deep, current, demonstrated" },
  { name: "TypeScript", level: 90, note: "Strong across app and tooling" },
  { name: "Systems design", level: 72, note: "Good — not yet staff-level" },
  { name: "Distributed data", level: 55, note: "Working knowledge only" },
  { name: "Docker", level: 46, note: "Blocks 34 target roles" },
  { name: "Kubernetes", level: 38, note: "Frequently paired with Docker" },
];

const R_MIN = 9;
const R_MAX = 40;

function point(level: number, i: number, n: number) {
  const a = (Math.PI * 2 * i) / n - Math.PI / 2;
  const r = R_MIN + (level / 100) * (R_MAX - R_MIN);
  return [50 + r * Math.cos(a), 50 + r * Math.sin(a)] as const;
}

/** Section 05 — Skill gap intelligence. */
export function SkillGap() {
  const [hover, setHover] = useState<number | null>(null);
  const n = SKILLS.length;

  const polygon = SKILLS.map((s, i) => point(s.level, i, n).join(",")).join(" ");
  // The "target band" the analyst is measuring against.
  const target = SKILLS.map((_, i) => point(80, i, n).join(",")).join(" ");

  return (
    <section id="skills" aria-labelledby="skills-title" className="section-y relative">
      <div className="shell">
        <SectionHeading
          index="05"
          eyebrow="Skill gap intelligence"
          title={
            <span id="skills-title">
              Know the gap
              <br />
              <span className="italic text-muted-foreground">before it costs you.</span>
            </span>
          }
          subtitle="The Skills Analyst compares what you have against what your target roles keep asking for — then ranks the gaps by how many doors each one opens."
        />

        <div className="mt-16 grid items-center gap-14 lg:grid-cols-[0.95fr_1fr] lg:gap-20">
          <Reveal>
            <div className="relative mx-auto w-full max-w-[460px]">
              <div
                className="pointer-events-none absolute inset-8 rounded-full bg-primary/20 blur-3xl"
                aria-hidden="true"
              />
              {/*
               * The viewBox is padded to -18/136 so axis labels placed outside
               * the grid have room to render; at 0..100 they were clipped.
               */}
              <svg
                viewBox="-18 -8 136 116"
                className="relative w-full"
                role="img"
                aria-label="Radar chart comparing current skill levels against the target band"
              >
                {[16, 24, 32, 40].map((r) => (
                  <circle
                    key={r}
                    cx="50"
                    cy="50"
                    r={r}
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="0.2"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                {SKILLS.map((s, i) => {
                  const a = (Math.PI * 2 * i) / n - Math.PI / 2;
                  return (
                    <line
                      key={s.name}
                      x1="50"
                      y1="50"
                      x2={50 + R_MAX * Math.cos(a)}
                      y2={50 + R_MAX * Math.sin(a)}
                      stroke="var(--border)"
                      strokeWidth="0.2"
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}

                {/* Target band — the shape to grow into. */}
                <polygon
                  points={target}
                  fill="none"
                  stroke="var(--rose-gold)"
                  strokeOpacity="0.35"
                  strokeWidth="0.4"
                  strokeDasharray="1.5 1.5"
                  vectorEffect="non-scaling-stroke"
                />

                {/* Current profile. */}
                <polygon
                  points={polygon}
                  fill="var(--rose)"
                  fillOpacity="0.16"
                  stroke="var(--rose)"
                  strokeOpacity="0.75"
                  strokeWidth="0.5"
                  vectorEffect="non-scaling-stroke"
                />

                {SKILLS.map((s, i) => {
                  const [cx, cy] = point(s.level, i, n);
                  const on = hover === i;
                  return (
                    <circle
                      key={s.name}
                      cx={cx}
                      cy={cy}
                      r={on ? 2 : 1.1}
                      fill={on ? "var(--rose-gold)" : "var(--rose)"}
                      className="transition-all duration-300"
                    />
                  );
                })}

                {/* Axis labels sit outside the grid so they never collide. */}
                {SKILLS.map((s, i) => {
                  const a = (Math.PI * 2 * i) / n - Math.PI / 2;
                  const lx = 50 + 47 * Math.cos(a);
                  const ly = 50 + 47 * Math.sin(a);
                  return (
                    <text
                      key={`t-${s.name}`}
                      x={lx}
                      y={ly}
                      textAnchor={
                        Math.abs(Math.cos(a)) < 0.2 ? "middle" : Math.cos(a) > 0 ? "start" : "end"
                      }
                      dominantBaseline="middle"
                      fontSize="3"
                      fill={hover === i ? "var(--rose-gold)" : "var(--muted-gray)"}
                      className="transition-colors duration-300"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      {s.name}
                    </text>
                  );
                })}
              </svg>

              <div className="mt-6 flex items-center justify-center gap-6 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  You now
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-px w-4 border-t border-dashed border-rose-gold/60" />
                  Target band
                </span>
              </div>
            </div>
          </Reveal>

          <div className="min-w-0">
            <Reveal>
              <div className="surface relative overflow-hidden border-accent/25 p-7 md:p-8">
                <div
                  className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/12 blur-3xl"
                  aria-hidden="true"
                />
                <div className="relative">
                  <p className="eyebrow">Highest-leverage gap</p>
                  <h3 className="mt-3 font-display text-4xl tracking-tight">Docker</h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Closing this one gap would qualify you for{" "}
                    <span className="text-accent">34 more opportunities</span> in your target band —
                    more than the next three gaps combined.
                  </p>
                </div>
              </div>
            </Reveal>

            <ul className="mt-9 space-y-5">
              {SKILLS.map((s, i) => (
                <Reveal as="li" key={s.name} delay={i * 55}>
                  <div
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                    className="group cursor-default"
                  >
                    <div className="flex items-baseline justify-between gap-4 text-sm">
                      <span className="transition-colors duration-300 group-hover:text-accent">
                        {s.name}
                      </span>
                      <span className="tnum text-xs text-muted-foreground">{s.level}%</span>
                    </div>
                    <div
                      className="relative mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted"
                      aria-hidden="true"
                    >
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-1000 ease-out"
                        style={{ width: `${s.level}%` }}
                      />
                      {/* Target marker at 80%. */}
                      <span className="absolute inset-y-0 left-[80%] w-px bg-rose-gold/60" />
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground/70">{s.note}</p>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
