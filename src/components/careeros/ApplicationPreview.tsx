import { Sparkles } from "lucide-react";
import { Reveal, SectionHeading } from "./Reveal";

const FIELDS = [
  { label: "Full name", value: "Aarav Mehta", filled: true },
  { label: "Role applying for", value: "Senior Frontend Engineer", filled: true },
  { label: "Years of experience", value: "6 years", filled: true },
  { label: "Portfolio", value: "aaravmehta.dev", filled: true },
];

export function ApplicationPreview() {
  return (
    <section className="relative py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="Application intelligence"
          title="From opportunity to application, seamlessly."
          subtitle="Agents prepare everything. You stay in control of the final word."
        />

        <Reveal delay={100}>
          <div className="surface mx-auto mt-20 max-w-3xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-7 py-5">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                <p className="text-sm text-muted-foreground">
                  Application draft · Stripe
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] tracking-wide text-accent">
                <Sparkles className="h-3 w-3" />
                AI Pre-filled
              </span>
            </div>

            <div className="space-y-5 px-7 py-8">
              {FIELDS.map((f, i) => (
                <Reveal key={f.label} delay={i * 80}>
                  <label className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {f.label}
                  </label>
                  <div className="mt-2 flex items-center justify-between rounded-xl border border-border bg-secondary/50 px-4 py-3">
                    <span className="text-sm">{f.value}</span>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-accent/80">
                      auto
                    </span>
                  </div>
                </Reveal>
              ))}

              <Reveal delay={340}>
                <label className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Why this team
                </label>
                <div className="mt-2 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                  Six years building payment-adjacent interfaces taught me that trust
                  is a design problem as much as an engineering one — which is exactly
                  the work this team is doing.
                </div>
              </Reveal>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border bg-secondary/30 px-7 py-5">
              <p className="text-xs text-muted-foreground">
                Awaiting your approval — nothing is sent without you.
              </p>
              <div className="flex gap-3">
                <button type="button" className="btn-ghost !py-2.5 !text-sm">
                  Review
                </button>
                <button type="button" className="btn-hero !py-2.5 !text-sm">
                  Submit
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
