export type Education = {
  institution: string;
  qualification: string;
  period: string;
  location?: string;
  start_year?: string;
  end_year?: string;
  expected_graduation?: string;
  grade?: string;
  specialization?: string;
};
export type Experience = {
  organization: string;
  role: string;
  description: string;
  period: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  current_status?: string;
  responsibilities?: string[];
  achievements?: string[];
  technologies?: string[];
};
export type Project = {
  name: string;
  description: string;
  url: string;
  technologies?: string[];
  tools?: string[];
  outcomes?: string[];
  repository?: string;
  deployment_url?: string;
  role?: string;
  period?: string;
  links?: string[];
};
export type SkillDetail = {
  name: string;
  original_text: string;
  source: "resume" | "manual";
  verified: boolean;
  user_confirmed: boolean;
  source_section: string;
  evidence: FieldEvidence["source"];
  method: string;
  confidence: string;
};
export type ProfileInput = {
  name: string;
  email: string;
  phone: string;
  location: string;
  career_objective: string;
  education: Education[];
  skills: string[];
  experience: Experience[];
  projects: Project[];
  preferred_roles: string[];
  preferred_locations: string[];
  experience_level: "" | "student" | "graduate" | "early_career" | "experienced";
  additional_sections: { heading: string; content: string }[];
  publications: string[];
  certifications: string[];
  achievements: string[];
  links: string[];
};
export type Profile = ProfileInput & {
  id: string;
  revision: number;
  verification_state: "unverified" | "verified";
  evidence_origin: "manual" | "document" | "mixed";
  verified_at: string | null;
  verified_fields: string[];
  sources: {
    document_id: string | null;
    source_document_ref: string;
    filename: string;
    fields: string[];
    verified_at: string;
    source_available: boolean;
  }[];
  skill_details: SkillDetail[];
  created_at: string;
  updated_at: string;
};
export type CareerDocument = {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  upload_status: "stored";
  extraction_status: string;
  processing_status: string;
  verification_status: string;
  processing_id: string | null;
  extraction_version: number | null;
  created_at: string;
};
export type UploadPolicy = {
  formats: string[];
  max_bytes: number;
  max_documents: number;
  extraction_available: boolean;
  groq_configured: boolean;
  groq_model: string;
  ocr_available: boolean;
  vision_primary?: string;
  vision_fallback?: string;
  audit_available?: boolean;
};
export type ExtractionState =
  | "queued"
  | "processing"
  | "awaiting_review"
  | "verified"
  | "failed"
  | "rejected"
  | "needs_correction"
  | "cancelled";
export type ExtractionStatus = {
  id: string;
  document_id: string;
  run_version: number;
  revision: number;
  status: ExtractionState;
  stage: string;
  method: string;
  warnings: string[];
  error_code: string | null;
  error_message: string | null;
  page_count: number | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  verified_at: string | null;
  agent_run?: AgentRun | null;
};
export type FieldEvidence = {
  source: { block_id: number; page: number | null; paragraph: number | null; quote: string } | null;
  confidence: "high" | "medium" | "low" | "unknown";
  method: "deterministic" | "groq" | "user";
  warning: string | null;
  extraction_methods?: string[];
  layout_block_ids?: string[];
  ocr_confidence?: number | null;
  edited: boolean;
  classification?: "directly_found" | "normalized" | "ambiguous" | "not_found";
  source_section?: string;
  original_text?: string;
  heading?: string;
  statement_type?: string;
  references?: FieldEvidence["source"][];
  edited_by_user?: boolean;
  verified?: boolean;
  review_status?: string;
};
export type ExtractedData = ExtractionStatus & {
  applied_fields: string[];
  values: ProfileInput;
  evidence: Record<string, FieldEvidence>;
  current_profile_revision: number;
  current_profile_values: Partial<ProfileInput>;
  skill_details: SkillDetail[];
  structured: {
    profile_statement: { heading: string; type: string };
    extraction_metadata?: { parser_version: string };
  };
};
export type Summary = {
  data_mode: "live_local";
  profile_exists: boolean;
  candidate_name: string | null;
  profile_completion: number;
  profile_revision: number | null;
  verification_state: "missing" | "unverified" | "verified";
  uploaded_document_count: number;
  profile_skill_count: number;
  extracted_skill_count: number;
  recommended_job_count: number | null;
  latest_matching_status: string | null;
  matching_stale: boolean;
  skill_gap_count: number | null;
  pending_approval_count: number | null;
  application_status_summary: Record<string, number> | null;
  recent_activity: { id: string; kind: string; message: string; created_at: string }[];
  feature_states: Record<string, string>;
};
export type Health = {
  status: "ok" | "degraded";
  database: "connected" | "unavailable";
  version: string;
  access_mode: string;
};

export type AgentRun = {
  id: string;
  agent_name: string;
  agent_version: string;
  engine: string;
  status: string;
  task: string;
  tasks: { name: string; status: string; issue_count?: number }[];
  warnings: string[];
  error_code: string | null;
  created_at: string;
  completed_at: string | null;
};
export type JobFilters = {
  keyword: string;
  skills: string;
  location: string;
  work_mode: "" | "remote" | "hybrid" | "onsite";
  experience: string;
  category: string;
  employment_type: string;
  company: string;
  industry: string;
  country: string;
  posted_from: string;
  posted_to: string;
  availability: "all" | "active" | "expired" | "future";
};
export type DemoJob = {
  id: string;
  title: string;
  company: string;
  industry: string;
  department: string;
  location: string;
  country: string;
  remote: boolean;
  work_mode: "remote" | "hybrid" | "onsite";
  employment_type: "internship" | "full_time" | "contract" | "apprenticeship";
  description: string;
  responsibilities: string[];
  required_skills: string[];
  preferred_skills: string[];
  tools_and_technologies: string[];
  education_requirements: string[];
  language_requirements: string[];
  normalized_skill_tokens: string[];
  experience_level: string;
  experience_years_min: number;
  experience_years_max: number;
  category: string;
  generated_data: true;
  salary: { minimum: number; maximum: number; currency: string; period: "month" | "year" } | null;
  currency: string;
  source: "seeded_mock";
  source_url: string;
  application_url: string;
  posted_date: string;
  closing_date: string | null;
  metadata: {
    dataset_version: string;
    country: string;
    category: string;
    is_demo: true;
    company_size: string | null;
    edge_cases: string[];
    duplicate_group: string | null;
  };
};
export type JobOptions = {
  categories: string[];
  industries: string[];
  countries: string[];
  employment_types: string[];
  experience_levels: string[];
  work_modes: string[];
  total: number;
  dataset_version: string;
  reference_date: string;
};
export type JobPage = {
  items: DemoJob[];
  total: number;
  matched_total: number;
  page: number;
  page_size: number;
  source: "seeded_mock";
  dataset_version: string;
  reference_date: string;
  warnings: string[];
};

export type AuditRegion = { x: number; y: number; width: number; height: number };
export type AuditLayout = {
  id: string;
  page: number;
  section: string;
  raw_text: string;
  block_type: string;
  region: AuditRegion | null;
  related_block_ids: string[];
  source_block_ids: number[];
  reading_order: number;
  confidence: number;
  method: "text" | "vision";
  status: "supported" | "needs_review";
  warnings: string[];
};
export type CanonicalValue = {
  fact_id: string;
  profile_path: string | null;
  value: string | null;
  proposed_value?: string | null;
  normalized_value: string | null;
  original_text: string;
  page: number | null;
  evidence_ids: string[];
  source_block_ids: number[];
  extraction_methods: string[];
  confidence: { label: string; score: number | null; basis: string };
  status: "supported" | "needs_review" | "conflict" | "unsupported";
  warnings: string[];
  related_entities: string[];
};
export type CanonicalResume = {
  schema_version: string;
  run_id: string;
  entities: {
    entity_id: string;
    bucket: string;
    fields: Record<string, CanonicalValue>;
    evidence_ids: string[];
    section_ids: string[];
    status: string;
  }[];
  sections: {
    section_id: string;
    bucket: string;
    heading: string;
    original_heading: string;
    source_block_ids: number[];
    page: number | null;
    column: string;
    detection_method: string;
  }[];
  relations: {
    source_id: string;
    target_id: string;
    relation: string;
    evidence_ids: string[];
    status: string;
  }[];
  conflicts: {
    conflict_id: string;
    field: string;
    code: string;
    alternatives: {
      value: string;
      extraction_method: string;
      source_block_ids: number[];
      page: number | null;
    }[];
    resolution: string;
    message: string;
  }[];
  warnings: string[];
};
export type CanonicalValidation = {
  schema_valid: boolean;
  checked_fields: number;
  supported_fields: number;
  unsupported_fields: number;
  critical_passed: boolean;
  issues: { code: string; field: string; severity: string; message: string; repairable: boolean }[];
  checks: Record<string, number>;
};
export type ResumeRunSummary = {
  id: string;
  run_version: number;
  revision: number;
  status: string;
  method: string;
  created_at: string;
  completed_at: string | null;
};
export type RunComparison = {
  left_version: number;
  right_version: number;
  differences: { field: string; before?: string; after?: string; change: string }[];
  profile_updated: false;
};
export type ProcessingAudit = {
  raw_evidence?: {
    evidence_id: string;
    source_block_id: number;
    source_text: string;
    page: number | null;
    paragraph: number | null;
    order: number;
    extraction_method: string;
    confidence: { label: string; score: number | null };
    coordinates: AuditRegion | null;
    metadata: Record<string, unknown>;
  }[];
  canonical?: CanonicalResume | null;
  canonical_validation?: CanonicalValidation | null;
  canonical_workflow?: {
    engine: string;
    maximum_repair_cycles: number;
    tasks: { name: string; label: string; method: string; status: string; elapsed_ms: number }[];
  };
  canonical_status?: string | null;
  repair_iterations?: {
    iteration: number;
    detected_problems: CanonicalValidation["issues"];
    repair_action: string;
    affected_fields: string[];
    validation_result: CanonicalValidation;
    model: string | null;
    provider: string;
    elapsed_ms: number;
    outcome: string;
    error_code: string | null;
    changes: { field: string; before: string; after: string }[];
  }[];

  pipeline_version?: string;
  id: string;
  document_id: string;
  status: string;
  stage: string;
  duration_ms: number | null;
  quality: {
    classification?: string;
    page_count?: number | null;
    selectable_text?: boolean;
    likely_scanned?: boolean;
    columns?: string;
    tables_detected?: boolean;
    image_heavy_pages?: number[];
    ocr_recommended?: boolean;
    vision_recommended?: boolean;
    limitations?: string[];
    pages?: {
      page: number;
      selectable_characters: number;
      ocr_recommended: boolean;
      ocr_status?: string;
      ocr_reason?: string;
      ocr_blocks?: number;
    }[];
  };
  pages: {
    id: string;
    page: number;
    width: number;
    height: number;
    renderer: string;
    bytes: number;
  }[];
  exact_text: {
    block_id: number;
    text: string;
    page: number | null;
    paragraph: number | null;
    order: number;
    method: string;
    region: AuditRegion | null;
    metadata?: { source_engine?: string; source_kind?: string };
  }[];
  ocr: {
    block_id: number;
    page: number;
    text: string;
    region: AuditRegion | null;
    confidence: number;
    warnings: string[];
  }[];
  layout: AuditLayout[];
  agents: {
    name: string;
    status: string;
    model?: string | null;
    method: string;
    result: Record<string, unknown>;
    warnings: string[];
    error_code?: string | null;
  }[];
  warnings: {
    code: string;
    message: string;
    field: string;
    severity: string;
    sources: Record<string, unknown>[];
  }[];
  draft: {
    values: ProfileInput;
    unresolved_fields: string[];
    other_sections: { heading: string; text: string; source_block_ids: number[] }[];
    evidence: {
      field: string;
      value: string;
      source_text: string;
      page: number | null;
      source_block_ids: number[];
      extraction_methods: string[];
      confidence: { label: string; score: number | null; basis: string };
      status: string;
      alternatives: Record<string, unknown>[];
    }[];
  } | null;
  review: { action: string; revision: number; fields: string[]; decided_at: string | null };
  consent: { text?: boolean; images?: boolean };
};
