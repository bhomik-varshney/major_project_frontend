import { useState } from "react";
import type { FilterAudit } from "@/services/api/types";

export function JobFilterAudit({
  audit,
  extra,
}: {
  audit?: FilterAudit | undefined;
  extra?: unknown;
}) {
  const [exclusionQuery, setExclusionQuery] = useState("");
  const exclusions = audit?.excluded_jobs;
  const matchingExclusions = exclusions?.filter((row) =>
    `${row.job_id} ${row.reason}`.toLowerCase().includes(exclusionQuery.trim().toLowerCase()),
  );
  const preview = audit
    ? {
        ...audit,
        excluded_jobs: matchingExclusions?.slice(0, 100),
        exclusion_preview: {
          available: exclusions !== undefined,
          total: exclusions?.length ?? null,
          matching_search: matchingExclusions?.length ?? null,
          shown: matchingExclusions?.slice(0, 100).length ?? null,
        },
      }
    : undefined;
  return (
    <details className="mt-4 rounded-lg border border-border p-4 text-xs">
      <summary className="cursor-pointer text-accent">Search and filter diagnostics</summary>
      {audit ? (
        <>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {audit.total_jobs} listings before filters → {audit.after_hard_filters} after hard
            filters.{" "}
            {audit.first_empty_filter
              ? `The first filter to remove every remaining job was ${audit.first_empty_filter}.`
              : "No stage removed every candidate."}{" "}
            Score thresholds apply after retrieval and ranking.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table
              className="w-full text-left text-[11px]"
              aria-label="Candidate counts after each filter"
            >
              <thead>
                <tr>
                  <th className="pb-2">Filter</th>
                  <th>Before</th>
                  <th>Kept</th>
                  <th>Excluded</th>
                </tr>
              </thead>
              <tbody>
                {audit.steps.map((step) => (
                  <tr key={step.filter} className="border-t border-border">
                    <th className="py-2 font-normal">{step.filter.replaceAll("_", " ")}</th>
                    <td>{step.input_count}</td>
                    <td>{step.kept_count}</td>
                    <td>{step.excluded_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer text-accent">
              Exact request, normalized filters and exclusions
            </summary>
            {exclusions !== undefined && (
              <label className="mt-3 block text-muted-foreground">
                Find an excluded job by ID or reason
                <input
                  className="mt-2 block w-full rounded-lg border border-border bg-background p-2 text-foreground"
                  value={exclusionQuery}
                  onChange={(event) => setExclusionQuery(event.target.value)}
                />
                <span className="mt-2 block">
                  Showing up to 100 of {matchingExclusions?.length} matching exclusions. Search to
                  inspect any excluded listing without rendering the entire dataset.
                </span>
              </label>
            )}
            <pre
              aria-label="Search request audit JSON"
              className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-secondary/30 p-3 text-[10px]"
            >
              {JSON.stringify({ audit: preview, result_diagnostics: extra }, null, 2)}
            </pre>
          </details>
        </>
      ) : (
        <p className="mt-3 text-muted-foreground">
          This saved run predates filter-stage diagnostics. Start a new run to trace the current
          normalization and filter counts.
        </p>
      )}
    </details>
  );
}
