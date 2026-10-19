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

      <div className="relative mx-auto grid w-full max-w-[110rem] items-center gap-10 px-5 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-6 lg:px-10">
        <div className="min-w-0">
          {/*
           * Publication-cover headline: two tight lines keep the column
           * balanced against the constellation instead of running tall.
           */}
          <h1
            id="hero-title"
            className="font-display text-[clamp(3rem,6vw,5.25rem)] leading-[0.96]"
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
              Find your fit. Plan your next move. Build a career that keeps rising.
            </p>
          </Reveal>

          {/* The mechanism, stated as a single legible chain. */}
          <Reveal delay={500} variant="x">
            <ol className="mt-7 flex w-full flex-nowrap items-center justify-start gap-1 sm:gap-2">
              {FLOW.map((s, i) => (
                <li key={s} className="flex shrink-0 items-center gap-1 sm:gap-2">
                  <span className="whitespace-nowrap rounded-full border border-border bg-secondary/60 px-0.5 py-1 text-[clamp(6px,2.5vw,7px)] uppercase tracking-[0.06em] text-muted-foreground sm:px-2 sm:py-1.5 sm:text-[9px] sm:tracking-[0.12em] xl:px-3 xl:text-[10px] xl:tracking-[0.18em]">
                    {s}
                  </span>
                  {i < FLOW.length - 1 ? (
                    <span
                      className="h-px w-1 shrink-0 bg-gradient-to-r from-accent/55 to-accent/10 sm:w-3 xl:w-4"
                      aria-hidden="true"
                    />
                  ) : null}
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal delay={560}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <Link to="/dashboard" className="btn-hero group">
                Enter Ascendra
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
