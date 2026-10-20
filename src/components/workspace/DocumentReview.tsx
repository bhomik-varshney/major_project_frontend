import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronRight, FileCheck2, Loader2, Plus, ShieldCheck, X } from "lucide-react";
import { api } from "@/services/api/client";
import { documentsQuery, profileQuery, summaryQuery } from "@/services/api/queries";
import type {
  CareerDocument,
  ExtractedData,
  ExtractionStatus,
  FieldEvidence,
  ProfileInput,
  UploadPolicy,
} from "@/services/api/types";
import { ErrorNotice, LoadingCards, Panel } from "./shared";
import { ResumeAudit } from "./ResumeAudit";
import { formatDate } from "@/lib/workspace-date";

const labels: Record<keyof ProfileInput, string> = {
  name: "Full name",
  email: "Email address",
  phone: "Phone number",
  location: "Location",
  career_objective: "Profile Summary / Objective",
  education: "Education",
  skills: "Skills",
  experience: "Experience",
  projects: "Projects",
  certifications: "Certifications",
  achievements: "Achievements",
  additional_sections: "Additional sections",
  publications: "Publications",
  links: "Links",
  preferred_roles: "Preferred roles",
  preferred_locations: "Preferred locations",
  experience_level: "Experience level",
};
const active = (status?: string) => status === "queued" || status === "processing";
const statusKey = (id: string) => ["career", "processing", id] as const;
const reviewKey = (id: string) => ["career", "extraction", id] as const;

export function DocumentReview({
  document,
  policy,
  onClose,
}: {
  document: CareerDocument;
  policy: UploadPolicy;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [useGroq, setUseGroq] = useState(false);
  const [useVision, setUseVision] = useState(false);
  const [restartRequested, setRestartRequested] = useState(false);
  const status = useQuery({
    queryKey: statusKey(document.id),
    queryFn: ({ signal }) => api.processingStatus(document.id, signal),
    retry: false,
    refetchInterval: (query) => (active(query.state.data?.status) ? 700 : false),
  });
  const state = status.data;
  const currentStatus = state?.status;
  const processingId = state?.id;
  const data = useQuery({
    queryKey: [...reviewKey(document.id), state?.id, state?.revision],
    queryFn: ({ signal }) => api.extractedData(document.id, signal),
    enabled:
      !!state &&
      ["awaiting_review", "needs_correction", "verified", "rejected"].includes(state.status),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const invalidate = () => {
    void client.invalidateQueries({ queryKey: documentsQuery.queryKey });
    void client.invalidateQueries({ queryKey: summaryQuery.queryKey });
  };
  useEffect(() => {
    if (currentStatus && !active(currentStatus)) {
      void client.invalidateQueries({ queryKey: documentsQuery.queryKey });
      void client.invalidateQueries({ queryKey: summaryQuery.queryKey });
    }
  }, [client, processingId, currentStatus]);
  const process = useMutation({
    mutationFn: (restart: boolean) =>
      api.processDocument(document.id, useGroq, restart, useGroq && useVision),
    onSuccess: (result) => {
      setRestartRequested(false);
      setUseGroq(false);
      setUseVision(false);
      client.setQueryData(statusKey(document.id), result);
      invalidate();
    },
  });
  const cancel = useMutation({
    mutationFn: () => api.correctExtraction(document.id, state!, "cancel"),
    onSuccess: (result) => {
      client.setQueryData(statusKey(document.id), result);
      invalidate();
    },
  });
  const refresh = () => {
    void status.refetch();
    if (
      state &&
      ["awaiting_review", "verified", "needs_correction", "rejected"].includes(state.status)
    )
      void data.refetch();
  };
  const busy = active(state?.status) || process.isPending;
  return (
    <Panel className="border-accent/25" light>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow !text-[9px]">From document to reviewed facts</p>
          <h2 className="mt-3 break-words font-display text-2xl">Review: {document.filename}</h2>
          <p className="mt-2 text-[10px] text-muted-foreground">
            {(document.size_bytes / 1024).toFixed(1)} KB ·{" "}
            {document.filename.split(".").pop()?.toUpperCase()}
            {state && ` · Extraction ${state.run_version}`}
          </p>
        </div>
        <button
          className="rounded p-2 text-muted-foreground"
          type="button"
          aria-label="Close document review"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {status.isPending ? (
        <LoadingCards />
      ) : status.isError ? (
        <ErrorNotice error={status.error} retry={() => void status.refetch()} />
      ) : (
        <>
          {state?.agent_run && (
            <div
              className="mb-5 rounded-xl border border-border px-4 py-3"
              aria-label="Resume agent run"
            >
              <p className="text-xs font-medium">
                {state.agent_run.engine === "crewai"
                  ? "CrewAI · Resume Intelligence Agent"
                  : state.agent_run.status === "fallback"
                    ? "Local fallback · CrewAI could not complete"
                    : "Local document processing"}
              </p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {state.agent_run.engine === "crewai" && state.agent_run.status === "draft_ready"
                  ? "CrewAI processed this resume. Draft facts still require your confirmation."
                  : state.agent_run.status === "partial"
                    ? "Completed AI extraction is retained. An AI stage could not finish; local source checks ran. Review all draft facts before confirming."
                    : state.agent_run.status === "local_only"
                      ? "No external model was run. Local extraction and the canonical CrewAI Flow produced this draft."
                      : `Run: ${state.agent_run.status.replaceAll("_", " ")} · ${state.agent_run.task.replaceAll("_", " ")}`}
              </p>
              {state.agent_run.error_code && (
                <p className="mt-2 text-[10px] text-accent">
                  Processing issue: {state.agent_run.error_code.replaceAll("_", " ")}. Review the
                  warnings below or retry processing.
                </p>
              )}
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                {state.agent_run.tasks.map((task) => (
                  <li key={task.name}>
                    {task.name.replaceAll("_", " ")} · {task.status.replaceAll("_", " ")}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!busy &&
            (restartRequested ||
              !state ||
              ["failed", "cancelled", "rejected"].includes(state.status)) && (
              <div className="rounded-xl border border-border bg-secondary/20 p-5">
                <p className="text-sm">
                  {state?.status === "failed"
                    ? "This document needs another route."
                    : state?.status === "cancelled"
                      ? "Processing was cancelled."
                      : state?.status === "rejected"
                        ? "This draft was rejected."
                        : "Ready to read your document."}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  We’ll extract readable text and propose profile fields. Nothing is saved to your
                  profile until you review and confirm it.
                </p>
                {restartRequested && (
                  <p className="mt-3 text-xs leading-relaxed text-accent">
                    This creates a new extraction version with the current parser. Your saved
                    profile stays unchanged. Unsaved review edits will not be copied.
                  </p>
                )}
                {state?.error_message && (
                  <div className="mt-4">
                    <ErrorNotice error={new Error(state.error_message)} />
                  </div>
                )}
                <label className="mt-5 flex items-start gap-3 text-xs leading-relaxed">
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-[var(--rose)]"
                    checked={useGroq}
                    onChange={(event) => {
                      setUseGroq(event.target.checked);
                      if (!event.target.checked) setUseVision(false);
                    }}
                  />
                  <span>
                    Use optional Groq enhancement with CrewAI. I allow this document’s extracted
                    text, including contact details, to be sent to Groq for this run.
                    <span className="mt-2 block text-[10px] text-muted-foreground">
                      {policy.groq_configured
                        ? `Configured model: ${policy.groq_model}.`
                        : "Groq is not configured; this run will stay in limited local mode."}{" "}
                      Leave unchecked to keep processing local.
                    </span>
                  </span>
                </label>
                {useGroq && document.filename.toLowerCase().endsWith(".txt") === false && (
                  <label className="mt-4 flex items-start gap-3 text-xs leading-relaxed">
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-[var(--rose)]"
                      checked={useVision}
                      onChange={(event) => setUseVision(event.target.checked)}
                    />
                    <span>
                      Include visual layout analysis. I also allow rendered resume page images,
                      including visible personal details, to be sent to Groq for this run.
                      <span className="mt-2 block text-[10px] text-muted-foreground">
                        Uses the configured primary/fallback vision model when available. Local
                        previews and OCR work without this option.
                        {policy.vision_primary && (
                          <span className="mt-1 block break-all">
                            Configured vision: {policy.vision_primary}
                            {policy.vision_fallback && ` / ${policy.vision_fallback}`}
                          </span>
                        )}
                      </span>
                    </span>
                  </label>
                )}
                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    className="btn-hero !py-2.5 !text-xs"
                    onClick={() => process.mutate(restartRequested)}
                  >
                    {restartRequested
                      ? "Start new extraction"
                      : state
                        ? "Retry extraction"
                        : "Process document"}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  {restartRequested && (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground underline"
                      onClick={() => setRestartRequested(false)}
                    >
                      Keep current review
                    </button>
                  )}
                  <Link
                    to="/profile"
                    className="text-xs text-muted-foreground underline underline-offset-4"
                  >
                    Enter profile manually
                  </Link>
                </div>
              </div>
            )}
          {busy && (
            <div
              className="rounded-xl border border-border p-5"
              role="status"
              aria-label="Processing document"
            >
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                <p className="text-sm">
                  {process.isPending
                    ? "Starting extraction…"
                    : (
                        {
                          queued: "Waiting for the local worker…",
                          rendering_pages: "Rendering private page previews…",
                          ocr_processing: "Reading image-based text with local OCR…",
                          provider_rate_wait: "Waiting for Groq’s quota to reset…",
                          vision_processing: "CrewAI is analysing visual layout…",
                          extracting_text: "Extracting readable text…",
                          identifying_fields: "Identifying profile information…",
                          crew_extraction: "CrewAI is extracting source-linked facts…",
                          crew_validation: "CrewAI is checking the extraction…",
                          quality_validation: "Checking source evidence and warnings…",
                          analysing: "Analysing page quality…",
                          canonicalizing: "Connecting fields with source evidence…",
                          validating: "Validating canonical fields and relationships…",
                          repairing: "Verifying uncertain fields with a bounded repair loop…",
                          review_preparation: "Preparing the validated review draft…",
                          enhancing_fields: "Enhancing source-linked fields with Groq…",
                          preparing_review: "Preparing your verification view…",
                        } as Record<string, string>
                      )[state?.stage || "queued"] || "Processing your document…"}
                </p>
              </div>
              <ol className="mt-5 grid gap-3 text-[10px] text-muted-foreground sm:grid-cols-3">
                <li>01 · Read document</li>
                <li>02 · Identify facts</li>
                <li>03 · Prepare review</li>
              </ol>
              {state && active(state.status) && (
                <button
                  type="button"
                  className="mt-5 text-xs text-accent underline underline-offset-4"
                  disabled={cancel.isPending}
                  onClick={() => cancel.mutate()}
                >
                  Cancel processing
                </button>
              )}
              <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
                Cancelling stops profile preparation. A request already sent to Groq cannot be
                recalled.
              </p>
            </div>
          )}
          {state &&
            !busy &&
            data.isPending &&
            ["awaiting_review", "verified", "needs_correction"].includes(state.status) && (
              <LoadingCards />
            )}
          {data.isError && <ErrorNotice error={data.error} retry={refresh} />}
          {state && <ResumeAudit documentId={document.id} state={state} />}
          {data.data && !busy && !restartRequested && state?.status !== "rejected" && (
            <ReviewEditor
              key={`${data.data.id}-${data.data.revision}-${data.data.current_profile_revision}`}
              documentId={document.id}
              data={data.data}
              refresh={refresh}
            />
          )}
          {state &&
            !busy &&
            !restartRequested &&
            ["awaiting_review", "verified", "needs_correction"].includes(state.status) && (
              <div className="mt-5 border-t border-border pt-4">
                <button
                  type="button"
                  className="text-xs text-accent underline underline-offset-4"
                  onClick={() => {
                    setUseGroq(false);
                    setRestartRequested(true);
                  }}
                >
                  Reprocess with current parser
                </button>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Create a separate review version; saved profile facts remain unchanged.
                </p>
              </div>
            )}
          {(process.isError || cancel.isError) && (
            <div className="mt-4">
              <ErrorNotice error={process.error || cancel.error} retry={refresh} />
            </div>
          )}
        </>
      )}
    </Panel>
  );
}

function describe(value: unknown): string {
  if (Array.isArray(value))
    return value
      .map((item: unknown) =>
        typeof item === "string"
          ? item
          : Object.values(item as Record<string, string>)
              .filter(Boolean)
              .join(" · "),
      )
      .join("; ");
  return typeof value === "string" ? value : "";
}
function leaf(object: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (value, key) =>
        value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined,
      object,
    );
}
function fieldLabel(path: string) {
  const parts = path.split(".");
  const root = labels[parts[0] as keyof ProfileInput];
  if (parts.length === 1) return root;
  const index = Number(parts[1]) + 1;
  return parts[2] ? `${root} ${index}: ${parts[2].replaceAll("_", " ")}` : `${root} ${index}`;
}
function SourceHint({ proof, edited }: { proof: FieldEvidence | undefined; edited: boolean }) {
  if (edited || proof?.method === "user")
    return (
      <p className="mt-2 text-[10px] leading-relaxed text-accent">
        Your correction · source support is not assumed. Review before confirming.
      </p>
    );
  if (!proof || proof.classification === "not_found")
    return (
      <p className="mt-2 text-[10px] text-muted-foreground">
        Not detected. Add only information you can confirm.
      </p>
    );
  return (
    <div className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
      <p>
        Confidence: {proof.confidence} ·{" "}
        {proof.method === "groq" ? "Groq suggestion" : "Local suggestion"}
      </p>
      {!!proof.extraction_methods?.length && (
        <p
          className={`mt-1 ${proof.extraction_methods.includes("ocr") ? "text-purple-400" : "text-emerald-400"}`}
        >
          Evidence: {proof.extraction_methods.join(" + ")}
          {proof.ocr_confidence != null &&
            ` · OCR recognition ${Math.round(proof.ocr_confidence * 100)}%`}
        </p>
      )}
      {proof.heading && (
        <p className="mt-1">
          Original heading: {proof.heading}
          {proof.statement_type ? ` · ${proof.statement_type}` : ""}
        </p>
      )}
      {proof.classification === "ambiguous" && (
        <p className="mt-1 text-accent">Ambiguous — review required.</p>
      )}
      {proof.classification === "normalized" && (
        <p className="mt-1">Normalized from source text.</p>
      )}
      {proof.warning && <p className="mt-1 text-accent">{proof.warning}</p>}
      {proof.source && (
        <details className="mt-1.5">
          <summary className="cursor-pointer text-accent">
            Source ·{" "}
            {proof.source.page
              ? `page ${proof.source.page}`
              : `paragraph ${proof.source.paragraph || proof.source.block_id}`}
          </summary>
          <blockquote className="mt-2 whitespace-pre-wrap break-words border-l border-accent/25 pl-3">
            {proof.source.quote}
          </blockquote>
          {proof.references &&
            proof.references.length > 1 &&
            proof.references.map(
              (reference, index) =>
                reference && (
                  <blockquote
                    key={index}
                    className="mt-2 whitespace-pre-wrap break-words border-l border-accent/25 pl-3"
                  >
                    {reference.quote}
                  </blockquote>
                ),
            )}
        </details>
      )}
    </div>
  );
}

function ReviewEditor({
  documentId,
  data,
  refresh,
}: {
  documentId: string;
  data: ExtractedData;
  refresh: () => void;
}) {
  const client = useQueryClient();
  const editor = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<ProfileInput>(() => structuredClone(data.values));
  const [selected, setSelected] = useState<(keyof ProfileInput)[]>(() =>
    (Object.keys(data.values) as (keyof ProfileInput)[]).filter((key) => {
      const value = data.values[key];
      const prior = data.current_profile_values[key];
      return (
        (Array.isArray(value) ? value.length > 0 : !!value) &&
        (!prior ||
          (Array.isArray(prior) && prior.length === 0) ||
          Array.isArray(value) ||
          prior === value)
      );
    }),
  );
  const [replace, setReplace] = useState<(keyof ProfileInput)[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const dirty = JSON.stringify(values) !== JSON.stringify(data.values);
  const readOnly = data.status === "verified";
  const invalidate = () => {
    void client.invalidateQueries({ queryKey: statusKey(documentId) });
    void client.invalidateQueries({ queryKey: documentsQuery.queryKey });
    void client.invalidateQueries({ queryKey: summaryQuery.queryKey });
  };
  const save = useMutation({
    mutationFn: () => api.updateExtraction(documentId, data, values),
    onSuccess: (saved) => {
      client.setQueryData([...reviewKey(documentId), saved.id, saved.revision], saved);
      client.setQueryData(statusKey(documentId), saved);
      void client.invalidateQueries({ queryKey: documentsQuery.queryKey });
    },
  });
  const verify = useMutation({
    mutationFn: () =>
      api.verifyExtraction(
        documentId,
        data,
        selected,
        replace.filter((field) => selected.includes(field)),
      ),
    onSuccess: (profile) => {
      client.setQueryData(profileQuery.queryKey, profile);
      invalidate();
    },
  });
  const correction = useMutation({
    mutationFn: (action: "correction" | "reject") =>
      api.correctExtraction(documentId, data, action),
    onSuccess: (result) => {
      client.setQueryData(statusKey(documentId), result);
      void client.invalidateQueries({ queryKey: documentsQuery.queryKey });
      void client.invalidateQueries({ queryKey: summaryQuery.queryKey });
    },
  });
  const busy = save.isPending || verify.isPending || correction.isPending;
  const change = (field: keyof ProfileInput, value: ProfileInput[keyof ProfileInput]) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    setConfirmed(false);
  };
  const control = (
    path: string,
    value: string,
    onChange: (value: string) => void,
    multiline = false,
  ) => (
    <div className="min-w-0">
      <label className="career-field">
        <span>{fieldLabel(path)}</span>
        {multiline || path.endsWith(".content") ? (
          <textarea
            rows={3}
            aria-label={`Extracted ${fieldLabel(path)}`}
            maxLength={path.endsWith(".content") ? 6000 : 2000}
            disabled={readOnly || busy}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
        ) : (
          <input
            aria-label={`Extracted ${fieldLabel(path)}`}
            disabled={readOnly || busy}
            value={value}
            maxLength={path === "career_objective" ? 2000 : path.includes("links") ? 500 : 254}
            onChange={(event) => onChange(event.target.value)}
          />
        )}
      </label>
      <SourceHint proof={data.evidence[path]} edited={leaf(data.values, path) !== value} />
    </div>
  );
  const section = (field: keyof ProfileInput) => {
    const value = values[field];
    const prior = data.current_profile_values[field];
    const populated = Array.isArray(value) ? value.length > 0 : !!value;
    const current = describe(prior);
    return (
      <details
        id={`resume-field-${field}`}
        key={field}
        open={populated}
        className="rounded-xl border border-border p-4 sm:p-5"
      >
        <summary className="cursor-pointer text-sm font-medium">
          {labels[field]}
          <span className="ml-3 text-[10px] font-normal text-muted-foreground">
            {readOnly
              ? data.applied_fields.includes(field)
                ? "Saved to profile"
                : "Not applied"
              : populated
                ? "Review suggested values"
                : "Not found · optional"}
          </span>
        </summary>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {!readOnly && (
            <label className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <input
                type="checkbox"
                aria-label={`Apply ${labels[field]}`}
                className="accent-[var(--rose)]"
                disabled={!populated || busy}
                checked={selected.includes(field)}
                onChange={(event) => {
                  setSelected((previous) =>
                    event.target.checked
                      ? [...previous, field]
                      : previous.filter((key) => key !== field),
                  );
                  setConfirmed(false);
                }}
              />
              Apply to profile
            </label>
          )}
        </div>
        {current && (
          <div className="my-3 rounded-lg bg-secondary/50 p-3 text-[10px] leading-relaxed text-muted-foreground">
            <p className="break-words">Currently saved: {current}</p>
            {selected.includes(field) && !readOnly && (
              <label className="mt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  aria-label={`Replace ${labels[field]}`}
                  className="accent-[var(--rose)]"
                  checked={replace.includes(field)}
                  onChange={(event) => {
                    setReplace((previous) =>
                      event.target.checked
                        ? [...previous, field]
                        : previous.filter((key) => key !== field),
                    );
                    setConfirmed(false);
                  }}
                />
                {Array.isArray(value)
                  ? "Replace the saved section instead of adding unique items"
                  : "Replace the saved value with this reviewed value"}
              </label>
            )}
          </div>
        )}
        <div className="mt-4 space-y-4">
          {Array.isArray(value) ? (
            <>
              {value.length === 0 && (
                <p className="text-[11px] text-muted-foreground">
                  No entries found. This section will not change your profile.
                </p>
              )}
              {value.map((item, index) => (
                <div key={index} className="rounded-lg border border-border p-3">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {typeof item === "string" ? (
                      <div className="sm:col-span-2">
                        {control(`${field}.${index}`, item, (updated) =>
                          change(
                            field,
                            value.map((old, i) =>
                              i === index ? updated : old,
                            ) as ProfileInput[typeof field],
                          ),
                        )}
                      </div>
                    ) : (
                      (() => {
                        const entries = Object.entries(item);
                        const primary = ([key, text]: [string, string | string[] | undefined]) =>
                          [
                            "name",
                            "institution",
                            "qualification",
                            "organization",
                            "role",
                            "description",
                            "url",
                            "technologies",
                          ].includes(key) || !!(Array.isArray(text) ? text.length : text);
                        const renderEntry = ([key, text]: [
                          string,
                          string | string[] | undefined,
                        ]) => (
                          <div key={key} className={key === "description" ? "sm:col-span-2" : ""}>
                            {Array.isArray(text) ? (
                              <>
                                <label className="career-field">
                                  <span>{fieldLabel(`${field}.${index}.${key}`)}</span>
                                  <textarea
                                    rows={2}
                                    aria-label={`Extracted ${fieldLabel(`${field}.${index}.${key}`)}`}
                                    disabled={readOnly || busy}
                                    value={text.join("\n")}
                                    onChange={(event) =>
                                      change(
                                        field,
                                        value.map((old, i) =>
                                          i === index
                                            ? {
                                                ...(old as object),
                                                [key]: event.target.value
                                                  .split("\n")
                                                  .map((s) => s.trim())
                                                  .filter(Boolean),
                                              }
                                            : old,
                                        ) as ProfileInput[typeof field],
                                      )
                                    }
                                  />
                                </label>
                                {text.length === 0 && (
                                  <SourceHint proof={undefined} edited={false} />
                                )}
                                {text.map((entry, j) => (
                                  <div key={j} className="mt-2">
                                    <p className="text-[10px] text-muted-foreground">{entry}</p>
                                    <SourceHint
                                      proof={data.evidence[`${field}.${index}.${key}.${j}`]}
                                      edited={
                                        leaf(data.values, `${field}.${index}.${key}.${j}`) !== entry
                                      }
                                    />
                                  </div>
                                ))}
                              </>
                            ) : (
                              control(
                                `${field}.${index}.${key}`,
                                text || "",
                                (updated) =>
                                  change(
                                    field,
                                    value.map((old, i) =>
                                      i === index ? { ...(old as object), [key]: updated } : old,
                                    ) as ProfileInput[typeof field],
                                  ),
                                key === "description",
                              )
                            )}
                          </div>
                        );
                        const extra = entries.filter((entry) => !primary(entry));
                        return (
                          <>
                            {entries.filter(primary).map(renderEntry)}
                            {extra.length > 0 && (
                              <details className="sm:col-span-2 rounded-lg border border-border p-3">
                                <summary className="cursor-pointer text-[11px] text-muted-foreground">
                                  Additional fields · not detected
                                </summary>
                                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                  {extra.map(renderEntry)}
                                </div>
                              </details>
                            )}
                          </>
                        );
                      })()
                    )}
                  </div>
                  {!readOnly && (
                    <button
                      type="button"
                      disabled={busy}
                      className="mt-3 text-[10px] text-muted-foreground underline underline-offset-4"
                      aria-label={`Remove extracted ${field} ${index + 1}`}
                      onClick={() =>
                        change(
                          field,
                          value.filter((_, i) => i !== index) as ProfileInput[typeof field],
                        )
                      }
                    >
                      Remove entry
                    </button>
                  )}
                </div>
              ))}
              {!readOnly && (
                <button
                  type="button"
                  disabled={
                    busy ||
                    value.length >=
                      (field === "skills"
                        ? 100
                        : field === "education" || field === "experience"
                          ? 20
                          : 30)
                  }
                  className="career-add"
                  onClick={() => {
                    const item =
                      field === "education"
                        ? { institution: "", qualification: "", period: "" }
                        : field === "experience"
                          ? { organization: "", role: "", period: "", description: "" }
                          : field === "projects"
                            ? { name: "", description: "", url: "" }
                            : field === "additional_sections"
                              ? { heading: "", content: "" }
                              : "";
                    change(field, [...value, item] as ProfileInput[typeof field]);
                  }}
                >
                  <Plus className="h-3 w-3" />
                  Add {labels[field].toLowerCase()} entry
                </button>
              )}
            </>
          ) : field === "experience_level" ? (
            <label className="career-field">
              <span>Level, if you choose to provide it</span>
              <select
                aria-label="Extracted Experience level"
                disabled={readOnly || busy}
                value={value}
                onChange={(event) =>
                  change(field, event.target.value as ProfileInput["experience_level"])
                }
              >
                <option value="">Unknown / not stated</option>
                <option value="student">Student</option>
                <option value="graduate">Recent graduate</option>
                <option value="early_career">Early career</option>
                <option value="experienced">Experienced</option>
              </select>
            </label>
          ) : (
            control(field, value, (updated) => change(field, updated), field === "career_objective")
          )}
        </div>
      </details>
    );
  };
  return (
    <div ref={editor} className="space-y-5">
      {data.structured?.extraction_metadata?.parser_version === "legacy" && (
        <p className="rounded-xl border border-accent/20 p-4 text-xs leading-relaxed text-muted-foreground">
          This saved review predates the latest extraction improvements. Reprocess to create a fresh
          review; your saved profile stays unchanged.
        </p>
      )}
      {readOnly ? (
        <div className="rounded-xl border border-accent/25 bg-primary/10 p-5">
          <p role="status" className="career-success">
            <FileCheck2 className="h-4 w-4" />
            Selected information saved to your profile.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Confirmed {data.verified_at ? formatDate(data.verified_at) : "by you"}. Unselected
            sections were preserved; other profile facts may still need review.
          </p>
          <Link to="/profile" className="btn-ghost mt-4 !text-xs">
            Open updated profile
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-accent/20 bg-primary/10 p-5">
          <p className="flex items-center gap-2 text-sm">
            <ShieldCheck className="h-4 w-4 text-accent" />
            {data.status === "needs_correction"
              ? "Needs correction — edit before confirming."
              : "Extracted information — review required."}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Choose the sections to apply. Lists add unique entries unless you explicitly choose
            replacement. A different saved value requires a replacement choice. Source quotes
            support review; suggestions are not verified facts.
          </p>
          <button
            type="button"
            className="btn-ghost mt-4 !text-xs"
            disabled={busy}
            onClick={() => {
              const field = editor.current?.querySelector<HTMLInputElement>(
                'input[aria-label^="Extracted "]',
              );
              const section = field?.closest("details");
              if (section) section.open = true;
              field?.focus();
            }}
          >
            Edit information
          </button>
        </div>
      )}
      <details
        className="rounded-xl border border-border p-4"
        open={data.method !== "groq_enhanced"}
      >
        <summary className="cursor-pointer text-xs text-accent">
          {data.method === "groq_enhanced"
            ? data.agent_run?.engine === "crewai"
              ? "CrewAI + Groq extraction"
              : "Groq-enhanced extraction"
            : "Limited local extraction"}{" "}
          · limitations and warnings
        </summary>
        <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-muted-foreground">
          {data.warnings.map((warning, index) => (
            <li key={index}>{warning}</li>
          ))}
        </ul>
      </details>
      <div className="grid gap-4">
        {(
          [
            "name",
            "email",
            "phone",
            "location",
            "career_objective",
            "skills",
            "education",
            "experience",
            "projects",
            "links",
            "certifications",
            "achievements",
            "publications",
            "additional_sections",
            "preferred_roles",
            "preferred_locations",
            "experience_level",
          ] as (keyof ProfileInput)[]
        ).map(section)}
      </div>
      {!readOnly && (
        <div
          id="resume-confirmation"
          className="rounded-xl border border-border bg-background/95 p-4"
        >
          <p className="mb-3 text-[10px] text-muted-foreground">
            Target:{" "}
            {data.current_profile_revision
              ? `saved profile revision ${data.current_profile_revision}`
              : "new candidate profile"}{" "}
            · {selected.length} sections selected
          </p>
          <label className="flex items-start gap-2 text-xs leading-relaxed">
            <input
              type="checkbox"
              className="mt-0.5 accent-[var(--rose)]"
              checked={confirmed}
              disabled={dirty || busy}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            <span>
              I reviewed the selected values and replacement choices and confirm they are accurate.
            </span>
          </label>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-ghost !py-2.5 !text-xs"
              disabled={!dirty || busy}
              onClick={() => save.mutate()}
            >
              {save.isPending ? "Saving edits…" : "Save draft edits"}
            </button>
            <button
              type="button"
              className="btn-hero !py-2.5 !text-xs"
              disabled={
                dirty ||
                !confirmed ||
                selected.length === 0 ||
                busy ||
                data.status === "needs_correction"
              }
              onClick={() => verify.mutate()}
            >
              {verify.isPending ? "Confirming…" : "Confirm and save profile"}
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="text-[10px] text-muted-foreground underline underline-offset-4"
              disabled={dirty || busy}
              onClick={() => correction.mutate("correction")}
            >
              Request correction
            </button>
            <button
              type="button"
              className="text-[10px] text-muted-foreground underline underline-offset-4"
              disabled={dirty || busy}
              onClick={() => correction.mutate("reject")}
            >
              Reject draft
            </button>
          </div>
          {dirty && (
            <p className="mt-3 text-[10px] text-accent">
              Save draft edits before confirming. Your profile has not changed.
            </p>
          )}
        </div>
      )}
      {(save.isError || verify.isError || correction.isError) && (
        <div className="space-y-3">
          <ErrorNotice error={save.error || verify.error || correction.error} />
          <button type="button" className="btn-ghost !text-xs" onClick={refresh}>
            Reload review and current profile
          </button>
        </div>
      )}
    </div>
  );
}
