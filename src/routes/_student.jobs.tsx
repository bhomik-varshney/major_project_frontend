import { createFileRoute } from "@tanstack/react-router";
import { PlannedPage } from "@/components/workspace/shared";

export const Route = createFileRoute("/_student/jobs")({
  head: () => ({ meta: [{ title: "Opportunity discovery — CareerOS" }] }),
  component: () => (
    <PlannedPage
      title="Opportunity discovery"
      description="Find opportunities that fit your direction, with clear sources and freshness."
    />
  ),
});
