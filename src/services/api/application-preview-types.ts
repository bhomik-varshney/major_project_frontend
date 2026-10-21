export type PreparedAnswer = {
  question_type: string;
  concise: string;
  detailed: string;
  evidence: string[];
  source_paths: string[];
  confidence: number;
  reason: string;
  generated_draft: boolean;
  requires_confirmation: boolean;
};
export type ClassifiedLink = {
  original_url: string;
  url: string;
  platform: string;
  kind: string;
  label: string;
  primary: boolean;
  source: string;
  evidence: string;
};
export type RepeatedEntry = {
  title: string;
  subtitle: string;
  details: Record<string, string>;
  bullets: string[];
  links: ClassifiedLink[];
  source: string;
};
export type PreviewField = {
  field_id: string;
  label: string;
  input_type: string;
  display_value: string | boolean | string[] | null;
  status: string;
  source_label: string;
  confidence: number;
  requires_confirmation: boolean;
  approved: boolean;
  required: boolean;
  auto_filled: boolean;
  sensitive: boolean;
  reason: string;
  evidence: string[];
  answer: PreparedAnswer | null;
};
export type ApplicationSection = {
  id: string;
  label: string;
  fields: PreviewField[];
  entries: RepeatedEntry[];
  links: ClassifiedLink[];
};
export type ApplicationPreview = {
  version: string;
  title: string;
  company: string;
  source: string;
  application_url: string;
  sections: ApplicationSection[];
  documents: {
    label: string;
    role: string;
    content_type: string;
    size_bytes: number;
    approved: boolean;
  }[];
  missing_fields: { field_id: string; label: string; required: boolean; reason: string }[];
  mappings: {
    field_id: string;
    label: string;
    status: string;
    source_label: string;
    required: boolean;
  }[];
  engine: string;
  is_mock: boolean;
  content_hash: string;
};
