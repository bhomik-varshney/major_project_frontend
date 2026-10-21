import { createFileRoute } from "@tanstack/react-router";
import { SkillGapsPage } from "@/components/workspace/SkillGapsPage";

export const Route = createFileRoute("/_student/skill-gaps")({
  head: () => ({ meta: [{ title: "Room to grow — Ascendra" }] }),
  validateSearch: (
    search: Record<string, unknown>,
  ): { job?: string; run?: string; ids?: string } => ({
    ...(typeof search["job"] === "string" ? { job: search["job"] } : {}),
    ...(typeof search["run"] === "string" ? { run: search["run"] } : {}),
    ...(typeof search["ids"] === "string" ? { ids: search["ids"] } : {}),
  }),
  component: SkillGapRoute,
});

function SkillGapRoute() {
  const search = Route.useSearch();
  return (
    <SkillGapsPage
      initialJob={search.job || ""}
      initialRun={search.run || ""}
      initialIds={search.ids || ""}
    />
  );
}
