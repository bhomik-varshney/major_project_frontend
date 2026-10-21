export type ResumeSection =
  | "summary"
  | "experience"
  | "projects"
  | "skills"
  | "education"
  | "certifications"
  | "achievements"
  | "publications";
export type ResumeEntry = {
  id: string;
  section: ResumeSection;
  source: string;
  title: string;
  subtitle: string;
  period: string;
  location: string;
  grade: string;
  technologies: string[];
  links: { url: string; label: string; source: string }[];
  bullets: { id: string; text: string; original: string; source: string; variants: string[] }[];
  relevance: number;
  skill_group: string;
};
export type ResumeDraft = {
  name: string;
  phone: string;
  email: string;
  location: string;
  links: { url: string; label: string; source: string }[];
  target_job: string;
  summary: string;
  summary_id: string;
  summary_evidence: string[];
  entries: ResumeEntry[];
  section_order: ResumeSection[];
};
export type ResumeEdits = {
  summary?: string;
  entry_ids?: string[];
  bullet_text?: Record<string, string>;
  section_order?: ResumeSection[];
};
export type RelevancePlan = {
  valid: boolean;
  status: string;
  message: string;
  matching_context: string;
  skill_gap_context: string;
  limitation: string | null;
  review_recommended: boolean;
  required: {
    skill: string;
    status: string;
    evidence: { id: string; source: string; kind: string }[];
  }[];
  preferred: { skill: string; status: string }[];
  role_terms: string[];
  method: string;
};
export type TailoredResume = {
  id: string;
  application_id: string;
  version: number;
  revision: number;
  status: string;
  stage: string;
  operation_active: boolean;
  profile_revision: number;
  job: { id: string; title: string; company: string; location: string };
  document_id: string | null;
  approval: { reviewed_at?: string };
  error_code: string | null;
  created_at: string;
  pdf_available: boolean;
  preview_available: boolean;
  source_available: boolean;
  tasks: { name: string; status: string }[];
  data: {
    draft?: ResumeDraft;
    input_source: { mode: string; document_id?: string; filename?: string; authority: string };
    original_evidence?: {
      profile_revision: number;
      current_revision: boolean;
      document_id: string | null;
      original_bytes_verified: boolean | null;
      applied_fields: string[];
      authority: string;
    }[];
    context: {
      matching?: {
        hybrid_score?: number;
        matched_required?: string[];
        missing_required?: string[];
        status?: string;
      };
      skill_gaps?: { gaps?: { skill: string; status: string }[] };
    };
    catalog?: {
      content_policy_version?: number;
      entries: ResumeEntry[];
      summaries: { id: string; text: string; evidence: string[] }[];
      selected_ids: string[];
      requirements: string[];
      preferred_requirements: string[];
      warnings: string[];
      confidence: string;
      protected_ids?: string[];
      relevance_plan?: RelevancePlan;
      ledger?: {
        original: unknown;
        normalized: string;
        source_evidence: string;
        confidence: string;
        entry_id: string | null;
        relevance_status: string;
        omission_allowed: boolean;
      }[];
      technology_reviews?: { entry_id: string; technology: string; reason: string }[];
    };
    validation?: {
      valid: boolean;
      issues: { field: string; reason: string }[];
      one_page: string;
      ats: string;
      immutable_fields_checked: boolean;
      claims_source_checked: boolean;
    };
    report?: {
      selected_job: string;
      preserved?: { id: string; title: string; section: string }[];
      coverage?: Record<string, { available: number; preserved: number }>;
      relevance_plan?: RelevancePlan;
      condensed?: { entry_id: string; before: string; after: string; reason: string }[];
      title_condensation?: { entry_id: string; before: string; after: string; reason: string }[];
      bullet_omissions?: { entry_id: string; source: string; original: string; reason: string }[];
      keywords_addressed: string[];
      selected: {
        id: string;
        section: string;
        title: string;
        source: string;
        relevance: number;
        reason: string;
      }[];
      omitted: { id: string; section: string; title: string; reason: string }[];
      changes: {
        section: string;
        before: string | string[];
        after: string | string[];
        evidence: string[];
      }[];
      warnings: string[];
      confidence: string;
      ats_observations: string;
    };
    retained_sections?: string[];
    provider?: {
      engine: string;
      model: string | null;
      status: string;
      error_code?: string;
      correction?: string;
      agents?: { name: string; status: string }[];
    };
    history?: { state: string; timestamp: string }[];
    render?: {
      quality?: {
        valid: boolean;
        issues: string[];
        page_count: number;
        selectable_text: boolean;
        fonts_embedded: boolean;
        ats_observations: string;
        body_font_pt?: number;
        content_height_ratio?: number;
        balance_observation?: string;
      };
      corrections?: { field: string; reason: string }[];
      attempts: {
        attempt: number;
        exit_code: number;
        timeout: boolean;
        generated_file_exists: boolean;
        diagnostics?: string[];
        quality?: { issues: string[] };
      }[];
    };
  };
};
export type ResumeStart = {
  expected_application_revision: number;
  template: string;
  input_mode: string;
  source_document_id?: string;
  use_ai: boolean;
  allow_external_processing: boolean;
  base_version_id?: string;
  regenerate_section: string;
  edits: ResumeEdits;
};
export type TailoringReadiness = {
  engine_available: boolean;
  template_available: boolean;
  profile_ready: boolean;
  groq_configured: boolean;
  source_policy: string;
  templates: { id: string; label: string }[];
  sources: { id: string; filename: string; content_type: string }[];
};
