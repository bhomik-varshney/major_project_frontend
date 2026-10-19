import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Reveal, MaskedLines } from "./Reveal";

/* Deterministic scatter — a constellation, not uniform noise. */
const STARS = Array.from({ length: 34 }, (_, i) => ({
  left: (i * 37.7) % 100,
  top: (i * 61.3) % 100,
  size: i % 7 === 0 ? 2.5 : 1.5,
  delay: (i % 9) * 0.45,
}));

/** Final CTA — closes the loop back on the constellation metaphor. */
export function FinalCTA() {
  return (
    <section
      id="final"
      aria-labelledby="final-title"
      className="relative overflow-hidden py-32 lg:py-48"
    >
      <div className="hero-glow pointer-events-none absolute inset-0 opacity-85" />

      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="animate-pulse-soft absolute rounded-full bg-accent"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}

        {/* Faint constellation lines binding a few of the stars. */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          {STARS.slice(0, 12).map((s, i) => {
            const n = STARS[(i + 3) % 12]!;
            return (
              <line
                key={i}
                x1={s.left}
                y1={s.top}
                x2={n.left}
                y2={n.top}
                stroke="var(--rose)"
                strokeOpacity="0.12"
                strokeWidth="0.15"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
      </div>

      <div className="shell relative max-w-3xl text-center">
        <Reveal>
          <p className="eyebrow">Begin</p>
        </Reveal>

        <h2
          id="final-title"
          className="mt-7 font-display text-[clamp(2.5rem,6.5vw,4.75rem)] leading-[1.02]"
        >
          <MaskedLines
            delay={80}
            stagger={110}
            lines={[
              <>Your next opportunity</>,
              <span className="text-gradient italic" key="l2">
                is already out there.
              </span>,
            ]}
          />
        </h2>

        <Reveal delay={340}>
          <p className="mx-auto mt-7 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
            Let's make sure it finds you ready.
          </p>
        </Reveal>

        <Reveal delay={420}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Link to="/dashboard" className="btn-hero group !px-9 !py-4 !text-base">
              Enter CareerOS
              <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
            </Link>
            <a href="#understands" className="btn-ghost !px-8 !py-4 !text-base">
              Explore the intelligence
            </a>
          </div>
        </Reveal>

        <Reveal delay={500}>
          <p className="mt-10 text-xs text-muted-foreground/65">
            A university major project — an agentic AI career companion.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
