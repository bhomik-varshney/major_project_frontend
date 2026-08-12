import { Reveal, SectionHeading } from "./Reveal";

const SKILLS = [
  { name: "React", level: 94 },
  { name: "TypeScript", level: 90 },
  { name: "Systems design", level: 72 },
  { name: "Docker", level: 46 },
  { name: "Kubernetes", level: 38 },
  { name: "Distributed data", level: 55 },
];

export function SkillGap() {
  const points = SKILLS.map((s, i) => {
    const a = (Math.PI * 2 * i) / SKILLS.length - Math.PI / 2;
    const r = 8 + (s.level / 100) * 34;
    return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
  }).join(" ");

  return (
    <section className="relative py-28 lg:py-36">
      <div className="pointer-events-none absolute inset-x-0 top-0 hairline" />
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="Skill gap intelligence"
          title="Know your gaps. Unlock your next level."
        />

        <div className="mt-20 grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="surface relative aspect-square w-full max-w-[480px] p-8">
              <svg viewBox="0 0 100 100" className="h-full w-full">
                {[14, 24, 34, 42].map((r) => (
                  <circle
                    key={r}
                    cx="50"
                    cy="50"
                    r={r}
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="0.25"
                  />
                ))}
                {SKILLS.map((s, i) => {
                  const a = (Math.PI * 2 * i) / SKILLS.length - Math.PI / 2;
                  return (
                    <line
                      key={s.name}
                      x1="50"
                      y1="50"
                      x2={50 + 42 * Math.cos(a)}
                      y2={50 + 42 * Math.sin(a)}
                      stroke="var(--border)"
                      strokeWidth="0.25"
                    />
                  );
                })}
                <polygon
                  points={points}
                  fill="var(--rose)"
                  fillOpacity="0.16"
                  stroke="var(--rose)"
                  strokeOpacity="0.7"
                  strokeWidth="0.5"
                />
                {SKILLS.map((s, i) => {
                  const a = (Math.PI * 2 * i) / SKILLS.length - Math.PI / 2;
                  const r = 8 + (s.level / 100) * 34;
                  return (
                    <circle
                      key={s.name}
                      cx={50 + r * Math.cos(a)}
                      cy={50 + r * Math.sin(a)}
                      r="1.1"
                      fill="var(--rose-gold)"
                    />
                  );
                })}
              </svg>
            </div>
          </Reveal>

          <div>
            <Reveal>
              <div className="surface border-accent/30 p-7">
                <p className="eyebrow">Top-impact gap</p>
                <h3 className="mt-3 font-display text-3xl tracking-tight">Docker</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Improving Docker could unlock{" "}
                  <span className="text-accent">34 more opportunities</span> in your
                  target band — the single highest-leverage move this quarter.
                </p>
              </div>
            </Reveal>

            <ul className="mt-8 space-y-5">
              {SKILLS.map((s, i) => (
                <Reveal as="li" key={s.name} delay={i * 60}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{s.name}</span>
                    <span className="text-muted-foreground">{s.level}%</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-accent/80 transition-[width] duration-1000 ease-out"
                      style={{ width: `${s.level}%` }}
                    />
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
