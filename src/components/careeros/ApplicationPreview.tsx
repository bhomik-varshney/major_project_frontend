import { Sparkles, Check, Loader2, Lock } from "lucide-react";
import { Reveal, SectionHeading } from "./Reveal";
import { DemoBadge } from "./demo";

const STEPS = [
  { label: "Discover", state: "done" },
  { label: "Analyze", state: "done" },
  { label: "Prepare", state: "done" },
  { label: "Apply", state: "waiting" },
  { label: "Track", state: "idle" },
  { label: "Follow up", state: "idle" },
] as const;

const FIELDS = [
  { label: "Full name", value: "Aarav Mehta", source: "Profile" },
  { label: "Role applying for", value: "Senior Frontend Engineer", source: "Match" },
  { label: "Years of experience", value: "6 years", source: "Profile" },
  { label: "Portfolio", value: "aaravmehta.dev", source: "Profile" },
];

function StepIcon({ state }: { state: (typeof STEPS)[number]["state"] }) {
  if (state === "done") return <Check className="h-3 w-3" />;
  if (state === "waiting")
    return <Loader2 className="h-3 w-3 animate-spin [animation-duration:2.4s]" />;
  return <span className="h-1 w-1 rounded-full bg-current" />;
}

/**
 * Sections 06 + 07 — Act, and the application surface.
 *
 * The form here is a *product preview*: it shows how an agent-prepared,
 * dynamically-generated application would look. It is not wired to a backend,
 * which the copy and the demo badge state explicitly.
 */
export function ApplicationPreview() {
  return (
    <section id="preview" aria-labelledby="preview-title" className="section-y relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 hairline" />

      <div className="shell">
        <SectionHeading
          index="06"
          eyebrow="Act — with your approval"
          title={
            <span id="preview-title">
              The agent prepares.
              <br />
              <span className="italic text-muted-foreground">You decide.</span>
            </span>
          }
          subtitle="Every application is drafted against the specific team and role, then held at the last step until you approve it."
        />

        {/* Agentic pipeline */}
        <Reveal delay={100}>
          <ol className="mt-16 flex flex-wrap items-center gap-x-3 gap-y-4">
            {STEPS.map((s, i) => (
              <li key={s.label} className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-xs tracking-wide transition-colors duration-500 ${
                    s.state === "done"
                      ? "border-accent/35 bg-accent/8 text-accent"
                      : s.state === "waiting"
                        ? "border-rose-gold/45 bg-rose-gold/8 text-rose-gold"
                        : "border-border bg-secondary/35 text-muted-foreground"
                  }`}
                >
                  <StepIcon state={s.state} />
                  {s.label}
                </span>
                {i < STEPS.length - 1 ? (
                  <span
                    className="hidden h-px w-6 bg-gradient-to-r from-accent/45 to-accent/5 sm:block"
                    aria-hidden="true"
                  />
                ) : null}
              </li>
            ))}
          </ol>
        </Reveal>

        <div className="mt-14 grid items-start gap-6 lg:grid-cols-[1.35fr_1fr] lg:gap-8">
          {/* The application surface */}
          <Reveal>
            <div className="surface overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-5 sm:px-7">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  <p className="text-sm text-muted-foreground">Application draft · Stripe</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] tracking-wide text-accent">
                  <Sparkles className="h-3 w-3" />
                  Agent pre-filled
                </span>
              </div>

              <div className="space-y-5 px-6 py-8 sm:px-7">
                {FIELDS.map((f, i) => (
                  <Reveal key={f.label} delay={i * 70}>
                    <label className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {f.label}
                    </label>
                    <div className="mt-2 flex items-center justify-between gap-4 rounded-xl border border-border bg-secondary/50 px-4 py-3 transition-colors duration-500 hover:border-accent/30">
                      <span className="min-w-0 truncate text-sm">{f.value}</span>
                      <span className="shrink-0 text-[9px] uppercase tracking-[0.16em] text-accent/75">
                        from {f.source}
                      </span>
                    </div>
                  </Reveal>
                ))}

                <Reveal delay={300}>
                  <label className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Why this team
                  </label>
                  <div className="mt-2 rounded-xl border border-border bg-secondary/50 px-4 py-3.5 text-sm leading-relaxed text-muted-foreground">
                    Six years building payment-adjacent interfaces taught me that trust is a design
                    problem as much as an engineering one — which is exactly the work this team is
                    doing.
                  </div>
                </Reveal>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border bg-secondary/30 px-6 py-5 sm:px-7">
                <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3 text-accent/70" />
                  Nothing is sent without your approval.
                </p>
                <div className="flex gap-3">
                  <button type="button" className="btn-ghost !py-2.5 !text-sm">
                    Review
                  </button>
                  <button type="button" className="btn-hero !py-2.5 !text-sm">
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </Reveal>

          {/* The roadmap note — honest about what is and isn't built */}
          <div className="space-y-6">
            <Reveal delay={120}>
              <div className="surface p-7">
                <p className="eyebrow">On the roadmap</p>
                <h3 className="mt-4 font-display text-2xl leading-snug tracking-tight">
                  Forms that build themselves
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Every employer asks for the same information in a different shape. The planned MCP
                  integration lets an agent read an application form, map each field to your
                  profile, and assemble the response — so you review one draft instead of retyping
                  your career for the ninth time.
                </p>
                <div className="mt-6 hairline" />
                <p className="mt-6 text-xs leading-relaxed text-muted-foreground/75">
                  The panel on the left is a design preview of that experience. It is not connected
                  to a live application backend.
                </p>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <DemoBadge label="Product preview — not live" />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
