import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Check, MapPin, Search, Target, RotateCcw, ArrowRight } from "lucide-react";
import { api } from "@/services/api/client";
import {
  activeMatching,
  type RankedMatch,
  type ResultFilters,
  type MatchingRun,
  type SkillMapping,
} from "@/services/api/matching-types";
import { JobFilterAudit } from "./JobFilterAudit";
import type { FilterAudit } from "@/services/api/types";
import { Panel, PageHeading, ErrorNotice, LoadingCards } from "./shared";

const runTime = (value: string) => {
  const date = new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "medium",
        timeZone: "Asia/Kolkata",
      }).format(date)
    : "Date unavailable";
};
const input =
  "mt-2 w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2.5 text-sm";
const human = (s: string) => s.replaceAll("_", " ");
const initialSearch = {
  role: "",
  location_scope: "compatible",
  category_scope: "family",
  keyword: "",
  skills: "",
  category: "",
  location: "",
  work_mode: "",
  experience: "",
  country: "",
  employment_type: "",
  company: "",
  industry: "",
  posted_from: "",
  posted_to: "",
  availability: "active",
};
const initialResults: ResultFilters = {
  keyword: "",
  category: "",
  work_mode: "",
  skill: "",
  minimum_score: "",
  saved_only: false,
  sort: "hybrid",
};
const stages = [
  "preparing",
  "normalizing",
  "calculating_baseline",
  "retrieving",
  "calculating_hybrid",
  "calibrating",
  "generating_explanations",
  "validating",
];

const emptyExplanation: Record<string, string> = {
  no_jobs_in_dataset: "No matching jobs are available because this dataset is empty.",
  jobs_filtered_out:
    "Jobs exist, but the location, role/category, work-mode or date filters exclude them. Lowering the score cannot restore jobs removed before ranking. Open Search and filter diagnostics to find the first empty stage.",
  score_below_threshold:
    "Jobs were retrieved and scored, but none meet the current raw-score threshold. Lower the result threshold to inspect saved lower-scoring jobs.",
  result_filters_excluded:
    "Saved ranked jobs exist, but the current result search or saved-only filter hides them. Clear result filters to see them.",
  no_retrieval_candidates:
    "Jobs passed the hard filters but none reached ranking. Inspect retrieval diagnostics or rerun with a broader candidate pool.",
  page_out_of_range:
    "Jobs exist on an earlier result page. Return to the first page or clear result filters.",
};
function SourceData({ value }: { value: unknown }) {
  return (
    <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-secondary/30 p-4 text-[11px] leading-relaxed">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
function SkillChips({
  label,
  skills,
  gap = false,
}: {
  label: string;
  skills: SkillMapping[];
  gap?: boolean;
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {skills.length ? (
          skills.map((s) => (
            <span
              key={s.normalized}
              title={
                s.reason ||
                s.candidate_evidence?.map((e) => `${e.original} (${e.source_path})`).join(", ")
              }
              className={`rounded-full border px-2.5 py-1 text-[10px] ${gap ? "border-amber-400/25 text-amber-300" : "border-accent/25 bg-accent/5 text-accent"}`}
            >
              {s.original}
            </span>
          ))
        ) : (
          <span className="text-[11px] text-muted-foreground">None documented</span>
        )}
      </div>
    </div>
  );
}
function MatchCard({
  row,
  runId,
  saved,
  toggleSave,
  saving,
}: {
  row: RankedMatch;
  runId: string;
  saved: boolean;
  toggleSave: () => void;
  saving: boolean;
}) {
  const [auditOpen, setAuditOpen] = useState(false);
  const detail = useQuery({
    queryKey: ["career", "matching-detail", runId, row.job.id],
    queryFn: ({ signal }) => api.matchingDetail(runId, row.job.id, signal),
    enabled: auditOpen,
    retry: false,
  });
  const job = row.job;
  return (
    <article className="career-panel min-w-0" aria-label={`Rank ${row.rank}: ${job.title}`}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <span className="career-pill">#{row.rank}</span>
            <span className="career-pill">Seeded / mock</span>
            <span className="career-pill">{human(job.employment_type)}</span>
          </div>
          <h2 className="mt-4 font-display text-2xl">{job.title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {job.company} · {human(job.category)}
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            {job.location} · {job.work_mode}
          </p>
        </div>
        <div className="col-span-2 text-left sm:text-right">
          <p className="font-display text-3xl text-accent">
            {(row.match_percentage ?? row.hybrid_score).toFixed(1)}
            <span className="ml-1 text-xs text-muted-foreground">
              {row.match_percentage == null ? "/100" : "%"}
            </span>
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {row.match_percentage == null ? "Hybrid match" : "Experimental match estimate"}
          </p>
          <p className="mt-2 text-xs">
            Raw hybrid {row.hybrid_score.toFixed(1)} · Baseline {row.baseline_score.toFixed(1)}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleSave}
          disabled={saving}
          aria-pressed={saved}
          aria-label={`${saved ? "Unsave" : "Save"} ${job.title}`}
          className="col-start-2 row-start-1 self-start rounded-lg border border-border p-2.5 text-accent disabled:opacity-50"
        >
          <Bookmark className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      {row.match_percentage != null && (
        <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">
          Calibrated on synthetic relevance examples. Review requirements and location; this
          estimate is not a hiring probability.
        </p>
      )}
      {row.filter_evidence && (
        <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
          {Object.entries(row.filter_evidence)
            .filter(([, e]) => e.relation !== "not_requested")
            .map(([key, e]) => (
              <p key={key}>
                Search {key}: {human(e.relation)} · {e.reason}
              </p>
            ))}
        </div>
      )}
      {row.retrieval?.method_ranks && Object.keys(row.retrieval.method_ranks).length === 0 && (
        <p className="mt-3 text-[11px] text-amber-300">
          No positive retrieval signal. Included for complete review of this small filtered pool;
          suitability is unestablished.
        </p>
      )}
      <p className="my-5 text-sm leading-relaxed text-muted-foreground">{row.explanation}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <SkillChips label="Matched required skills" skills={row.matched_required} />
        <SkillChips label="Required · no confirmed evidence" skills={row.missing_required} gap />
        <SkillChips label="Matched preferred skills" skills={row.matched_preferred} />
        <SkillChips label="Preferred · no confirmed evidence" skills={row.missing_preferred} gap />
      </div>
      {!!row.transferable_skills.length && (
        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Transferable foundations · requirements still need evidence
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {row.transferable_skills.map((skill, i) => (
              <span key={i} className="career-pill" title={skill.reason}>
                {skill.candidate_skill} → {skill.job_skill}
              </span>
            ))}
          </div>
        </div>
      )}
      {row.retrieval?.method_ranks && (
        <p className="mt-4 text-[10px] text-muted-foreground">
          Retrieved by {Object.keys(row.retrieval.method_ranks).map(human).join(" · ")}. Location:{" "}
          {human(row.components["location"]?.state || "unknown")}.
        </p>
      )}
      <details className="mt-5 border-t border-border pt-4">
        <summary className="cursor-pointer text-xs text-accent">
          Why this match · evidence and considerations
        </summary>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Method: {human(row.explanation_method)}. A match score is a comparison heuristic, not a
          hiring probability.
        </p>
        <ul className="mt-4 space-y-3">
          {row.reasons.map((r) => (
            <li key={r.id} className="text-xs leading-relaxed">
              <p>{r.text}</p>
              {r.evidence.length > 0 && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-[10px] text-muted-foreground">
                    Source evidence
                  </summary>
                  <SourceData value={r.evidence} />
                </details>
              )}
            </li>
          ))}
        </ul>
        {row.transferable_skills.length > 0 && (
          <p className="mt-3 text-[11px] text-muted-foreground">
            Transferable skills do not count as matched requirements.
          </p>
        )}
      </details>
      <details className="mt-4 border-t border-border pt-4">
        <summary className="cursor-pointer text-xs text-accent">Score breakdown</summary>
        {row.method_scores && (
          <div
            className="mt-4 grid gap-2 text-[11px] sm:grid-cols-2"
            aria-label="Independent retrieval scores"
          >
            {Object.entries(row.method_scores).map(([name, score]) => (
              <p key={name}>
                {human(name)}: {score == null ? "Unavailable / not scored" : score.toFixed(2)}
                {name === "bm25_raw" ? " raw retrieval units" : " /100"}
              </p>
            ))}
          </div>
        )}
        <div className="mt-4 space-y-4">
          {Object.entries(row.components).map(([key, c]) => (
            <div key={key}>
              <div className="flex flex-wrap justify-between gap-2 text-xs">
                <span>{human(key)}</span>
                <span>
                  {c.score === null
                    ? "Unknown / not scored"
                    : `${c.score.toFixed(1)} · ${(c.effective_weight * 100).toFixed(1)}% weight → ${c.contribution.toFixed(2)} points`}
                </span>
              </div>
              <div className="my-1.5 h-1.5 rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-accent/70"
                  style={{ width: `${c.score ?? 0}%` }}
                />
              </div>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                {human(c.state)} · {c.reason}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-lg border border-accent/20 p-4 text-xs leading-relaxed">
          <p>
            Weighted sum {row.calculation.weighted_sum.toFixed(2)} − required-skill penalty{" "}
            {row.calculation.critical_skill_penalty.toFixed(2)}
          </p>
          <p className="mt-2">
            Evidence coverage {(row.calculation.available_weight * 100).toFixed(1)}% · uncertainty
            ceiling {row.calculation.uncertainty_ceiling.toFixed(2)}
          </p>
          <p className="mt-2">
            Final = max(0, min(100, ceiling, weighted sum − penalty)) ={" "}
            <strong>{row.hybrid_score.toFixed(2)}</strong>
          </p>
          <p className="mt-2 text-muted-foreground">
            Unknown components are excluded and known weights are normalized. Limited evidence caps
            the final score.
          </p>
        </div>
        {row.calibration && (
          <details className="mt-4 text-xs">
            <summary className="cursor-pointer text-accent">
              How the displayed percentage is calibrated
            </summary>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              {row.calibration.interpretation || "Calibration unavailable for this saved run."}{" "}
              Minimum-score filters use the raw hybrid score. Equal calibrated estimates keep their
              raw ranking.
            </p>
            <SourceData value={row.calibration} />
          </details>
        )}
      </details>
      <details className="mt-4 border-t border-border pt-4">
        <summary className="cursor-pointer text-xs text-accent">Job details</summary>
        <p className="mt-4 text-xs leading-relaxed">{job.description}</p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-muted-foreground">
          {job.responsibilities.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
        <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Education</dt>
            <dd className="mt-1">{job.education_requirements.join("; ") || "Not specified"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Experience</dt>
            <dd className="mt-1">
              {human(job.experience_level)} · {job.experience_years_min}–{job.experience_years_max}{" "}
              years
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Demonstration dates</dt>
            <dd className="mt-1">
              Posted {job.posted_date} · closes {job.closing_date || "not specified"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Other requirements</dt>
            <dd className="mt-1">{job.language_requirements.join("; ") || "Not specified"}</dd>
          </div>
        </dl>
        <p className="mt-4 text-[11px] text-muted-foreground">
          This is synthetic project data. Application links are inactive placeholders.
        </p>
      </details>
      <details
        className="mt-4 border-t border-border pt-4"
        onToggle={(e) => setAuditOpen(e.currentTarget.open)}
      >
        <summary className="cursor-pointer text-xs text-accent">
          Inspect normalized job and skill mappings
        </summary>
        {detail.isPending ? (
          <p role="status" className="mt-3 text-xs">
            Loading source details…
          </p>
        ) : detail.isError ? (
          <ErrorNotice error={detail.error} retry={() => void detail.refetch()} />
        ) : (
          <SourceData value={detail.data.normalized_job} />
        )}
      </details>
    </article>
  );
}
function RunAudit({ run }: { run: MatchingRun }) {
  const [open, setOpen] = useState(false);
  const audit = useQuery({
    queryKey: ["career", "matching-audit", run.id],
    queryFn: ({ signal }) => api.matchingAudit(run.id, signal),
    enabled: open,
    retry: false,
  });
  return (
    <details className="career-panel mb-5" onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="cursor-pointer text-sm">
        Matching audit · profile, tasks and validation
      </summary>
      <p className="mt-4 text-xs text-muted-foreground">
        {runTime(run.created_at)} · profile revision {run.profile_revision} ·{" "}
        {run.elapsed_ms === null ? "In progress" : `${(run.elapsed_ms / 1000).toFixed(2)} seconds`}{" "}
        · dataset date {run.dataset_reference_date}
      </p>
      <JobFilterAudit
        audit={
          audit.data?.filter_audit || (run.validation["filter_audit"] as FilterAudit | undefined)
        }
      />
      <ol className="mt-5 grid gap-3 sm:grid-cols-2">
        {run.tasks.map((t) => (
          <li key={t.stage} className="rounded-lg border border-border p-3 text-xs">
            <p>
              {t.name} · {human(t.status)}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {t.method}
              {t.model ? ` · ${t.model}` : ""}
              {t.elapsed_ms !== undefined ? ` · ${t.elapsed_ms} ms` : ""}
            </p>
            {t.error_code && <p className="mt-1 text-amber-300">{human(t.error_code)}</p>}
          </li>
        ))}
      </ol>
      <details className="mt-5 text-xs">
        <summary className="cursor-pointer text-accent">
          Candidate data used · confirmed fields only
        </summary>
        {audit.isPending ? (
          <p className="mt-3">Loading snapshot…</p>
        ) : audit.isError ? (
          <ErrorNotice error={audit.error} />
        ) : (
          <>
            <p className="mt-3 text-muted-foreground">
              Derived role topics reflect confirmed text. They do not become preferences or matched
              required skills.
            </p>
            <SourceData value={audit.data.candidate_snapshot} />
          </>
        )}
      </details>
      <details className="mt-4 text-xs">
        <summary className="cursor-pointer text-accent">
          Retrieval pool and excluded opportunities
        </summary>
        <p className="mt-3 text-muted-foreground">
          Every filtered listing is considered by retrieval. The configurable pool is reranked with
          detailed compatibility features. Excluded IDs and reasons are recorded below.
        </p>
        <SourceData
          value={
            audit.data?.retrieval ||
            run.validation["retrieval"] || { status: "Legacy run: retrieval audit unavailable" }
          }
        />
      </details>
      <details className="mt-4 text-xs">
        <summary className="cursor-pointer text-accent">
          Scoring configuration and model/provider metadata
        </summary>
        <SourceData
          value={{
            configuration: run.config,
            providers: run.provider_metadata,
            filters: run.filters,
            validation: run.validation,
          }}
        />
      </details>
      {run.warnings.length > 0 && (
        <details className="mt-4 text-xs">
          <summary className="cursor-pointer text-amber-300">
            Run considerations · {run.warnings.length}
          </summary>
          <ul className="mt-3 list-inside list-disc space-y-2 leading-relaxed text-muted-foreground">
            {run.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </details>
      )}
    </details>
  );
}

export function MatchesPage() {
  const cache = useQueryClient();
  const [selected, setSelected] = useState("");
  const [search, setSearch] = useState(initialSearch);
  const [minimum, setMinimum] = useState(30);
  const [poolSize, setPoolSize] = useState(1200);
  const [useAI, setUseAI] = useState(false);
  const [filters, setFilters] = useState(initialResults);
  const [page, setPage] = useState(1);
  const readiness = useQuery({
    queryKey: ["career", "matching-readiness"],
    queryFn: ({ signal }) => api.matchingReadiness(signal),
    retry: false,
    staleTime: 0,
  });
  const runs = useQuery({
    queryKey: ["career", "matching-runs"],
    queryFn: ({ signal }) => api.matchingRuns(signal),
    retry: false,
    refetchInterval: (q) => (q.state.data?.some((r) => activeMatching(r.status)) ? 1000 : false),
  });
  const runId = selected || runs.data?.[0]?.id || "";
  const status = useQuery({
    queryKey: ["career", "matching-status", runId],
    queryFn: ({ signal }) => api.matchingRun(runId, signal),
    enabled: !!runId,
    retry: false,
    refetchInterval: (q) => (activeMatching(q.state.data?.status) ? 700 : false),
    staleTime: 0,
  });
  const run = status.data;
  const busy = activeMatching(run?.status) || !!runs.data?.some((r) => activeMatching(r.status));
  const results = useQuery({
    queryKey: ["career", "matching-results", runId, filters, page],
    queryFn: ({ signal }) => api.matchingResults(runId, filters, page, signal),
    enabled: !!run && ["completed", "partial"].includes(run.status),
    retry: false,
  });
  const bookmarks = useQuery({
    queryKey: ["career", "matching-bookmarks"],
    queryFn: ({ signal }) => api.bookmarks(signal),
    retry: false,
  });
  const options = useQuery({
    queryKey: ["career", "job-options"],
    queryFn: ({ signal }) => api.jobOptions(signal),
    retry: false,
    staleTime: 30_000,
  });
  const changedRun = (value: MatchingRun) => {
    setSelected(value.id);
    setPage(1);
    setFilters(initialResults);
    cache.setQueryData(["career", "matching-status", value.id], value);
    void cache.invalidateQueries({ queryKey: ["career", "matching-runs"] });
    void cache.invalidateQueries({ queryKey: ["career", "summary"] });
  };
  const start = useMutation({
    mutationFn: () =>
      api.startMatching({
        filters: {
          ...Object.fromEntries(
            Object.entries(search).filter(([key, value]) => key !== "skills" && !!value),
          ),
          skills: search.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        },
        minimum_score: minimum,
        retrieval_pool_size: poolSize,
        use_ai: useAI,
        allow_external_processing: useAI,
      }),
    onSuccess: changedRun,
  });
  const retry = useMutation({ mutationFn: () => api.retryMatching(runId), onSuccess: changedRun });
  const cancel = useMutation({
    mutationFn: () => api.cancelMatching(runId),
    onSuccess: changedRun,
  });
  const save = useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) => api.bookmark(id, saved),
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: ["career", "matching-bookmarks"] });
      void cache.invalidateQueries({ queryKey: ["career", "matching-results"] });
    },
  });
  const saved = new Set(bookmarks.data?.map((b) => b.job.id));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    start.mutate();
  };
  const select = (key: keyof typeof search, label: string, values: string[]) => (
    <label className="min-w-0 text-xs">
      {label}
      <select
        className={input}
        aria-label={label}
        value={search[key]}
        onChange={(e) => setSearch({ ...search, [key]: e.target.value })}
      >
        <option value="">Any</option>
        {values.map((v) => (
          <option key={v} value={v}>
            {human(v)}
          </option>
        ))}
      </select>
    </label>
  );
  const text = (key: keyof typeof search, label: string) => (
    <label className="min-w-0 text-xs">
      {label}
      <input
        className={input}
        aria-label={label}
        value={search[key]}
        maxLength={key === "skills" ? 300 : 120}
        onChange={(e) => setSearch({ ...search, [key]: e.target.value })}
      />
    </label>
  );
  const refresh = () => {
    void readiness.refetch();
    void runs.refetch();
    void status.refetch();
    void cache.invalidateQueries({ queryKey: ["career", "summary"] });
  };
  return (
    <>
      <PageHeading
        eyebrow="A direction backed by evidence"
        title="Your matching opportunities."
        description="Compare your confirmed profile with demonstration jobs. See how each score was calculated and where more evidence would help."
        action={
          <Link to="/jobs" className="inline-flex items-center gap-2 text-xs text-accent">
            Browse all jobs <ArrowRight className="h-3 w-3" />
          </Link>
        }
      />
      {readiness.isPending ? (
        <LoadingCards />
      ) : readiness.isError ? (
        <ErrorNotice error={readiness.error} retry={() => void readiness.refetch()} />
      ) : (
        <Panel className="mb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-accent" />
              {readiness.data.can_match
                ? "Confirmed profile ready for matching"
                : "Confirm your profile to begin"}
            </h2>
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-2 text-xs text-accent"
            >
              <RotateCcw className="h-3 w-3" />
              Refresh readiness
            </button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {readiness.data.message}
          </p>
          {readiness.data.confirmed_fields.length > 0 && (
            <p className="mt-3 text-[11px]">
              Using: {readiness.data.confirmed_fields.map(human).join(", ")}.
            </p>
          )}
          {readiness.data.missing_fields.length > 0 && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Not established: {readiness.data.missing_fields.map(human).join(", ")}.
            </p>
          )}
          {readiness.data.excluded_unconfirmed_fields.length > 0 && (
            <p className="mt-2 text-[11px] text-amber-300">
              Unconfirmed fields excluded:{" "}
              {readiness.data.excluded_unconfirmed_fields.map(human).join(", ")}.
            </p>
          )}
          {!readiness.data.can_match && (
            <Link to="/profile" className="mt-4 inline-flex items-center gap-2 text-xs text-accent">
              Review and confirm profile <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </Panel>
      )}
      <Panel className="mb-6">
        <form onSubmit={submit} aria-label="Find matching jobs">
          <fieldset disabled={!readiness.data || busy || start.isPending} className="min-w-0">
            <div className="flex flex-wrap justify-between gap-3">
              <h2 className="font-display text-2xl">Find your next possibility.</h2>
              <span className="career-pill">
                {options.data?.total ?? "10,000"} seeded / mock listings
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              All listings are synthetic. Active dates use the frozen dataset date,{" "}
              {options.data?.reference_date || "2026-10-19"}.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {text("keyword", "Job search")}
              {text("role", "Role or career area")}
              {text("skills", "Required listing skills (comma separated)")}
              {select("category", "Job category", options.data?.categories || [])}
              {text("location", "Job location")}
              {select("work_mode", "Work mode", ["remote", "hybrid", "onsite"])}
              <label className="text-xs">
                Minimum hybrid score
                <input
                  className={input}
                  type="number"
                  min={0}
                  max={100}
                  required
                  step="any"
                  aria-label="Minimum hybrid score"
                  value={minimum}
                  onChange={(e) => setMinimum(Number(e.target.value))}
                />
                <span className="mt-1 block text-[10px] text-muted-foreground">
                  Raw score 0–100. 0.5 means half a point, not 50%. The experimental match
                  percentage is separate.
                </span>
              </label>
            </div>
            <details className="mt-4 rounded-lg border border-border p-4">
              <summary className="cursor-pointer text-xs text-accent">More search filters</summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {select(
                  "experience",
                  "Listing experience level",
                  options.data?.experience_levels || [],
                )}
                {select("employment_type", "Employment type", options.data?.employment_types || [])}
                {select("country", "Country", options.data?.countries || [])}
                {select("industry", "Industry", options.data?.industries || [])}
                {text("company", "Company")}
                <label className="text-xs">
                  Location reach
                  <select
                    className={input}
                    aria-label="Location reach"
                    value={search.location_scope}
                    onChange={(e) => setSearch({ ...search, location_scope: e.target.value })}
                  >
                    <option value="compatible">City + remote roles in the country</option>
                    <option value="city">Exact city</option>
                    <option value="state">Same state</option>
                    <option value="country">Same country</option>
                  </select>
                  <span className="mt-1 block text-[10px] text-muted-foreground">
                    An explicit onsite work mode still excludes remote jobs.
                  </span>
                </label>
                <label className="text-xs">
                  Category scope
                  <select
                    className={input}
                    aria-label="Category scope"
                    value={search.category_scope}
                    onChange={(e) => setSearch({ ...search, category_scope: e.target.value })}
                  >
                    <option value="family">Related role family</option>
                    <option value="exact">Exact category only</option>
                  </select>
                  <span className="mt-1 block text-[10px] text-muted-foreground">
                    AI includes ML, NLP, computer vision, deep learning and generative AI. Exact
                    category remains available.
                  </span>
                </label>
                <label className="text-xs">
                  Retrieval pool size
                  <input
                    className={input}
                    type="number"
                    min={50}
                    max={10000}
                    required
                    value={poolSize}
                    onChange={(e) => setPoolSize(Number(e.target.value))}
                  />
                  <span className="mt-1 block text-[10px] text-muted-foreground">
                    All filtered jobs are searched; up to this many receive detailed ranking.
                  </span>
                </label>
                {(["posted_from", "posted_to"] as const).map((key) => (
                  <label key={key} className="text-xs">
                    {human(key)}
                    <input
                      type="date"
                      className={input}
                      aria-label={human(key)}
                      value={search[key]}
                      onChange={(e) => setSearch({ ...search, [key]: e.target.value })}
                    />
                  </label>
                ))}
                <label className="text-xs">
                  Dataset availability
                  <select
                    className={input}
                    value={search.availability}
                    onChange={(e) => setSearch({ ...search, availability: e.target.value })}
                  >
                    <option value="active">Active at dataset date</option>
                    <option value="all">All demonstration dates</option>
                    <option value="expired">Expired examples</option>
                    <option value="future">Future examples</option>
                  </select>
                </label>
              </div>
            </details>
            <label className="mt-5 flex items-start gap-3 text-xs leading-relaxed">
              <input
                type="checkbox"
                className="mt-0.5 accent-[var(--accent)]"
                checked={useAI}
                onChange={(e) => setUseAI(e.target.checked)}
              />
              <span>
                Allow optional Groq explanation review for the top recommendations.
                <span className="mt-1 block text-[10px] text-muted-foreground">
                  Sends job titles, scores and source-grounded reason evidence to Groq. Numeric
                  scores stay deterministic. Runs locally without this choice.
                </span>
              </span>
            </label>
            <div className="mt-5 flex flex-wrap items-center gap-5">
              <button
                type="submit"
                className="btn-hero !py-3 !text-xs disabled:opacity-50"
                disabled={!readiness.data?.can_match || busy || start.isPending}
              >
                <Search className="h-4 w-4" />
                {start.isPending
                  ? "Starting…"
                  : busy
                    ? "Matching in progress…"
                    : "Find Matching Jobs"}
              </button>
              <button
                type="button"
                onClick={() => setSearch(initialSearch)}
                className="text-xs text-muted-foreground underline"
              >
                Reset search filters
              </button>
            </div>
          </fieldset>
        </form>
        {options.isError && (
          <ErrorNotice error={options.error} retry={() => void options.refetch()} />
        )}
      </Panel>
      {[start.error, retry.error, cancel.error, save.error, bookmarks.error]
        .filter(Boolean)
        .map((error, i) => (
          <div className="mb-4" key={i}>
            <ErrorNotice error={error} />
          </div>
        ))}
      {runs.isError && <ErrorNotice error={runs.error} retry={() => void runs.refetch()} />}
      {!!runs.data?.length && (
        <div className="mb-5 flex flex-wrap items-end gap-4">
          <label className="min-w-0 flex-1 text-xs">
            Saved matching runs
            <select
              className={input}
              aria-label="Saved matching runs"
              value={runId}
              onChange={(e) => {
                setSelected(e.target.value);
                setPage(1);
                setFilters(initialResults);
              }}
            >
              {runs.data.map((r) => (
                <option key={r.id} value={r.id}>
                  {runTime(r.created_at)} · revision {r.profile_revision} · {r.status}
                  {r.stale ? " · stale" : ""}
                </option>
              ))}
            </select>
          </label>
          <button onClick={refresh} className="mb-3 text-xs text-accent" type="button">
            Refresh status
          </button>
        </div>
      )}
      {status.isError && <ErrorNotice error={status.error} retry={() => void status.refetch()} />}
      {run && (
        <>
          {options.data && run.dataset_version !== options.data.dataset_version && (
            <p className="mb-5 rounded-xl border border-accent/20 p-4 text-xs leading-relaxed text-muted-foreground">
              This saved run uses an earlier job dataset. Choose Find Matching Jobs to search the
              current {options.data.total.toLocaleString()} listings. Your saved results remain
              available.
            </p>
          )}
          {run.config["filter_version"] !== "structured-filters-v1" && (
            <p className="mb-5 rounded-xl border border-accent/20 p-4 text-xs text-muted-foreground">
              This saved run predates the location and role-filter fixes. Start a new run to apply
              them; saved history remains unchanged.
            </p>
          )}
          {run.stale && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-amber-400/30 p-4 text-xs leading-relaxed text-amber-300"
            >
              Your profile has changed since this run. These results use revision{" "}
              {run.profile_revision}. Find Matching Jobs again to recalculate from your current
              confirmed facts.
            </div>
          )}
          {activeMatching(run.status) && (
            <Panel className="mb-5">
              <p role="status" aria-live="polite" className="text-sm">
                Matching in progress · {human(run.stage)}
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {stages.map((stage) => (
                  <span
                    key={stage}
                    className={`rounded-lg border p-2 text-[10px] ${run.stage === stage ? "border-accent text-accent" : "border-border text-muted-foreground"}`}
                  >
                    {human(stage)} · {run.tasks.find((t) => t.stage === stage)?.status || "waiting"}
                  </span>
                ))}
              </div>
              <button
                type="button"
                className="mt-5 text-xs text-accent underline"
                disabled={cancel.isPending}
                onClick={() => cancel.mutate()}
              >
                Cancel matching
              </button>
            </Panel>
          )}
          {["failed", "cancelled"].includes(run.status) && (
            <Panel className="mb-5">
              <p className="text-sm">Matching {run.status}.</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {run.warnings.join(" ") ||
                  "Your profile is unchanged. You can retry with your current confirmed profile."}
              </p>
              {run.error_code && (
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Reference: {human(run.error_code)}
                </p>
              )}
              <button
                type="button"
                onClick={() => retry.mutate()}
                disabled={retry.isPending || busy || !readiness.data?.can_match}
                className="btn-hero mt-4 !text-xs"
              >
                Retry matching
              </button>
            </Panel>
          )}
          {["completed", "partial"].includes(run.status) && (
            <>
              <div className="mb-5 grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Visible matches", value: results.data?.total ?? run.result_count },
                  { label: "Jobs reranked", value: run.eligible_jobs },
                  {
                    label: "Current raw-score threshold",
                    value: results.data?.diagnostics?.effective_minimum_score ?? run.minimum_score,
                  },
                ].map((metric) => (
                  <Panel key={metric.label} light>
                    <p className="text-[11px] text-muted-foreground">{metric.label}</p>
                    <p className="mt-3 font-display text-3xl">{metric.value}</p>
                  </Panel>
                ))}
              </div>
              <p className="mb-5 text-xs leading-relaxed text-muted-foreground">
                {run.provider_metadata["embeddings"]?.status === "active"
                  ? `Semantic embeddings active · ${run.provider_metadata["embeddings"].model}`
                  : "Semantic embeddings unavailable · TF-IDF and explicit skill evidence used."}{" "}
                {run.status === "partial"
                  ? "Partial completion: a requested enrichment stage was unavailable. Validated deterministic results were retained."
                  : run.eligible_jobs
                    ? "Scoring and validation completed."
                    : "No jobs reached scoring. See the filter diagnostics."}{" "}
                AI review: {human(run.provider_metadata["ai_review"]?.status || "not selected")}
                {run.provider_metadata["ai_review"]?.reviewed_jobs
                  ? ` · ${run.provider_metadata["ai_review"].reviewed_jobs} recommendations`
                  : ""}
                .
              </p>
              <Panel className="mb-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="text-xs">
                    Search ranked results
                    <input
                      className={input}
                      maxLength={120}
                      value={filters.keyword}
                      onChange={(e) => {
                        setFilters({ ...filters, keyword: e.target.value });
                        setPage(1);
                      }}
                    />
                  </label>
                  <label className="text-xs">
                    Sort results
                    <select
                      className={input}
                      value={filters.sort}
                      onChange={(e) => {
                        setFilters({ ...filters, sort: e.target.value as ResultFilters["sort"] });
                        setPage(1);
                      }}
                    >
                      <option value="hybrid">Hybrid score</option>
                      <option value="baseline">TF-IDF baseline</option>
                    </select>
                  </label>
                  <label className="text-xs">
                    Narrow by minimum score
                    <input
                      className={input}
                      type="number"
                      min={0}
                      step="any"
                      max={100}
                      aria-label="Narrow by minimum score"
                      value={filters.minimum_score}
                      placeholder={String(run.minimum_score)}
                      onChange={(e) => {
                        setFilters({ ...filters, minimum_score: e.target.value });
                        setPage(1);
                      }}
                    />
                    <span className="mt-1 block text-[10px] text-muted-foreground">
                      Filters raw hybrid points; the experimental percentage is separate.
                    </span>
                  </label>
                  <label className="flex items-center gap-2 self-end py-3 text-xs">
                    <input
                      type="checkbox"
                      checked={filters.saved_only}
                      onChange={(e) => {
                        setFilters({ ...filters, saved_only: e.target.checked });
                        setPage(1);
                      }}
                    />
                    Saved opportunities only
                  </label>
                </div>
              </Panel>
            </>
          )}
          <RunAudit key={run.id} run={run} />
          {["completed", "partial"].includes(run.status) &&
            (results.isPending ? (
              <LoadingCards />
            ) : results.isError ? (
              <ErrorNotice error={results.error} retry={() => void results.refetch()} />
            ) : (
              results.data && (
                <>
                  <p className="mb-4 text-xs text-muted-foreground">
                    {results.data.total} results ·{" "}
                    {filters.sort === "baseline"
                      ? "sorted by baseline; cards retain their hybrid rank"
                      : "ranked by hybrid score"}
                  </p>
                  <details className="mb-4 rounded-lg border border-border p-4 text-xs">
                    <summary className="cursor-pointer text-accent">
                      Result threshold and rendering audit
                    </summary>
                    <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words text-[10px]">
                      {JSON.stringify(
                        {
                          request: { run_id: runId, ...filters, page },
                          diagnostics: results.data.diagnostics,
                        },
                        null,
                        2,
                      )}
                    </pre>
                  </details>
                  {results.data.total === 0 ? (
                    <Panel className="py-12 text-center">
                      <Target className="mx-auto h-6 w-6 text-accent" />
                      <h2 className="mt-4 font-display text-2xl">Room to explore.</h2>
                      <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-muted-foreground">
                        {emptyExplanation[results.data.diagnostics?.empty_state || ""] ||
                          "No opportunities meet these filters. Inspect the saved request and filter counts, or start a new run."}
                      </p>
                      <button
                        type="button"
                        className="mt-4 text-xs text-accent underline"
                        onClick={() => {
                          setFilters(initialResults);
                          setPage(1);
                        }}
                      >
                        Clear result filters
                      </button>
                    </Panel>
                  ) : (
                    <div className="space-y-5">
                      {results.data.items.map((row) => (
                        <MatchCard
                          key={`${run.id}:${row.job.id}`}
                          row={row}
                          runId={run.id}
                          saved={saved.has(row.job.id)}
                          saving={save.isPending}
                          toggleSave={() =>
                            save.mutate({ id: row.job.id, saved: !saved.has(row.job.id) })
                          }
                        />
                      ))}
                    </div>
                  )}
                  {results.data.total > 6 && (
                    <nav
                      aria-label="Matching result pages"
                      className="mt-6 flex items-center justify-between gap-3 text-xs"
                    >
                      <button
                        type="button"
                        className="rounded-lg border border-border px-4 py-2 disabled:opacity-40"
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                      >
                        Previous
                      </button>
                      <span>
                        Page {page} of {Math.ceil(results.data.total / 6)}
                      </span>
                      <button
                        type="button"
                        className="rounded-lg border border-border px-4 py-2 disabled:opacity-40"
                        disabled={page * 6 >= results.data.total}
                        onClick={() => setPage(page + 1)}
                      >
                        Next
                      </button>
                    </nav>
                  )}
                </>
              )
            ))}
        </>
      )}
      {!runId && !runs.isPending && !runs.isError && (
        <Panel className="py-12 text-center">
          <Target className="mx-auto h-7 w-7 text-accent" />
          <h2 className="mt-4 font-display text-2xl">A clearer direction starts here.</h2>
          <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-muted-foreground">
            Confirm your profile, choose the opportunities to compare, and find your first set of
            explainable matches.
          </p>
        </Panel>
      )}
    </>
  );
}
