import { createFileRoute } from "@tanstack/react-router";
import { ApplicationsPage } from "@/components/workspace/ApplicationsPage";

export const Route = createFileRoute("/_student/applications")({
  head: () => ({ meta: [{ title: "Your applications — Ascendra" }] }),
  validateSearch: (search: Record<string, unknown>): { job?: string; run?: string } => ({
    ...(typeof search["job"] === "string" ? { job: search["job"] } : {}),
    ...(typeof search["run"] === "string" ? { run: search["run"] } : {}),
  }),
  component: ApplicationsRoute,
});

function ApplicationsRoute() {
  const search = Route.useSearch();
  return <ApplicationsPage {...search} />;
}
