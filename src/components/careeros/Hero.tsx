import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowDown } from "lucide-react";
import { Constellation } from "./Constellation";
import { Reveal } from "./Reveal";
import { DemoBadge } from "./demo";

const FLOW = ["You", "Profile", "AI agents", "Opportunities", "Career action"];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-32 pb-20 lg:pt-44 lg:pb-32">
      <div className="hero-glow pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-10">
        <div className="min-w-0">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-xs tracking-wide text-muted-foreground">
              <span className="animate-pulse-soft h-1.5 w-1.5 rounded-full bg-accent" />
              Agentic AI career operating system
            </span>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="mt-8 font-display text-[2.6rem] leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
              Your career.
              <br />
              <span className="text-gradient italic">Handled intelligently.</span>
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              CareerOS builds a living model of your profile, sends six specialized
              agents to find and evaluate opportunities, then prepares your next move —
              with you approving every step.
            </p>
          </Reveal>

          {/* The product mechanism, stated plainly */}
          <Reveal delay={240}>
            <ol className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2.5">
              {FLOW.map((s, i) => (
                <li key={s} className="flex items-center gap-3">
                  <span
                    className="animate-pulse-soft inline-flex items-center gap-2 rounded-full border border-border bg-secondary/45 px-3.5 py-1.5 text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
                    style={{ animationDelay: `${i * 0.5}s`, animationDuration: "6s" }}
                  >
                    {s}
                  </span>
                  {i < FLOW.length - 1 ? (
                    <span className="hidden h-px w-5 bg-gradient-to-r from-accent/60 to-transparent sm:block" />
                  ) : null}
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal delay={300}>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <Link to="/workspace" className="btn-hero group">
                Enter CareerOS
                <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
              <a href="#understands" className="btn-ghost group">
                <ArrowDown className="h-4 w-4 transition-transform duration-500 group-hover:translate-y-0.5" />
                See how it works
              </a>
            </div>
          </Reveal>

          <Reveal delay={360}>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-5 border-t border-border pt-8">
              {[
                ["6", "Specialized agents"],
                ["9", "Loop stages"],
                ["100%", "Human-approved actions"],
              ].map(([v, k]) => (
                <div key={k} className="min-w-0">
                  <dt className="font-display text-2xl text-ivory sm:text-3xl">{v}</dt>
                  <dd className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:text-xs">
                    {k}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal delay={200}>
          <div className="min-w-0">
            <Constellation />
            <div className="mt-4 flex justify-center">
              <DemoBadge label="Sample profile" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
