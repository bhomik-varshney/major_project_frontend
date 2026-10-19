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
