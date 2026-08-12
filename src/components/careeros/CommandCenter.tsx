import { Reveal, SectionHeading } from "./Reveal";

const METRICS = [
  ["Matches", "128"],
  ["Applications", "17"],
  ["Interviews", "5"],
  ["Skill gaps", "3"],
];

const BARS = [42, 58, 51, 70, 64, 82, 78, 94];

export function CommandCenter() {
  return (
    <section id="command-center" className="relative py-28 lg:py-36">
      <div className="pointer-events-none absolute inset-x-0 top-0 hairline" />
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="Career command center"
          title="Everything you need. One intelligent place."
        />

        <Reveal delay={120}>
          <div
            className="mx-auto mt-20 max-w-5xl"
            style={{ perspective: "1600px" }}
          >
            <div
              className="surface p-7 md:p-10"
              style={{ transform: "rotateX(9deg) rotateZ(-1deg)" }}
            >
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                  <p className="eyebrow">Career health score</p>
                  <p className="mt-3 font-display text-6xl tracking-tight">
                    87<span className="text-2xl text-muted-foreground">/100</span>
                  </p>
                </div>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Trajectory is compounding. Two agents are currently active on your
                  behalf.
                </p>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-4">
                {METRICS.map(([k, v]) => (
                  <div
                    key={k}
                    className="rounded-xl border border-border bg-secondary/45 p-5"
                  >
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      {k}
                    </p>
                    <p className="mt-2 font-display text-3xl">{v}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 rounded-2xl border border-border bg-secondary/30 p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Momentum · 8 weeks</p>
                  <p className="text-xs text-accent">+34%</p>
                </div>
                <div className="mt-6 flex h-32 items-end gap-3">
                  {BARS.map((b, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-md bg-gradient-to-t from-primary/40 to-accent/70"
                      style={{ height: `${b}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
