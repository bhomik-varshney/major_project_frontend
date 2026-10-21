import type { ApplicationPreview } from "./application-preview-types";
export type ApplicationField = {
  id: string;
  value: string | boolean | string[] | null;
  source: string;
  evidence: string;
  confidence: string;
  classification: string;
  approved: boolean;
  edited_by_user: boolean;
  warning: string;
  auto_filled: boolean;
  confirmation_required: boolean;
  suggested_answer: boolean;
};
export type FormField = {
  id: string;
  label: string;
  type:
    | "text"
    | "email"
    | "tel"
    | "textarea"
    | "select"
    | "radio"
    | "checkbox"
    | "date"
    | "file"
    | "multiselect"
    | "unsupported";
  required: boolean;
  options: string[];
  semantic: string;
  sensitive: boolean;
};
export type DocumentOption = {
  id: string;
  filename: string;
  sha256: string;
  content_type: string;
  size_bytes: number;
  confirmed_resume: boolean;
};
export type DocumentChoice = {
  document_id: string;
  role: "resume" | "cover_letter" | "supporting";
  approved: true;
};
export type Application = {
  id: string;
  revision: number;
  job_id: string;
  job: {
    title: string;
    company: string;
    location: string;
    application_url: string;
    required_skills?: string[];
    preferred_skills?: string[];
    responsibilities?: string[];
    description?: string;
  };
  status: string;
  stage: string;
  provider: string;
  is_demo: boolean;
  profile_revision: number;
  stale: boolean;
  lifecycle_status: string;
  draft: null | {
    preview: ApplicationPreview | null;
    presentation_version: string;
    form: { id: string; version: string; fields: FormField[]; provider: string; is_demo: boolean };
    fields: ApplicationField[];
    documents: (DocumentOption & DocumentChoice)[];
    document_options: DocumentOption[];
    requirements: {
      required_skills: string[];
      preferred_skills: string[];
      matched_skills: string[];
      missing_skill_evidence: string[];
      responsibilities: string[];
      recommended_resume_ids: string[];
      document_recommendation: string;
      cover_letter: string;
    };
    missing_inputs: string[];
    warnings: string[];
    tasks: { name: string; status: string; method: string }[];
    validation: {
      ready_for_prefill: boolean;
      missing_required: string[];
      unreviewed_fields: string[];
      invalid_fields: string[];
    };
    ai_review: Record<string, unknown>;
    connection: { status: string; form_source: string; error_code?: string };
  };
  approval: Record<string, unknown>;
  receipt: Record<string, unknown>;
  tasks: { name: string; status: string; method: string }[];
  warnings: string[];
  error_code: string | null;
  allowed_actions: string[];
  operation_active: boolean;
  milestones: Record<string, string>;
  recovery: { reconcile_required?: boolean };
  match_context: Record<string, unknown>;
  tracking: {
    tasks: { id: string; kind: string; text: string; due_at: string; completed: boolean }[];
    interviews: { id: string; stage: string; scheduled_at: string }[];
  };
  created_at: string;
  updated_at: string;
};
export type ApplicationAction = {
  action: string;
  expected_revision: number;
  confirmed?: boolean;
  fields?: Record<string, { value: ApplicationField["value"]; approved: boolean }>;
  documents?: DocumentChoice[];
  reference?: string;
};
export type ApplicationEvent = {
  seq: number;
  type: string;
  payload: {
    status: string;
    revision: number;
    message?: string;
    kind?: string;
    text?: string;
    due_at?: string;
    stage?: string;
    code?: string;
    completed?: number;
    total?: number;
  };
  created_at: string;
};
export type ApplicationSurface = {
  preview: ApplicationPreview | null;
  version: string;
  actions: string[];
  status: string;
  messages: unknown[];
  application_id: string;
  revision: number;
  form: { fields: FormField[] };
  fields: ApplicationField[];
  is_demo: boolean;
};
export type ApplicationReadiness = {
  can_prepare: boolean;
  providers: { id: string; label: string; is_demo: boolean }[];
  message: string;
};
