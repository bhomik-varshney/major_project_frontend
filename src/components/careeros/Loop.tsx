import { useState } from "react";
import { Reveal, SectionHeading } from "./Reveal";

const STAGES = [
  { label: "Discover", note: "The Researcher surfaces what you'd never have found." },
  { label: "Decide", note: "The Matcher ranks it and shows its reasoning." },
  { label: "Apply", note: "The Application Agent drafts; you approve." },
  { label: "Learn", note: "Every outcome — offer or rejection — is signal." },
  { label: "Improve", note: "The Skills Analyst turns signal into a next move." },
];

const R = 34;

/**
 * Section 08 — The career loop.
 *
 * Rendered as an actual ring so the "growth is a loop, not a line" idea is
 * carried by the composition rather than by the caption.
 */
export function Loop() {
  const [active, setActive] = useState(0);
  const n = STAGES.length;

  return (
    <section id="loop" aria-labelledby="loop-title" className="section-y relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 hairline" />

      <div className="shell">
        <SectionHeading
          index="08"
          eyebrow="The career loop"
          align="center"
          title={
            <span id="loop-title">
              Growth is not a line.
              <br />
              <span className="italic text-muted-foreground">It is a loop.</span>
            </span>
          }
          subtitle="Every cycle teaches the system more about you — and makes the next move sharper than the last."
        />

        <Reveal delay={120}>
          <div className="relative mx-auto mt-16 w-full max-w-[540px]">
            <div
              className="pointer-events-none absolute inset-10 rounded-full bg-primary/20 blur-3xl"
              aria-hidden="true"
            />

            <svg viewBox="0 0 100 100" className="relative w-full" aria-hidden="true">
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke="var(--border)"
                strokeWidth="0.3"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke="var(--rose)"
                strokeOpacity="0.55"
                strokeWidth="0.6"
                vectorEffect="non-scaling-stroke"
                className="animate-dash"
              />
              <circle
                cx="50"
                cy="50"
                r={R - 9}
                fill="none"
                stroke="var(--rose-gold)"
                strokeOpacity="0.12"
                strokeWidth="0.25"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* Centre reading surface */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="mx-auto max-w-[46%] text-center">
                <p className="tnum text-[10px] uppercase tracking-[0.2em] text-accent">
                  Stage {String(active + 1).padStart(2, "0")}
                </p>
                <p className="mt-2 font-display text-2xl leading-tight tracking-tight sm:text-3xl">
                  {STAGES[active]!.label}
                </p>
                <p
                  key={active}
                  className="mt-3 text-[11px] leading-relaxed text-muted-foreground sm:text-xs"
                  style={{ animation: "rise-in 0.5s var(--ease-premium) both" }}
                >
                  {STAGES[active]!.note}
                </p>
              </div>
            </div>

            {/* Stage nodes placed on the ring */}
            {STAGES.map((s, i) => {
              const a = (Math.PI * 2 * i) / n - Math.PI / 2;
              const x = 50 + R * Math.cos(a);
              const y = 50 + R * Math.sin(a);
              const on = active === i;
              return (
                <button
                  key={s.label}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  aria-pressed={on}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <span
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] tracking-wide backdrop-blur-md transition-all duration-500 ${
                      on
                        ? "border-accent/55 bg-secondary/95 text-foreground shadow-[0_0_30px_-8px_var(--rose)]"
                        : "border-border bg-secondary/70 text-muted-foreground hover:border-accent/30"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rotate-45 rounded-[1px] transition-colors duration-500 ${
                        on ? "bg-accent" : "bg-accent/40"
                      }`}
                      aria-hidden="true"
                    />
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={200}>
          <p className="mt-14 text-center text-xs text-muted-foreground/70">
            Hover or focus a stage to read it.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
