import { createFileRoute } from "@tanstack/react-router";
import { MatchesPage } from "@/components/workspace/MatchesPage";
export const Route = createFileRoute("/_student/matches")({
  head: () => ({ meta: [{ title: "Your matches — Ascendra" }] }),
  component: MatchesPage,
});
