export const letterSections = [
  "opening",
  "motivation",
  "experience",
  "skills_alignment",
  "closing",
] as const;
export type LetterSection = (typeof letterSections)[number];
export type LetterContent = Record<LetterSection, string> & {
  date: string;
  company_name: string;
  job_title: string;
  salutation: string;
  signature_name: string;
  signature_phone: string;
  signature_email: string;
  confidence: string;
  claims: { id: string; section: string; text: string; evidence_ids: string[] }[];
};
export type CoverLetter = {
  id: string;
  application_id: string;
  version: number;
  revision: number;
  status: string;
  stage: string;
  operation_active: boolean;
  profile_revision: number;
  job: { id: string; title: string; company: string; location: string; source: string };
  signature_id: string | null;
  document_id: string | null;
  data: {
    content?: LetterContent;
    validation?: {
      valid: boolean;
      issues: string[];
      warnings: string[];
      word_count: number;
      grounding: string;
      user_sections: string[];
      retained_sections?: string[];
    };
    warnings?: string[];
    provider?: {
      engine: string;
      model: string | null;
      status: string;
      error_code?: string;
      correction?: string;
      agents?: { name: string; status: string }[];
    };
    signature?: {
      included: boolean;
      approved_by_user: boolean;
      signer_name: string;
      width_mm: number;
    };
    plan?: {
      evidence: { id: string; label: string; text: string; source: string; relevance: number }[];
      selected_evidence_ids: string[];
      job_requirements: string[];
      excluded: { id: string; reason: string }[];
      missing: string[];
    };
    history?: { state: string; timestamp: string }[];
    render?: {
      quality?: {
        valid: boolean;
        issues: string[];
        page_count: number;
        fonts_embedded: boolean;
        selectable_text: boolean;
        visual_check: string;
      };
      attempts: {
        attempt: number;
        exit_code: number;
        timeout: boolean;
        generated_file_exists: boolean;
        paragraph_spacing_pt: number;
        log_reference: string;
        stdout_bytes: number;
        stderr_bytes: number;
        diagnostics?: string[];
        quality?: { issues: string[] };
      }[];
    };
  };
  tasks: { name: string; status: string }[];
  approval: { reviewed_at?: string; signature_included?: boolean };
  error_code: string | null;
  created_at: string;
  pdf_available: boolean;
  preview_available: boolean;
  source_available: boolean;
};
export type Signature = {
  id: string;
  signer_name: string;
  metadata: { width: number; height: number; transparent: boolean };
};
export type CoverStart = {
  expected_application_revision: number;
  document_date: string;
  tone: "formal" | "concise" | "warm";
  length: "standard" | "short" | "expanded";
  use_ai: boolean;
  allow_external_processing: boolean;
  include_signature: boolean;
  signature_id?: string;
  signature_approved: boolean;
  signature_width_mm: number;
  base_version_id?: string;
  regenerate_section?: "all" | LetterSection;
  edits?: Partial<Record<LetterSection, string>>;
  personal_sentence?: string;
  user_text_confirmed: boolean;
};
