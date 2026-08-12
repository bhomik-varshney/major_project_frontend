import { ArrowRight, Play } from "lucide-react";
import { Constellation } from "./Constellation";
import { Reveal } from "./Reveal";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-36 pb-24 lg:pt-44 lg:pb-32">
      <div className="hero-glow pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-[1.05fr_1fr] lg:px-10">
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-xs tracking-wide text-muted-foreground">
              <span className="animate-pulse-soft h-1.5 w-1.5 rounded-full bg-accent" />
              Agentic AI career operating system
            </span>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="mt-8 font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Your career.
              <br />
              <span className="text-gradient italic">Handled intelligently.</span>
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              CareerOS understands your profile, discovers the right opportunities,
              evaluates fit, and moves you from goals to growth.
            </p>
          </Reveal>

          <Reveal delay={260}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a href="#final" className="btn-hero">
                Enter CareerOS
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#agents" className="btn-ghost">
                <Play className="h-4 w-4" />
                See how it works
              </a>
            </div>
          </Reveal>

          <Reveal delay={340}>
            <dl className="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-8">
              {[
                ["6", "Specialized agents"],
                ["34", "Unlocked opportunities"],
                ["92%", "Average match precision"],
              ].map(([v, k]) => (
                <div key={k}>
                  <dt className="font-display text-3xl text-ivory">{v}</dt>
                  <dd className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {k}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal delay={200}>
          <Constellation />
        </Reveal>
      </div>
    </section>
  );
}
