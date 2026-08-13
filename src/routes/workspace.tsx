import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Brain,
  Check,
  Compass,
  FileCheck2,
  Radar,
  Send,
  Target,
} from "lucide-react";

import { Nav } from "@/components/careeros/Nav";
import { Footer } from "@/components/careeros/Footer";
import { AgentRun } from "@/components/careeros/AgentRun";
import { DemoBadge } from "@/components/careeros/demo";

const TITLE = "Sample Workspace — CareerOS";
const DESCRIPTION =
  "Step inside a sample CareerOS workspace: your goal, six agents working the career loop, ranked matches, skill gaps, and applications awaiting your approval.";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Workspace,
});

const AGENTS = [
  { name: "Planner", icon: Compass, status: "Plan sequenced", tone: "done" },
  { name: "Researcher", icon: Radar, status: "Scanning", tone: "live" },
  { name: "Matcher", icon: Target, status: "12 ranked", tone: "done" },
  { name: "Skills Analyst", icon: Brain, status: "3 gaps found", tone: "done" },
  { name: "Application Agent", icon: Send, status: "1 awaiting you", tone: "wait" },
  { name: "Tracker", icon: FileCheck2, status: "5 threads open", tone: "live" },
] as const;

const QUEUE = [
  { role: "Senior Frontend Engineer", co: "Stripe", score: 94, state: "Draft ready" },
  { role: "Product Engineer", co: "Linear", score: 88, state: "Matched" },
  { role: "Staff Engineer, Platform", co: "NVIDIA", score: 81, state: "Matched" },
  { role: "AI Platform Engineer", co: "Spotify", score: 78, state: "Researching" },
];

const NEXT_ACTIONS = [
  "Approve the Stripe application draft prepared by the Application Agent.",
  "Start Docker fundamentals — the highest-leverage gap this quarter.",
  "Reply to the Linear recruiter thread before it goes cold.",
];

function toneClass(tone: string) {
  if (tone === "live") return "text-accent";
  if (tone === "wait") return "text-rose-gold";
  return "text-muted-foreground";
}

function Workspace() {
  const [done, setDone] = useState<number[]>([]);

  return (
    <div className="relative min-h-dvh bg-background">
      <Nav />
      <main className="mx-auto max-w-7xl px-5 pb-24 pt-28 sm:px-6 lg:px-10 lg:pt-36">
        <div className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-70" />

        <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
          <div className="min-w-0">
            <DemoBadge label="Sample CareerOS workspace" />
            <h1 className="mt-5 font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Good afternoon, <span className="italic text-muted-foreground">Aarav.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Your goal is <span className="text-foreground">Staff Engineer within 18
              months</span>. Six agents worked overnight. Nothing has been sent — every
              action below waits for you.
            </p>
          </div>
          <Link to="/" className="btn-ghost shrink-0 !py-2.5 !text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>

        <p className="relative mt-6 max-w-3xl rounded-xl border border-border bg-secondary/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          This workspace is an interactive product demonstration. All profiles, scores
          and companies shown are illustrative sample data — not real accounts,
          listings, or performance claims.
        </p>

        {/* Agent grid */}
        <section aria-labelledby="ws-agents" className="relative mt-14">
          <h2 id="ws-agents" className="eyebrow">
            Agent system
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {AGENTS.map((a) => {
              const Icon = a.icon;
              return (
                <li key={a.name}>
                  <div className="surface lift flex items-center gap-4 p-5">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-accent/25 bg-primary/25">
                      <Icon className="h-4.5 w-4.5 text-accent" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold tracking-tight">
                        {a.name}
                      </p>
                      <p
                        className={`mt-1 flex items-center gap-2 text-xs ${toneClass(a.tone)}`}
                      >
                        {a.tone === "done" ? null : (
                          <span className="animate-pulse-soft h-1.5 w-1.5 rounded-full bg-current" />
                        )}
                        {a.status}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="relative mt-14 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          {/* Live run */}
          <section aria-labelledby="ws-run" className="min-w-0">
            <h2 id="ws-run" className="eyebrow">
              Latest agent run
            </h2>
            <div className="mt-6">
              <AgentRun compact />
            </div>
          </section>

          {/* Queue + actions */}
          <div className="min-w-0 space-y-6">
            <section aria-labelledby="ws-queue">
              <h2 id="ws-queue" className="eyebrow">
                Opportunity queue
              </h2>
              <ul className="surface mt-6 divide-y divide-border">
                {QUEUE.map((q) => (
                  <li
                    key={q.role}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{q.role}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {q.co} · {q.state}
                      </p>
                    </div>
                    <span className="shrink-0 font-display text-lg text-accent">
                      {q.score}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="ws-next">
              <h2 id="ws-next" className="eyebrow">
                Your next moves
              </h2>
              <ul className="mt-6 space-y-3">
                {NEXT_ACTIONS.map((t, i) => {
                  const isDone = done.includes(i);
                  return (
                    <li key={t}>
                      <button
                        type="button"
                        aria-pressed={isDone}
                        onClick={() =>
                          setDone((d) =>
                            d.includes(i) ? d.filter((x) => x !== i) : [...d, i],
                          )
                        }
                        className="surface flex w-full items-start gap-3 p-4 text-left transition-colors duration-500 hover:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span
                          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors duration-300 ${
                            isDone
                              ? "border-accent bg-accent/20 text-accent"
                              : "border-border text-transparent"
                          }`}
                        >
                          <Check className="h-3 w-3" />
                        </span>
                        <span
                          className={`text-sm leading-relaxed ${
                            isDone
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                          }`}
                        >
                          {t}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
