import { useState } from "react";
import { Brain, Compass, FileCheck2, Radar, Send, Target } from "lucide-react";
import { Reveal, SectionHeading } from "./Reveal";

const AGENTS = [
  {
    name: "Planner",
    icon: Compass,
    desc: "Turns your ambition into a sequenced, realistic plan.",
    detail:
      "Reads your goal, your constraints and your timeline, then works backwards into the moves that actually compound.",
    output: "A dated plan",
  },
  {
    name: "Researcher",
    icon: Radar,
    desc: "Continuously scans the market for relevant motion.",
    detail:
      "Watches companies, teams and postings in your target band — including the ones that never reach a job board.",
    output: "A live opportunity pool",
  },
  {
    name: "Matcher",
    icon: Target,
    desc: "Scores every opportunity against your true profile.",
    detail:
      "Weighs skills, seniority, trajectory, location and compensation, then explains its reasoning in plain language.",
    output: "A ranked shortlist",
  },
  {
    name: "Skills Analyst",
    icon: Brain,
    desc: "Finds the gaps that quietly cost you offers.",
    detail:
      "Compares what you have against what your target roles keep asking for, and ranks gaps by how much they unlock.",
    output: "Prioritised gaps",
  },
  {
    name: "Application Agent",
    icon: Send,
    desc: "Prepares tailored applications for your approval.",
    detail:
      "Drafts each application against the specific team and role. Nothing leaves your hands without you saying so.",
    output: "A draft awaiting you",
  },
  {
    name: "Tracker",
    icon: FileCheck2,
    desc: "Follows every thread so nothing goes cold.",
    detail:
      "Keeps state on every conversation, deadline and follow-up, and tells you when a thread needs a nudge.",
    output: "Nothing forgotten",
  },
];

/**
 * Section 02 — The companion.
 *
 * An interactive ledger rather than a six-card grid: the list on the left is
 * the index, the panel on the right is the reading surface.
 */
export function Agents() {
  const [active, setActive] = useState(0);
  const current = AGENTS[active]!;
  const CurrentIcon = current.icon;

  return (
    <section id="agents" aria-labelledby="agents-title" className="section-y relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 hairline" />

      <div className="shell relative">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SectionHeading
            index="02"
            eyebrow="The companion"
            title={
              <span id="agents-title">
                Not a chatbot.
                <br />
                <span className="italic text-muted-foreground">A system that works.</span>
              </span>
            }
          />
          <Reveal delay={160}>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Six specialized agents, each responsible for one part of the career loop —
              coordinating with each other, reporting to you.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          {/* Index */}
          <ol className="min-w-0">
            {AGENTS.map((a, i) => {
              const Icon = a.icon;
              const on = active === i;
              return (
                <Reveal as="li" key={a.name} delay={i * 60}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                    aria-pressed={on}
                    className={`group grid w-full grid-cols-[auto_auto_1fr_auto] items-center gap-4 border-t border-border py-5 text-left transition-colors duration-500 sm:gap-5 ${
                      on ? "border-accent/40" : "hover:border-accent/25"
                    }`}
                  >
                    <span
                      className={`tnum text-[11px] tracking-[0.2em] transition-colors duration-500 ${
                        on ? "text-accent" : "text-muted-foreground/60"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition-all duration-500 ${
                        on ? "border-accent/45 bg-primary/35" : "border-border bg-secondary/30"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 transition-colors duration-500 ${
                          on ? "text-accent" : "text-muted-foreground"
                        }`}
                      />
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block font-display text-xl tracking-tight transition-colors duration-500 ${
                          on ? "text-ivory" : "text-muted-foreground"
                        }`}
                      >
                        {a.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground/75">
                        {a.desc}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={`h-px bg-accent transition-all duration-500 ${
                        on ? "w-8 opacity-100" : "w-3 opacity-30"
                      }`}
                    />
                  </button>
                </Reveal>
              );
            })}
            <li className="border-t border-border" />
          </ol>

          {/* Reading surface */}
          <Reveal delay={140}>
            <div className="surface sticky top-28 overflow-hidden p-8 md:p-10">
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-primary/25 blur-3xl"
                aria-hidden="true"
              />
              <div className="relative">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-xl border border-accent/30 bg-primary/30">
                    <CurrentIcon className="h-5 w-5 text-accent" />
                  </span>
                  <div>
                    <p className="eyebrow">Agent {String(active + 1).padStart(2, "0")}</p>
                    <p className="mt-1 font-display text-2xl tracking-tight">{current.name}</p>
                  </div>
                </div>

                <p
                  key={current.name}
                  className="mt-8 text-base leading-relaxed text-muted-foreground md:text-lg"
                  style={{ animation: "rise-in 0.5s var(--ease-premium) both" }}
                >
                  {current.detail}
                </p>

                <div className="mt-8 hairline" />

                <div className="mt-8 flex items-center justify-between gap-4">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Produces
                  </span>
                  <span className="text-sm text-accent">{current.output}</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
