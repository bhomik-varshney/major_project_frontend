export type Education = { institution: string; qualification: string; period: string };
export type Experience = {
  organization: string;
  role: string;
  description: string;
  period: string;
};
export type Project = { name: string; description: string; url: string };
export type ProfileInput = {
  name: string;
  email: string;
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
};
export type Profile = ProfileInput & {
  id: string;
  revision: number;
  verification_state: "unverified" | "verified";
  evidence_origin: "manual";
  created_at: string;
  updated_at: string;
};
export type CareerDocument = {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  upload_status: "stored";
  extraction_status: "not_started";
  created_at: string;
};
export type UploadPolicy = {
  formats: string[];
  max_bytes: number;
  max_documents: number;
  extraction_available: boolean;
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
