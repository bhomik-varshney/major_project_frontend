import { Reveal, MaskedLines } from "./Reveal";

/**
 * Section 01 — The problem.
 *
 * Deliberately quiet and type-led: after the dense hero the page exhales.
 * The composition is asymmetric (a hairline rule + offset column) rather than
 * a centered title over cards.
 */

/* Deterministic so SSR and client agree — no Math.random() during render. */
const SCATTER = Array.from({ length: 11 }, (_, i) => ({
  x: (i * 29.7) % 82,
  y: (i * 17.3) % 88,
  size: 8 + ((i * 7) % 16),
  rot: (i * 37) % 90,
  delay: (i % 6) * 0.8,
  dur: 8 + (i % 5),
}));

const FRAGMENTS = [
  { k: "Tabs open", v: "14", note: "Job boards, spreadsheets, notes apps" },
  { k: "Résumé versions", v: "6", note: "None of them current" },
  { k: "Roles you never saw", v: "∞", note: "Filled before you searched" },
];

export function Problem() {
  return (
    <section
      id="problem"
      aria-labelledby="problem-title"
      className="section-y relative overflow-hidden"
    >
      {/*
       * Scattered, UNCONNECTED nodes — the visual inverse of the hero's
       * constellation. Decorative, so it's hidden from assistive tech and
       * only drawn where there is room for it.
       */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] xl:block"
        aria-hidden="true"
      >
        {SCATTER.map((s, i) => (
          <span
            key={i}
            className="animate-float absolute rounded-[2px] border border-accent/25 bg-primary/15"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              transform: `rotate(${s.rot}deg)`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.dur}s`,
            }}
          />
        ))}
      </div>

      <div className="shell relative">
        <div className="grid gap-14 lg:grid-cols-[auto_1fr] lg:gap-20">
          {/* Editorial index rail */}
          <div className="flex items-start gap-6 lg:flex-col lg:items-center lg:gap-8">
            <span className="section-index" aria-hidden="true">
              01
            </span>
            <Reveal className="hidden lg:block lg:flex-1" variant="none">
              <span className="rule-y block h-full min-h-40" aria-hidden="true" />
            </Reveal>
          </div>

          <div className="min-w-0">
            <Reveal>
              <p className="eyebrow">The problem</p>
            </Reveal>

            <h2
              id="problem-title"
              className="mt-7 font-display text-[2.5rem] leading-[1.02] sm:text-5xl md:text-6xl lg:text-[4.5rem]"
            >
              <MaskedLines
                delay={80}
                lines={[
                  <>Career decisions are</>,
                  <span className="italic text-muted-foreground" key="l2">
                    made in fragments.
                  </span>,
                ]}
              />
            </h2>

            <Reveal delay={200}>
              <p className="mt-8 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                A tab here. A bookmark there. A résumé you last touched in March. The signal about
                where you could go next is scattered across a dozen places that never talk to each
                other — so the decision gets made by whatever you happened to see that week.
              </p>
            </Reveal>

            {/* Asymmetric fragment ledger — not a card grid. */}
            <ul className="mt-14 max-w-2xl">
              {FRAGMENTS.map((f, i) => (
                <Reveal as="li" key={f.k} delay={260 + i * 90}>
                  <div className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-5 border-t border-border py-5 transition-colors duration-500 hover:border-accent/30 sm:gap-8">
                    <span className="font-display tnum text-3xl text-accent/70 transition-colors duration-500 group-hover:text-accent sm:text-4xl">
                      {f.v}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium tracking-tight">{f.k}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                        {f.note}
                      </span>
                    </span>
                    <span
                      className="h-px w-6 bg-border transition-all duration-500 group-hover:w-10 group-hover:bg-accent/50 sm:w-10"
                      aria-hidden="true"
                    />
                  </div>
                </Reveal>
              ))}
              <Reveal as="li" delay={560} variant="none">
                <span className="draw-line block h-px w-full bg-border" aria-hidden="true" />
              </Reveal>
            </ul>

            <Reveal delay={620}>
              <blockquote className="mt-14 max-w-md border-l border-accent/35 pl-6 font-display text-2xl italic leading-snug text-ivory/85 sm:text-3xl">
                The opportunity you never saw is indistinguishable from the one that never existed.
              </blockquote>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
