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
