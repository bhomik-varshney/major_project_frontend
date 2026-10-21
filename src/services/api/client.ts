import type { GapRun, GapPage, GapStart } from "./skill-gap-types";
import type { CoverLetter, CoverStart, Signature } from "./cover-letter-types";
import type {
  Application,
  ApplicationAction,
  ApplicationEvent,
  ApplicationReadiness,
  ApplicationSurface,
} from "./application-types";
import type {
  MatchReadiness,
  MatchingRun,
  MatchingPage,
  MatchAudit,
  MatchDetail,
  ResultFilters,
  MatchingStart,
} from "./matching-types";
import type {
  ProcessingAudit,
  ResumeRunSummary,
  RunComparison,
  JobFilters,
  JobOptions,
  JobPage,
  CareerDocument,
  ExtractedData,
  ExtractionStatus,
  Health,
  Profile,
  ProfileInput,
  Summary,
  UploadPolicy,
} from "./types";

const configured = import.meta.env["VITE_API_BASE_URL"] as string | undefined;
export const apiBaseUrl = (configured?.trim() || "/api/v1").replace(/\/+$/, "");
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
    public code = "network_error",
    public operationId = "",
    public fields: { field: string; message: string }[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let session: Promise<void> | undefined;
async function request<T>(
  path: string,
  init: RequestInit = {},
  callerSignal?: AbortSignal,
  binary = false,
): Promise<T> {
  const controller = new AbortController();
  // MCP read-only discovery/resource calls may make one bounded retry.
  const timeout = setTimeout(
    () => controller.abort(),
    /\/applications\/[^/]+\/mcp\/(resource|tools)$/.test(path) ? 70_000 : 15_000,
  );
  const onAbort = () => controller.abort();
  callerSignal?.addEventListener("abort", onAbort, { once: true });
  if (callerSignal?.aborted) controller.abort();
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      credentials: "include",
      signal: controller.signal,
      headers: { "X-Workspace-Client": "careeros-web", ...init.headers },
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: {
          message: string;
          code: string;
          operation_id: string;
          fields?: { field: string; message: string }[];
        };
      } | null;
      if (response.status === 401) session = undefined;
      throw new ApiError(
        body?.error?.message || "The request could not be completed. Try again.",
        response.status,
        body?.error?.code || "request_error",
        body?.error?.operation_id || "",
        body?.error?.fields || [],
      );
    }
    if (response.status === 204) return undefined as T;
    return (binary ? await response.blob() : await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (callerSignal?.aborted) throw error;
    throw new ApiError(
      controller.signal.aborted
        ? "The request took too long. Reconnect and try again."
        : "We couldn’t reach your workspace. Check the connection and try again.",
    );
  } finally {
    clearTimeout(timeout);
    callerSignal?.removeEventListener("abort", onAbort);
  }
}

function ensureSession(): Promise<void> {
  if (!session) {
    session = request("/session", { method: "POST" })
      .then(() => undefined)
      .catch((error: unknown) => {
        session = undefined;
        throw error;
      });
  }
  return session;
}

async function privateRequest<T>(
  path: string,
  init: RequestInit = {},
  signal?: AbortSignal,
  binary = false,
): Promise<T> {
  await ensureSession();
  return request<T>(path, init, signal, binary);
}
const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const api = {
  coverReadiness: () =>
    privateRequest<{
      engine_available: boolean;
      fonts_available: boolean;
      profile_ready: boolean;
      candidate_name: string;
      groq_configured: boolean;
      message: string;
    }>("/cover-letters/readiness"),
  coverLetters: (application: string) =>
    privateRequest<CoverLetter[]>(
      `/cover-letters?${new URLSearchParams({ application_id: application })}`,
    ),
  coverLetter: (id: string) =>
    privateRequest<CoverLetter>(`/cover-letters/${encodeURIComponent(id)}`),
  createCoverLetter: (application: string, body: CoverStart) =>
    privateRequest<CoverLetter>(
      `/cover-letters/applications/${encodeURIComponent(application)}`,
      json("POST", body),
    ),
  coverAction: (
    id: string,
    body: {
      action: "render" | "approve" | "attach" | "cancel";
      expected_revision: number;
      expected_application_revision?: number;
      reviewed?: boolean;
      signature_id?: string;
      include_signature?: boolean;
      signature_approved?: boolean;
      signature_width_mm?: number;
    },
  ) =>
    privateRequest<CoverLetter>(
      `/cover-letters/${encodeURIComponent(id)}/actions`,
      json("POST", body),
    ),
  coverArtifact: (id: string, kind: "pdf" | "preview" | "source" | "compile-log") =>
    privateRequest<Blob>(
      `/cover-letters/${encodeURIComponent(id)}/artifacts/${kind}`,
      {},
      undefined,
      true,
    ),
  signatures: () => privateRequest<Signature[]>("/cover-letters/signatures"),
  uploadSignature: (file: File, name: string) => {
    const form = new FormData();
    form.set("file", file);
    form.set("signer_name", name);
    form.set("approved", "true");
    return privateRequest<Signature>("/cover-letters/signatures", { method: "POST", body: form });
  },
  signatureImage: (id: string) =>
    privateRequest<Blob>(
      `/cover-letters/signatures/${encodeURIComponent(id)}/image`,
      {},
      undefined,
      true,
    ),
  applicationReadiness: (signal?: AbortSignal) =>
    privateRequest<ApplicationReadiness>("/applications/readiness", {}, signal),
  applications: (page = 1, status = "", signal?: AbortSignal, q = "", sort = "updated") =>
    privateRequest<{ items: Application[]; total: number; page: number; page_size: number }>(
      `/applications?${new URLSearchParams({ page: String(page), status, q, sort })}`,
      {},
      signal,
    ),
  application: (id: string, signal?: AbortSignal) =>
    privateRequest<Application>(`/applications/${encodeURIComponent(id)}`, {}, signal),
  createApplication: (payload: {
    job_id: string;
    matching_run_id?: string;
    provider: string;
    use_ai: boolean;
    allow_external_processing: boolean;
    demo_scenario?: string;
  }) => privateRequest<Application>("/applications", json("POST", payload)),
  applicationAction: (id: string, payload: ApplicationAction) =>
    privateRequest<Application>(
      `/applications/${encodeURIComponent(id)}/actions`,
      json("POST", payload),
    ),
  applicationAudit: (id: string, signal?: AbortSignal) =>
    privateRequest<Record<string, unknown>>(
      `/applications/${encodeURIComponent(id)}/audit`,
      {},
      signal,
    ),
  applicationSchedule: (signal?: AbortSignal) =>
    privateRequest<
      {
        id: string;
        application_id: string;
        title: string;
        kind: string;
        text: string;
        due_at: string;
        completed: boolean;
      }[]
    >("/applications/schedule", {}, signal),
  completeApplicationTask: (id: string, taskId: string, revision: number) =>
    privateRequest<Application>(
      `/applications/${encodeURIComponent(id)}/tasks/${encodeURIComponent(taskId)}/complete`,
      json("POST", { expected_revision: revision }),
    ),
  applicationTimeline: (id: string, signal?: AbortSignal) =>
    privateRequest<ApplicationEvent[]>(
      `/applications/${encodeURIComponent(id)}/timeline`,
      {},
      signal,
    ),
  applicationSurface: (id: string, signal?: AbortSignal) =>
    privateRequest<ApplicationSurface>(
      `/applications/${encodeURIComponent(id)}/surface`,
      {},
      signal,
    ),
  applicationResource: (id: string, signal?: AbortSignal) =>
    privateRequest<{ html: string; mime_type: string; uri: string }>(
      `/applications/${encodeURIComponent(id)}/mcp/resource`,
      {},
      signal,
    ),
  applicationTool: (
    id: string,
    payload: { name: string; expected_revision: number; fields?: ApplicationAction["fields"] },
  ) =>
    privateRequest<{ content: { type: "text"; text: string }[]; isError: boolean }>(
      `/applications/${encodeURIComponent(id)}/mcp/call`,
      json("POST", payload),
    ),
  applicationTools: (id: string, signal?: AbortSignal) =>
    privateRequest<Record<string, unknown>>(
      `/applications/${encodeURIComponent(id)}/mcp/tools`,
      {},
      signal,
    ),
  applicationTracking: (
    id: string,
    payload: {
      expected_revision: number;
      kind: string;
      text: string;
      status?: string;
      due_at?: string;
    },
  ) =>
    privateRequest<Application>(
      `/applications/${encodeURIComponent(id)}/tracking`,
      json("POST", payload),
    ),
  streamApplication: async (
    id: string,
    after: number,
    signal: AbortSignal,
    onEvent: (event: { seq: number; type: string }) => void,
  ) => {
    await ensureSession();
    const response = await fetch(
      `${apiBaseUrl}/applications/${encodeURIComponent(id)}/events?after=${after}`,
      { credentials: "include", headers: { "X-Workspace-Client": "careeros-web" }, signal },
    );
    if (!response.ok || !response.body)
      throw new ApiError(
        "Application progress stream unavailable. Saved state remains available.",
        response.status,
      );
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() || "";
        for (const frame of frames) {
          const data = frame
            .split("\n")
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trim())
            .join("\n");
          if (data) onEvent(JSON.parse(data) as { seq: number; type: string });
        }
      }
    } finally {
      await reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }
  },
  gapReadiness: (signal?: AbortSignal) =>
    privateRequest<{
      can_analyse: boolean;
      profile_revision: number | null;
      confirmed_fields: string[];
      message: string;
    }>("/skill-gaps/readiness", {}, signal),
  gapRuns: (signal?: AbortSignal) => privateRequest<GapRun[]>("/skill-gaps/runs", {}, signal),
  gapRun: (id: string, signal?: AbortSignal) =>
    privateRequest<GapRun>(`/skill-gaps/runs/${encodeURIComponent(id)}`, {}, signal),
  startGap: (payload: GapStart) =>
    privateRequest<GapRun>("/skill-gaps/runs", json("POST", payload)),
  retryGap: (id: string) =>
    privateRequest<GapRun>(`/skill-gaps/runs/${encodeURIComponent(id)}/retry`, { method: "POST" }),
  cancelGap: (id: string) =>
    privateRequest<GapRun>(`/skill-gaps/runs/${encodeURIComponent(id)}/cancel`, { method: "POST" }),
  gapResults: (id: string, page: number, priority: string, signal?: AbortSignal) =>
    privateRequest<GapPage>(
      `/skill-gaps/runs/${encodeURIComponent(id)}/results?${new URLSearchParams({ page: String(page), page_size: "12", priority })}`,
      {},
      signal,
    ),
  gapAudit: (id: string, signal?: AbortSignal) =>
    privateRequest<Record<string, unknown>>(
      `/skill-gaps/runs/${encodeURIComponent(id)}/audit`,
      {},
      signal,
    ),
  gapEvidence: (id: string, gap: string, signal?: AbortSignal) =>
    privateRequest<Record<string, unknown>>(
      `/skill-gaps/runs/${encodeURIComponent(id)}/gaps/${encodeURIComponent(gap)}`,
      {},
      signal,
    ),
  reviewGap: (id: string, gap: string, decision: string) =>
    privateRequest(
      `/skill-gaps/runs/${encodeURIComponent(id)}/gaps/${encodeURIComponent(gap)}/review`,
      json("PUT", { decision, note: "" }),
    ),
  matchingReadiness: (signal?: AbortSignal) =>
    privateRequest<MatchReadiness>("/matching/readiness", {}, signal),
  matchingRuns: (signal?: AbortSignal) =>
    privateRequest<MatchingRun[]>("/matching/runs", {}, signal),
  matchingRun: (id: string, signal?: AbortSignal) =>
    privateRequest<MatchingRun>(`/matching/runs/${encodeURIComponent(id)}`, {}, signal),
  startMatching: (payload: MatchingStart) =>
    privateRequest<MatchingRun>("/matching/runs", json("POST", payload)),
  retryMatching: (id: string) =>
    privateRequest<MatchingRun>(`/matching/runs/${encodeURIComponent(id)}/retry`, {
      method: "POST",
    }),
  cancelMatching: (id: string) =>
    privateRequest<MatchingRun>(`/matching/runs/${encodeURIComponent(id)}/cancel`, {
      method: "POST",
    }),
  matchingResults: (id: string, filters: ResultFilters, page: number, signal?: AbortSignal) => {
    const query = new URLSearchParams({ page: String(page), page_size: "6" });
    for (const [key, value] of Object.entries(filters))
      if (key !== "skill" && value !== "") query.set(key, String(value));
    for (const skill of filters.skill
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean))
      query.append("skill", skill);
    return privateRequest<MatchingPage>(
      `/matching/runs/${encodeURIComponent(id)}/results?${query}`,
      {},
      signal,
    );
  },
  matchingAudit: (id: string, signal?: AbortSignal) =>
    privateRequest<MatchAudit>(`/matching/runs/${encodeURIComponent(id)}/audit`, {}, signal),
  matchingDetail: (id: string, job: string, signal?: AbortSignal) =>
    privateRequest<MatchDetail>(
      `/matching/runs/${encodeURIComponent(id)}/results/${encodeURIComponent(job)}`,
      {},
      signal,
    ),
  bookmarks: (signal?: AbortSignal) =>
    privateRequest<{ job: import("./types").DemoJob; saved_at: string }[]>(
      "/matching/bookmarks",
      {},
      signal,
    ),
  bookmark: (id: string, saved: boolean) =>
    privateRequest(`/matching/bookmarks/${encodeURIComponent(id)}`, {
      method: saved ? "PUT" : "DELETE",
    }),
  jobOptions: (signal?: AbortSignal) => privateRequest<JobOptions>("/jobs/options", {}, signal),
  jobs: (filters: JobFilters, page = 1, signal?: AbortSignal) => {
    const query = new URLSearchParams({ page: String(page), page_size: "6" });
    for (const [key, value] of Object.entries(filters)) {
      if (key !== "skills" && value) query.set(key, value);
    }
    for (const skill of filters.skills
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean))
      query.append("skill", skill);
    return privateRequest<JobPage>(`/jobs?${query.toString()}`, {}, signal);
  },
  health: (signal?: AbortSignal) => request<Health>("/health", {}, signal),
  summary: (signal?: AbortSignal) => privateRequest<Summary>("/dashboard/summary", {}, signal),
  profile: async (signal?: AbortSignal) => {
    try {
      return await privateRequest<Profile>("/profile", {}, signal);
    } catch (error) {
      if (error instanceof ApiError && error.code === "profile_not_found") return null;
      throw error;
    }
  },
  saveProfile: (profile: ProfileInput, revision?: number) => {
    // Rich skill input is accepted alongside the legacy string array. Origin and
    // confirmation metadata in responses are always established by the server.
    const payload = {
      ...profile,
      skills: profile.skills.map((name) => ({ name, source: "manual", verified: false })),
    };
    return revision
      ? privateRequest<Profile>(
          "/profile",
          json("PUT", { ...payload, expected_revision: revision }),
        )
      : privateRequest<Profile>("/profile", json("POST", payload));
  },
  verifyProfile: (revision: number) =>
    privateRequest<Profile>(
      "/profile/verify",
      json("POST", { expected_revision: revision, confirmed: true }),
    ),
  documents: (signal?: AbortSignal) => privateRequest<CareerDocument[]>("/documents", {}, signal),
  policy: (signal?: AbortSignal) => privateRequest<UploadPolicy>("/documents/policy", {}, signal),
  upload: (file: File) => {
    const body = new FormData();
    body.append("file", file);
    return privateRequest<CareerDocument>("/documents/upload", { method: "POST", body });
  },
  removeDocument: (id: string) =>
    privateRequest<void>(`/documents/${encodeURIComponent(id)}`, { method: "DELETE" }),
  resumeRuns: (id: string, signal?: AbortSignal) =>
    privateRequest<ResumeRunSummary[]>(`/documents/${encodeURIComponent(id)}/runs`, {}, signal),
  compareResumeRuns: (id: string, left: string, right: string, signal?: AbortSignal) =>
    privateRequest<RunComparison>(
      `/documents/${encodeURIComponent(id)}/compare?${new URLSearchParams({ left_run_id: left, right_run_id: right })}`,
      {},
      signal,
    ),
  originalDocument: (id: string) =>
    privateRequest<Blob>(`/documents/${encodeURIComponent(id)}/original`, {}, undefined, true),
  audit: (id: string, signal?: AbortSignal, runId?: string) =>
    privateRequest<ProcessingAudit>(
      `/documents/${encodeURIComponent(id)}/audit${runId ? `?${new URLSearchParams({ run_id: runId })}` : ""}`,
      {},
      signal,
    ),
  pagePreview: (id: string, artifact: string, signal?: AbortSignal) =>
    privateRequest<Blob>(
      `/documents/${encodeURIComponent(id)}/audit/pages/${encodeURIComponent(artifact)}`,
      {},
      signal,
      true,
    ),
  processDocument: (id: string, useGroq: boolean, restart = false, useVision = false) =>
    privateRequest<ExtractionStatus>(
      `/documents/${encodeURIComponent(id)}/process`,
      json("POST", {
        use_groq: useGroq,
        allow_external_processing: useGroq,
        restart,
        use_vision: useVision,
        allow_image_processing: useVision,
      }),
    ),
  processingStatus: async (id: string, signal?: AbortSignal) => {
    try {
      return await privateRequest<ExtractionStatus>(
        `/documents/${encodeURIComponent(id)}/status`,
        {},
        signal,
      );
    } catch (error) {
      if (error instanceof ApiError && error.code === "extraction_not_found") return null;
      throw error;
    }
  },
  extractedData: (id: string, signal?: AbortSignal) =>
    privateRequest<ExtractedData>(
      `/documents/${encodeURIComponent(id)}/extracted-data`,
      {},
      signal,
    ),
  updateExtraction: (id: string, data: ExtractedData, values: ProfileInput) =>
    privateRequest<ExtractedData>(
      `/documents/${encodeURIComponent(id)}/extracted-data`,
      json("PUT", { processing_id: data.id, expected_revision: data.revision, values }),
    ),
  verifyExtraction: (
    id: string,
    data: ExtractedData,
    fields: (keyof ProfileInput)[],
    replaceFields: (keyof ProfileInput)[],
  ) =>
    privateRequest<Profile>(
      `/documents/${encodeURIComponent(id)}/verify`,
      json("POST", {
        processing_id: data.id,
        expected_revision: data.revision,
        expected_profile_revision: data.current_profile_revision,
        fields,
        replace_fields: replaceFields,
        confirmed: true,
      }),
    ),
  correctExtraction: (
    id: string,
    data: ExtractionStatus,
    action: "correction" | "reject" | "cancel",
  ) =>
    privateRequest<ExtractionStatus>(
      `/documents/${encodeURIComponent(id)}/request-correction`,
      json("POST", { processing_id: data.id, expected_revision: data.revision, action }),
    ),
};
