import { Reveal, SectionHeading } from "./Reveal";
import { DemoBadge, useCountUp, useInView } from "./demo";

const METRICS = [
  ["Matches", 128],
  ["Applications", 17],
  ["Interviews", 5],
  ["Skill gaps", 3],
] as const;

const BARS = [42, 51, 47, 63, 58, 74, 81, 94];

function Metric({ label, value }: { label: string; value: number }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  const n = useCountUp(value, inView, 1400);
  return (
    <div
      ref={ref}
      className="rounded-xl border border-border bg-secondary/45 p-5 transition-colors duration-500 hover:border-accent/30"
    >
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="tnum mt-2 font-display text-3xl">{n}</p>
    </div>
  );
}

/** Section 07 — The command center surface. */
export function CommandCenter() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  const score = useCountUp(87, inView, 1600);

  return (
    <section id="command-center" aria-labelledby="command-title" className="section-y relative">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            index="07"
            eyebrow="Career command center"
            title={
              <span id="command-title">
                One surface.
                <br />
                <span className="italic text-muted-foreground">Your whole career.</span>
              </span>
            }
          />
          <Reveal delay={140}>
            <DemoBadge label="Sample workspace data" />
          </Reveal>
        </div>

        <Reveal delay={120}>
          <div className="mt-16 overflow-hidden" style={{ perspective: "1800px" }}>
            <div
              ref={ref}
              className="surface relative overflow-hidden p-6 sm:p-9 md:p-11"
              style={{ transform: "rotateX(7deg)" }}
            >
              <div
                className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-primary/22 blur-3xl"
                aria-hidden="true"
              />

              <div className="relative flex flex-wrap items-end justify-between gap-8">
                <div>
                  <p className="eyebrow">Career health score</p>
                  <p className="tnum mt-4 font-display text-6xl leading-none tracking-tight sm:text-7xl">
                    {score}
                    <span className="text-2xl text-muted-foreground">/100</span>
                  </p>
                </div>
                <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                  Trajectory is compounding. Two agents are currently active on your behalf; one
                  draft is waiting for you.
                </p>
              </div>

              <div className="relative mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {METRICS.map(([k, v]) => (
                  <Metric key={k} label={k} value={v} />
                ))}
              </div>

              <div className="relative mt-10 rounded-2xl border border-border bg-secondary/30 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">Momentum · last 8 weeks</p>
                  <p className="tnum text-xs text-accent">+34%</p>
                </div>
                <div className="mt-7 flex h-32 items-end gap-2 sm:gap-3" aria-hidden="true">
                  {BARS.map((b, i) => (
                    <span
                      key={i}
                      className="flex-1 rounded-t-md bg-gradient-to-t from-primary/45 to-accent/75 transition-[height] duration-1000 ease-out"
                      style={{
                        height: inView ? `${b}%` : "4%",
                        transitionDelay: `${i * 70}ms`,
                      }}
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
