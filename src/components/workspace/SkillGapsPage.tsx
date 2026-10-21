import { useEffect, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, ArrowRight, Download, RotateCcw } from "lucide-react";
import { api } from "@/services/api/client";
import {
  activeGap,
  readyGap,
  type Gap,
  type GapPage,
  type GapRun,
  type GapStart,
} from "@/services/api/skill-gap-types";
import { Panel, PageHeading, ErrorNotice, LoadingCards } from "./shared";

const input =
  "mt-2 w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2.5 text-sm";
const human = (text: string) => text.replaceAll("_", " ");
const time = (value: string) =>
  new Date(/(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`).toLocaleString();
function Data({ value, label }: { value: unknown; label: string }) {
  return (
    <pre
      aria-label={label}
      className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-secondary/30 p-3 text-[11px]"
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function GapCard({ gap, data }: { gap: Gap; data: GapPage }) {
  const [open, setOpen] = useState(false);
  const cache = useQueryClient();
  const evidence = useQuery({
    queryKey: ["career", "gap-evidence", data.run.id, gap.id],
    queryFn: ({ signal }) => api.gapEvidence(data.run.id, gap.id, signal),
    enabled: open,
    retry: false,
  });
  const review = useMutation({
    mutationFn: (decision: string) => api.reviewGap(data.run.id, gap.id, decision),
    onSuccess: () =>
      void cache.invalidateQueries({ queryKey: ["career", "gap-results", data.run.id] }),
  });
  const jobs = new Map(data.jobs.map((j) => [j.job.id, j.job]));
  return (
    <article className="career-panel min-w-0" aria-label={`${gap.priority} priority: ${gap.skill}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="career-pill">{gap.priority} priority</span>
            <span className="career-pill">{human(gap.requirement_type)}</span>
            <span className="career-pill">{human(gap.category)}</span>
          </div>
          <h2 className="mt-4 font-display text-2xl">{gap.skill}</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          {gap.affected_count} affected {gap.affected_count === 1 ? "job" : "jobs"}
          <br />
          <span className="mt-1 inline-block">
            {gap.required_count} required · {gap.preferred_count} preferred · {gap.optional_count}{" "}
            optional
          </span>
        </p>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{gap.explanation}</p>
      <p className="mt-3 text-xs text-accent">
        Estimated average change: {gap.average_score_impact >= 0 ? "+" : ""}
        {gap.average_score_impact.toFixed(1)} raw points
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Temporary score simulation, not a guaranteed improvement. Evidence confidence:{" "}
        {gap.confidence}; proficiency is not established.
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-xs leading-relaxed">
        {gap.guidance.map((g) => (
          <li key={g.id}>{g.text}</li>
        ))}
      </ol>
      <details
        className="mt-5 border-t border-border pt-4"
        onToggle={(e) => setOpen(e.currentTarget.open)}
      >
        <summary className="cursor-pointer text-xs text-accent">
          Evidence, affected jobs and priority calculation
        </summary>
        <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Normalized skill</dt>
            <dd className="mt-1">{gap.normalized}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Original job wording</dt>
            <dd className="mt-1">{gap.original_wordings.join(", ")}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Evidence context</dt>
            <dd className="mt-1">{gap.learnability}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Review</dt>
            <dd className="mt-1">{human(data.reviews[gap.id]?.decision || gap.review_status)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{gap.priority_reason}</p>
        <h3 className="mt-5 text-xs font-medium">Candidate evidence</h3>
        {gap.candidate_evidence.length ? (
          <ul className="mt-2 space-y-2 text-xs">
            {gap.candidate_evidence.map((e, i) => (
              <li key={i}>
                {e.original} · {human(e.strength)} · {e.path}
                {e.denied ? " · explicit denial" : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            Equivalent evidence unavailable. This does not establish a lack of ability.
          </p>
        )}
        <h3 className="mt-5 text-xs font-medium">Related and transferable foundations</h3>
        {gap.related_skills.length ? (
          <ul className="mt-2 space-y-2 text-xs">
            {gap.related_skills.map((r) => (
              <li key={r.skill}>
                {r.skill} · {human(r.relationship)}. {r.reason} Requirement credit is not granted.
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            No controlled related-skill mapping found.
          </p>
        )}
        <div className="mt-5 overflow-x-auto">
          <table
            className="w-full text-left text-[11px]"
            aria-label={`Match impact for ${gap.skill}`}
          >
            <thead>
              <tr>
                <th>Job</th>
                <th>Current</th>
                <th>Simulated</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {gap.impact.map((i) => (
                <tr key={i.job_id} className="border-t border-border">
                  <td className="max-w-44 py-2 pr-3">
                    {jobs.get(i.job_id)?.title || "Selected job"}
                  </td>
                  <td>{i.current_score.toFixed(1)}</td>
                  <td>{i.simulated_score.toFixed(1)}</td>
                  <td>
                    {i.delta >= 0 ? "+" : ""}
                    {i.delta.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Text similarity features stay fixed; only hypothetical skill evidence changes. Current
          scores are recomputed for this analysis. Saved matching scores may use a different corpus,
          profile revision or model.
        </p>
        <Data
          label={`Priority components for ${gap.skill}`}
          value={{
            priority_score: gap.priority_score,
            components: gap.priority_components,
            classification_counts: gap.classification_counts,
          }}
        />
        {evidence.isPending && open && (
          <p role="status" className="mt-3 text-xs">
            Loading source evidence…
          </p>
        )}
        {evidence.isError && (
          <ErrorNotice error={evidence.error} retry={() => void evidence.refetch()} />
        )}
        {evidence.data && (
          <details className="mt-3 text-xs">
            <summary className="cursor-pointer">Source paths and comparison records</summary>
            <Data label={`Comparison evidence for ${gap.skill}`} value={evidence.data} />
          </details>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          {["reviewed", "dismissed", "needs_review"].map((decision) => (
            <button
              type="button"
              key={decision}
              className="rounded-lg border border-border px-3 py-2 text-xs disabled:opacity-50"
              disabled={review.isPending}
              onClick={() => review.mutate(decision)}
            >
              {decision === "needs_review"
                ? "Flag for review"
                : decision === "dismissed"
                  ? "Dismiss suggestion"
                  : "Mark reviewed"}
            </button>
          ))}
        </div>
        {review.isError && <ErrorNotice error={review.error} />}
        <p className="mt-2 text-[10px] text-muted-foreground">
          Review decisions annotate this analysis. They never confirm a new profile skill.
        </p>
      </details>
    </article>
  );
}

function RunAudit({ run }: { run: GapRun }) {
  const [open, setOpen] = useState(false);
  const audit = useQuery({
    queryKey: ["career", "gap-audit", run.id],
    queryFn: ({ signal }) => api.gapAudit(run.id, signal),
    enabled: open && readyGap(run.status),
    retry: false,
  });
  return (
    <details className="career-panel my-6" onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="cursor-pointer text-sm text-accent">
        Skill gap audit · profile, requirements and agents
      </summary>
      <p className="mt-4 text-xs text-muted-foreground">
        Run started {time(run.created_at)} · confirmed revision {run.profile_revision}. Sources are
        private to this workspace.
      </p>
      <ol className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
        {run.tasks.map((t) => (
          <li key={t.stage} className="rounded-lg border border-border p-3">
            <p>
              {t.name} · {t.status}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {t.method}
              {t.elapsed_ms !== undefined ? ` · ${t.elapsed_ms} ms` : ""}
            </p>
          </li>
        ))}
      </ol>
      {run.warnings.length > 0 && (
        <ul className="mt-4 list-disc space-y-2 pl-5 text-xs text-amber-300">
          {run.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
      <Data
        label="Skill gap provider metadata"
        value={{ configuration: run.config, provider_metadata: run.provider_metadata }}
      />
      {audit.isPending && open && (
        <p role="status" className="mt-3 text-xs">
          Loading private audit…
        </p>
      )}
      {audit.isError && <ErrorNotice error={audit.error} retry={() => void audit.refetch()} />}
      {audit.data && (
        <details className="mt-4 text-xs">
          <summary className="cursor-pointer">
            Frozen candidate and job snapshots, comparisons, frequencies and validation
          </summary>
          <Data label="Skill gap source audit" value={audit.data} />
        </details>
      )}
    </details>
  );
}

export function SkillGapsPage({
  initialJob = "",
  initialRun = "",
  initialIds = "",
}: {
  initialJob?: string;
  initialRun?: string;
  initialIds?: string;
}) {
  const cache = useQueryClient();
  const [interactive, setInteractive] = useState(false);
  useEffect(() => setInteractive(true), []);
  const incoming = (initialIds || initialJob).split(",").filter(Boolean);
  const [mode, setMode] = useState<GapStart["mode"]>(
    incoming.length > 1 ? "selected" : incoming.length ? "single" : "top_ranked",
  );
  const [chosen, setChosen] = useState<string[]>(incoming);
  const [parent, setParent] = useState(initialRun);
  const [pickPage, setPickPage] = useState(1);
  const [selected, setSelected] = useState("");
  const [topK, setTopK] = useState(10);
  const [role, setRole] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [useAI, setUseAI] = useState(false);
  const [page, setPage] = useState(1);
  const [priority, setPriority] = useState("");
  const [copyNotice, setCopyNotice] = useState("");
  const readiness = useQuery({
    queryKey: ["career", "gap-readiness"],
    queryFn: ({ signal }) => api.gapReadiness(signal),
    retry: false,
    staleTime: 0,
  });
  const matching = useQuery({
    queryKey: ["career", "matching-runs"],
    queryFn: ({ signal }) => api.matchingRuns(signal),
    retry: false,
  });
  const options = useQuery({
    queryKey: ["career", "job-options"],
    queryFn: ({ signal }) => api.jobOptions(signal),
    retry: false,
  });
  const runs = useQuery({
    queryKey: ["career", "gap-runs"],
    queryFn: ({ signal }) => api.gapRuns(signal),
    retry: false,
    refetchInterval: (q) => (q.state.data?.some((r) => activeGap(r.status)) ? 1000 : false),
  });
  const id = selected || runs.data?.[0]?.id || "";
  const parentId =
    parent || matching.data?.find((r) => ["completed", "partial"].includes(r.status))?.id || "";
  const runQuery = useQuery({
    queryKey: ["career", "gap-run", id],
    queryFn: ({ signal }) => api.gapRun(id, signal),
    enabled: !!id,
    retry: false,
    refetchInterval: (q) => (activeGap(q.state.data?.status) ? 700 : false),
    staleTime: 0,
  });
  const run = runQuery.data;
  const busy = activeGap(run?.status) || !!runs.data?.some((r) => activeGap(r.status));
  const results = useQuery({
    queryKey: ["career", "gap-results", id, page, priority],
    queryFn: ({ signal }) => api.gapResults(id, page, priority, signal),
    enabled: !!id && readyGap(run?.status),
    retry: false,
  });
  const pickJobs = useQuery({
    queryKey: ["career", "gap-job-picker", parentId, pickPage],
    queryFn: ({ signal }) =>
      api.matchingResults(
        parentId,
        {
          keyword: "",
          category: "",
          work_mode: "",
          skill: "",
          minimum_score: "0",
          saved_only: false,
          sort: "hybrid",
        },
        pickPage,
        signal,
      ),
    enabled: !!parentId && ["single", "selected"].includes(mode),
    retry: false,
  });
  function changed(value: GapRun) {
    setSelected(value.id);
    setPage(1);
    setPriority("");
    void cache.invalidateQueries({ queryKey: ["career", "gap-runs"] });
    void cache.invalidateQueries({ queryKey: ["career", "summary"] });
  }
  const start = useMutation({
    mutationFn: (payload: GapStart) => api.startGap(payload),
    onSuccess: changed,
  });
  const retry = useMutation({ mutationFn: () => api.retryGap(id), onSuccess: changed });
  const cancel = useMutation({ mutationFn: () => api.cancelGap(id), onSuccess: changed });
  function submit(event: FormEvent) {
    event.preventDefault();
    const selectedMode = mode === "single" || mode === "selected";
    start.mutate({
      mode,
      job_ids: selectedMode ? chosen : [],
      ...(mode !== "target" && parentId ? { matching_run_id: parentId } : {}),
      top_k: topK,
      filters: {
        role,
        category,
        location,
        work_mode: workMode,
        availability: "active",
        location_scope: "compatible",
        category_scope: "family",
      },
      use_ai: useAI,
      allow_external_processing: useAI,
    });
  }
  function exportSummary() {
    if (!results.data) return;
    const d = results.data;
    const text = [
      "Skill Gap and Career Guidance",
      `Confirmed profile revision ${d.run.profile_revision}; ${d.run.status}; ${time(d.run.created_at)}`,
      "Evidence gaps are not proof of inability. Simulations are estimates, not employment guarantees.",
      ...d.items.map(
        (g) =>
          `${g.priority}: ${g.skill} — ${g.required_count} required, ${g.preferred_count} preferred; estimated average raw-score change ${g.average_score_impact.toFixed(1)}. ${g.explanation}`,
      ),
      "Export contains the current filtered result page only.",
    ].join("\n\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "skill-gap-summary.txt";
    a.click();
    URL.revokeObjectURL(url);
    setCopyNotice("Current result page exported.");
  }
  return (
    <>
      <PageHeading
        eyebrow="Evidence into direction"
        title="Room to grow"
        description="Compare your confirmed evidence with the jobs you want. Find shared gaps, review what is unknown, and choose your next step."
      />
      {readiness.isPending && <LoadingCards />}
      {readiness.isError && (
        <ErrorNotice error={readiness.error} retry={() => void readiness.refetch()} />
      )}
      {readiness.data && !readiness.data.can_analyse && (
        <Panel className="mb-6">
          <h2 className="font-display text-2xl">Confirm your profile first</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Review the facts you want to use. An unconfirmed resume draft cannot establish skill
            gaps.
          </p>
          <Link to="/profile" className="mt-4 inline-flex items-center gap-2 text-sm text-accent">
            Review profile <ArrowRight className="h-4 w-4" />
          </Link>
        </Panel>
      )}
      <Panel className="mb-7">
        <form onSubmit={submit}>
          <fieldset disabled={!interactive} className="min-w-0 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-xs">
                Analysis source
                <select
                  aria-label="Analysis source"
                  className={input}
                  value={mode}
                  onChange={(e) => {
                    const m = e.target.value as GapStart["mode"];
                    setMode(m);
                    if (m === "single") setChosen(chosen.slice(0, 1));
                  }}
                >
                  <option value="top_ranked">Top-ranked jobs</option>
                  <option value="single">One selected job</option>
                  <option value="selected">Several selected jobs</option>
                  <option value="target">Career target or category</option>
                </select>
              </label>
              <label className="text-xs">
                Number of target jobs
                <input
                  aria-label="Number of target jobs"
                  className={input}
                  type="number"
                  min={1}
                  max={30}
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                />
              </label>
            </div>
            {mode !== "target" && (
              <label className="block text-xs">
                Source matching run
                <select
                  aria-label="Source matching run"
                  className={input}
                  value={parentId}
                  onChange={(e) => {
                    setParent(e.target.value);
                    setChosen([]);
                    setPickPage(1);
                  }}
                >
                  <option value="">Choose a completed run</option>
                  {matching.data
                    ?.filter((r) => ["completed", "partial"].includes(r.status))
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {time(r.created_at)} · {r.result_count} recommendations
                        {r.stale ? " · older profile" : ""}
                      </option>
                    ))}
                </select>
              </label>
            )}
            {mode === "target" && (
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-xs">
                  Target role
                  <input
                    aria-label="Target role"
                    className={input}
                    placeholder="AI, backend, cybersecurity…"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  />
                </label>
                <label className="text-xs">
                  Target category
                  <select
                    aria-label="Target category"
                    className={input}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Any category</option>
                    {options.data?.categories.map((c) => (
                      <option key={c} value={c}>
                        {human(c)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs">
                  Target location
                  <input
                    aria-label="Target location"
                    className={input}
                    placeholder="Bengaluru, India or leave open"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </label>
                <label className="text-xs">
                  Target work mode
                  <select
                    aria-label="Target work mode"
                    className={input}
                    value={workMode}
                    onChange={(e) => setWorkMode(e.target.value)}
                  >
                    <option value="">Any mode</option>
                    {["remote", "hybrid", "onsite"].map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </label>
                <p className="text-[11px] text-muted-foreground sm:col-span-2">
                  Uses active mock listings and current confirmed facts. Analyses up to 30 locally
                  ranked jobs; corpus frequency uses the broader fixture. Exact role wording may
                  have no dataset coverage.
                </p>
              </div>
            )}
            {["single", "selected"].includes(mode) && (
              <fieldset className="rounded-xl border border-border p-4">
                <legend className="px-2 text-xs">Choose jobs · {chosen.length} selected</legend>
                {pickJobs.isPending && parentId && (
                  <p role="status" className="text-xs">
                    Loading recommended jobs…
                  </p>
                )}
                {pickJobs.isError && (
                  <ErrorNotice error={pickJobs.error} retry={() => void pickJobs.refetch()} />
                )}
                {pickJobs.data?.items.map((row) => (
                  <label
                    key={row.job.id}
                    className="flex items-start gap-3 border-b border-border py-3 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={chosen.includes(row.job.id)}
                      disabled={!chosen.includes(row.job.id) && chosen.length >= 30}
                      onChange={(e) =>
                        setChosen(
                          e.target.checked
                            ? mode === "single"
                              ? [row.job.id]
                              : [...chosen, row.job.id]
                            : chosen.filter((j) => j !== row.job.id),
                        )
                      }
                    />
                    <span>
                      {row.job.title}
                      <span className="mt-1 block text-muted-foreground">
                        {row.job.location} · {row.job.work_mode} · raw score{" "}
                        {row.hybrid_score.toFixed(1)}
                      </span>
                    </span>
                  </label>
                ))}
                {pickJobs.data && pickJobs.data.total > 6 && (
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      disabled={pickPage === 1}
                      onClick={() => setPickPage((p) => p - 1)}
                    >
                      Previous job choices
                    </button>
                    <span>Page {pickPage}</span>
                    <button
                      type="button"
                      disabled={pickPage * 6 >= pickJobs.data.total}
                      onClick={() => setPickPage((p) => p + 1)}
                    >
                      Next job choices
                    </button>
                  </div>
                )}
                {chosen.length > 0 && (
                  <button
                    type="button"
                    className="mt-4 text-xs text-accent underline"
                    onClick={() => setChosen([])}
                  >
                    Clear selected jobs
                  </button>
                )}
              </fieldset>
            )}
            {mode !== "target" && !parentId && (
              <p className="text-xs text-muted-foreground">
                Complete a matching run, or choose Career target to analyse the fixture directly.{" "}
                <Link to="/matches" className="text-accent underline">
                  Open matching
                </Link>
              </p>
            )}
            <label className="flex items-start gap-3 text-xs">
              <input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} />
              <span>
                Allow optional Groq guidance review.
                <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
                  Sends skill names, requirement counts and grounded guidance actions. Resume
                  excerpts and identity are excluded. Comparisons, priorities and scores remain
                  local and deterministic.
                </span>
              </span>
            </label>
            <button
              type="submit"
              className="btn-hero !text-sm disabled:opacity-50"
              disabled={
                busy ||
                start.isPending ||
                !readiness.data?.can_analyse ||
                !topK ||
                topK > 30 ||
                (["single", "selected"].includes(mode) && !chosen.length) ||
                (mode === "top_ranked" && !parentId) ||
                (mode === "target" && !role.trim() && !category)
              }
            >
              <Sparkles className="h-4 w-4" />
              {start.isPending ? "Starting analysis…" : "Analyse skill gaps"}
            </button>
          </fieldset>
        </form>
      </Panel>
      {[matching, options, runs, runQuery]
        .filter((q) => q.isError)
        .map((q, i) => (
          <div className="mb-4" key={i}>
            <ErrorNotice error={q.error} retry={() => void q.refetch()} />
          </div>
        ))}
      {[start, retry, cancel]
        .filter((q) => q.isError)
        .map((q, i) => (
          <div className="mb-4" key={i}>
            <ErrorNotice error={q.error} />
          </div>
        ))}
      {!!runs.data?.length && (
        <label className="mb-6 block text-xs">
          Saved skill analyses
          <select
            aria-label="Saved skill analyses"
            className={input}
            value={id}
            onChange={(e) => {
              setSelected(e.target.value);
              setPage(1);
              setPriority("");
            }}
          >
            {runs.data.map((r) => (
              <option key={r.id} value={r.id}>
                {time(r.created_at)} · revision {r.profile_revision} · {r.status}
                {r.stale ? " · older profile" : ""}
              </option>
            ))}
          </select>
        </label>
      )}
      {busy && (
        <Panel className="mb-6">
          <p role="status" className="text-sm">
            Analysing skill gaps · {human(run?.stage || "queued")}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Your confirmed profile stays unchanged.
          </p>
          <button
            type="button"
            className="mt-4 text-xs text-accent underline"
            disabled={cancel.isPending}
            onClick={() => cancel.mutate()}
          >
            Cancel analysis
          </button>
        </Panel>
      )}
      {run && (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-4 text-xs">
            <span>
              {human(run.status)} · {run.job_count} jobs · {run.gap_count} gaps
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-accent"
              onClick={() => {
                void runQuery.refetch();
                void results.refetch();
              }}
            >
              Refresh status <RotateCcw className="h-3 w-3" />
            </button>
            {!activeGap(run.status) && (
              <button
                type="button"
                className="text-accent underline"
                disabled={busy || retry.isPending}
                onClick={() => retry.mutate()}
              >
                Recalculate with current facts
              </button>
            )}
          </div>
          {run.stale && (
            <p role="status" className="mb-5 text-xs text-amber-300">
              Your profile changed after this analysis. Recalculate before relying on its gaps.
            </p>
          )}
          {run.status === "partial" && (
            <Panel className="mb-5">
              <p className="text-sm">Partial analysis: deterministic results retained</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Optional guidance review or orchestration could not finish. Review provider details
                in the audit and retry when available.
              </p>
            </Panel>
          )}
          {run.status === "needs_review" && (
            <Panel className="mb-5">
              <p className="text-sm text-amber-300">This analysis needs review</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Conflicting evidence or agent disagreements are preserved in the audit. They have
                not changed your profile.
              </p>
            </Panel>
          )}
          {run.status === "failed" && (
            <Panel className="mb-5">
              <p role="alert" className="text-sm">
                Skill analysis could not complete.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {run.error_code}. Retry using current confirmed facts.
              </p>
            </Panel>
          )}
          {run.status === "cancelled" && (
            <p className="mb-5 text-sm text-muted-foreground">
              Analysis cancelled. Your profile is unchanged.
            </p>
          )}
          <RunAudit run={run} />
        </>
      )}
      {results.isFetching && readyGap(run?.status) && (
        <p role="status" className="my-4 text-xs">
          Loading skill-gap results…
        </p>
      )}
      {results.isError && (
        <ErrorNotice error={results.error} retry={() => void results.refetch()} />
      )}
      {results.data && readyGap(run?.status) && (
        <>
          <Panel className="mb-6">
            <h2 className="font-display text-2xl">Your evidence inventory</h2>
            <p className="mt-3 text-xs text-muted-foreground">
              Directly confirmed skills and supporting mentions are separate. Evidence strength does
              not measure proficiency.
            </p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {[true, false].map((direct) => (
                <div key={String(direct)}>
                  <h3 className="text-xs font-medium">
                    {direct
                      ? "Explicitly confirmed skills"
                      : "Project, experience and other supporting mentions"}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {results.data.inventory
                      .filter((s) => s.explicitly_confirmed === direct)
                      .map((s) => (
                        <span
                          className="career-pill"
                          key={s.normalized}
                          title={s.evidence.map((e) => `${e.strength}: ${e.path}`).join("\n")}
                        >
                          {s.originals[0]}
                          {!direct ? ` · ${human(s.evidence[0]?.strength || "unknown")}` : ""}
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
            {results.data.inventory.length === 0 && (
              <p className="mt-3 text-xs text-amber-300">
                Evidence unavailable. Verify your existing abilities before treating unknown skills
                as learning needs.
              </p>
            )}
          </Panel>
          <details className="career-panel mb-6 text-xs">
            <summary className="cursor-pointer text-accent">Job context and eligibility</summary>
            <p className="mt-3 text-muted-foreground">
              Skill simulations do not establish education, professional experience, location
              eligibility or employer approval.
            </p>
            <ul className="mt-4 space-y-4">
              {results.data.jobs.map(({ job }) => (
                <li key={job.id}>
                  <p>
                    {job.title} · {job.location} · {job.work_mode}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Minimum listed experience: {job.experience_years_min} years. Education:{" "}
                    {job.education_requirements.join("; ") || "Not specified"}.
                  </p>
                </li>
              ))}
            </ul>
          </details>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <label className="text-xs">
              Filter by priority
              <select
                aria-label="Filter by priority"
                className={input}
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All priorities</option>
                {["Critical", "High", "Medium", "Low"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-xs text-accent"
              onClick={exportSummary}
            >
              <Download className="h-4 w-4" />
              Export current page summary
            </button>
          </div>
          {copyNotice && (
            <p role="status" className="mb-4 text-xs">
              {copyNotice}
            </p>
          )}
          <p className="mb-5 text-xs text-muted-foreground">
            {results.data.total} gap records · {results.data.jobs.length} analysed jobs. Preferred
            skills remain optional; related skills do not automatically satisfy requirements.
          </p>
          {!results.data.total && (
            <Panel className="py-12 text-center">
              <Sparkles className="mx-auto h-6 w-6 text-accent" />
              <h2 className="mt-4 font-display text-2xl">
                {results.data.jobs.length
                  ? "No gaps in this view"
                  : "No jobs available for this target"}
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-xs text-muted-foreground">
                {results.data.jobs.length
                  ? "Explicit requirements are covered by confirmed skills, or the priority filter hides remaining records. Unknown requirements are reported separately; absence of gaps is not proof of full job eligibility."
                  : "Broaden the role, category, location or work-mode filters. No role requirements were invented."}
              </p>
            </Panel>
          )}
          <div className="space-y-5">
            {results.data.items.map((gap) => (
              <GapCard key={`${id}:${gap.id}`} gap={gap} data={results.data} />
            ))}
          </div>
          {results.data.total > 12 && (
            <nav
              aria-label="Skill gap pages"
              className="mt-6 flex items-center justify-between text-xs"
            >
              <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous gaps
              </button>
              <span>
                Page {page} of {Math.ceil(results.data.total / 12)}
              </span>
              <button
                type="button"
                disabled={page * 12 >= results.data.total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next gaps
              </button>
            </nav>
          )}
        </>
      )}
      {!id && !runs.isPending && (
        <Panel className="py-12 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-accent" />
          <h2 className="mt-4 font-display text-2xl">Choose a direction to explore</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Start an analysis above. Shared job requirements will become a reviewable set of next
            steps.
          </p>
        </Panel>
      )}
    </>
  );
}
