import { createFileRoute } from "@tanstack/react-router";
import { PlannedPage } from "@/components/workspace/shared";

export const Route = createFileRoute("/_student/skill-gaps")({
  head: () => ({ meta: [{ title: "Room to grow — CareerOS" }] }),
  component: () => (
    <PlannedPage
      title="Room to grow"
      description="Explore the skills your target roles ask for, grounded in evidence."
    />
  ),
});
