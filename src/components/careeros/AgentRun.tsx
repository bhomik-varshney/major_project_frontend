import { useCallback, useEffect, useRef, useState } from "react";
import { Brain, Compass, Pause, Play, Radar, RotateCcw, Sparkles, Target } from "lucide-react";
import { DemoBadge, useInView, usePrefersReducedMotion } from "./demo";

type Step = {
  agent: string;
  icon: typeof Compass;
  working: string;
  result: string;
};

const STEPS: Step[] = [
  {
    agent: "Planner",
    icon: Compass,
    working: "Creating career strategy…",
    result: "18-month path: depth in systems design, then platform ownership.",
  },
  {
    agent: "Researcher",
    icon: Radar,
    working: "Scanning relevant opportunities…",
    result: "412 roles scanned · 12 worth your attention.",
  },
  {
    agent: "Matcher",
    icon: Target,
    working: "Evaluating fit…",
    result: "Top match: AI Platform Engineer — 94% fit.",
  },
  {
    agent: "Skills Analyst",
    icon: Brain,
    working: "Finding high-impact gaps…",
    result: "Docker is the gap standing between you and 34 more roles.",
  },
];

const GOALS = ["Become an AI Engineer", "Move into Staff Engineer", "Lead a platform team"];

export function AgentRun({ compact = false }: { compact?: boolean }) {
  const reduced = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  const [goal, setGoal] = useState(0);
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const start = useCallback(() => {
    clear();
    setStep(-1);
    setPlaying(true);
  }, []);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setStep(STEPS.length);
      return;
    }
    setPlaying(true);
  }, [inView, reduced]);

  useEffect(() => {
    if (!playing || reduced) return;
    if (step >= STEPS.length) {
      setPlaying(false);
      return;
    }
    timer.current = setTimeout(() => setStep((s) => s + 1), step < 0 ? 500 : 1500);
    return clear;
  }, [playing, step, reduced]);

  const done = step >= STEPS.length;

  return (
    <div ref={ref} className={`surface overflow-hidden ${compact ? "" : "mx-auto max-w-4xl"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-7">
        <DemoBadge label="Interactive product preview" />
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={playing ? "Pause simulation" : "Play simulation"}
            onClick={() => setPlaying((p) => !p)}
            disabled={reduced}
            className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors duration-300 hover:border-accent/45 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={start}
            disabled={reduced}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-muted-foreground transition-colors duration-300 hover:border-accent/45 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
          >
            <RotateCcw className="h-3 w-3" />
            Replay
          </button>
        </div>
      </div>

      <div className="px-5 py-7 sm:px-7 sm:py-8">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Your goal</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {GOALS.map((g, i) => (
            <button
              key={g}
              type="button"
              aria-pressed={goal === i}
              onClick={() => {
                setGoal(i);
                start();
              }}
              className={`rounded-full border px-4 py-2 text-xs transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                goal === i
                  ? "border-accent/50 bg-accent/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-accent/35 hover:text-foreground"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <ol className="mt-8 space-y-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const state = step > i ? "done" : step === i ? "active" : "idle";
            return (
              <li
                key={s.agent}
                className={`flex items-start gap-4 rounded-xl border px-4 py-4 transition-all duration-700 ${
                  state === "idle"
                    ? "border-border/60 opacity-40"
                    : state === "active"
                      ? "border-accent/40 bg-accent/5 opacity-100"
                      : "border-border bg-secondary/35 opacity-100"
                }`}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-accent/25 bg-primary/25">
                  <Icon
                    className={`h-4 w-4 text-accent ${
                      state === "active" ? "animate-pulse-soft" : ""
                    }`}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {s.agent}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed">
                    {state === "done" ? (
                      s.result
                    ) : state === "active" ? (
                      <span className="text-accent">{s.working}</span>
                    ) : (
                      <span className="text-muted-foreground">Queued</span>
                    )}
                  </p>
                  <div className="mt-3 h-px w-full overflow-hidden bg-border">
                    <div
                      className="h-full bg-accent transition-[width] duration-[1400ms] ease-out"
                      style={{ width: state === "idle" ? "0%" : "100%" }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <div
          className={`mt-6 rounded-xl border p-5 transition-all duration-700 ${
            done ? "border-accent/40 bg-accent/8 opacity-100" : "border-border/60 opacity-35"
          }`}
        >
          <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-accent">
            <Sparkles className="h-3 w-3" />
            Ascendra · your strongest next move
          </p>
          <p className="mt-3 font-display text-xl leading-snug tracking-tight sm:text-2xl">
            {done
              ? "Close the Docker gap this month, then apply to the Stripe platform role with a tailored draft."
              : "Working…"}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Sample reasoning generated from the demo profile above. Nothing is sent without your
            approval.
          </p>
        </div>
      </div>
    </div>
  );
}
