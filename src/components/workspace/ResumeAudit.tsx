import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import type { AuditLayout, ExtractionStatus, ProcessingAudit } from "@/services/api/types";
import { CanonicalAudit } from "./CanonicalAudit";
import { ErrorNotice } from "./shared";

function Step({
  title,
  children,
  open = false,
}: {
  title: string;
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <details open={open} className="min-w-0 rounded-xl border border-border bg-background/30 p-4">
      <summary className="cursor-pointer text-xs font-medium">{title}</summary>
      <div className="mt-4 min-w-0 space-y-3 text-xs leading-relaxed text-muted-foreground">
        {children}
      </div>
    </details>
  );
}
const friendly = (value: string) => value.replaceAll("_", " ");
function resultSummary(agent: ProcessingAudit["agents"][number]) {
  const grounding = agent.result["grounding"] as Record<string, unknown> | undefined;
  if (agent.name === "extraction" && typeof grounding?.["accepted_claims"] === "number") {
    return `Source-checked AI claims: ${grounding["accepted_claims"]} accepted; ${grounding["withheld_claims"]} withheld. Inspect the per-claim decisions below.`;
  }
  if (agent.name === "source_validation" && typeof grounding?.["supported_fields"] === "number") {
    return `Draft source checks: ${grounding["supported_fields"]} fields supported; ${grounding["unsupported_fields"]} unsupported. Source support still requires your confirmation.`;
  }
  if (agent.name === "vision_layout" && Array.isArray(agent.result["blocks"])) {
    const blocks = agent.result["blocks"] as { status?: string }[];
    const supported = blocks.filter((block) => block.status === "supported").length;
    return `Visual blocks: ${supported} source corroborated; ${blocks.length - supported} need review. Check text and region placement in step 3.`;
  }
  return null;
}
const codeView = (value: unknown) => (
  <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-secondary/40 p-3 text-[11px]">
    {JSON.stringify(value, null, 2)}
  </pre>
);

function Preview({
  documentId,
  page,
  layout,
}: {
  documentId: string;
  page: ProcessingAudit["pages"][number];
  layout: AuditLayout[];
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [overlays, setOverlays] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = "";
    setUrl("");
    setError(null);
    void api
      .pagePreview(documentId, page.id, controller.signal)
      .then((blob) => {
        if (!controller.signal.aborted) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason);
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentId, page.id]);
  return (
    <div className="space-y-3">
      <p>
        Page {page.page} · {page.width} × {page.height} · {page.renderer}
      </p>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={overlays} onChange={(e) => setOverlays(e.target.checked)} />
        Show layout regions
      </label>
      {error ? (
        <ErrorNotice error={error} />
      ) : url ? (
        <div className="relative mx-auto max-w-xl overflow-hidden rounded-lg border border-border bg-white">
          <img
            src={url}
            width={page.width}
            height={page.height}
            alt={`Resume page ${page.page} preview`}
            className="h-auto w-full"
          />
          {overlays &&
            layout
              .filter((b) => b.region)
              .map((b) => (
                <div
                  key={b.id}
                  title={`${b.section || b.block_type}: ${b.raw_text}`}
                  aria-hidden="true"
                  className={`pointer-events-none absolute border ${b.status === "needs_review" ? "border-amber-500 bg-amber-500/10" : "border-blue-500 bg-blue-500/10"}`}
                  style={{
                    left: `${b.region!.x * 100}%`,
                    top: `${b.region!.y * 100}%`,
                    width: `${b.region!.width * 100}%`,
                    height: `${b.region!.height * 100}%`,
                  }}
                />
              ))}
        </div>
      ) : (
        <p role="status">Loading private page preview…</p>
      )}
    </div>
  );
}

export function ResumeAudit({
  documentId,
  state,
}: {
  documentId: string;
  state: ExtractionStatus;
}) {
  const running = state.status === "queued" || state.status === "processing";
  const [selectedRun, setSelectedRun] = useState("");
  const [compareRun, setCompareRun] = useState("");
  const [originalError, setOriginalError] = useState<unknown>(null);
  const history = useQuery({
    queryKey: ["career", "resume-runs", documentId, state.id, state.status],
    queryFn: ({ signal }) => api.resumeRuns(documentId, signal),
    retry: false,
  });
  const comparison = useQuery({
    queryKey: ["career", "resume-compare", documentId, compareRun, state.id],
    queryFn: ({ signal }) => api.compareResumeRuns(documentId, compareRun, state.id, signal),
    enabled: !!compareRun && compareRun !== state.id && !running,
    retry: false,
  });
  const audit = useQuery({
    queryKey: [
      "career",
      "audit",
      documentId,
      state.id,
      state.revision,
      state.stage,
      state.status,
      selectedRun,
    ],
    queryFn: ({ signal }) => api.audit(documentId, signal, selectedRun || undefined),
    refetchInterval: running ? 1200 : false,
  });
  const [pageId, setPageId] = useState("");
  const [textPage, setTextPage] = useState("all");
  const data = audit.data;
  const page = data?.pages.find((p) => p.id === pageId) || data?.pages[0];
  const layout = data?.layout.filter((b) => b.page === page?.page) || [];
  const textPages = [
    ...new Set(data?.exact_text.map((b) => (b.page === null ? "unpaginated" : String(b.page)))),
  ];
  return (
    <section
      aria-label="Resume processing audit"
      className="my-6 min-w-0 space-y-4 rounded-2xl border border-blue-400/20 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow !text-[9px] text-blue-400">Processing audit</p>
          <h3 className="mt-2 font-display text-xl">Follow the evidence</h3>
        </div>
        <p className="text-[10px] text-muted-foreground">
          {friendly(data?.status || state.status)}
          {data?.duration_ms != null && ` · ${(data.duration_ms / 1000).toFixed(1)}s`}
        </p>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Inspect each step before applying the draft. Blue marks layout, purple marks OCR, green
        marks source support, and amber marks unresolved evidence. Source support still requires
        your confirmation.
      </p>
      {data && data.pipeline_version !== "connected-evidence-4" && !running && (
        <p className="text-xs text-amber-400">
          This saved audit uses an older extraction pipeline. Reprocess this document to apply the
          connected representation and validation pipeline.
        </p>
      )}
      {audit.isPending && (
        <p role="status" className="text-xs">
          Loading audit evidence…
        </p>
      )}
      {audit.isError && <ErrorNotice error={audit.error} retry={() => void audit.refetch()} />}
      {data && (
        <div className="space-y-3">
          <div className="rounded-lg border border-border p-4 text-xs">
            <label>
              Inspect extraction version
              <select
                className="mt-2 w-full rounded-lg border border-border bg-background p-2"
                value={selectedRun || state.id}
                onChange={(e) => setSelectedRun(e.target.value === state.id ? "" : e.target.value)}
              >
                {history.data?.map((r) => (
                  <option key={r.id} value={r.id}>
                    Version {r.run_version} · {r.status}
                    {r.id === state.id ? " · latest" : " · historical snapshot"}
                  </option>
                ))}
              </select>
            </label>
            {selectedRun && selectedRun !== state.id && (
              <p className="mt-2 text-amber-400">
                You are inspecting a historical snapshot. The editable draft below belongs to the
                latest extraction.
              </p>
            )}
          </div>
          <Step title="1. File and quality check" open>
            <button
              type="button"
              className="text-accent underline"
              onClick={() =>
                void api
                  .originalDocument(documentId)
                  .then((blob) => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = blob.type.includes("pdf")
                      ? "original-resume.pdf"
                      : blob.type.includes("word")
                        ? "original-resume.docx"
                        : "original-resume.txt";
                    link.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                  })
                  .catch(setOriginalError)
              }
            >
              Download original uploaded file
            </button>
            {!!originalError && <ErrorNotice error={originalError} />}

            {data.quality.classification ? (
              <>
                <p className="text-foreground">
                  {friendly(data.quality.classification)} · {data.quality.page_count ?? "Unknown"}{" "}
                  pages
                </p>
                <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {Object.entries({
                    "Selectable text": data.quality.selectable_text,
                    "Likely scanned": data.quality.likely_scanned,
                    Columns: data.quality.columns,
                    "Tables detected": data.quality.tables_detected,
                    "OCR recommended": data.quality.ocr_recommended,
                    "Vision recommended": data.quality.vision_recommended,
                  }).map(([key, value]) => (
                    <div key={key}>
                      <dt className="inline">{key}: </dt>
                      <dd className="inline text-foreground">
                        {typeof value === "boolean"
                          ? value
                            ? "Yes"
                            : "No"
                          : friendly(String(value ?? "Unknown"))}
                      </dd>
                    </div>
                  ))}
                </dl>
                {data.quality.limitations?.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </>
            ) : (
              <p>Quality results will appear after local document analysis.</p>
            )}
            <p>
              External text consent: {data.consent.text ? "allowed for this run" : "not selected"}.
              Page image consent: {data.consent.images ? "allowed for this run" : "not selected"}.
            </p>
          </Step>
          <Step title={`2. Extracted exact text · ${data.exact_text.length} blocks`}>
            <label className="career-field">
              <span>Exact text page</span>
              <select value={textPage} onChange={(e) => setTextPage(e.target.value)}>
                <option value="all">All pages / paragraphs</option>
                {textPages.map((p) => (
                  <option key={p} value={p}>
                    {p === "unpaginated" ? "Original paragraphs · page unknown" : `Page ${p}`}
                  </option>
                ))}
              </select>
            </label>
            <p>
              Original parser order is preserved. DOCX paragraph locations are separate from
              converted page geometry.
            </p>
            <div className="max-h-96 space-y-2 overflow-auto">
              {data.exact_text
                .filter(
                  (b) =>
                    textPage === "all" ||
                    (b.page === null ? "unpaginated" : String(b.page)) === textPage,
                )
                .map((b) => (
                  <div key={b.block_id} className="rounded-lg border border-border p-3">
                    <p className="mb-1 text-[10px]">
                      Block {b.block_id}
                      {b.page && ` · Page ${b.page}`}
                      {b.paragraph && ` · Paragraph ${b.paragraph}`}
                      {b.metadata?.source_engine && ` · ${b.metadata.source_engine}`}
                      {b.metadata?.source_kind === "link_destination" && " · PDF link destination"}
                    </p>
                    <pre className="whitespace-pre-wrap break-words font-sans text-xs text-foreground">
                      {b.text || "(blank paragraph)"}
                    </pre>
                  </div>
                ))}
            </div>
            {!data.exact_text.length && (
              <p>No selectable text was recovered. Check OCR and warnings.</p>
            )}
          </Step>
          <Step title={`3. Page previews and layout · ${data.pages.length} pages`}>
            {page ? (
              <>
                <label className="career-field">
                  <span>Preview page</span>
                  <select value={page.id} onChange={(e) => setPageId(e.target.value)}>
                    {data.pages.map((p) => (
                      <option key={p.id} value={p.id}>
                        Page {p.page}
                      </option>
                    ))}
                  </select>
                </label>
                <Preview key={page.id} documentId={documentId} page={page} layout={layout} />
              </>
            ) : (
              <p>
                No rendered previews. TXT has no page layout. DOCX conversion and PDF rendering
                limitations appear in warnings.
              </p>
            )}
            <p className="text-blue-400">
              {data.layout.filter((b) => b.method === "vision").length
                ? "Includes CrewAI visual analysis."
                : "Local text geometry only; visual AI was not completed."}
            </p>
            <div className="max-h-80 space-y-2 overflow-auto">
              {layout.map((b) => (
                <details
                  key={`${b.method}-${b.id}`}
                  className="rounded-lg border border-blue-400/25 p-3"
                >
                  <summary className="cursor-pointer">
                    {b.section || b.block_type} · {b.method} ·{" "}
                    {b.status === "supported" ? "source supported" : "needs review"}
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap break-words text-foreground">
                    {b.raw_text}
                  </p>
                  <p className="mt-2">
                    Block {b.id} · Reading order {b.reading_order} · Model/heuristic score{" "}
                    {Math.round(b.confidence * 100)}% (uncalibrated)
                  </p>
                  <p>
                    Source IDs: {b.source_block_ids.join(", ") || "unresolved"}. Related:{" "}
                    {b.related_block_ids.join(", ") || "none"}.
                  </p>
                  {b.warnings.map((w) => (
                    <p key={w} className="mt-2 text-amber-400">
                      {w}
                    </p>
                  ))}
                </details>
              ))}
            </div>
          </Step>
          <Step title={`4. OCR output · ${data.ocr.length} blocks`}>
            <p className="text-purple-400">
              OCR is local and runs on pages with missing or sparse native text, or substantial
              image content. OCR confidence measures recognition, not factual correctness.
            </p>
            {data.quality.pages?.map((result) => (
              <div key={result.page} className="rounded-lg border border-purple-400/20 p-3">
                <p className="text-foreground">
                  Page {result.page} · OCR{" "}
                  {friendly(
                    result.ocr_status ||
                      (result.ocr_recommended ? "status_unknown" : "not_required"),
                  )}
                </p>
                <p className="mt-1">
                  {result.selectable_characters} native characters ·{" "}
                  {result.ocr_blocks ?? data.ocr.filter((b) => b.page === result.page).length} OCR
                  blocks
                </p>
                <p className="mt-1">
                  {result.ocr_reason ||
                    (result.ocr_recommended
                      ? "This older run did not record an OCR outcome. Check its warnings or reprocess."
                      : "Readable native text was found. OCR was not needed.")}
                </p>
              </div>
            ))}
            {data.ocr.length ? (
              <div className="max-h-96 space-y-2 overflow-auto">
                {data.ocr.map((b) => (
                  <div key={b.block_id} className="rounded-lg border border-purple-400/30 p-3">
                    <p>
                      Page {b.page} · Block {b.block_id} · Recognition{" "}
                      {Math.round(b.confidence * 100)}%
                    </p>
                    <p className="mt-2 whitespace-pre-wrap break-words text-foreground">{b.text}</p>
                    {b.warnings.map((w) => (
                      <p key={w} className="mt-2 text-amber-400">
                        {w}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p>
                {(
                  data.quality.pages?.length
                    ? data.quality.pages.every((p) => !p.ocr_recommended)
                    : data.quality.selectable_text
                )
                  ? "OCR was not required. Use step 2 to inspect the extracted native text."
                  : "No OCR blocks were recovered. Review the per-page outcomes and warnings."}
              </p>
            )}
          </Step>
          <Step title="5. CrewAI agent activity and models">
            {state.agent_run && data.id === state.id && (
              <p>
                Current task: {friendly(state.agent_run.task)} · {friendly(state.agent_run.status)}
              </p>
            )}
            {data.agents.map((agent, index) => (
              <div key={`${agent.name}-${index}`} className="rounded-lg border border-border p-3">
                <p className="text-foreground">
                  {friendly(agent.name)} · {friendly(agent.status)}
                </p>
                <p className="mt-1 break-words">
                  {agent.model || "Local / no model"} · {agent.method}
                </p>
                {resultSummary(agent) && <p className="mt-2">{resultSummary(agent)}</p>}
                {agent.error_code && (
                  <p className="mt-2 text-amber-400">{friendly(agent.error_code)}</p>
                )}
                {agent.warnings.map((w) => (
                  <p key={w} className="mt-2">
                    {w}
                  </p>
                ))}
                {Object.keys(agent.result).length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer">
                      Inspect intermediate task result (unverified)
                    </summary>
                    {codeView(agent.result)}
                  </details>
                )}
              </div>
            ))}
            {!data.agents.length && (
              <p>
                Agent results appear as processing completes. Local-only runs use no external model;
                canonical Flow tasks are listed separately.
              </p>
            )}
          </Step>
          <CanonicalAudit data={data} />
          <Step title="Compare extraction versions">
            <label>
              Compare previous version with latest
              <select
                className="mt-2 w-full rounded-lg border border-border bg-background p-2"
                value={compareRun}
                onChange={(e) => setCompareRun(e.target.value)}
              >
                <option value="">Choose a previous extraction</option>
                {history.data
                  ?.filter((r) => r.id !== state.id)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      Version {r.run_version} · {r.status}
                    </option>
                  ))}
              </select>
            </label>
            {comparison.isFetching && <p role="status">Comparing saved draft values…</p>}
            {comparison.isError && <ErrorNotice error={comparison.error} />}
            {comparison.data && (
              <>
                <p>
                  Version {comparison.data.left_version} → {comparison.data.right_version}:{" "}
                  {comparison.data.differences.length} changed fields. No profile changes were made.
                </p>
                <div className="max-h-80 space-y-3 overflow-auto">
                  {comparison.data.differences.map((d) => (
                    <div key={d.field} className="rounded-lg border border-border p-3">
                      <p className="text-foreground">
                        {d.field} · {d.change}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap break-words">
                        Before: {d.before ?? "not present"}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap break-words">
                        After: {d.after ?? "not present"}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
            {!history.data?.some((r) => r.id !== state.id) && (
              <p>Reprocess to create a second extraction version for comparison.</p>
            )}
          </Step>
          <Step title="6. Structured draft and field evidence">
            <p>
              The editable draft and section choices appear below this audit. Every correction is
              labeled separately from source extraction.
            </p>
            {data.draft && (
              <>
                <p>
                  Unresolved sections: {data.draft.unresolved_fields.join(", ") || "none detected"}.
                </p>
                <div className="max-h-96 space-y-2 overflow-auto">
                  {data.draft.evidence.map((proof) => (
                    <details
                      key={proof.field}
                      className={`rounded-lg border p-3 ${proof.status === "supported" ? "border-emerald-400/25" : "border-amber-400/30"}`}
                    >
                      <summary className="cursor-pointer break-words">
                        {proof.field}: {proof.value} ·{" "}
                        <span
                          className={
                            proof.status === "supported" ? "text-emerald-400" : "text-amber-400"
                          }
                        >
                          {friendly(proof.status)}
                        </span>
                      </summary>
                      <p className="mt-2 whitespace-pre-wrap break-words">
                        {proof.source_text || "Candidate correction / no source quote."}
                      </p>
                      <p className="mt-2">
                        {proof.page && `Page ${proof.page} · `}Blocks{" "}
                        {proof.source_block_ids.join(", ") || "none"} ·{" "}
                        {proof.extraction_methods.join(" + ") || "candidate/legacy"} ·{" "}
                        {proof.confidence.label} confidence
                      </p>
                      <p>{proof.confidence.basis}</p>
                      {proof.alternatives.length > 0 && (
                        <>
                          <p className="mt-2 text-amber-400">
                            Conflicting readings — compare and edit before confirming:
                          </p>
                          {codeView(proof.alternatives)}
                        </>
                      )}
                    </details>
                  ))}
                </div>
                {data.draft.other_sections.map((s, i) => (
                  <details key={i}>
                    <summary className="cursor-pointer">Additional section: {s.heading}</summary>
                    <p className="mt-2 whitespace-pre-wrap break-words">{s.text}</p>
                    <p>Source blocks: {s.source_block_ids.join(", ")}</p>
                  </details>
                ))}
              </>
            )}
          </Step>
          <Step title={`7. Validation warnings · ${data.warnings.length}`}>
            {data.warnings.length ? (
              <div className="max-h-96 space-y-2 overflow-auto">
                {data.warnings.map((w, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border p-3 ${w.severity === "failure" ? "border-red-400/30 text-red-400" : "border-amber-400/25 text-amber-400"}`}
                  >
                    <p>
                      {w.field && `${w.field}: `}
                      {w.message}
                    </p>
                    {w.sources.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer">Compare source readings</summary>
                        {codeView(w.sources)}
                      </details>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No warnings recorded yet. This does not verify the draft.</p>
            )}
          </Step>
          <Step title="8. Final confirmation">
            <p>
              Review decision:{" "}
              <span className="text-foreground">{friendly(data.review.action)}</span> · revision{" "}
              {data.review.revision}.
            </p>
            <p>
              Use the editable sections below, save corrections, select the sections to apply, and
              confirm their accuracy. Only the existing confirmation action updates your profile.
            </p>
            {data.review.fields.length > 0 && (
              <p>Confirmed sections: {data.review.fields.join(", ")}</p>
            )}
            {state.status === "awaiting_review" && data.id === state.id && (
              <a
                href="#resume-confirmation"
                className="inline-block text-accent underline underline-offset-4"
              >
                Go to confirmation controls
              </a>
            )}
          </Step>
        </div>
      )}
    </section>
  );
}
