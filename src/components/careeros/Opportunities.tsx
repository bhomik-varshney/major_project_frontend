import { MapPin, Building2 } from "lucide-react";
import { Reveal, SectionHeading } from "./Reveal";
import { DemoBadge } from "./demo";

const MATCHES = [
  {
    role: "Product Engineer",
    company: "Linear",
    loc: "Hybrid · Berlin",
    score: 88,
    signal: "Design-adjacent engineering",
  },
  {
    role: "Staff Engineer, Platform",
    company: "NVIDIA",
    loc: "Onsite · Munich",
    score: 81,
    signal: "Stretch on seniority",
  },
  {
    role: "AI Platform Engineer",
    company: "Spotify",
    loc: "Remote · EU",
    score: 78,
    signal: "Adjacent domain",
  },
];

const REASONS = [
  "Systems design depth matches their platform charter",
  "Shipped 3 products at comparable scale",
  "Team explicitly hiring for TypeScript + infra overlap",
];

const FACTORS = [
  ["Skills", 91],
  ["Experience", 88],
  ["Goals", 96],
  ["Location", 100],
  ["Compensation", 84],
] as const;

function Ring({ score, size = 64 }: { score: number; size?: number }) {
  const c = 2 * Math.PI * 26;
  return (
    <svg
      viewBox="0 0 64 64"
      className="-rotate-90"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="26" fill="none" stroke="var(--border)" strokeWidth="3" />
      <circle
        cx="32"
        cy="32"
        r="26"
        fill="none"
        stroke="var(--rose)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (c * score) / 100}
      />
    </svg>
  );
}

/**
 * Sections 04 + 05 — Discover and Understand, deliberately fused.
 * A single oversized "hero opportunity" carries the match reasoning; the
 * shortlist beside it stays compact so the hierarchy is unmistakable.
 */
export function Opportunities() {
  return (
    <section
      id="opportunities"
      aria-labelledby="opportunities-title"
      className="section-y relative"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 hairline" />

      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            index="04"
            eyebrow="Discover & understand"
            title={
              <span id="opportunities-title">
                Not a feed.
                <br />
                <span className="italic text-muted-foreground">A reasoned shortlist.</span>
              </span>
            }
          />
          <Reveal delay={140}>
            <DemoBadge label="Illustrative matches" />
          </Reveal>
        </div>

        <div className="mt-16 grid items-start gap-6 lg:grid-cols-[1.3fr_1fr] lg:gap-8">
          {/* Feature opportunity */}
          <Reveal>
            <article className="surface relative overflow-hidden p-8 md:p-11">
              <div
                className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-primary/25 blur-3xl"
                aria-hidden="true"
              />
              <div className="relative">
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div className="min-w-0">
                    <p className="eyebrow">Top match</p>
                    <h3 className="mt-4 font-display text-[2rem] leading-[1.06] tracking-tight md:text-[2.75rem]">
                      Senior Frontend Engineer
                    </h3>
                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-accent/70" />
                        Stripe
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-accent/70" />
                        Remote · EU
                      </span>
                      <span>Full-time</span>
                    </div>
                  </div>
                  <div className="relative shrink-0">
                    <Ring score={94} size={76} />
                    <span className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-display tnum text-xl leading-none">94</span>
                      <span className="mt-0.5 text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
                        match
                      </span>
                    </span>
                  </div>
                </div>

                <div className="mt-9 hairline" />

                {/* Factor breakdown — the "understand" half of the story. */}
                <div className="mt-9">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    How the score is built
                  </p>
                  <ul className="mt-5 space-y-3.5">
                    {FACTORS.map(([label, v], i) => (
                      <Reveal as="li" key={label} delay={i * 70}>
                        <div className="grid grid-cols-[7rem_1fr_auto] items-center gap-4 sm:grid-cols-[8rem_1fr_auto]">
                          <span className="truncate text-xs text-muted-foreground">{label}</span>
                          <span
                            className="h-1 overflow-hidden rounded-full bg-muted"
                            aria-hidden="true"
                          >
                            <span
                              className="block h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-1000 ease-out"
                              style={{ width: `${v}%` }}
                            />
                          </span>
                          <span className="tnum text-xs text-muted-foreground">{v}</span>
                        </div>
                      </Reveal>
                    ))}
                  </ul>
                </div>

                <div className="mt-9 hairline" />

                <div className="mt-9">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Why it matches you
                  </p>
                  <ul className="mt-5 space-y-3">
                    {REASONS.map((r) => (
                      <li
                        key={r}
                        className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                      >
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rotate-45 rounded-[1px] bg-accent"
                          aria-hidden="true"
                        />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          </Reveal>

          {/* Shortlist */}
          <div className="space-y-4">
            <Reveal>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Also shortlisted
              </p>
            </Reveal>
            {MATCHES.map((m, i) => (
              <Reveal key={m.role} delay={i * 90}>
                <article className="surface lift group flex items-center justify-between gap-5 p-6">
                  <div className="min-w-0">
                    <h4 className="truncate text-base font-semibold tracking-tight transition-colors duration-500 group-hover:text-accent">
                      {m.role}
                    </h4>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {m.company} · {m.loc}
                    </p>
                    <p className="mt-3 inline-flex rounded-full border border-border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/80">
                      {m.signal}
                    </p>
                  </div>
                  <div className="relative shrink-0">
                    <Ring score={m.score} size={58} />
                    <span className="tnum absolute inset-0 flex items-center justify-center text-sm font-semibold">
                      {m.score}
                    </span>
                  </div>
                </article>
              </Reveal>
            ))}

            <Reveal delay={280}>
              <p className="pt-2 text-xs leading-relaxed text-muted-foreground/75">
                Ranking is produced by the Matcher agent and always shows its reasoning — you are
                never asked to trust a number on its own.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
