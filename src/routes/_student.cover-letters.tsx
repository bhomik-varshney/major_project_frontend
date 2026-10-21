import { createFileRoute } from "@tanstack/react-router";
import { CoverLettersPage } from "@/components/workspace/CoverLettersPage";

export const Route = createFileRoute("/_student/cover-letters")({
  head: () => ({ meta: [{ title: "Cover letters — Ascendra" }] }),
  validateSearch: (search: Record<string, unknown>): { application?: string } => ({
    ...(typeof search["application"] === "string" ? { application: search["application"] } : {}),
  }),
  component: CoverLettersRoute,
});
function CoverLettersRoute() {
  return <CoverLettersPage {...Route.useSearch()} />;
}
