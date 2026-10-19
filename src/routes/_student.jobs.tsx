import { createFileRoute } from "@tanstack/react-router";
import { JobsPage } from "@/components/workspace/JobsPage";

export const Route = createFileRoute("/_student/jobs")({
  head: () => ({ meta: [{ title: "Demo opportunities — Ascendra" }] }),
  component: JobsPage,
});
