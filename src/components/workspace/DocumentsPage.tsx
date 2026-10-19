import { useRef, useState, type DragEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, FileText, FolderOpen, ShieldCheck, Trash2, UploadCloud, X } from "lucide-react";
import { api } from "@/services/api/client";
import { documentsQuery, policyQuery, summaryQuery } from "@/services/api/queries";
import type { CareerDocument } from "@/services/api/types";
import { ErrorNotice, LoadingCards, PageHeading, Panel } from "./shared";
import { formatDate } from "@/lib/workspace-date";
import { DocumentReview } from "./DocumentReview";

export function DocumentsPage() {
  const documents = useQuery(documentsQuery);
  const policy = useQuery(policyQuery);
  const client = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [validation, setValidation] = useState("");
  const [notice, setNotice] = useState("");
  const [dragging, setDragging] = useState(false);
  const [deleting, setDeleting] = useState<CareerDocument | null>(null);
  const [selected, setSelected] = useState<CareerDocument | null>(null);
  const upload = useMutation({
    mutationFn: api.upload,
    onSuccess: (stored) => {
      client.setQueryData<CareerDocument[]>(documentsQuery.queryKey, (current) => [
        stored,
        ...(current || []).filter((item) => item.id !== stored.id),
      ]);
      void client.invalidateQueries({ queryKey: summaryQuery.queryKey });
      setNotice(
        stored.processing_status === "uploaded"
          ? "Document saved to your library. Extraction has not started."
          : "This document is already in your library. Its current processing and review status is shown below.",
      );
      setSelected(stored);
    },
  });
  const remove = useMutation({
    mutationFn: api.removeDocument,
    onSuccess: (_, id) => {
      client.setQueryData<CareerDocument[]>(
        documentsQuery.queryKey,
        (current) => current?.filter((item) => item.id !== id) || [],
      );
      void client.invalidateQueries({ queryKey: summaryQuery.queryKey });
      setDeleting(null);
      setSelected((current) => (current?.id === id ? null : current));
      setNotice("Document and its stored contents removed.");
    },
  });
  const selectFile = (file?: File) => {
    setValidation("");
    setNotice("");
    upload.reset();
    if (!file || !policy.data) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !policy.data.formats.includes(extension)) {
      setValidation("Choose a PDF, DOCX, or UTF-8 TXT file.");
      return;
    }
    if (file.size === 0) {
      setValidation("The selected document is empty.");
      return;
    }
    if (file.size > policy.data.max_bytes) {
      setValidation(`Choose a document smaller than ${policy.data.max_bytes / 1024 / 1024} MB.`);
      return;
    }
    upload.mutate(file);
  };
  const drop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    if (!upload.isPending) selectFile(event.dataTransfer.files[0]);
  };
  return (
    <>
      <PageHeading
        eyebrow="The work behind your story"
        title="Your document library."
        description="Keep your resume and supporting documents together. Uploads are stored privately in your local workspace."
      />
      {documents.isPending || policy.isPending ? (
        <LoadingCards />
      ) : documents.isError || policy.isError ? (
        <ErrorNotice
          error={documents.error || policy.error}
          retry={() => {
            void documents.refetch();
            void policy.refetch();
          }}
        />
      ) : (
        <>
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0 space-y-5">
              <Panel light>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-display text-2xl">Make room for your experience.</h2>
                  <span className="career-pill">PDF · DOCX · TXT</span>
                </div>
                <div
                  className={`career-dropzone ${dragging ? "is-dragging" : ""}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={drop}
                  aria-busy={upload.isPending}
                >
                  <UploadCloud className="mx-auto h-8 w-8 text-accent/80" />
                  <h3 className="mt-5 text-sm">
                    {upload.isPending ? "Saving your document…" : "Drop a document here"}
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground">
                    or choose a file from your computer
                  </p>
                  <input
                    ref={input}
                    id="career-document-input"
                    className="sr-only"
                    type="file"
                    aria-label="Upload document"
                    accept=".pdf,.docx,.txt"
                    disabled={upload.isPending}
                    onChange={(event) => {
                      selectFile(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    className="btn-ghost mt-6 !py-2.5 !text-xs"
                    disabled={
                      upload.isPending || documents.data.length >= policy.data.max_documents
                    }
                    onClick={() => input.current?.click()}
                  >
                    {upload.isPending ? "Uploading…" : "Choose document"}
                  </button>
                  <p className="mt-4 text-[10px] text-muted-foreground">
                    Up to {policy.data.max_bytes / 1024 / 1024} MB per file ·{" "}
                    {policy.data.max_documents} documents per workspace
                  </p>
                </div>
                <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                  Upload first, then process and review the proposed fields below. An upload never
                  adds or verifies profile facts automatically.
                </p>
              </Panel>
              {validation && <ErrorNotice error={new Error(validation)} />}
              {upload.isError && <ErrorNotice error={upload.error} />}
              {notice && (
                <p className="career-success" role="status">
                  <Check className="h-4 w-4" />
                  {notice}
                </p>
              )}
              {selected && (
                <DocumentReview
                  key={selected.id}
                  document={selected}
                  policy={policy.data}
                  onClose={() => setSelected(null)}
                />
              )}
              <Panel>
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl">Saved documents</h2>
                  <span className="career-pill">
                    {documents.data.length} {documents.data.length === 1 ? "file" : "files"}
                  </span>
                </div>
                {documents.data.length === 0 ? (
                  <div className="py-14 text-center">
                    <span className="career-icon mx-auto">
                      <FolderOpen className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 text-sm">A little space for your work.</h3>
                    <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
                      No documents yet. Upload a resume or supporting document to start your
                      library.
                    </p>
                  </div>
                ) : (
                  <ul className="mt-6 divide-y divide-border">
                    {documents.data.map((document) => (
                      <li key={document.id} className="flex items-start gap-3 py-5">
                        <span className="career-icon !h-10 !w-10 shrink-0">
                          <FileText className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm">{document.filename}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {(document.size_bytes / 1024).toFixed(1)} KB ·{" "}
                            {formatDate(document.created_at)}
                          </p>
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            <span className="career-pill !text-[9px]">Stored</span>
                            <span className="career-pill !text-[9px] text-muted-foreground">
                              {(
                                {
                                  uploaded: "Extraction not started",
                                  queued: "Queued",
                                  processing: "Processing",
                                  awaiting_review: "Awaiting user verification",
                                  verified: "Verified",
                                  failed: "Extraction failed",
                                  rejected: "Rejected",
                                  needs_correction: "Needs correction",
                                  cancelled: "Cancelled",
                                } as Record<string, string>
                              )[document.processing_status] || "Extraction not started"}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="mt-3 text-[11px] text-accent underline underline-offset-4"
                            aria-label={`Review ${document.filename}`}
                            onClick={() => {
                              setSelected(document);
                              setNotice("");
                            }}
                          >
                            Open processing & review
                          </button>
                          {deleting?.id === document.id && (
                            <div className="mt-4 rounded-lg border border-rose-gold/25 p-3">
                              <p className="text-xs leading-relaxed">
                                Remove this document and its extracted text? Confirmed profile facts
                                remain. This cannot be undone.
                              </p>
                              <div className="mt-3 flex flex-wrap gap-3">
                                <button
                                  className="career-remove"
                                  disabled={remove.isPending}
                                  onClick={() => remove.mutate(document.id)}
                                >
                                  {remove.isPending ? "Removing…" : "Remove permanently"}
                                </button>
                                <button
                                  className="text-xs text-muted-foreground"
                                  disabled={remove.isPending}
                                  onClick={() => setDeleting(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-rose-gold"
                          aria-label={`Remove ${document.filename}`}
                          disabled={remove.isPending}
                          onClick={() => {
                            setDeleting(document);
                            remove.reset();
                            setNotice("");
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {remove.isError && (
                  <div className="mt-4">
                    <ErrorNotice error={remove.error} />
                  </div>
                )}
              </Panel>
            </div>
            <aside className="space-y-5">
              <Panel className="border-accent/20">
                <ShieldCheck className="h-6 w-6 text-accent" />
                <h2 className="mt-5 font-display text-2xl">A private starting point.</h2>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  Your files stay in the local database. Processing is local by default. The
                  optional CrewAI workflow uses Groq and sends extracted text only when you choose
                  it for a run. Nothing is sent to job platforms.
                </p>
                <div className="mt-5 border-t border-border pt-5">
                  <p className="text-xs">What happens after upload?</p>
                  <ol className="mt-3 space-y-3 text-[11px] leading-relaxed text-muted-foreground">
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                      The file format and size are checked.
                    </li>
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                      The document is saved to your library.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full border border-muted-foreground" />
                      Process, correct, and confirm selected profile information.
                    </li>
                  </ol>
                </div>
              </Panel>
              <Panel>
                <p className="eyebrow !text-[9px]">Good to know</p>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  Password-protected or corrupt files cannot be stored. Scanned PDFs can be stored,
                  but cannot be extracted because OCR is not available.
                </p>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  Uploading the same content twice keeps a single copy.
                </p>
              </Panel>
            </aside>
          </div>
        </>
      )}
    </>
  );
}
