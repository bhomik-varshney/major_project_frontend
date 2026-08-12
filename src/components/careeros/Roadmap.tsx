import { Cpu, Layers, Orbit } from "lucide-react";
import { Reveal, SectionHeading } from "./Reveal";

const PHASES = [
  {
    tag: "Phase 01",
    title: "Career Intelligence",
    sub: "Core",
    icon: Layers,
    desc: "Deep profile understanding, opportunity discovery, and precise match reasoning.",
  },
  {
    tag: "Phase 02",
    title: "Career Execution",
    sub: "Advanced",
    icon: Cpu,
    desc: "Agents prepare, apply, track and follow up — with you approving every move.",
  },
  {
    tag: "Future",
    title: "Career Operating System",
    sub: "Horizon",
    icon: Orbit,
    desc: "A lifelong system that grows with you across roles, industries and decades.",
  },
];

export function Roadmap() {
  return (
    <section id="roadmap" className="relative py-28 lg:py-36">
      <div className="pointer-events-none absolute inset-x-0 top-0 hairline" />
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading eyebrow="Roadmap" title="Built in deliberate phases." />

        <div className="mt-20 grid gap-6 lg:grid-cols-3">
          {PHASES.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal key={p.title} delay={i * 100}>
                <article className="surface lift h-full p-8">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-accent/25 bg-primary/25">
                      <Icon className="h-5 w-5 text-accent" />
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                      {p.tag}
                    </span>
                  </div>
                  <h3 className="mt-7 font-display text-2xl tracking-tight">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-accent/80">
                    {p.sub}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {p.desc}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
