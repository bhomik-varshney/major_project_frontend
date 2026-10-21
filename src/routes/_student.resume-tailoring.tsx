import { createFileRoute } from "@tanstack/react-router";
import { ResumeTailoringPage } from "@/components/workspace/ResumeTailoringPage";
export const Route = createFileRoute("/_student/resume-tailoring")({
  head: () => ({ meta: [{ title: "Resume tailoring — Ascendra" }] }),
  validateSearch: (search: Record<string, unknown>): { application?: string } => ({
    ...(typeof search["application"] === "string" ? { application: search["application"] } : {}),
  }),
  component: ResumeRoute,
});
function ResumeRoute() {
  return <ResumeTailoringPage {...Route.useSearch()} />;
}
