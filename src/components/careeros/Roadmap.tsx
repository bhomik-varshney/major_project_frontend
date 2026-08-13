import { Reveal, SectionHeading } from "./Reveal";

const PHASES = [
  {
    tag: "Phase 01",
    sub: "Core · in progress",
    title: "Career Intelligence",
    desc: "Deep profile understanding, opportunity discovery, and precise match reasoning you can interrogate.",
    items: ["Profile graph", "Opportunity discovery", "Match reasoning"],
    progress: 100,
  },
  {
    tag: "Phase 02",
    sub: "Advanced",
    title: "Career Execution",
    desc: "Agents prepare, apply, track and follow up — with a human approval gate on every outbound action.",
    items: ["Application drafting", "MCP form interaction", "Thread tracking"],
    progress: 45,
  },
  {
    tag: "Horizon",
    sub: "Long term",
    title: "Career Operating System",
    desc: "A lifelong system that grows with you across roles, industries and decades — not one job search.",
    items: ["Longitudinal memory", "Negotiation support", "Career simulation"],
    progress: 12,
  },
];

/** Roadmap — a staggered vertical timeline, not three equal cards. */
export function Roadmap() {
  return (
    <section id="roadmap" aria-labelledby="roadmap-title" className="section-y relative">
      <div className="shell">
        <SectionHeading
          eyebrow="Roadmap"
          title={
            <span id="roadmap-title">
              Built in
              <span className="italic text-muted-foreground"> deliberate phases.</span>
            </span>
          }
          subtitle="What exists today, what is being built, and where this is going — stated plainly."
        />

        <ol className="relative mt-16">
          {/* Spine */}
          <span
            className="absolute left-[7px] top-2 hidden h-[calc(100%-2rem)] w-px bg-gradient-to-b from-accent/50 via-accent/20 to-transparent md:block"
            aria-hidden="true"
          />

          {PHASES.map((p, i) => (
            <Reveal as="li" key={p.title} delay={i * 110}>
              <div className="group relative grid gap-6 border-t border-border py-10 md:grid-cols-[auto_1fr] md:gap-10 md:pl-0">
                {/* Node */}
                <span
                  className="relative hidden h-4 w-4 shrink-0 translate-y-2 items-center justify-center md:flex"
                  aria-hidden="true"
                >
                  <span className="absolute h-4 w-4 rounded-full bg-accent/15 transition-transform duration-500 group-hover:scale-150" />
                  <span className="h-2 w-2 rotate-45 rounded-[1px] bg-accent" />
                </span>

                <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="text-[10px] uppercase tracking-[0.22em] text-accent">
                        {p.tag}
                      </span>
                      <span className="h-px w-6 bg-border" aria-hidden="true" />
                      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        {p.sub}
                      </span>
                    </div>

                    <h3 className="mt-5 font-display text-3xl tracking-tight transition-colors duration-500 group-hover:text-accent md:text-[2.5rem]">
                      {p.title}
                    </h3>
                    <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                      {p.desc}
                    </p>

                    <ul className="mt-6 flex flex-wrap gap-2.5">
                      {p.items.map((it) => (
                        <li
                          key={it}
                          className="rounded-full border border-border bg-secondary/40 px-3.5 py-1.5 text-[11px] tracking-wide text-muted-foreground transition-colors duration-500 group-hover:border-accent/25"
                        >
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Progress readout */}
                  <div className="w-full lg:w-48">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        Progress
                      </span>
                      <span className="tnum font-display text-xl text-accent">{p.progress}%</span>
                    </div>
                    <span
                      className="mt-2.5 block h-1 w-full overflow-hidden rounded-full bg-muted"
                      aria-hidden="true"
                    >
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-1000 ease-out"
                        style={{ width: `${p.progress}%` }}
                      />
                    </span>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
          <li className="border-t border-border" />
        </ol>
      </div>
    </section>
  );
}
