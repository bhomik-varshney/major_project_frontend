import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/workspace/SettingsPage";

export const Route = createFileRoute("/_student/settings")({
  head: () => ({ meta: [{ title: "Settings — CareerOS" }] }),
  component: SettingsPage,
});
