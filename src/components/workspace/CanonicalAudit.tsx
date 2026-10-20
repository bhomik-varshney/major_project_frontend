import type { ProcessingAudit } from "@/services/api/types";

const human = (s: string) => s.replaceAll("_", " ");
const detail = (value: unknown) => (
  <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-secondary/30 p-3 text-[10px]">
    {JSON.stringify(value, null, 2)}
  </pre>
);
function Fold({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="min-w-0 rounded-xl border border-border p-4">
      <summary className="cursor-pointer text-xs">{title}</summary>
      <div className="mt-4 min-w-0 space-y-3 text-xs leading-relaxed text-muted-foreground">
        {children}
      </div>
    </details>
  );
}
export function CanonicalAudit({ data }: { data: ProcessingAudit }) {
  const graph = data.canonical;
  if (!graph)
    return (
      <Fold title="Connected representation">
        <p>
          This extraction predates the connected pipeline. Reprocess to create a validated canonical
          representation.
        </p>
      </Fold>
    );
  const raw = new Map(data.raw_evidence?.map((e) => [e.evidence_id, e]));
  return (
    <>
      <Fold title={`Connected canonical representation · ${graph.entities.length} entities`}>
        <p className="text-foreground">
          {graph.schema_version} · {graph.relations.length} relationships ·{" "}
          {data.canonical_status ? human(data.canonical_status) : "review required"}
        </p>
        <p>
          This source snapshot remains separate from your edits and confirmed profile. Withheld
          values do not enter the editable draft.
        </p>
        <div className="max-h-[36rem] space-y-3 overflow-auto">
          {graph.entities.map((e) => (
            <details key={e.entity_id} className="rounded-lg border border-blue-400/20 p-3">
              <summary className="cursor-pointer text-foreground">
                {human(e.bucket)} · {e.entity_id} · {human(e.status)}
              </summary>
              <div className="mt-3 space-y-3">
                {Object.values(e.fields).map((f) => (
                  <details
                    key={f.fact_id}
                    className={`rounded-lg border p-3 ${f.status === "supported" ? "border-emerald-400/30" : f.status === "conflict" || f.status === "unsupported" ? "border-red-400/35" : "border-amber-400/30"}`}
                  >
                    <summary className="cursor-pointer break-words text-foreground">
                      {f.profile_path}: {f.value ?? "Withheld — unsupported"}{" "}
                      <span
                        className={
                          f.status === "supported"
                            ? "text-emerald-400"
                            : f.status === "conflict" || f.status === "unsupported"
                              ? "text-red-400"
                              : "text-amber-400"
                        }
                      >
                        · {human(f.status)}
                      </span>
                    </summary>
                    <p className="mt-3 whitespace-pre-wrap break-words">
                      Original wording: {f.original_text || "No source quote"}
                    </p>
                    {f.proposed_value && (
                      <p className="mt-2 text-red-400">
                        Proposed value withheld: {f.proposed_value}
                      </p>
                    )}
                    <p className="mt-2">
                      {f.page ? `Page ${f.page} · ` : ""}
                      {f.extraction_methods.join(" + ")} · {f.confidence.label} confidence ·{" "}
                      {f.evidence_ids.join(", ")}
                    </p>
                    <p>{f.confidence.basis}</p>
                    <p className="mt-2">Related entities: {f.related_entities.join(", ")}</p>
                    {f.warnings.map((w) => (
                      <p className="mt-2 text-amber-400" key={w}>
                        {w}
                      </p>
                    ))}
                    {f.evidence_ids.map((id) => {
                      const ev = raw.get(id);
                      return ev ? (
                        <details key={id} className="mt-2">
                          <summary
                            className={`cursor-pointer ${ev.extraction_method === "ocr" ? "text-purple-400" : "text-blue-400"}`}
                          >
                            Evidence {id} · block {ev.source_block_id}
                          </summary>
                          <p className="mt-2 whitespace-pre-wrap break-words">{ev.source_text}</p>
                          {ev.coordinates && detail(ev.coordinates)}
                        </details>
                      ) : null;
                    })}
                    {f.profile_path && (
                      <a
                        href={`#resume-field-${f.profile_path.split(".")[0]}`}
                        className="mt-3 inline-block text-accent underline"
                      >
                        Review or correct in draft
                      </a>
                    )}
                  </details>
                ))}
              </div>
            </details>
          ))}
        </div>
        <details>
          <summary className="cursor-pointer text-blue-400">
            Sections and entity relationships
          </summary>
          {detail({ sections: graph.sections, relations: graph.relations })}
        </details>
      </Fold>
      <Fold title="Canonical validation checks">
        <p
          className={
            data.canonical_validation?.critical_passed ? "text-emerald-400" : "text-red-400"
          }
        >
          {data.canonical_validation?.critical_passed
            ? "Critical source checks passed"
            : "Some canonical claims failed checks and require review"}
        </p>
        <p>
          {data.canonical_validation?.checked_fields} fields inspected ·{" "}
          {data.canonical_validation?.supported_fields} source-supported ·{" "}
          {data.canonical_validation?.unsupported_fields} unsupported
        </p>
        <p>Source support is not factual verification or candidate confirmation.</p>
        <div className="max-h-80 space-y-2 overflow-auto">
          {data.canonical_validation?.issues.map((i, index) => (
            <p key={index} className={i.severity === "failure" ? "text-red-400" : "text-amber-400"}>
              {i.field} · {human(i.code)}: {i.message}
            </p>
          ))}
        </div>
      </Fold>
      <Fold title={`Verification and repair iterations · ${data.repair_iterations?.length ?? 0}`}>
        <p>
          Maximum model repair cycles: {data.canonical_workflow?.maximum_repair_cycles}. Cycle 0
          performs local source reconciliation.
        </p>
        {data.repair_iterations?.map((r) => (
          <details key={r.iteration} className="rounded-lg border border-border p-3">
            <summary className="cursor-pointer text-foreground">
              Iteration {r.iteration} · {human(r.outcome)} · {r.elapsed_ms} ms
            </summary>
            <p className="mt-2">{r.repair_action}</p>
            <p className="mt-2">
              {r.provider} · {r.model || "No model"} · affected fields:{" "}
              {r.affected_fields.join(", ") || "none"}
            </p>
            {r.error_code && <p className="mt-2 text-amber-400">{human(r.error_code)}</p>}
            {detail({
              detected_problems: r.detected_problems,
              changes: r.changes,
              validation: r.validation_result,
            })}
          </details>
        ))}
      </Fold>
      <Fold title={`Source conflicts · ${graph.conflicts.length}`}>
        {graph.conflicts.length === 0 ? (
          <p>
            No competing readings were recorded. Review confidence and source evidence before
            confirming.
          </p>
        ) : (
          graph.conflicts.map((c) => (
            <div className="rounded-lg border border-red-400/35 p-3" key={c.conflict_id}>
              <p className="text-red-400">
                {c.field} · {human(c.resolution)}
              </p>
              <p className="mt-2">{c.message}</p>
              {c.alternatives.map((a, i) => (
                <p key={i} className="mt-2 break-words">
                  <strong>{a.extraction_method}</strong>: {a.value}
                  {a.page ? ` · page ${a.page}` : ""} · blocks{" "}
                  {a.source_block_ids.join(", ") || "unresolved"}
                </p>
              ))}
            </div>
          ))
        )}
      </Fold>
      <Fold title="Canonical workflow tasks">
        <p>
          {data.canonical_workflow?.engine} · source analysis, connected graph, bounded repair and
          review preparation
        </p>
        {data.canonical_workflow?.tasks.map((t) => (
          <p key={t.name}>
            {t.label} · {t.status} · {t.method} · {t.elapsed_ms} ms
          </p>
        ))}
      </Fold>
    </>
  );
}
