import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/workspace/ProfilePage";

export const Route = createFileRoute("/_student/profile")({
  head: () => ({ meta: [{ title: "Profile — CareerOS" }] }),
  component: ProfilePage,
});
