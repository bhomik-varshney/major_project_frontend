import { createFileRoute } from "@tanstack/react-router";
import { PlannedPage } from "@/components/workspace/shared";

export const Route = createFileRoute("/_student/applications")({
  head: () => ({ meta: [{ title: "Your applications — Ascendra" }] }),
  component: () => (
    <PlannedPage
      title="Your applications"
      description="Keep track of reviewed drafts, decisions, and your next steps."
    />
  ),
});
