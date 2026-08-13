import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowDown } from "lucide-react";
import { Constellation } from "./Constellation";
import { Reveal, MaskedLines } from "./Reveal";
import { DemoBadge } from "./demo";

const FLOW = ["You", "Profile", "Agents", "Opportunities", "Action"];

const STATS = [
  ["6", "Specialized agents"],
  ["9", "Loop stages"],
  ["100%", "Human-approved"],
] as const;

export function Hero() {
  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      // min-h-dvh + centred content makes the hero own exactly one screen, so
      // the stats row always lands above the fold instead of being cut off.
      className="relative flex min-h-dvh items-center overflow-hidden pb-16 pt-28 lg:pb-20 lg:pt-28"
    >
      {/* Local hero bloom, layered over the page-wide atmosphere. */}
      <div className="hero-glow pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-background" />

      {/*
       * Capped at 96rem: wide enough to breathe on large displays, but narrow
       * enough that the copy and the constellation stay visually paired rather
       * than drifting to opposite edges of an ultra-wide window.
       */}
      <div className="relative mx-auto grid max-w-[96rem] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:px-10">
        <div className="min-w-0">
          <Reveal>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-[11px] uppercase tracking-[0.16em] text-muted-foreground backdrop-blur-md">
              <span className="animate-pulse-soft h-1.5 w-1.5 rounded-full bg-accent" />
              Agentic AI career operating system
            </span>
          </Reveal>

          {/*
           * Publication-cover headline: two tight lines keep the column
           * balanced against the constellation instead of running tall.
           */}
          <h1
            id="hero-title"
            className="mt-7 font-display text-[clamp(2.75rem,5.6vw,4.5rem)] leading-[0.96]"
          >
            <MaskedLines
              delay={120}
              stagger={110}
              lines={[
                <>Careers aren’t</>,
                <span className="text-gradient italic" key="l2">
                  found by luck.
                </span>,
              ]}
            />
          </h1>

          <Reveal delay={430}>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              CareerOS builds a living model of who you are professionally, sends six specialized
              agents to find and evaluate what fits, and prepares your next move — with you
              approving every step.
            </p>
          </Reveal>

          {/* The mechanism, stated as a single legible chain. */}
          <Reveal delay={500}>
            <ol className="mt-7 flex flex-wrap items-center gap-x-2.5 gap-y-3">
              {FLOW.map((s, i) => (
                <li key={s} className="flex items-center gap-2.5">
                  <span className="rounded-full border border-border bg-secondary/40 px-3.5 py-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur-sm">
                    {s}
                  </span>
                  {i < FLOW.length - 1 ? (
                    <span
                      className="h-px w-4 bg-gradient-to-r from-accent/55 to-accent/10"
                      aria-hidden="true"
                    />
                  ) : null}
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal delay={560}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <Link to="/workspace" className="btn-hero group">
                Enter CareerOS
                <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
              <a href="#problem" className="btn-ghost group">
                <ArrowDown className="h-4 w-4 transition-transform duration-500 group-hover:translate-y-0.5" />
                See how it works
              </a>
            </div>
          </Reveal>

          <Reveal delay={640}>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-6">
              {STATS.map(([v, k]) => (
                <div key={k} className="min-w-0">
                  <dt className="font-display tnum text-3xl text-ivory sm:text-4xl">{v}</dt>
                  <dd className="mt-1.5 text-[10px] uppercase leading-relaxed tracking-[0.14em] text-muted-foreground sm:text-[11px]">
                    {k}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal delay={300}>
          <div className="min-w-0">
            <Constellation />
            <div className="mt-6 flex justify-center">
              <DemoBadge label="Sample profile" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
