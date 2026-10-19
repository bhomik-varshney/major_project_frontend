import type {
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
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
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
    return (await response.json()) as T;
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
): Promise<T> {
  await ensureSession();
  return request<T>(path, init, signal);
}
const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const api = {
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
  processDocument: (id: string, useGroq: boolean, restart = false) =>
    privateRequest<ExtractionStatus>(
      `/documents/${encodeURIComponent(id)}/process`,
      json("POST", { use_groq: useGroq, allow_external_processing: useGroq, restart }),
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
