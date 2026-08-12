import { Reveal, SectionHeading } from "./Reveal";

const MATCHES = [
  { role: "Senior Frontend Engineer", company: "Stripe", loc: "Remote · EU", score: 94 },
  { role: "Product Engineer", company: "Linear", loc: "Hybrid · Berlin", score: 88 },
  { role: "Staff Engineer, Platform", company: "NVIDIA", loc: "Onsite · Munich", score: 81 },
];

const REASONS = [
  "Systems design depth matches their platform charter",
  "Shipped 3 products at comparable scale",
  "Team explicitly hiring for TypeScript + infra overlap",
];

function Ring({ score }: { score: number }) {
  const c = 2 * Math.PI * 26;
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
      <circle cx="32" cy="32" r="26" fill="none" stroke="var(--border)" strokeWidth="4" />
      <circle
        cx="32"
        cy="32"
        r="26"
        fill="none"
        stroke="var(--rose)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (c * score) / 100}
      />
    </svg>
  );
}

export function Opportunities() {
  return (
    <section id="opportunities" className="relative py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="Opportunity intelligence"
          title="Intelligent opportunity discovery."
          subtitle="Not a feed of listings. A ranked, reasoned shortlist of the roles that actually fit the person you are becoming."
        />

        <div className="mt-20 grid items-start gap-8 lg:grid-cols-[1.15fr_1fr]">
          <Reveal>
            <article className="surface relative p-8 md:p-10">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="eyebrow">Top match</p>
                  <h3 className="mt-3 font-display text-3xl tracking-tight md:text-4xl">
                    Senior Frontend Engineer
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Stripe · Remote (EU) · Full-time
                  </p>
                </div>
                <div className="relative shrink-0">
                  <Ring score={94} />
                  <span className="absolute inset-0 flex items-center justify-center font-display text-lg">
                    94
                  </span>
                </div>
              </div>

              <div className="mt-8 hairline" />

              <div className="mt-8 space-y-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Why it matches you
                </p>
                <ul className="space-y-3">
                  {REASONS.map((r) => (
                    <li key={r} className="flex gap-3 text-sm text-muted-foreground">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 rounded-[1px] bg-accent" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4">
                {[
                  ["Skills match", "91%"],
                  ["Seniority fit", "High"],
                  ["Comp signal", "Above range"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-border bg-secondary/40 p-4">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      {k}
                    </p>
                    <p className="mt-1.5 font-display text-lg">{v}</p>
                  </div>
                ))}
              </div>
            </article>
          </Reveal>

          <div className="space-y-5">
            {MATCHES.map((m, i) => (
              <Reveal key={m.role} delay={i * 90}>
                <article className="surface lift flex items-center justify-between gap-5 p-6">
                  <div>
                    <h4 className="text-base font-semibold tracking-tight">{m.role}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {m.company} · {m.loc}
                    </p>
                  </div>
                  <div className="relative shrink-0">
                    <Ring score={m.score} />
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                      {m.score}
                    </span>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
