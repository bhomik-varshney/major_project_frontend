import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import {
  letterSections,
  type LetterSection,
  type CoverStart,
} from "@/services/api/cover-letter-types";
import { ErrorNotice, PageHeading, Panel } from "./shared";

const input = "mt-2 w-full rounded-xl border border-border bg-background p-3 text-sm";
const button =
  "rounded-xl border border-accent/30 bg-primary/30 px-4 py-3 text-sm disabled:opacity-40";
const human = (value: string) => value.replaceAll("_", " ");
const today = () => new Date().toLocaleDateString("en-CA");

function PrivateImage({
  load,
  label,
  identity,
}: {
  load: () => Promise<Blob>;
  label: string;
  identity: string;
}) {
  const [url, setURL] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    let local = "";
    setFailed(false);
    setURL("");
    void load()
      .then((blob) => {
        if (active) {
          local = URL.createObjectURL(blob);
          setURL(local);
        }
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
      if (local) URL.revokeObjectURL(local);
    };
    // The stable identity binds the authenticated resource and avoids refetching on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity]);
  return failed ? (
    <p role="alert">Preview could not load. Refresh the version and try again.</p>
  ) : url ? (
    <img src={url} alt={label} className="mx-auto max-h-[1100px] max-w-full rounded bg-white" />
  ) : (
    <p role="status">Loading private preview…</p>
  );
}

export function CoverLettersPage({ application: initialApplication }: { application?: string }) {
  const cache = useQueryClient();
  const [application, setApplication] = useState(initialApplication || "");
  const [version, setVersion] = useState("");
  const [tone, setTone] = useState<CoverStart["tone"]>("formal");
  const [length, setLength] = useState<CoverStart["length"]>("standard");
  const [date, setDate] = useState(today);
  const [useAI, setUseAI] = useState(false);
  const [includeSignature, setIncludeSignature] = useState(true);
  const [signature, setSignature] = useState("");
  const [signer, setSigner] = useState("");
  const [ownership, setOwnership] = useState(false);
  const [signatureApproved, setSignatureApproved] = useState(false);
  const [width, setWidth] = useState(38);
  const [reviewed, setReviewed] = useState(false);
  const [edit, setEdit] = useState(false);
  const [edits, setEdits] = useState<Partial<Record<LetterSection, string>>>({});
  const [personal, setPersonal] = useState("");
  const [attested, setAttested] = useState(false);
  const [section, setSection] = useState<"all" | LetterSection>("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState("");
  const [applicationPage, setApplicationPage] = useState(1);
  const readiness = useQuery({ queryKey: ["cover-readiness"], queryFn: api.coverReadiness });
  const apps = useQuery({
    queryKey: ["cover-applications", applicationPage],
    queryFn: () => api.applications(applicationPage),
  });
  const app = useQuery({
    queryKey: ["cover-application", application],
    queryFn: () => api.application(application),
    enabled: !!application,
  });
  const signatures = useQuery({ queryKey: ["signatures"], queryFn: api.signatures });
  const versions = useQuery({
    queryKey: ["cover-versions", application],
    queryFn: () => api.coverLetters(application),
    enabled: !!application,
  });
  const current = useQuery({
    queryKey: ["cover-letter", version],
    queryFn: () => api.coverLetter(version),
    enabled: !!version,
    refetchInterval: (query) => (query.state.data?.operation_active ? 1000 : false),
  });
  const letter = current.data;
  useEffect(() => {
    if (letter && !letter.operation_active) {
      void cache.invalidateQueries({ queryKey: ["cover-versions", letter.application_id] });
      void cache.invalidateQueries({ queryKey: ["cover-application", letter.application_id] });
    }
    // Refresh the history once per operation transition, not on every poll object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter?.status, letter?.operation_active, letter?.application_id, cache]);
  const content = letter?.data.content;
  const locked = busy || !!letter?.operation_active;
  useEffect(() => {
    setReviewed(false);
    setEdit(false);
    setEdits({});
    setAttested(false);
  }, [version]);
  const refresh = async () => {
    await Promise.all([
      cache.invalidateQueries({ queryKey: ["cover-versions", application] }),
      cache.invalidateQueries({ queryKey: ["cover-application", application] }),
      cache.invalidateQueries({ queryKey: ["application"] }),
    ]);
  };
  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setNotice("");
    try {
      await work();
      await refresh();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  const generate = () =>
    run(async () => {
      if (!app.data) return;
      const result = await api.createCoverLetter(application, {
        expected_application_revision: app.data.revision,
        document_date: date,
        tone,
        length,
        use_ai: useAI,
        allow_external_processing: useAI,
        include_signature: includeSignature,
        ...(signature ? { signature_id: signature } : {}),
        signature_approved: signatureApproved,
        signature_width_mm: width,
        ...(letter ? { base_version_id: letter.id } : {}),
        regenerate_section: section,
        edits: edit ? edits : {},
        personal_sentence: personal,
        user_text_confirmed: attested,
      });
      cache.setQueryData(["cover-letter", result.id], result);
      setVersion(result.id);
      setPersonal("");
      setNotice("New letter version started. Previous approved documents are preserved.");
    });
  const action = (kind: "render" | "approve" | "attach" | "cancel") =>
    run(async () => {
      if (!letter) return;
      // Fetch current application revision because other workspace tabs may have changed it.
      const applicationNow = await api.application(application);
      const result = await api.coverAction(letter.id, {
        action: kind,
        expected_revision: letter.revision,
        expected_application_revision: applicationNow.revision,
        reviewed,
        ...(signature ? { signature_id: signature } : {}),
        include_signature: includeSignature,
        signature_approved: signatureApproved,
        signature_width_mm: width,
      });
      cache.setQueryData(["cover-letter", result.id], result);
      setReviewed(false);
      setNotice(
        kind === "attach"
          ? "Approved cover letter attached to this application. The application has not been submitted."
          : kind === "approve"
            ? "This exact PDF version is approved. You can now attach it."
            : "Cover-letter state updated.",
      );
    });
  const download = (kind: "pdf" | "source" | "compile-log") =>
    run(async () => {
      if (!letter) return;
      const blob = await api.coverArtifact(letter.id, kind);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `cover-letter-v${letter.version}.${kind === "pdf" ? "pdf" : kind === "source" ? "tex" : "log"}`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Career toolkit"
        title="A letter grounded in your work."
        description="Choose an application, review the evidence, and approve a job-specific PDF in the supplied Source Sans Pro template."
      />
      {(error ||
        readiness.error ||
        app.error ||
        current.error ||
        versions.error ||
        signatures.error ||
        apps.error) && (
        <ErrorNotice
          error={
            error ||
            readiness.error ||
            app.error ||
            current.error ||
            versions.error ||
            signatures.error ||
            apps.error
          }
          retry={() => {
            setError(null);
            void readiness.refetch();
            void app.refetch();
            void versions.refetch();
            void current.refetch();
            void signatures.refetch();
            void apps.refetch();
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
              value={application}
              disabled={locked}
              onChange={(e) => {
                setApplication(e.target.value);
                setVersion("");
              }}
            >
              <option value="">Choose an application</option>
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
              value={version}
              disabled={locked}
              onChange={(e) => setVersion(e.target.value)}
            >
              <option value="">New letter</option>
              {versions.data?.map((v) => (
                <option key={v.id} value={v.id}>
                  Version {v.version} · {human(v.status)} ·{" "}
                  {new Date(v.created_at).toLocaleString()}
                </option>
              ))}
            </select>
          </label>
        </div>
        {apps.data && apps.data.total > apps.data.page_size && (
          <div className="mt-3 flex items-center gap-3">
            <button
              className={button}
              disabled={applicationPage === 1 || locked}
              onClick={() => setApplicationPage(applicationPage - 1)}
            >
              Previous applications
            </button>
            <span className="text-sm">Page {applicationPage}</span>
            <button
              className={button}
              disabled={applicationPage * apps.data.page_size >= apps.data.total || locked}
              onClick={() => setApplicationPage(applicationPage + 1)}
            >
              More applications
            </button>
          </div>
        )}
        {!readiness.data?.profile_ready && (
          <p className="mt-4 text-sm">
            <Link to="/profile" className="text-accent underline">
              Confirm your candidate profile first.
            </Link>
          </p>
        )}
        {app.data && (
          <div className="mt-5 rounded-xl border border-border p-4">
            <h2 className="font-display text-2xl">{app.data.job.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {app.data.job.company || "Company not supplied"} · {app.data.job.location} ·{" "}
              {app.data.is_demo ? "Synthetic listing" : "Selected application source"}
            </p>
            <p className="mt-2 text-xs">
              Confirmed profile revision {letter?.profile_revision || app.data.profile_revision}.
              Current application: {human(app.data.status)}.
            </p>
            <Link to="/applications" className="mt-2 inline-block text-sm text-accent underline">
              Open applications and timeline
            </Link>
          </div>
        )}
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label className="text-sm">
            Tone
            <select
              aria-label="Tone"
              className={input}
              value={tone}
              onChange={(e) => setTone(e.target.value as CoverStart["tone"])}
            >
              <option value="formal">Formal</option>
              <option value="concise">Concise</option>
              <option value="warm">Warm professional</option>
            </select>
          </label>
          <label className="text-sm">
            Length
            <select
              aria-label="Length"
              className={input}
              value={length}
              onChange={(e) => setLength(e.target.value as CoverStart["length"])}
            >
              <option value="standard">Standard · aim for 300–450 words</option>
              <option value="short">Shorten</option>
              <option value="expanded">Expand with available evidence</option>
            </select>
          </label>
          <label className="text-sm">
            Letter date
            <input
              type="date"
              value={date}
              className={input}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        </div>
        <label className="mt-5 flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={useAI}
            onChange={(e) => setUseAI(e.target.checked)}
          />
          Use the three CrewAI agents with Groq. I allow sending selected profile evidence and
          selected-job requirements for this generation. Contact details and signature images stay
          local.
        </label>
        <p className="mt-2 text-xs text-muted-foreground">
          Without this choice, the explicitly labelled local evidence composer is available.
          Provider failure is shown; it is never presented as successful AI generation.
        </p>
        <label className="mt-5 block text-sm">
          Personal sentence (optional)
          <textarea
            className={input}
            maxLength={350}
            value={personal}
            onChange={(e) => setPersonal(e.target.value)}
            placeholder="Add a truthful personal motivation for this role."
          />
        </label>
        {(edit || personal) && (
          <label className="mt-3 flex gap-3 text-sm">
            <input
              type="checkbox"
              checked={attested}
              onChange={(e) => setAttested(e.target.checked)}
            />
            I confirm my supplied text is accurate and appropriate. It will be labelled as
            user-supplied evidence, without changing my confirmed profile.
          </label>
        )}
      </Panel>
      <Panel>
        <h2 className="font-display text-2xl">Your signature</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload your own signature, approve it for this document, and check its placement in the
          PDF preview. No signature is generated.
        </p>
        <label className="mt-4 flex gap-3 text-sm">
          <input
            type="checkbox"
            checked={!includeSignature}
            onChange={(e) => {
              setIncludeSignature(!e.target.checked);
              setSignatureApproved(false);
            }}
          />
          Use a typed name only for the next render; omit the signature image.
        </label>
        {includeSignature && (
          <div className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                Stored signature
                <select
                  className={input}
                  value={signature}
                  onChange={(e) => {
                    setSignature(e.target.value);
                    setSignatureApproved(false);
                  }}
                >
                  <option value="">Upload or select your signature</option>
                  {signatures.data?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.signer_name} · {s.metadata.width} × {s.metadata.height}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Signature width (mm)
                <input
                  className={input}
                  type="number"
                  min={20}
                  max={50}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                />
              </label>
            </div>
            {signature && (
              <div className="max-w-xs rounded-xl border border-border bg-white p-3">
                <PrivateImage
                  key={signature}
                  identity={signature}
                  load={() => api.signatureImage(signature)}
                  label="Selected user-supplied signature"
                />
              </div>
            )}
            <details className="rounded-xl border border-border p-4">
              <summary className="cursor-pointer text-sm">Upload or replace signature</summary>
              <label className="mt-4 block text-sm">
                Signer name
                <input
                  className={input}
                  value={signer}
                  placeholder={readiness.data?.candidate_name || "Confirmed candidate name"}
                  onChange={(e) => setSigner(e.target.value)}
                />
              </label>
              <label className="mt-4 flex gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={ownership}
                  onChange={(e) => setOwnership(e.target.checked)}
                />
                This is my signature. I authorise storing it locally for my cover letters.
              </label>
              <label className="mt-4 block text-sm">
                Signature image
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={!ownership || busy}
                  className={input}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file)
                      void run(async () => {
                        const s = await api.uploadSignature(
                          file,
                          signer || readiness.data?.candidate_name || "",
                        );
                        setSignature(s.id);
                        setSignatureApproved(false);
                        await signatures.refetch();
                        setNotice(
                          "Signature uploaded. Approve it for this letter before rendering.",
                        );
                      });
                  }}
                />
              </label>
              <p className="mt-2 text-xs text-muted-foreground">
                PNG, JPEG or WebP, up to 2 MB. Transparent PNG is preferred. Export SVG to PNG
                first.
              </p>
            </details>
            <label className="flex gap-3 text-sm">
              <input
                type="checkbox"
                checked={signatureApproved}
                disabled={!signature}
                onChange={(e) => setSignatureApproved(e.target.checked)}
              />
              I approve this signature for the next document version.
            </label>
          </div>
        )}
        <p className="mt-4 text-sm" aria-label="Signature status">
          {letter?.data.signature
            ? letter.data.signature.included
              ? "This version includes your approved signature."
              : "This version uses a typed name only, by explicit choice."
            : "An image signature is requested before final rendering unless you explicitly omit it."}
        </p>
      </Panel>
      <Panel>
        {letter && (
          <>
            <p className="text-sm" aria-label="Cover letter state">
              Version {letter.version} · {human(letter.status)}
            </p>
            <p className="mt-2 text-sm" role="status">
              {letter.stage}
            </p>
          </>
        )}
        {!readiness.data?.engine_available && (
          <p className="mt-3 text-sm text-amber-300">
            XeLaTeX/LuaLaTeX is unavailable. Draft generation works; install the documented compiler
            before PDF rendering.
          </p>
        )}
        {letter?.error_code && (
          <p className="mt-3 text-sm" role="alert">
            {human(letter.error_code)}. Source and compilation evidence are retained where
            available. Generate a new version or retry rendering after correcting the reported
            dependency or layout issue.
          </p>
        )}
        {letter?.data.warnings?.map((w) => (
          <p className="mt-3 text-sm text-amber-300" key={w}>
            {w}
          </p>
        ))}
        {letter?.data.validation?.issues.map((issue) => (
          <p key={issue} role="alert" className="mt-3 text-sm">
            {issue}
          </p>
        ))}
        <div className="mt-5 flex flex-wrap items-end gap-3">
          {letter && (
            <label className="text-sm">
              Regenerate
              <select
                className={input}
                value={section}
                onChange={(e) => setSection(e.target.value as typeof section)}
              >
                <option value="all">Full letter</option>
                {letterSections.map((key) => (
                  <option key={key} value={key}>
                    {human(key)}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            className={button}
            disabled={
              !app.data ||
              !readiness.data?.profile_ready ||
              locked ||
              (!!signature && includeSignature && !signatureApproved) ||
              ((edit || !!personal) && !attested)
            }
            onClick={() => void generate()}
          >
            {letter
              ? edit
                ? "Save edits as new version"
                : "Regenerate letter"
              : "Generate cover letter"}
          </button>
          {letter?.operation_active && (
            <button className={button} onClick={() => void action("cancel")}>
              Cancel generation
            </button>
          )}
          {letter &&
            !letter.operation_active &&
            ["waiting_for_signature", "draft_ready", "failed"].includes(letter.status) &&
            letter.data.validation?.valid && (
              <button
                className={button}
                disabled={locked || (includeSignature && (!signature || !signatureApproved))}
                onClick={() => void action("render")}
              >
                Render PDF preview
              </button>
            )}
        </div>
        {content && (
          <div className="mt-6 space-y-5 border-t border-border pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl">Cover-letter text</h2>
              <span className="text-sm">{letter?.data.validation?.word_count} words</span>
              <button
                className={button}
                disabled={locked}
                onClick={() => {
                  setEdit(!edit);
                  setEdits({});
                  setAttested(false);
                }}
              >
                {edit ? "Discard unsaved edits" : "Edit letter"}
              </button>
            </div>
            <p className="text-sm">{content.salutation}</p>
            {letterSections.map((key) =>
              edit ? (
                <label key={key} className="block text-sm">
                  {human(key)}
                  <textarea
                    aria-label={`Edit ${human(key)} paragraph`}
                    className={`${input} min-h-28`}
                    value={edits[key] ?? content[key]}
                    onChange={(e) => setEdits({ ...edits, [key]: e.target.value })}
                  />
                </label>
              ) : (
                content[key] && (
                  <p key={key} className="whitespace-pre-wrap text-sm leading-7">
                    {content[key]}
                  </p>
                )
              ),
            )}
            <p className="text-sm leading-7">
              Yours faithfully,
              <br />
              {content.signature_name}
            </p>
            {edit && (
              <p className="text-sm text-amber-300">
                Unsaved text is not reflected in the PDF. Save as a new version, then render and
                review it.
              </p>
            )}
          </div>
        )}
      </Panel>
      {letter?.preview_available && (
        <Panel>
          <h2 className="mb-5 font-display text-2xl">PDF preview</h2>
          <PrivateImage
            key={letter.id + letter.revision}
            identity={letter.id + letter.revision}
            load={() => api.coverArtifact(letter.id, "preview")}
            label="Rendered cover-letter PDF page"
          />
          <div className="mt-5 flex flex-wrap gap-3">
            <button className={button} disabled={locked} onClick={() => void download("pdf")}>
              Download PDF
            </button>
            <button className={button} disabled={locked} onClick={() => void download("source")}>
              Download LaTeX source
            </button>
          </div>
          {letter.status === "preview_ready" && (
            <div className="mt-5 space-y-4">
              <label className="flex gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={reviewed}
                  disabled={edit}
                  onChange={(e) => setReviewed(e.target.checked)}
                />
                I reviewed this PDF, the factual claims, contact details and signature placement. I
                approve this exact version.
              </label>
              <button
                className={button}
                disabled={!reviewed || locked || edit}
                onClick={() => void action("approve")}
              >
                Approve PDF version
              </button>
            </div>
          )}
          {letter.status === "approved" && (
            <button
              className={`${button} mt-5`}
              disabled={locked || edit}
              onClick={() => void action("attach")}
            >
              Attach approved PDF to this application
            </button>
          )}
          {letter.status === "attached" && (
            <p className="mt-5 text-sm">
              Attached to the selected application. Review application fields and document choices
              before any external prefill.
            </p>
          )}
        </Panel>
      )}
      {letter && (
        <Panel>
          <details>
            <summary className="cursor-pointer text-sm">
              Evidence, validation and document audit
            </summary>
            <div className="mt-5 space-y-5 text-sm">
              <p>
                Engine: {letter.data.provider?.engine || "Preparing"} ·{" "}
                {letter.data.provider?.model || "Local"} ·{" "}
                {human(letter.data.provider?.status || "pending")}
              </p>
              {letter.data.provider?.correction && <p>{letter.data.provider.correction}</p>}
              {letter.data.provider?.agents?.map((agent) => (
                <p key={agent.name}>
                  {agent.name}: {agent.status}
                </p>
              ))}
              <p>
                Profile revision {letter.profile_revision} · Version {letter.version}. Signature
                inclusion:{" "}
                {letter.data.signature?.included ? "approved user asset" : "not included"}.
              </p>
              <p>
                Job requirements: {letter.data.plan?.job_requirements.join(", ") || "Unavailable"}
              </p>
              <h3 className="font-medium">Confirmed evidence selected</h3>
              {letter.data.plan?.evidence
                .filter((e) => letter.data.plan?.selected_evidence_ids.includes(e.id))
                .map((e) => (
                  <div className="rounded-xl border border-border p-3" key={e.id}>
                    <p className="font-medium">{e.label}</p>
                    <p className="mt-1 leading-6">{e.text}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {e.source} · {e.id}
                    </p>
                  </div>
                ))}
              <h3 className="font-medium">Claims and source references</h3>
              {content?.claims.map((claim) => (
                <p key={claim.id}>
                  {claim.text}{" "}
                  <span className="text-xs text-muted-foreground">
                    [{claim.evidence_ids.join(", ")}]
                  </span>
                </p>
              ))}
              {!!letter.data.validation?.user_sections.length && (
                <p>
                  User-supplied paragraphs:{" "}
                  {letter.data.validation.user_sections.map(human).join(", ")}. These edits are
                  attributed to the user and are not independently verified profile facts.
                </p>
              )}
              {!!letter.data.validation?.retained_sections?.length && (
                <p>
                  Retained unchanged from the previous version:{" "}
                  {letter.data.validation.retained_sections.map(human).join(", ")}.
                </p>
              )}
              <details>
                <summary>Excluded evidence and reasons</summary>
                {letter.data.plan?.excluded.map((e) => (
                  <p className="mt-2" key={e.id}>
                    {e.id}: {e.reason}
                  </p>
                ))}
              </details>
              <p>
                Validation: {letter.data.validation?.valid ? "Passed" : "Pending / failed"}.{" "}
                {letter.data.validation?.grounding}
              </p>
              <p>
                LaTeX source: {letter.source_available ? "Retained privately" : "Not produced yet"}.{" "}
                {letter.data.render?.quality?.visual_check}
              </p>
              {letter.data.render?.attempts.map((attempt) => (
                <p key={attempt.attempt}>
                  Compilation {attempt.attempt}: exit {attempt.exit_code}, timeout{" "}
                  {String(attempt.timeout)}, PDF exists {String(attempt.generated_file_exists)},
                  paragraph spacing {attempt.paragraph_spacing_pt}pt. stdout {attempt.stdout_bytes}{" "}
                  bytes; stderr {attempt.stderr_bytes} bytes. Log: {attempt.log_reference}.{" "}
                  {attempt.quality?.issues.map(human).join(", ")}
                  {attempt.diagnostics?.join(" ")}
                </p>
              ))}
              <p>
                {letter.data.render?.quality?.page_count || 0} pages · embedded fonts{" "}
                {String(letter.data.render?.quality?.fonts_embedded || false)} · selectable text{" "}
                {String(letter.data.render?.quality?.selectable_text || false)}
              </p>
              {letter.source_available && (
                <button className={button} onClick={() => void download("source")}>
                  Download retained source
                </button>
              )}
              {!!letter.data.render?.attempts.length && (
                <button className={button} onClick={() => void download("compile-log")}>
                  Download private compilation log
                </button>
              )}
              <h3 className="font-medium">Document history</h3>
              {letter.data.history?.map((h, i) => (
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
