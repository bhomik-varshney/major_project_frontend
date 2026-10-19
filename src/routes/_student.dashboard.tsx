import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/workspace/Dashboard";

export const Route = createFileRoute("/_student/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Ascendra" }] }),
  component: Dashboard,
});
