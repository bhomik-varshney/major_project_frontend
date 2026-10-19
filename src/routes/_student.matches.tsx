import { createFileRoute } from "@tanstack/react-router";
import { PlannedPage } from "@/components/workspace/shared";

export const Route = createFileRoute("/_student/matches")({
  head: () => ({ meta: [{ title: "Your matches — CareerOS" }] }),
  component: () => (
    <PlannedPage
      title="Your matches"
      description="Understand how your reviewed profile relates to each opportunity."
    />
  ),
});
