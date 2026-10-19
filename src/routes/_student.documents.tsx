import { createFileRoute } from "@tanstack/react-router";
import { DocumentsPage } from "@/components/workspace/DocumentsPage";

export const Route = createFileRoute("/_student/documents")({
  head: () => ({ meta: [{ title: "Documents — Ascendra" }] }),
  component: DocumentsPage,
});
