import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import type {
  ResumeEdits,
  ResumeEntry,
  ResumeSection,
} from "@/services/api/resume-tailoring-types";
import { PageHeading, Panel, ErrorNotice } from "./shared";
import { PrivateDocumentPreview } from "./PrivateDocumentPreview";

const input = "mt-2 w-full rounded-xl border border-border bg-background p-3 text-sm";
const button =
  "rounded-xl border border-accent/30 bg-primary/30 px-4 py-3 text-sm disabled:opacity-40";
const human = (value: string) => value.replaceAll("_", " ");
const sections: ResumeSection[] = [
  "summary",
  "experience",
  "projects",
  "skills",
  "education",
  "certifications",
  "achievements",
  "publications",
];
const views = [
  "Job requirements",
  "Tailoring plan",
  "Content review",
  "Change comparison",
  "PDF preview",
  "Validation results",
  "Application attachment",
] as const;
type View = (typeof views)[number];

function Entry({ entry }: { entry: ResumeEntry }) {
  return (
    <article className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap justify-between gap-2">
        <h3 className="font-medium">{entry.title}</h3>
        <span className="text-sm text-muted-foreground">{entry.period}</span>
      </div>
      {entry.subtitle && <p className="mt-1 text-sm">{entry.subtitle}</p>}
      {entry.location && <p className="mt-1 text-xs text-muted-foreground">{entry.location}</p>}
      {entry.grade && <p className="mt-2 text-sm">Grade / CGPA: {entry.grade}</p>}
      {entry.bullets.map((b) => (
        <p className="mt-2 text-sm leading-6" key={b.id}>
          {b.text}
        </p>
      ))}
      {!!entry.technologies.length && (
        <p className="mt-2 text-xs text-muted-foreground">
          Technologies: {entry.technologies.join(", ")}
        </p>
      )}
      {entry.links.map((v) => (
        <a
          key={v.url}
          href={v.url}
          target="_blank"
          rel="noreferrer"
          className="mr-3 mt-2 inline-block text-sm text-accent underline"
        >
          {v.label}
        </a>
      ))}
    </article>
  );
}

export function ResumeTailoringPage({ application: initial }: { application?: string }) {
  const cache = useQueryClient();
  const [application, setApplication] = useState(initial || "");
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState("");
  const [template, setTemplate] = useState("supplied-navy-v1");
  const [mode, setMode] = useState("confirmed_profile");
  const [source, setSource] = useState("");
  const [useAI, setUseAI] = useState(false);
  const [section, setSection] = useState("all");
  const [view, setView] = useState<View>("Job requirements");
  const [editing, setEditing] = useState(false);
  const [edits, setEdits] = useState<ResumeEdits>({});
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState("");
  const readiness = useQuery({
    queryKey: ["tailoring-readiness"],
    queryFn: api.tailoringReadiness,
  });
  const apps = useQuery({
    queryKey: ["tailoring-applications", page],
    queryFn: () => api.applications(page),
  });
  const app = useQuery({
    queryKey: ["tailoring-application", application],
    queryFn: () => api.application(application),
    enabled: !!application,
  });
  const versions = useQuery({
    queryKey: ["tailored-versions", application],
    queryFn: () => api.tailoredResumes(application),
    enabled: !!application,
  });
  const current = useQuery({
    queryKey: ["tailored-resume", version],
    queryFn: () => api.tailoredResume(version),
    enabled: !!version,
    refetchInterval: (q) => (q.state.data?.operation_active ? 1000 : false),
  });
  const resume = current.data;
  const draft = resume?.data.draft;
  const locked = busy || !!resume?.operation_active;
  useEffect(() => {
    setEditing(false);
    setEdits({});
    setReviewed(false);
  }, [version]);
  useEffect(() => {
    if (resume && !resume.operation_active) {
      void cache.invalidateQueries({ queryKey: ["tailored-versions", resume.application_id] });
      void cache.invalidateQueries({ queryKey: ["tailoring-application", resume.application_id] });
    }
    // Refresh once per state transition rather than for every poll object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume?.status, resume?.operation_active, resume?.application_id, cache]);
  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setNotice("");
    try {
      await work();
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["tailored-versions", application] }),
        cache.invalidateQueries({ queryKey: ["tailoring-application", application] }),
        cache.invalidateQueries({ queryKey: ["application"] }),
      ]);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  const generate = () =>
    run(async () => {
      const latest = await api.application(application);
      const row = await api.startResumeTailoring(application, {
        expected_application_revision: latest.revision,
        template,
        input_mode: mode,
        ...(source ? { source_document_id: source } : {}),
        use_ai: useAI,
        allow_external_processing: useAI,
        ...(resume ? { base_version_id: resume.id } : {}),
        regenerate_section: section,
        edits: editing ? edits : {},
      });
      cache.setQueryData(["tailored-resume", row.id], row);
      setVersion(row.id);
      setView("Content review");
      setNotice(
        "A separate tailored version has started. Original documents and profile remain unchanged.",
      );
    });
  const action = (kind: "compile" | "approve" | "attach" | "cancel") =>
    run(async () => {
      if (!resume) return;
      const latest = await api.application(application);
      const row = await api.tailoredResumeAction(resume.id, {
        action: kind,
        expected_revision: resume.revision,
        expected_application_revision: latest.revision,
        reviewed,
      });
      cache.setQueryData(["tailored-resume", row.id], row);
      setReviewed(false);
      setNotice(
        kind === "attach"
          ? "Approved tailored resume attached to this application. The original resume is preserved and the application is not submitted."
          : kind === "approve"
            ? "This exact one-page PDF is approved. You can now attach it."
            : "Resume state updated.",
      );
    });
  const download = (kind: "pdf" | "source" | "class" | "compile-log") =>
    run(async () => {
      if (!resume) return;
      const blob = await api.tailoredResumeArtifact(resume.id, kind);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download =
        kind === "class"
          ? "resume.cls"
          : `tailored-resume-v${resume.version}.${kind === "pdf" ? "pdf" : kind === "source" ? "tex" : "log"}`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  const selectedIDs = edits.entry_ids || draft?.entries.map((e) => e.id) || [];
  const relevance = resume?.data.catalog?.relevance_plan;
  const reorder = (id: string, direction: number) => {
    const ids = [...selectedIDs];
    const i = ids.indexOf(id);
    const j = i + direction;
    if (i >= 0 && j >= 0 && j < ids.length) {
      [ids[i], ids[j]] = [ids[j]!, ids[i]!];
      setEdits({ ...edits, entry_ids: ids });
    }
  };
  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Career toolkit"
        title="Your experience, focused for the role."
        description="Create a separate one-page resume using the supplied navy template and your confirmed facts. Review every change before approval."
      />
      {(error || readiness.error || apps.error || app.error || versions.error || current.error) && (
        <ErrorNotice
          error={
            error || readiness.error || apps.error || app.error || versions.error || current.error
          }
          retry={() => {
            setError(null);
            void readiness.refetch();
            void apps.refetch();
            if (application) {
              void app.refetch();
              void versions.refetch();
            }
            if (version) void current.refetch();
          }}
        />
      )}
      {notice && (
        <p role="status" className="rounded-xl border border-accent/30 p-4 text-sm">
          {notice}
        </p>
      )}
      <Panel>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            Selected application
            <select
              aria-label="Selected application"
              className={input}
              disabled={locked}
              value={application}
              onChange={(e) => {
                setApplication(e.target.value);
                setVersion("");
              }}
            >
              <option value="">Choose an application/job</option>
              {app.data && !apps.data?.items.some((a) => a.id === app.data.id) && (
                <option value={app.data.id}>
                  {app.data.job.title} · {app.data.job.company}
                </option>
              )}
              {apps.data?.items.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.job.title} · {a.job.company}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Version history
            <select
              aria-label="Version history"
              className={input}
              disabled={locked}
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            >
              <option value="">New tailored resume</option>
              {versions.data?.map((r) => (
                <option key={r.id} value={r.id}>
                  Version {r.version} · {human(r.status)} ·{" "}
                  {new Date(r.created_at).toLocaleString()}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Template
            <select
              aria-label="Template"
              className={input}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            >
              {(
                readiness.data?.templates || [
                  { id: "supplied-navy-v1", label: "Supplied navy resume.cls template" },
                ]
              ).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Input mode
            <select
              aria-label="Input mode"
              className={input}
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                setSource("");
              }}
            >
              <option value="confirmed_profile">Confirmed structured profile</option>
              <option value="processed_pdf">Previously processed and confirmed PDF</option>
              <option value="latex_source">LaTeX source with confirmed profile</option>
              <option value="template_profile">Template and confirmed profile data</option>
            </select>
          </label>
        </div>
        {apps.data && apps.data.total > apps.data.page_size && (
          <div className="mt-3 flex gap-3">
            <button
              className={button}
              disabled={page === 1 || locked}
              onClick={() => setPage(page - 1)}
            >
              Previous applications
            </button>
            <button
              className={button}
              disabled={page * apps.data.page_size >= apps.data.total || locked}
              onClick={() => setPage(page + 1)}
            >
              More applications
            </button>
          </div>
        )}
        {(mode === "latex_source" || mode === "processed_pdf") && (
          <div className="mt-4">
            <label className="text-sm">
              Source document
              <select
                aria-label="Source document"
                className={input}
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <option value="">Select a source</option>
                {readiness.data?.sources
                  .filter((s) =>
                    mode === "latex_source"
                      ? s.content_type === "text/x-tex"
                      : s.content_type === "application/pdf",
                  )
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.filename}
                    </option>
                  ))}
              </select>
            </label>
            {mode === "latex_source" && (
              <label className="mt-3 block text-sm">
                Upload LaTeX reference
                <input
                  aria-label="Upload LaTeX reference"
                  className={input}
                  type="file"
                  accept=".tex,text/plain,text/x-tex"
                  disabled={locked}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file)
                      void run(async () => {
                        const doc = await api.uploadResumeSource(file);
                        setSource(doc.id);
                        await readiness.refetch();
                        setNotice(
                          "Source stored unchanged as a passive reference. Confirm any missing facts in your profile before tailoring.",
                        );
                      });
                  }}
                />
              </label>
            )}
            <p className="mt-3 text-xs text-muted-foreground">{readiness.data?.source_policy}</p>
          </div>
        )}
        {app.data && (
          <div className="mt-5 rounded-xl border border-border p-4">
            <h2 className="font-display text-2xl">{app.data.job.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {app.data.job.company} · {app.data.job.location}
            </p>
            <p className="mt-2 text-xs">
              {app.data.is_demo ? "Synthetic job listing" : "Selected application source"} ·
              Confirmed profile revision {resume?.profile_revision || app.data.profile_revision}
            </p>
          </div>
        )}
        {!readiness.data?.profile_ready && (
          <Link to="/profile" className="mt-4 block text-sm text-accent underline">
            Confirm your profile before tailoring
          </Link>
        )}
        <label className="mt-5 flex gap-3 text-sm">
          <input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} />
          Use three CrewAI agents with Groq. I allow selected confirmed education, experience,
          projects, skills and job context to be processed for this version. Contact details and
          uploaded source files stay local.
        </label>
        <p className="mt-2 text-xs text-muted-foreground">
          Without this choice, the local source selector is clearly labelled. Missing requirements
          are never added as candidate skills.
        </p>
        <div className="mt-5 flex flex-wrap items-end gap-3">
          {resume && (
            <label className="text-sm">
              Regenerate section
              <select
                aria-label="Regenerate section"
                className={input}
                value={section}
                onChange={(e) => setSection(e.target.value)}
              >
                <option value="all">Full resume</option>
                {sections.map((s) => (
                  <option key={s} value={s}>
                    {human(s)}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            className={button}
            disabled={
              !application ||
              !readiness.data?.profile_ready ||
              locked ||
              ((mode === "latex_source" || mode === "processed_pdf") && !source)
            }
            onClick={() => void generate()}
          >
            {editing
              ? "Save edits as new version"
              : resume
                ? "Create another tailored version"
                : "Tailor resume"}
          </button>
          {resume?.operation_active && (
            <button className={button} onClick={() => void action("cancel")}>
              Cancel tailoring
            </button>
          )}
        </div>
      </Panel>
      {resume && (
        <Panel>
          <p aria-label="Tailored resume state" className="text-sm">
            Version {resume.version} · {human(resume.status)}
          </p>
          <p role="status" className="mt-2 text-sm">
            {resume.stage}
          </p>
          {resume.data.catalog && !resume.data.catalog.content_policy_version && (
            <p className="mt-3 text-sm">
              This saved version predates the complete-profile checks. Create another tailored
              version to include the updated content and relevance analysis.
            </p>
          )}
          {resume.error_code && (
            <p role="alert" className="mt-3 text-sm">
              {resume.error_code === "resume_insufficient_space"
                ? "Important content could not fit on one readable page after three attempts. Your internships, projects and skills were preserved. Review the long source bullets before creating another version."
                : `${human(resume.error_code)}. Review the validation/compilation details, then create a corrected version or retry compilation.`}
            </p>
          )}
          {relevance && (
            <div
              className="mt-4 rounded-xl border border-border p-4 text-sm"
              aria-label="Relevance analysis status"
            >
              <p>{relevance.message}</p>
              {relevance.limitation && (
                <p className="mt-2 text-muted-foreground">{relevance.limitation}</p>
              )}
              {relevance.review_recommended && <p className="mt-2">Review recommended.</p>}
              <p className="mt-2">
                Relevance determines emphasis. Confirmed internships, projects and skills are
                preserved.
              </p>
            </div>
          )}
          {resume.data.report?.warnings.map((w) => (
            <p className="mt-3 text-sm text-amber-300" key={w}>
              {w}
            </p>
          ))}
          {resume.data.provider?.status === "fallback" && (
            <p className="mt-3 text-sm text-amber-300">
              CrewAI generation was unavailable or rejected. Local source selection is active; no
              unsupported model output was accepted.
            </p>
          )}
          {resume.data.validation?.issues.map((v, i) => (
            <p role="alert" className="mt-3 text-sm" key={i}>
              {v.field}: {v.reason}
            </p>
          ))}
        </Panel>
      )}
      <div className="flex flex-wrap gap-2" aria-label="Tailoring views">
        {views.map((name) => (
          <button
            className={button}
            key={name}
            aria-pressed={view === name}
            onClick={() => setView(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <Panel>
        {view === "Job requirements" && (
          <>
            <h2 className="font-display text-2xl">Job requirements</h2>
            <p className="mt-3 text-sm">
              Required:{" "}
              {(resume?.data.catalog?.requirements || app.data?.job.required_skills || []).join(
                ", ",
              ) || "Not supplied"}
            </p>
            <p className="mt-3 text-sm">
              Preferred:{" "}
              {(
                resume?.data.catalog?.preferred_requirements ||
                app.data?.job.preferred_skills ||
                []
              ).join(", ") || "Not supplied"}
            </p>
            {app.data?.job.responsibilities?.map((r) => (
              <p key={r} className="mt-2 text-sm leading-6">
                {r}
              </p>
            ))}
            {resume?.data.catalog && (
              <div className="mt-4 space-y-4 text-sm">
                <p>
                  Matching score:{" "}
                  {resume.data.context.matching?.hybrid_score ?? "Not available for this snapshot"}
                </p>
                <p>
                  Matched skills:{" "}
                  {resume.data.context.matching?.matched_required?.join(", ") ||
                    relevance?.required
                      .filter((r) => r.status === "supported")
                      .map((r) => r.skill)
                      .join(", ") ||
                    "No supported required skills found"}
                </p>
                <p>
                  Missing skill evidence:{" "}
                  {resume.data.context.matching?.missing_required?.join(", ") ||
                    relevance?.required
                      .filter((r) => r.status === "missing_evidence")
                      .map((r) => r.skill)
                      .join(", ") ||
                    "No missing required skill evidence found"}
                </p>
                <p>
                  Skill-gap context:{" "}
                  {resume.data.context.skill_gaps?.gaps?.map((g) => g.skill).join(", ") ||
                    "Computed from job requirements and confirmed profile for this version"}
                </p>
              </div>
            )}
          </>
        )}
        {view === "Tailoring plan" && (
          <>
            <h2 className="font-display text-2xl">Tailoring plan</h2>
            <p className="mt-3 text-sm">
              Keywords addressed:{" "}
              {resume?.data.report?.keywords_addressed.join(", ") ||
                "No confirmed exact skill keywords selected yet"}
            </p>
            <h3 className="mt-5 text-sm font-medium">Preserved content</h3>
            {Object.entries(resume?.data.report?.coverage || {})
              .filter(([, value]) => value.available > 0)
              .map(([section, value]) => (
                <p key={section} className="mt-2 text-sm capitalize">
                  {human(section)}: {value.preserved} of {value.available} preserved
                </p>
              ))}
            <div className="mt-5 space-y-3">
              {resume?.data.report?.selected.map((v) => (
                <article key={v.id} className="rounded-xl border border-border p-4">
                  <h3 className="text-sm font-medium">
                    {v.title} · {human(v.section)}
                  </h3>
                  <p className="mt-2 text-sm">{v.reason}</p>
                </article>
              ))}
            </div>
            <details className="mt-5">
              <summary className="cursor-pointer text-sm">Omitted content and reasons</summary>
              {resume?.data.report?.omitted.map((v) => (
                <p key={v.id} className="mt-3 text-sm">
                  {v.title}: {v.reason}
                </p>
              ))}
              {!resume?.data.report?.omitted.length && (
                <p className="mt-3 text-sm">No complete profile entries omitted.</p>
              )}
              {resume?.data.report?.bullet_omissions?.map((v, i) => (
                <p key={`bullet-${i}`} className="mt-3 text-sm">
                  {v.original} — {v.reason}
                </p>
              ))}
              {resume?.data.report?.condensed?.map((v, i) => (
                <p key={`condensed-${i}`} className="mt-3 text-sm">
                  {v.before} → {v.after} {v.reason}
                </p>
              ))}
              {resume?.data.report?.title_condensation?.map((v, i) => (
                <p key={`title-${i}`} className="mt-3 text-sm">
                  {v.before} → {v.after} {v.reason}
                </p>
              ))}
            </details>
          </>
        )}
        {view === "Content review" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl">Review tailored content</h2>
              {draft && (
                <button
                  className={button}
                  disabled={locked}
                  onClick={() => {
                    setEditing(!editing);
                    setReviewed(false);
                    setEdits({});
                  }}
                >
                  {editing ? "Discard unsaved edits" : "Edit sections"}
                </button>
              )}
            </div>
            {draft ? (
              <div className="mt-5 space-y-6">
                <div>
                  <h3 className="text-lg font-medium">{draft.name}</h3>
                  <p className="mt-2 text-sm">
                    {[draft.location, draft.email, draft.phone].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {editing ? (
                  <div>
                    <label className="text-sm">
                      Summary wording
                      <select
                        aria-label="Summary wording"
                        className={input}
                        value={edits.summary || draft.summary}
                        onChange={(e) => setEdits({ ...edits, summary: e.target.value })}
                      >
                        {resume?.data.catalog?.summaries.map((s) => (
                          <option key={s.id} value={s.text}>
                            {s.id === "focused"
                              ? "Focused job-specific summary"
                              : "Concise summary"}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="mt-3 block text-sm">
                      Edit summary
                      <textarea
                        aria-label="Edit summary"
                        className={`${input} min-h-24`}
                        value={edits.summary ?? draft.summary}
                        onChange={(e) => setEdits({ ...edits, summary: e.target.value })}
                      />
                    </label>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Wording must match a supported source-backed variant. Unsupported new claims
                      are rejected; confirm new facts in your profile first.
                    </p>
                    <h3 className="mt-5 text-sm font-medium">Selected entries and order</h3>
                    {[...(resume?.data.catalog?.entries || [])]
                      .sort((a, b) => {
                        const ai = selectedIDs.indexOf(a.id),
                          bi = selectedIDs.indexOf(b.id);
                        return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
                      })
                      .map((e) => (
                        <div key={e.id} className="mt-3 rounded-xl border border-border p-3">
                          <label className="flex gap-3 text-sm">
                            <input
                              aria-label={`Include ${e.title}`}
                              type="checkbox"
                              checked={selectedIDs.includes(e.id)}
                              disabled={resume?.data.catalog?.protected_ids?.includes(e.id)}
                              onChange={(ev) =>
                                setEdits({
                                  ...edits,
                                  entry_ids: ev.target.checked
                                    ? [...selectedIDs, e.id]
                                    : selectedIDs.filter((id) => id !== e.id),
                                })
                              }
                            />
                            {e.title} · {human(e.section)}
                            {resume?.data.catalog?.protected_ids?.includes(e.id) && " · preserved"}
                          </label>
                          {selectedIDs.includes(e.id) && (
                            <div className="mt-3 flex gap-2">
                              <button
                                className={button}
                                onClick={() => reorder(e.id, -1)}
                                aria-label={`Move ${e.title} earlier`}
                              >
                                Move earlier
                              </button>
                              <button
                                className={button}
                                onClick={() => reorder(e.id, 1)}
                                aria-label={`Move ${e.title} later`}
                              >
                                Move later
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    <h3 className="mt-5 text-sm font-medium">Section order</h3>
                    {(edits.section_order || draft.section_order).map((name, index, list) => (
                      <div key={name} className="mt-2 flex items-center gap-3 text-sm">
                        <span className="min-w-28 capitalize">{human(name)}</span>
                        <button
                          className={button}
                          disabled={index === 0}
                          aria-label={`Move ${name} section earlier`}
                          onClick={() => {
                            const order = [...list];
                            [order[index - 1], order[index]] = [order[index]!, order[index - 1]!];
                            setEdits({ ...edits, section_order: order });
                          }}
                        >
                          Earlier
                        </button>
                        <button
                          className={button}
                          disabled={index === list.length - 1}
                          aria-label={`Move ${name} section later`}
                          onClick={() => {
                            const order = [...list];
                            [order[index + 1], order[index]] = [order[index]!, order[index + 1]!];
                            setEdits({ ...edits, section_order: order });
                          }}
                        >
                          Later
                        </button>
                      </div>
                    ))}
                    <h3 className="mt-5 text-sm font-medium">Source-backed bullets</h3>
                    {draft.entries.flatMap((e) =>
                      e.bullets.map((b) => (
                        <label className="mt-3 block text-sm" key={b.id}>
                          {e.title}
                          <textarea
                            aria-label={`Edit bullet ${b.id}`}
                            className={input}
                            value={edits.bullet_text?.[b.id] ?? b.text}
                            onChange={(ev) =>
                              setEdits({
                                ...edits,
                                bullet_text: { ...edits.bullet_text, [b.id]: ev.target.value },
                              })
                            }
                          />
                          <span className="text-xs text-muted-foreground">
                            Use original source wording or a supported clarity variant; dates,
                            numbers and facts cannot change.
                          </span>
                        </label>
                      )),
                    )}
                    <p className="mt-5 text-sm text-amber-300">
                      Unsaved edits are not in the PDF. Save as a new version, then review its
                      validation and preview.
                    </p>
                  </div>
                ) : (
                  <>
                    <section>
                      <h3 className="mb-2 text-sm font-medium">Professional Summary</h3>
                      <p className="text-sm leading-7">{draft.summary}</p>
                    </section>
                    {draft.section_order
                      .filter((s) => s !== "summary")
                      .map((s) => {
                        const entries = draft.entries.filter((e) => e.section === s);
                        return entries.length ? (
                          <section key={s} className="space-y-3">
                            <h3 className="text-sm font-medium capitalize">{human(s)}</h3>
                            {s === "skills"
                              ? [...new Set(entries.map((e) => e.skill_group))].map((group) => (
                                  <p key={group} className="text-sm leading-6">
                                    <strong>{group}:</strong>{" "}
                                    {entries
                                      .filter((e) => e.skill_group === group)
                                      .map((e) => e.title)
                                      .join(", ")}
                                  </p>
                                ))
                              : entries.map((e) => <Entry key={e.id} entry={e} />)}
                          </section>
                        ) : null;
                      })}
                  </>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm">
                A structured draft will appear here after tailoring starts.
              </p>
            )}
          </>
        )}
        {view === "Change comparison" && (
          <>
            <h2 className="font-display text-2xl">
              Original confirmed content and tailored version
            </h2>
            <p className="mt-3 text-sm">
              The complete profile and original uploaded resume remain unchanged. This comparison
              shows selected wording, ordering and omissions.
            </p>
            {resume?.data.report?.changes.map((c) => (
              <section className="mt-5 rounded-xl border border-border p-4" key={c.section}>
                <h3 className="text-sm font-medium capitalize">{human(c.section)}</h3>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs text-muted-foreground">Original confirmed content</p>
                    {(Array.isArray(c.before) ? c.before : [c.before || "Not supplied"]).map(
                      (v, i) => (
                        <p key={i} className="text-sm leading-6">
                          {v}
                        </p>
                      ),
                    )}
                  </div>
                  <div>
                    <p className="mb-2 text-xs text-muted-foreground">Tailored version</p>
                    {(Array.isArray(c.after) ? c.after : [c.after]).map((v, i) => (
                      <p key={i} className="text-sm leading-6">
                        {v}
                      </p>
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </>
        )}
        {view === "PDF preview" && (
          <>
            <h2 className="mb-5 font-display text-2xl">One-page PDF preview</h2>
            {resume?.preview_available ? (
              <>
                <PrivateDocumentPreview
                  identity={resume.id + resume.revision}
                  load={() => api.tailoredResumeArtifact(resume.id, "preview")}
                  label="Rendered tailored resume PDF page"
                />
                <div className="mt-5 flex flex-wrap gap-3">
                  <button className={button} disabled={locked} onClick={() => void download("pdf")}>
                    Download tailored PDF
                  </button>
                  <button className={button} onClick={() => void download("source")}>
                    Download LaTeX source
                  </button>
                  <button className={button} onClick={() => void download("class")}>
                    Download resume class
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm">
                The PDF appears only after compilation and one-page validation pass.
              </p>
            )}
          </>
        )}
        {view === "Validation results" && (
          <>
            <h2 className="font-display text-2xl">Validation results</h2>
            <div className="mt-4 space-y-3 text-sm">
              <p>Content: {resume?.data.validation?.valid ? "Passed" : "Pending / failed"}</p>
              <p>
                One-page status:{" "}
                {resume?.data.render?.quality?.page_count === 1
                  ? "Exactly one page"
                  : "Pending / failed"}
              </p>
              <p>
                Selectable text:{" "}
                {resume?.data.render?.quality?.selectable_text ? "Verified" : "Pending"}
              </p>
              <p>
                Embedded fonts:{" "}
                {resume?.data.render?.quality?.fonts_embedded ? "Verified" : "Pending"}
              </p>
              <p>
                Immutable fields:{" "}
                {resume?.data.validation?.immutable_fields_checked
                  ? "Checked against confirmed profile"
                  : "Pending"}
              </p>
              <p>
                {resume?.data.render?.quality?.ats_observations || resume?.data.validation?.ats}
              </p>
              <p>{resume?.data.render?.quality?.balance_observation}</p>
              {resume?.data.render?.quality?.body_font_pt && (
                <p>Body font: {resume.data.render.quality.body_font_pt} pt</p>
              )}
              {resume?.data.render?.quality?.issues.map((issue) => (
                <p key={issue} role="alert">
                  {human(issue)}
                </p>
              ))}
              {resume?.data.render?.corrections?.map((c, i) => (
                <p key={i}>
                  {c.field}: {c.reason}
                </p>
              ))}
            </div>
          </>
        )}
        {view === "Application attachment" && (
          <>
            <h2 className="font-display text-2xl">Review and attach</h2>
            <p className="mt-3 text-sm">
              Review the content comparison, validation and PDF preview first. Approval binds the
              exact bytes to this job and profile revision.
            </p>
            {resume?.status === "needs_review" &&
              resume.data.catalog?.content_policy_version === 2 && (
                <div className="mt-5 space-y-4">
                  <label className="flex gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={reviewed}
                      disabled={editing}
                      onChange={(e) => setReviewed(e.target.checked)}
                    />
                    I reviewed the tailored facts, dates, omissions, links and one-page PDF. I
                    approve this exact resume version.
                  </label>
                  <button
                    className={button}
                    disabled={!reviewed || editing || locked}
                    onClick={() => void action("approve")}
                  >
                    Approve tailored resume
                  </button>
                </div>
              )}
            {resume?.status === "approved" && (
              <button
                className={`${button} mt-5`}
                disabled={locked || editing}
                onClick={() => void action("attach")}
              >
                Attach approved resume to this application
              </button>
            )}
            {resume?.status === "attached" && (
              <p className="mt-5 text-sm">
                Attached to this application. Original documents are preserved. Review the
                application document choices before any external prefill.
              </p>
            )}
            <Link to="/applications" className="mt-5 inline-block text-sm text-accent underline">
              Open application timeline
            </Link>
          </>
        )}
      </Panel>
      {resume && (
        <Panel>
          <details>
            <summary className="cursor-pointer text-sm">Technical and evidence audit</summary>
            <div className="mt-5 space-y-3 text-sm">
              <p>
                Engine: {resume.data.provider?.engine || "Preparing"} · Model:{" "}
                {resume.data.provider?.model || "Local"} ·{" "}
                {human(resume.data.provider?.status || "pending")}
              </p>
              {resume.data.provider?.correction && <p>{resume.data.provider.correction}</p>}
              {resume.data.provider?.agents?.map((a) => (
                <p key={a.name}>
                  {a.name}: {a.status}
                </p>
              ))}
              <p>{resume.data.input_source.authority}</p>
              <details>
                <summary className="cursor-pointer">Original resume evidence</summary>
                {resume.data.original_evidence?.length ? (
                  resume.data.original_evidence.map((item, i) => (
                    <p key={i} className="mt-2">
                      Profile revision {item.profile_revision} · original bytes{" "}
                      {item.original_bytes_verified === true
                        ? "verified unchanged"
                        : "no stored document"}{" "}
                      · fields: {item.applied_fields.join(", ")}. {item.authority}
                    </p>
                  ))
                ) : (
                  <p className="mt-2">
                    Confirmed profile supplied directly; no processed source document evidence
                    available.
                  </p>
                )}
              </details>
              <p>
                Relevance method:{" "}
                {relevance?.method ||
                  "Legacy version; generate a new version for a complete preservation audit."}
              </p>
              <p>Role terms: {relevance?.role_terms.join(", ")}</p>
              <p>
                Matching context: {relevance?.matching_context}; skill-gap context:{" "}
                {relevance?.skill_gap_context}
              </p>
              {resume.data.catalog?.technology_reviews?.map((item, i) => (
                <p key={`tech-${i}`}>
                  {item.entry_id}: {item.technology} — {item.reason}
                </p>
              ))}
              <details>
                <summary className="cursor-pointer">Complete profile evidence ledger</summary>
                <p className="mt-2">
                  Confirmed evidence is not independently verified. Unconfirmed source details are
                  never promoted into resume facts.
                </p>
                {resume.data.catalog?.ledger?.map((item, i) => (
                  <p key={i} className="mt-2 break-words text-xs">
                    {item.source_evidence}: {item.normalized} · {human(item.relevance_status)} ·{" "}
                    {item.omission_allowed ? "May condense" : "Entry protected"}
                  </p>
                ))}
              </details>
              {resume.data.report?.selected.map((item) => (
                <p key={item.id}>
                  {item.source} · relevance {item.relevance}
                </p>
              ))}
              <p>
                Template: supplied-navy-v1 · Profile revision {resume.profile_revision} · Version{" "}
                {resume.version}
              </p>
              <p>
                Retained sections:{" "}
                {resume.data.retained_sections?.join(", ") || "None; full generation"}
              </p>
              {resume.data.render?.attempts.map((a) => (
                <p key={a.attempt}>
                  Compile attempt {a.attempt}: exit {a.exit_code}, timeout {String(a.timeout)},
                  output exists {String(a.generated_file_exists)}. {a.diagnostics?.join(" ")}{" "}
                  {a.quality?.issues.map(human).join(", ")}
                </p>
              ))}
              <div className="flex flex-wrap gap-3">
                {resume.source_available && (
                  <button className={button} onClick={() => void download("source")}>
                    Download retained source
                  </button>
                )}
                {!!resume.data.render?.attempts.length && (
                  <button className={button} onClick={() => void download("compile-log")}>
                    Download private compiler log
                  </button>
                )}
                {resume.status === "failed" && resume.data.validation?.valid && (
                  <button
                    className={button}
                    disabled={locked}
                    onClick={() => void action("compile")}
                  >
                    Retry compilation
                  </button>
                )}
              </div>
              {resume.data.history?.map((h, i) => (
                <p key={i}>
                  {human(h.state)} · {new Date(h.timestamp).toLocaleString()}
                </p>
              ))}
            </div>
          </details>
        </Panel>
      )}
    </div>
  );
}
