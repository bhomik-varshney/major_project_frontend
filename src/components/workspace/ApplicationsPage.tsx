import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCheck, FileText, RefreshCw } from "lucide-react";
import { api } from "@/services/api/client";
import type {
  Application,
  ApplicationAction,
  ApplicationField,
  DocumentChoice,
  FormField,
} from "@/services/api/application-types";
import { ErrorNotice, LoadingCards, PageHeading, Panel } from "./shared";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { ApplicationPresentation, ProfileEntryCards } from "./ApplicationPresentation";
import { ApplicationMcpFrame } from "./ApplicationMcpFrame";

const label = (value: string) => value.replaceAll("_", " ");
const inputClass = "mt-2 w-full rounded-xl border border-border bg-background/70 p-3 text-sm";
const buttonClass =
  "rounded-xl border border-accent/30 bg-primary/30 px-4 py-3 text-sm disabled:opacity-40";

function FieldInput({
  spec,
  field,
  disabled,
  update,
}: {
  spec: FormField;
  field: ApplicationField;
  disabled: boolean;
  update: (value: ApplicationField["value"]) => void;
}) {
  const common = {
    id: `field-${spec.id}`,
    disabled,
    className: inputClass,
    "aria-label": spec.label,
  };
  if (spec.type === "unsupported")
    return (
      <p role="note" className="mt-3 text-sm text-accent">
        This employer control requires manual completion. Automated prefill is unavailable.
      </p>
    );
  if (spec.type === "checkbox")
    return (
      <input
        {...common}
        className="mt-3 h-5 w-5 accent-[var(--accent)]"
        type="checkbox"
        checked={field.value === true}
        onChange={(e) => update(e.target.checked)}
      />
    );
  if (spec.type === "select" || spec.type === "multiselect")
    return (
      <select
        {...common}
        multiple={spec.type === "multiselect"}
        value={
          spec.type === "multiselect"
            ? Array.isArray(field.value)
              ? field.value
              : []
            : String(field.value ?? "")
        }
        onChange={(e) =>
          update(
            spec.type === "multiselect"
              ? Array.from(e.target.selectedOptions, (o) => o.value)
              : e.target.value,
          )
        }
      >
        {spec.type !== "multiselect" && <option value="">Choose…</option>}
        {spec.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  if (spec.type === "radio")
    return (
      <div role="radiogroup" aria-label={spec.label} className="mt-3 flex flex-wrap gap-4">
        {spec.options.map((o) => (
          <label key={o} className="flex items-center gap-2 text-sm">
            <input
              disabled={disabled}
              type="radio"
              name={spec.id}
              value={o}
              checked={field.value === o}
              onChange={() => update(o)}
            />
            {o}
          </label>
        ))}
      </div>
    );
  if (spec.type === "textarea")
    return (
      <textarea
        {...common}
        rows={4}
        value={String(field.value ?? "")}
        onChange={(e) => update(e.target.value)}
      />
    );
  return (
    <input
      {...common}
      type={spec.type === "file" ? "text" : spec.type}
      value={String(field.value ?? "")}
      onChange={(e) => update(e.target.value)}
    />
  );
}

function cleanFields(record: Application) {
  const views = record.draft?.preview?.sections.flatMap((s) => s.fields) ?? [];
  return (record.draft?.fields ?? []).map((field) => {
    const shown = views.find((f) => f.field_id === field.id);
    return shown && !field.edited_by_user
      ? {
          ...field,
          value: shown.display_value,
          approved: shown.approved,
          auto_filled: shown.auto_filled,
          confirmation_required: shown.requires_confirmation,
          confidence:
            shown.confidence >= 0.9 ? "high" : shown.confidence > 0 ? "medium" : "unknown",
          classification: ["missing", "unsupported", "conflict"].includes(shown.status)
            ? "unavailable"
            : shown.status === "safe_to_prefill"
              ? "safe_to_prefill"
              : "user_confirmation_required",
          suggested_answer: !!shown.answer?.concise,
          warning: shown.reason || "Review this value before prefilling.",
        }
      : field;
  });
}
function ApplicationDetail({ record, refresh }: { record: Application; refresh: () => void }) {
  const [fields, setFields] = useState<ApplicationField[]>(cleanFields(record));
  const [documents, setDocuments] = useState<DocumentChoice[]>(
    record.draft?.documents.map((d) => ({
      document_id: d.document_id,
      role: d.role,
      approved: true,
    })) ?? [],
  );
  const [view, setView] = useState("preview");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [message, setMessage] = useState("");
  const [pendingApproval, setPendingApproval] = useState<{
    action: string;
    extra: Partial<ApplicationAction>;
  } | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [approval, setApproval] = useState(false);
  const [submission, setSubmission] = useState(false);
  const [reference, setReference] = useState("");
  const [kind, setKind] = useState("note");
  const [note, setNote] = useState("");
  const [due, setDue] = useState("");
  const [nextStatus, setNextStatus] = useState("interview");
  const [showFrame, setShowFrame] = useState(false);
  const [streamStatus, setStreamStatus] = useState("Connecting to progress stream");
  const [streamSeq, setStreamSeq] = useState(0);
  const [interactive, setInteractive] = useState(false);
  useEffect(() => setInteractive(true), []);
  useEffect(() => {
    if (!dirty) {
      setFields(cleanFields(record));
      setDocuments(
        record.draft?.documents.map((d) => ({
          document_id: d.document_id,
          role: d.role,
          approved: true,
        })) ?? [],
      );
    }
  }, [record, dirty]);
  const onRefresh = useRef(refresh);
  onRefresh.current = refresh;
  useEffect(() => {
    const controller = new AbortController();
    let last = 0;
    async function connect() {
      try {
        do {
          setStreamStatus("Live progress connected");
          await api.streamApplication(record.id, last, controller.signal, (event) => {
            if (event.seq <= last) return;
            last = event.seq;
            setStreamSeq(last);
            if (
              [
                "RUN_FINISHED",
                "RUN_ERROR",
                "FORM_OPEN",
                "TRANSACTION_STATE",
                "FORM_SUBMITTED",
                "PREVIEW_READY",
                "PREVIEW_GENERATING",
                "FIELD_PREFILL_PROGRESS",
                "UPLOAD_PROGRESS",
                "MCP_CONNECTION",
                "FORM_DISCOVERED",
                "RETRY",
                "USER_APPROVAL_REQUEST",
              ].includes(event.type)
            )
              onRefresh.current();
          });
        } while (!controller.signal.aborted);
      } catch {
        if (!controller.signal.aborted)
          setStreamStatus("Progress stream disconnected · saved state refresh remains available");
      }
    }
    void connect();
    return () => controller.abort();
  }, [record.id]);
  const timeline = useQuery({
    queryKey: ["application-timeline", record.id, record.revision, streamSeq],
    queryFn: ({ signal }) => api.applicationTimeline(record.id, signal),
  });
  const surface = useQuery({
    queryKey: ["application-surface", record.id, record.revision],
    queryFn: ({ signal }) => api.applicationSurface(record.id, signal),
    enabled: !!record.draft,
    placeholderData: (previous) => previous,
  });
  const tools = useQuery({
    queryKey: ["application-tools", record.id],
    queryFn: ({ signal }) => api.applicationTools(record.id, signal),
    enabled: showFrame,
  });
  const audit = useQuery({
    queryKey: ["application-audit", record.id, record.revision],
    queryFn: ({ signal }) => api.applicationAudit(record.id, signal),
    enabled: auditOpen,
  });
  const allowed = (action: string) => record.allowed_actions.includes(action);
  const editing = allowed("review");
  async function act(action: string, extra: Partial<ApplicationAction> = {}, accepted = false) {
    if (extra.confirmed && !accepted) {
      setPendingApproval({ action, extra });
      return;
    }
    setBusy(true);
    setError(undefined);
    setMessage("");
    try {
      await api.applicationAction(record.id, {
        action,
        expected_revision: record.revision,
        ...extra,
      });
      if (action === "start_tracking") setView("tracking");
      if (action === "open_external" && record.is_demo) {
        setView("audit");
        setShowFrame(true);
        setAuditOpen(true);
      }
      setDirty(false);
      setApproval(false);
      setSubmission(false);
      setMessage(
        action === "review"
          ? "Review saved locally. Your profile is unchanged."
          : "Application state updated.",
      );
      refresh();
    } catch (e) {
      setError(e);
      refresh();
    } finally {
      setBusy(false);
    }
  }
  async function addTracking() {
    setBusy(true);
    setError(undefined);
    try {
      await api.applicationTracking(record.id, {
        expected_revision: record.revision,
        kind,
        text: note,
        ...(kind === "status" ? { status: nextStatus } : {}),
        ...(due && kind !== "status" && kind !== "note"
          ? { due_at: new Date(due).toISOString() }
          : {}),
      });
      setNote("");
      setDue("");
      setMessage("Timeline updated.");
      refresh();
    } catch (e) {
      setError(e);
      refresh();
    } finally {
      setBusy(false);
    }
  }
  const frameData =
    surface.data && record.provider !== "demo"
      ? {
          ...surface.data,
          messages: [],
          preview: surface.data.preview
            ? {
                ...surface.data.preview,
                sections: surface.data.preview.sections.map((section) => ({
                  ...section,
                  entries: [],
                  links: [],
                  fields: section.fields.map((field) => ({
                    ...field,
                    display_value: field.approved ? field.display_value : null,
                    answer: null,
                  })),
                })),
              }
            : null,
          fields: surface.data.fields.map((f) => ({ ...f, value: f.approved ? f.value : null })),
        }
      : surface.data;
  return (
    <div className="mt-7 space-y-6">
      <AlertDialog
        open={!!pendingApproval}
        onOpenChange={(open) => {
          if (!open) setPendingApproval(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm application action</AlertDialogTitle>
            <AlertDialogDescription>
              Action: {label(pendingApproval?.action ?? "")}.{" "}
              {record.is_demo
                ? "This is a local mock application."
                : "This action uses your configured application adapter."}
              {pendingApproval?.action === "record_submission"
                ? " Confirm that you personally completed the external submission. This is a user report, not independent verification."
                : " Review the current fields, attachments and destination before proceeding. No action here submits an application automatically."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const next = pendingApproval;
                setPendingApproval(null);
                if (next) void act(next.action, next.extra, true);
              }}
            >
              Confirm action
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">
              {record.is_demo
                ? "Synthetic job · local demo application"
                : "Configured MCP application adapter"}
            </p>
            <h2 className="mt-3 font-display text-3xl">{record.job.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {record.job.company} · {record.job.location}
            </p>
          </div>
          <button type="button" className={buttonClass} onClick={refresh}>
            <RefreshCw className="mr-2 inline h-4 w-4" />
            Refresh application
          </button>
          <Link to="/cover-letters" search={{ application: record.id }} className={buttonClass}>
            Prepare cover letter
          </Link>
        </div>
        <p className="mt-5 text-sm" aria-label="Application state">
          {label(record.status)}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {streamStatus} · last event {streamSeq}
        </p>
        {record.operation_active ? (
          <p className="mt-4 text-sm" role="status">
            {record.stage}
          </p>
        ) : null}
        {record.draft && (
          <p className="mt-3 text-xs text-muted-foreground" aria-label="MCP connection status">
            MCP connection: {label(record.draft.connection.status)} ·{" "}
            {label(record.draft.connection.form_source)}
            {record.is_demo ? " · Mock mode — no employer is contacted" : ""}
          </p>
        )}
        <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2" aria-label="Application milestones">
          {[
            ["Prepared", "prepared_at"],
            ["Preview generated", "preview_generated_at"],
            ["External form opened", "external_form_opened_at"],
            ["Prefill complete", "prefill_completed_at"],
            ["Submitted by user", "submitted_by_user_at"],
            ["Tracking active", "tracking_started_at"],
          ].map(([title, key]) => (
            <div key={key}>
              <dt>{title}</dt>
              <dd className="text-muted-foreground">
                {record.milestones[key!]
                  ? new Date(record.milestones[key!]!).toLocaleString()
                  : "Pending"}
              </dd>
            </div>
          ))}
        </dl>
        {typeof record.match_context["hybrid_score"] === "number" && (
          <p className="mt-3 text-sm">
            Saved hybrid score: {record.match_context["hybrid_score"].toFixed(1)} / 100
          </p>
        )}
        {!record.is_demo && record.milestones["external_url"]?.startsWith("https://") && (
          <a
            className="mt-4 inline-block text-sm text-accent underline"
            href={record.milestones["external_url"]}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
          >
            Visit external form — review and submit yourself
          </a>
        )}
        {record.recovery.reconcile_required && (
          <p role="alert" className="mt-4 text-sm text-accent">
            The last external action has an uncertain outcome. Reconcile its receipt before retrying
            prefill.
          </p>
        )}
        {record.status === "partially_completed" && (
          <p role="status" className="mt-4 text-sm">
            Partial prefill preserved. Review skipped fields and failed uploads in the audit. Retry
            sends only the unfinished work.
          </p>
        )}
        {view === "audit" && Object.keys(record.match_context).length > 0 && (
          <details className="mt-3 text-xs">
            <summary>Saved matching context</summary>
            <pre className="overflow-auto whitespace-pre-wrap break-all">
              {JSON.stringify(record.match_context, null, 2)}
            </pre>
          </details>
        )}
        {record.stale && (
          <p role="alert" className="mt-4 text-sm text-accent">
            Your confirmed profile changed. Prepare a fresh draft before approving a prefill.
          </p>
        )}
        {record.error_code && (
          <p role="alert" className="mt-4 text-sm text-accent">
            Workflow stopped: {label(record.error_code)}. Inspect any existing external prefill
            before retrying.
          </p>
        )}
        {error ? (
          <div className="mt-4">
            <ErrorNotice error={error} />
          </div>
        ) : null}
        {message && (
          <p role="status" className="mt-4 text-sm text-accent">
            {message}
          </p>
        )}
        <fieldset disabled={busy || !interactive} className="mt-5 flex flex-wrap gap-3">
          {allowed("prepare") && (
            <button className={buttonClass} onClick={() => void act("prepare")}>
              {record.draft ? "Prepare a fresh draft" : "Prepare application"}
            </button>
          )}
          {allowed("retry") && (
            <button className={buttonClass} onClick={() => void act("retry")}>
              Retry preparation with current facts
            </button>
          )}
          {allowed("cancel") && (
            <button className={buttonClass} onClick={() => void act("cancel")}>
              Cancel workflow
            </button>
          )}
          {(
            [
              ["pause", "Pause workflow"],
              ["resume", "Reconnect after completing manual step"],
              ["retry_prefill", "Retry skipped prefill work"],
              ["reconcile", "Reconcile previous action"],
              ["open_external", "Open external form session"],
              ["continue_manually", "Continue with manual form review"],
            ] as const
          )
            .filter(([action]) => allowed(action))
            .map(([action, title]) => (
              <button
                key={action}
                className={buttonClass}
                onClick={() => void act(action, { confirmed: true })}
              >
                {title}
              </button>
            ))}
          {allowed("generate_preview") && (
            <button className={buttonClass} onClick={() => void act("generate_preview")}>
              Generate MCP application preview
            </button>
          )}
          {allowed("start_tracking") && (
            <button className={buttonClass} onClick={() => void act("start_tracking")}>
              Activate application tracking
            </button>
          )}
        </fieldset>
      </Panel>
      {record.draft && (
        <nav
          aria-label="Application views"
          className="sticky top-16 z-20 flex flex-wrap gap-2 rounded-xl border border-border bg-background p-3"
        >
          {["form", "preview", "audit", "tracking"].map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={view === name}
              className={`${buttonClass} ${view === name ? "bg-primary/70" : ""}`}
              onClick={() => {
                setView(name);
                if (name === "audit") setAuditOpen(true);
              }}
            >
              {name[0]!.toUpperCase() + name.slice(1)} view
            </button>
          ))}
          <button
            type="button"
            className={buttonClass}
            onClick={() =>
              document.getElementById("application-approval")?.scrollIntoView({ block: "start" })
            }
          >
            Review approval
          </button>
          <span className="ml-auto self-center text-xs text-muted-foreground">
            {record.draft.validation.missing_required.length} required ·{" "}
            {record.draft.validation.unreviewed_fields.length} to review
          </span>
        </nav>
      )}
      {dirty && (
        <p role="status" className="text-sm text-accent">
          Unsaved edits. Save the reviewed application in Form view to update the MCP preview before
          approval.
        </p>
      )}
      {record.draft?.preview && view === "preview" && (
        <ApplicationPresentation preview={record.draft.preview} edit={() => setView("form")} />
      )}
      {record.draft && (
        <>
          <div hidden={view !== "form"} className="space-y-6">
            <Panel>
              <h3 className="font-display text-2xl">Job requirements and application documents</h3>
              <p className="mt-4 text-sm">
                Required skills:{" "}
                {record.draft.requirements.required_skills.join(", ") || "Not specified"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Confirmed skill overlap:{" "}
                {record.draft.requirements.matched_skills.join(", ") ||
                  "No direct overlap recorded"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Missing skill evidence:{" "}
                {record.draft.requirements.missing_skill_evidence.join(", ") ||
                  "None in the explicit skill list"}
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                {record.draft.requirements.document_recommendation} Cover letter:{" "}
                {label(record.draft.requirements.cover_letter)}.
              </p>
              {!record.draft.document_options.length && (
                <p className="mt-4 text-sm">
                  No documents are available.{" "}
                  <Link to="/documents" className="text-accent underline">
                    Upload and confirm a resume
                  </Link>
                  , then prepare again. The demo form permits proceeding without an attachment.
                </p>
              )}
              <fieldset disabled={!editing || busy || !interactive} className="mt-4 space-y-3">
                {record.draft.document_options.map((doc) => {
                  const selected = documents.find((d) => d.document_id === doc.id);
                  return (
                    <div key={doc.id} className="rounded-xl border border-border p-4">
                      <label className="flex items-start gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={!!selected}
                          onChange={(e) => {
                            setDocuments(
                              e.target.checked
                                ? [
                                    ...documents,
                                    {
                                      document_id: doc.id,
                                      role: doc.confirmed_resume ? "resume" : "supporting",
                                      approved: true,
                                    },
                                  ]
                                : documents.filter((d) => d.document_id !== doc.id),
                            );
                            setDirty(true);
                          }}
                        />
                        <span className="min-w-0 break-all">
                          Approve attachment: {doc.filename}
                          <small className="mt-1 block text-muted-foreground">
                            {doc.confirmed_resume
                              ? "Confirmed resume source"
                              : "Uploaded document; user review required"}{" "}
                            · {doc.size_bytes} bytes · {doc.sha256.slice(0, 12)}
                          </small>
                        </span>
                      </label>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {doc.content_type} · Selected uploads require explicit snapshot approval.
                      </p>
                      <button
                        type="button"
                        className={`${buttonClass} mt-2`}
                        onClick={() => {
                          void api
                            .originalDocument(doc.id)
                            .then((blob) => {
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.href = url;
                              link.download = doc.filename;
                              link.click();
                              setTimeout(() => URL.revokeObjectURL(url), 1000);
                            })
                            .catch(setError);
                        }}
                      >
                        Download for private preview
                      </button>
                      {selected && (
                        <label className="mt-3 block text-xs">
                          Document role
                          <select
                            aria-label={`Role for ${doc.filename}`}
                            className={inputClass}
                            value={selected.role}
                            onChange={(e) => {
                              setDocuments(
                                documents.map((d) =>
                                  d.document_id === doc.id
                                    ? { ...d, role: e.target.value as DocumentChoice["role"] }
                                    : d,
                                ),
                              );
                              setDirty(true);
                            }}
                          >
                            <option value="supporting">Supporting document</option>
                            <option value="cover_letter">Cover letter</option>
                            {doc.confirmed_resume && (
                              <option value="resume">Confirmed resume</option>
                            )}
                          </select>
                        </label>
                      )}
                    </div>
                  );
                })}
              </fieldset>
            </Panel>
            <Panel>
              <h3 className="font-display text-2xl">Review every populated field</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Values come from confirmed facts or your explicit input. Review checkboxes approve
                only this draft. Salary, availability, work authorization and demographic answers
                are never inferred.
              </p>
              <fieldset
                disabled={!editing || busy || !interactive}
                className="mt-6 grid gap-5 md:grid-cols-2"
              >
                {(record.draft.preview?.sections ?? []).map((section) => (
                  <details
                    key={section.id}
                    open
                    className="min-w-0 rounded-xl border border-border p-4 md:col-span-2"
                  >
                    <summary className="cursor-pointer font-display text-xl">
                      {section.label}
                    </summary>
                    <ProfileEntryCards entries={section.entries} />
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      {section.fields
                        .map((f) => record.draft!.form.fields.find((s) => s.id === f.field_id)!)
                        .filter((s) => s && s.type !== "file")
                        .map((spec) => {
                          const field = fields.find((f) => f.id === spec.id);
                          const presented = section.fields.find((f) => f.field_id === spec.id);
                          if (!field) return null;
                          return (
                            <details
                              key={spec.id}
                              open={spec.required || (field.value !== null && field.value !== "")}
                              className="min-w-0 rounded-xl border border-border p-4"
                            >
                              <summary className="cursor-pointer text-xs text-muted-foreground">
                                {spec.label} ·{" "}
                                {field.value === null || field.value === ""
                                  ? spec.required
                                    ? "Required input"
                                    : "Optional input"
                                  : "Available"}
                              </summary>
                              <label htmlFor={`field-${spec.id}`} className="text-sm">
                                {spec.label}
                                {spec.required ? " *" : ""}
                              </label>
                              <FieldInput
                                spec={spec}
                                field={field}
                                disabled={!editing || busy || spec.type === "unsupported"}
                                update={(value) => {
                                  setFields(
                                    fields.map((f) =>
                                      f.id === spec.id ? { ...f, value, approved: false } : f,
                                    ),
                                  );
                                  setDirty(true);
                                }}
                              />
                              <p className="mt-3 break-words text-[11px] text-muted-foreground">
                                {label(field.classification)} ·{" "}
                                {presented?.source_label || "User input needed"} ·{" "}
                                {field.confidence} confidence ·{" "}
                                {field.auto_filled ? "Auto-filled" : "Manual / unavailable"} ·{" "}
                                {field.confirmation_required ? "Confirmation required" : ""}
                                {field.suggested_answer ? " · Source-grounded draft answer" : ""}
                                {spec.sensitive ? " · Sensitive field" : ""}
                              </p>
                              {presented?.answer && (
                                <details className="mt-3 text-xs">
                                  <summary>Draft alternatives and evidence</summary>
                                  <p className="mt-2">{presented.answer.evidence.join("; ")}</p>
                                  <p className="mt-2 whitespace-pre-wrap">
                                    {presented.answer.detailed}
                                  </p>
                                  <p className="mt-2 text-accent">{presented.answer.reason}</p>
                                  <button
                                    type="button"
                                    className={`${buttonClass} mt-2`}
                                    onClick={() => {
                                      setFields(
                                        fields.map((f) =>
                                          f.id === field.id
                                            ? {
                                                ...f,
                                                value: presented.answer!.detailed,
                                                approved: false,
                                              }
                                            : f,
                                        ),
                                      );
                                      setDirty(true);
                                    }}
                                  >
                                    Use detailed draft
                                  </button>
                                </details>
                              )}
                              {field.warning && (
                                <p className="mt-1 text-[11px] text-accent">{field.warning}</p>
                              )}
                              <label className="mt-4 flex items-start gap-2 text-xs">
                                <input
                                  type="checkbox"
                                  aria-label={`Reviewed ${spec.label}`}
                                  checked={field.approved}
                                  onChange={(e) => {
                                    setFields(
                                      fields.map((f) =>
                                        f.id === spec.id ? { ...f, approved: e.target.checked } : f,
                                      ),
                                    );
                                    setDirty(true);
                                  }}
                                />
                                I reviewed this value and approve it for prefill.
                              </label>
                            </details>
                          );
                        })}
                    </div>
                  </details>
                ))}
              </fieldset>
              {editing && (
                <button
                  type="button"
                  disabled={busy || !interactive}
                  className={`${buttonClass} mt-6`}
                  onClick={() =>
                    void act("review", {
                      fields: Object.fromEntries(
                        fields
                          .filter(
                            (f) =>
                              record.draft!.form.fields.find((s) => s.id === f.id)?.type !== "file",
                          )
                          .map((f) => [f.id, { value: f.value, approved: f.approved }]),
                      ),
                      documents,
                    })
                  }
                >
                  Save reviewed application
                </button>
              )}
              {dirty && (
                <p role="status" className="mt-3 text-sm text-accent">
                  Unsaved review changes. Save before approving or continuing.
                </p>
              )}
              <p className="mt-4 text-xs text-muted-foreground">
                Required inputs outstanding:{" "}
                {record.draft.validation.missing_required
                  .map((id) => record.draft!.form.fields.find((f) => f.id === id)?.label || id)
                  .join(", ") || "None"}
                . Populated fields awaiting review:{" "}
                {record.draft.validation.unreviewed_fields.length}.
              </p>
            </Panel>
          </div>
          <div
            hidden={view !== "form" && view !== "preview"}
            id="application-approval"
            className="scroll-mt-40 rounded-xl bg-background/95"
          >
            <Panel>
              <h3 className="font-display text-2xl">Approve, prefill, then submit yourself</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                {record.is_demo
                  ? "This local MCP demo receives approved values and files; no employer is contacted. Completing it creates a demo tracking record."
                  : "The configured stdio adapter receives only your approved values and files. Review the external form before submitting it yourself."}
              </p>
              <fieldset disabled={busy || dirty || !interactive} className="mt-5 space-y-4">
                {allowed("approve_prefill") && (
                  <>
                    <label className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={approval}
                        onChange={(e) => setApproval(e.target.checked)}
                      />
                      I approve this exact reviewed draft and selected documents for{" "}
                      {record.is_demo ? "local demo" : "configured adapter"} prefill only.
                    </label>
                    <button
                      className={buttonClass}
                      disabled={
                        !approval || !record.draft.validation.ready_for_prefill || record.stale
                      }
                      onClick={() => void act("approve_prefill", { confirmed: true })}
                    >
                      Approve prefill snapshot
                    </button>
                  </>
                )}
                {allowed("prefill") && (
                  <button
                    className={buttonClass}
                    onClick={() => void act("prefill", { confirmed: true })}
                  >
                    Prefill approved fields through MCP
                  </button>
                )}
                {allowed("approve_submission") && (
                  <button
                    className={buttonClass}
                    onClick={() => void act("approve_submission", { confirmed: true })}
                  >
                    I reviewed the prefilled form — continue
                  </button>
                )}
                {allowed("record_submission") && (
                  <>
                    <label className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={submission}
                        onChange={(e) => setSubmission(e.target.checked)}
                      />
                      {record.is_demo
                        ? "I completed this demo and want to record a simulated application."
                        : "I personally submitted this application on the external site."}
                    </label>
                    <label className="block text-sm">
                      {record.is_demo
                        ? "Demo reference (optional)"
                        : "Submission reference (optional)"}
                      <input
                        className={inputClass}
                        value={reference}
                        maxLength={160}
                        onChange={(e) => setReference(e.target.value)}
                      />
                    </label>
                    <button
                      className={buttonClass}
                      disabled={!submission}
                      onClick={() => void act("record_submission", { confirmed: true, reference })}
                    >
                      {record.is_demo ? "Record demo completion" : "Record my submission"}
                    </button>
                  </>
                )}
                {!record.allowed_actions.some((a) =>
                  [
                    "approve_prefill",
                    "prefill",
                    "approve_submission",
                    "record_submission",
                  ].includes(a),
                ) && (
                  <p className="text-sm text-muted-foreground">
                    Current state: {label(record.status)}. Submission is never automatic.
                  </p>
                )}
              </fieldset>
            </Panel>
          </div>
          <div hidden={view !== "audit"}>
            <Panel>
              <details
                open={auditOpen}
                onToggle={(event) => setAuditOpen(event.currentTarget.open)}
              >
                <summary className="cursor-pointer text-sm">
                  Application audit · fields, documents, MCP and agents
                </summary>
                <p className="mt-4 text-xs text-muted-foreground">
                  CrewAI Flow performs local evidence mapping. Optional six-agent AI review:{" "}
                  {String(record.draft.ai_review["status"] ?? "not_selected")}.
                </p>
                <ul className="mt-4 space-y-2 text-xs">
                  {record.tasks.map((t, i) => (
                    <li key={`${t.name}-${i}`}>
                      {t.name} · {t.status} · {t.method}
                    </li>
                  ))}
                </ul>
                <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                  {record.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
                <details className="mt-5">
                  <summary className="cursor-pointer text-xs">
                    A2UI messages, approval digest, receipt and validation
                  </summary>
                  <pre
                    aria-label="Application audit data"
                    className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-background p-4 text-[10px]"
                  >
                    {JSON.stringify(
                      {
                        persisted_audit: audit.data,
                        surface: surface.data,
                        approval: record.approval,
                        receipt: record.receipt,
                        validation: record.draft.validation,
                        ai_review: record.draft.ai_review,
                      },
                      null,
                      2,
                    )}
                  </pre>
                </details>
                {(record.provider === "demo" ||
                  record.status === "prefill_complete" ||
                  record.status === "needs_submission_approval") && (
                  <button
                    type="button"
                    className={`${buttonClass} mt-5`}
                    onClick={() => setShowFrame(!showFrame)}
                  >
                    {showFrame ? "Hide MCP review app" : "Open MCP review app"}
                  </button>
                )}
                {showFrame && frameData && (
                  <ApplicationMcpFrame
                    key={record.id}
                    id={record.id}
                    data={frameData}
                    onReview={() => {
                      setDirty(false);
                      refresh();
                    }}
                  />
                )}
                {showFrame && (
                  <pre
                    className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-all text-[10px]"
                    aria-label="Discovered MCP tools"
                  >
                    {JSON.stringify(tools.data ?? {}, null, 2)}
                  </pre>
                )}
              </details>
            </Panel>
          </div>
        </>
      )}
      <div hidden={view !== "tracking"}>
        <Panel>
          <h3 className="font-display text-2xl">Timeline and next steps</h3>
          <fieldset
            disabled={busy || record.operation_active || !interactive}
            className="mt-5 grid gap-4 sm:grid-cols-2"
          >
            <label className="text-sm">
              Timeline entry
              <select
                aria-label="Timeline entry"
                className={inputClass}
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              >
                <option value="note">Note</option>
                <option value="deadline">Deadline</option>
                <option value="follow_up">Follow-up</option>
                <option value="interview">Interview stage</option>
                <option value="status">Outcome / status</option>
              </select>
            </label>
            {kind === "status" ? (
              <label className="text-sm">
                New application status
                <select
                  aria-label="New application status"
                  className={inputClass}
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                >
                  {[
                    "recruiter_review",
                    "assessment",
                    "interview",
                    "offer",
                    "accepted",
                    "rejected",
                    "withdrawn",
                    "closed",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {label(s)}
                    </option>
                  ))}
                </select>
              </label>
            ) : kind !== "note" ? (
              <label className="text-sm">
                Due date and time
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                />
              </label>
            ) : null}
            <label className="text-sm sm:col-span-2">
              Note or stage details
              <textarea
                className={inputClass}
                rows={3}
                maxLength={2000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            <button
              type="button"
              className={buttonClass}
              disabled={(kind === "note" && !note) || (!["note", "status"].includes(kind) && !due)}
              onClick={() => void addTracking()}
            >
              Add timeline entry
            </button>
          </fieldset>
          <h4 className="mt-6 text-sm">Follow-ups and deadlines</h4>
          {!record.tracking.tasks.length && (
            <p className="mt-2 text-xs text-muted-foreground">
              No follow-ups or deadlines recorded.
            </p>
          )}
          <ul className="mt-3 space-y-3">
            {record.tracking.tasks.map((task) => (
              <li key={task.id} className="text-xs">
                {label(task.kind)} · {task.text || "Scheduled task"} ·{" "}
                {new Date(task.due_at).toLocaleString()} ·{" "}
                {task.completed ? "Completed" : "Pending"}
                {!task.completed && (
                  <button
                    className={`${buttonClass} ml-3`}
                    disabled={busy || record.operation_active}
                    onClick={() => {
                      setBusy(true);
                      void api
                        .completeApplicationTask(record.id, task.id, record.revision)
                        .then(refresh)
                        .catch(setError)
                        .finally(() => setBusy(false));
                    }}
                  >
                    Mark complete
                  </button>
                )}
              </li>
            ))}
          </ul>
          {timeline.isError && (
            <ErrorNotice error={timeline.error} retry={() => void timeline.refetch()} />
          )}
          <ol className="mt-6 space-y-4 border-l border-accent/20 pl-5">
            {timeline.data
              ?.slice()
              .reverse()
              .map((e) => (
                <li key={e.seq} className="text-xs">
                  <time className="text-muted-foreground">
                    {new Date(e.created_at).toLocaleString()}
                  </time>
                  <p className="mt-1">
                    {label(e.payload.kind || e.type)} · {label(e.payload.status)}
                  </p>
                  {e.payload.total !== undefined && (
                    <p className="mt-1">
                      Completed {e.payload.completed} of {e.payload.total}
                    </p>
                  )}
                  {e.payload.message && (
                    <p className="mt-1 text-muted-foreground">{e.payload.message}</p>
                  )}
                  {e.payload.text && (
                    <p className="mt-1 whitespace-pre-wrap break-words">{e.payload.text}</p>
                  )}
                  {e.payload.due_at && (
                    <p className="mt-1 text-accent">
                      Scheduled: {new Date(e.payload.due_at).toLocaleString()}
                    </p>
                  )}
                </li>
              ))}
          </ol>
        </Panel>
      </div>
    </div>
  );
}

export function ApplicationsPage({ job, run }: { job?: string; run?: string }) {
  const cache = useQueryClient();
  const [selected, setSelected] = useState("");
  const [jobId, setJobId] = useState(job || "");
  const [provider, setProvider] = useState("demo");
  const [scenario, setScenario] = useState("standard");
  const [useAI, setUseAI] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("updated");
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const [interactive, setInteractive] = useState(false);
  useEffect(() => setInteractive(true), []);
  const readiness = useQuery({
    queryKey: ["application-readiness"],
    queryFn: ({ signal }) => api.applicationReadiness(signal),
    retry: false,
  });
  const saved = useQuery({
    queryKey: ["bookmarks"],
    queryFn: ({ signal }) => api.bookmarks(signal),
  });
  const applications = useQuery({
    queryKey: ["applications", page, filter, search, sort],
    queryFn: ({ signal }) => api.applications(page, filter, signal, search, sort),
    refetchInterval: 4000,
  });
  const schedule = useQuery({
    queryKey: ["application-schedule"],
    queryFn: ({ signal }) => api.applicationSchedule(signal),
  });
  const record = useQuery({
    queryKey: ["application", selected],
    queryFn: ({ signal }) => api.application(selected, signal),
    enabled: !!selected,
    refetchInterval: (q) => (q.state.data?.operation_active ? 700 : false),
  });
  const refresh = () => {
    void cache.invalidateQueries({ queryKey: ["applications"] });
    void cache.invalidateQueries({ queryKey: ["application-schedule"] });
    void cache.invalidateQueries({ queryKey: ["application", selected] });
    void cache.invalidateQueries({ queryKey: ["career", "summary"] });
  };
  async function create() {
    setBusy(true);
    setError(undefined);
    try {
      const created = await api.createApplication({
        job_id: jobId,
        ...(jobId === job && run ? { matching_run_id: run } : {}),
        provider,
        demo_scenario: scenario,
        use_ai: useAI,
        allow_external_processing: useAI,
      });
      setSelected(created.id);
      refresh();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="Your next step, reviewed"
        title="Your applications"
        description="Prepare a grounded application, review its fields and documents, then keep a clear record of decisions and next steps."
      />
      <Panel>
        <div className="flex items-center gap-3">
          <CheckCheck className="h-5 w-5 text-accent" />
          <h2 className="font-display text-2xl">Start from an opportunity</h2>
        </div>
        {readiness.isError ? (
          <ErrorNotice error={readiness.error} retry={() => void readiness.refetch()} />
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            {readiness.data?.message || "Checking confirmed profile…"}
          </p>
        )}
        {readiness.data && !readiness.data.can_prepare && (
          <Link to="/profile" className="mt-4 inline-block text-accent underline">
            Confirm your profile first
          </Link>
        )}
        <fieldset
          disabled={busy || !interactive || !readiness.data?.can_prepare}
          className="mt-5 grid gap-5 sm:grid-cols-2"
        >
          <label className="text-sm">
            Selected opportunity
            <select
              className={inputClass}
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              aria-label="Selected opportunity"
            >
              <option value="">Choose a saved job</option>
              {job && <option value={job}>Recommended opportunity</option>}
              {saved.data
                ?.filter((s) => s.job.id !== job)
                .map((s) => (
                  <option key={s.job.id} value={s.job.id}>
                    {s.job.title} · {s.job.company}
                  </option>
                ))}
            </select>
          </label>
          <label className="text-sm">
            Application integration
            <select
              className={inputClass}
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            >
              {readiness.data?.providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          {provider === "demo" && (
            <label className="text-sm">
              Mock form scenario
              <select
                aria-label="Mock form scenario"
                className={inputClass}
                value={scenario}
                onChange={(event) => setScenario(event.target.value)}
              >
                {[
                  "standard",
                  "graduate",
                  "partial",
                  "upload_failure",
                  "authentication",
                  "unavailable",
                  "unsupported",
                  "schema_change",
                ].map((value) => (
                  <option key={value} value={value}>
                    {label(value)}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="flex items-start gap-3 text-sm sm:col-span-2">
            <input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} />
            <span>
              Allow optional six-agent Groq review.
              <small className="mt-1 block text-xs text-muted-foreground">
                Sends only field IDs, classifications, tool names and confirmed document IDs.
                Candidate values, resume text and filenames stay local. Grounded preparation works
                without this review.
              </small>
            </span>
          </label>
          <button
            type="button"
            className={buttonClass}
            disabled={!jobId || busy}
            onClick={() => void create()}
          >
            <FileText className="mr-2 inline h-4 w-4" />
            Create application draft
          </button>
          <Link to="/matches" className="flex items-center gap-2 text-sm text-accent">
            Find a recommended job <ArrowRight className="h-4 w-4" />
          </Link>
        </fieldset>
        {error ? (
          <div className="mt-4">
            <ErrorNotice error={error} />
          </div>
        ) : null}
      </Panel>
      <Panel className="mt-6">
        <h2 className="font-display text-2xl">Upcoming follow-ups and deadlines</h2>
        <ul className="mt-4 space-y-3">
          {schedule.data
            ?.filter((task) => !task.completed)
            .slice(0, 8)
            .map((task) => (
              <li key={task.id} className="text-xs">
                <button
                  className="text-accent underline"
                  onClick={() => setSelected(task.application_id)}
                >
                  {task.title}
                </button>{" "}
                · {label(task.kind)} · {new Date(task.due_at).toLocaleString()} · {task.text}
              </li>
            ))}
        </ul>
        {!schedule.data?.some((task) => !task.completed) && (
          <p className="mt-3 text-sm text-muted-foreground">No upcoming tasks recorded.</p>
        )}
      </Panel>
      <Panel className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-2xl">Application tracker</h2>
          <label className="text-xs">
            Search applications
            <input
              aria-label="Search applications"
              className={inputClass}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="text-xs">
            Sort applications
            <select
              aria-label="Sort applications"
              className={inputClass}
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
            >
              <option value="updated">Recently updated</option>
              <option value="deadline">Nearest deadline / follow-up</option>
            </select>
          </label>
          <label className="text-xs">
            Filter application status
            <select
              className={inputClass}
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              {[
                "job_selected",
                "preparing",
                "needs_user_review",
                "approved_for_prefill",
                "partially_completed",
                "waiting_for_user",
                "external_site_unavailable",
                "unsupported_form",
                "prefill_complete",
                "needs_submission_approval",
                "submitted_by_user",
                "tracking_active",
                "recruiter_review",
                "assessment",
                "interview",
                "offer",
                "accepted",
                "rejected",
                "withdrawn",
                "closed",
                "failed",
                "cancelled",
              ].map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {applications.isPending ? (
          <LoadingCards />
        ) : applications.isError ? (
          <ErrorNotice error={applications.error} retry={() => void applications.refetch()} />
        ) : (
          <>
            {!applications.data.items.length && (
              <p className="mt-5 text-sm text-muted-foreground">
                No applications in this view. Select a saved or recommended job to get started.
              </p>
            )}
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {applications.data.items.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setSelected(r.id)}
                  aria-pressed={r.id === selected}
                  className={`min-w-0 rounded-xl border p-4 text-left ${r.id === selected ? "border-accent/60 bg-primary/20" : "border-border"}`}
                >
                  <span className="block break-words text-sm">{r.job.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {r.job.company} · {label(r.status)}
                    {r.is_demo ? " · demo" : ""}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-4 text-xs">
              <button disabled={page === 1} onClick={() => setPage(page - 1)}>
                Previous applications
              </button>
              <span>
                {applications.data.total} records · page {page}
              </span>
              <button
                disabled={page * applications.data.page_size >= applications.data.total}
                onClick={() => setPage(page + 1)}
              >
                Next applications
              </button>
            </div>
          </>
        )}
      </Panel>
      {record.isError && (
        <div className="mt-5">
          <ErrorNotice error={record.error} retry={() => void record.refetch()} />
        </div>
      )}
      {record.data && (
        <ApplicationDetail key={record.data.id} record={record.data} refresh={refresh} />
      )}
    </>
  );
}
