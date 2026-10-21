import type { ApplicationPreview, RepeatedEntry } from "@/services/api/application-preview-types";
import { Panel } from "./shared";
const readable = (text: string) => text.replaceAll("_", " ");
export function ProfileEntryCards({ entries }: { entries: RepeatedEntry[] }) {
  return (
    <div className="mt-4 grid gap-3 lg:grid-cols-2">
      {!!entries.length && (
        <p className="text-xs text-muted-foreground lg:col-span-2">
          Confirmed profile reference. Only the reviewed form fields are sent during prefill.
        </p>
      )}
      {entries.map((entry, index) => (
        <article
          key={index}
          className="min-w-0 rounded-xl border border-border bg-background/40 p-4"
          data-testid="profile-entry-card"
        >
          <h4 className="break-words text-sm font-medium">{entry.title}</h4>
          {entry.subtitle && <p className="mt-1 text-sm text-accent">{entry.subtitle}</p>}
          <dl className="mt-3 space-y-1 text-xs">
            {Object.entries(entry.details).map(([key, value]) => (
              <div key={key}>
                <dt className="inline text-muted-foreground">{key}: </dt>
                <dd className="inline break-words">{value}</dd>
              </div>
            ))}
          </dl>
          {!!entry.bullets.length && (
            <ul className="mt-3 list-disc space-y-2 pl-4 text-xs text-muted-foreground">
              {entry.bullets.map((value, i) => (
                <li key={i} className="whitespace-pre-wrap break-words">
                  {value}
                </li>
              ))}
            </ul>
          )}
          {entry.links.map((link, i) => (
            <a
              key={i}
              className="mt-2 block break-all text-xs text-accent underline"
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
            >
              {link.label}: {link.url}
            </a>
          ))}
        </article>
      ))}
    </div>
  );
}
export function ApplicationPresentation({
  preview,
  edit,
}: {
  preview: ApplicationPreview;
  edit: () => void;
}) {
  return (
    <section aria-label="Application preview" className="scroll-mt-40 space-y-5">
      <Panel>
        <p className="eyebrow">
          {preview.is_mock ? "Mock application preview" : "Application preview"} ·{" "}
          {preview.engine === "local_mcp"
            ? "Generated through local MCP"
            : preview.engine === "legacy_local"
              ? "Existing draft — generate MCP preview to refresh"
              : "Local preview fallback"}
        </p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-3xl">{preview.title}</h3>
            <p className="mt-2 text-sm">{preview.company}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Source: {readable(preview.source) || "Not provided"}
            </p>
          </div>
          <button className="rounded-xl border border-border px-4 py-3 text-sm" onClick={edit}>
            Edit application fields
          </button>
        </div>
        {preview.application_url && (
          <p className="mt-4 break-all text-xs">
            Application URL:{" "}
            <a
              href={preview.application_url}
              className="text-accent underline"
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
            >
              {preview.application_url}
            </a>
          </p>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Preview and prefill do not submit an application. All populated values require your
          approval.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <span>
            {preview.missing_fields.filter((f) => f.required).length} required inputs missing
          </span>
          <span>
            {preview.mappings.filter((f) => f.status === "unsupported").length} unsupported controls
          </span>
          <span>
            {
              preview.sections
                .flatMap((section) => section.fields)
                .filter((field) => field.sensitive).length
            }{" "}
            sensitive fields
          </span>
        </div>
      </Panel>
      {preview.sections.map((section) => (
        <Panel key={section.id}>
          <details
            open={
              section.entries.length > 0 ||
              section.links.length > 0 ||
              section.fields.some(
                (f) => (f.display_value !== null && f.display_value !== "") || f.required,
              )
            }
          >
            <summary className="cursor-pointer font-display text-xl">{section.label}</summary>
            <ProfileEntryCards entries={section.entries} />
            {!!section.links.length && (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {section.links.map((link, index) => (
                  <li key={index} className="min-w-0 rounded-xl border border-border p-3 text-xs">
                    <span className="block text-muted-foreground">
                      {link.label}
                      {link.primary ? " · primary" : ""}
                    </span>
                    <a
                      className="mt-2 block break-all text-accent underline"
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      referrerPolicy="no-referrer"
                    >
                      {link.url}
                    </a>
                    <small className="mt-2 block text-muted-foreground">{link.evidence}</small>
                  </li>
                ))}
              </ul>
            )}
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {section.fields.map((field) => (
                <div
                  key={field.field_id}
                  className={`min-w-0 rounded-xl border border-border p-4 ${field.input_type === "textarea" ? "sm:col-span-2" : ""}`}
                >
                  <dt className="text-sm">
                    {field.label}
                    {field.required ? " *" : ""}
                  </dt>
                  <dd className="mt-2 whitespace-pre-wrap break-words text-sm">
                    {field.display_value === null ||
                    field.display_value === "" ||
                    (Array.isArray(field.display_value) && !field.display_value.length) ? (
                      <span className="text-muted-foreground">
                        {field.reason || "Not provided"}
                      </span>
                    ) : typeof field.display_value === "boolean" ? (
                      field.display_value ? (
                        "Yes"
                      ) : (
                        "No"
                      )
                    ) : Array.isArray(field.display_value) ? (
                      field.display_value.join(", ")
                    ) : (
                      field.display_value
                    )}
                  </dd>
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    {readable(field.status)} · {field.source_label}
                    {field.confidence > 0
                      ? ` · ${Math.round(field.confidence * 100)}% confidence`
                      : ""}{" "}
                    · {field.approved ? "Reviewed" : "Review required"}
                  </p>
                  {field.answer?.detailed && (
                    <details className="mt-3 text-xs">
                      <summary className="cursor-pointer">Detailed draft and evidence</summary>
                      <p className="mt-2 whitespace-pre-wrap">{field.answer.detailed}</p>
                      <p className="mt-2 text-muted-foreground">
                        Evidence: {field.answer.evidence.join("; ")}
                      </p>
                      <p className="mt-2 text-accent">
                        {field.answer.reason || "Generated draft. Review before use."}
                      </p>
                    </details>
                  )}
                </div>
              ))}
            </dl>
            {!section.entries.length && !section.links.length && !section.fields.length && (
              <p className="mt-3 text-xs text-muted-foreground">
                No confirmed information available for this section.
              </p>
            )}
          </details>
        </Panel>
      ))}
      <Panel>
        <h3 className="font-display text-xl">Selected documents</h3>
        {!preview.documents.length ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No documents selected. Choose reviewed files in Form view.
          </p>
        ) : (
          preview.documents.map((doc, index) => (
            <p key={index} className="mt-3 break-words text-sm">
              {doc.label} · {readable(doc.role)} · {doc.size_bytes} bytes · {doc.content_type} ·{" "}
              {doc.approved ? "Approved for review snapshot" : "Review needed"}
            </p>
          ))
        )}
      </Panel>
    </section>
  );
}
