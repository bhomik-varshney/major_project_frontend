import type { DemoJob } from "./types";
export type GapRun = {
  id: string;
  status: string;
  stage: string;
  profile_revision: number;
  stale: boolean;
  request: Record<string, unknown>;
  config: Record<string, unknown>;
  job_count: number;
  gap_count: number;
  tasks: { stage: string; name: string; status: string; method: string; elapsed_ms?: number }[];
  warnings: string[];
  provider_metadata: Record<string, unknown>;
  error_code: string | null;
  created_at: string;
  completed_at: string | null;
  elapsed_ms: number | null;
};
export const activeGap = (status?: string) =>
  !!status &&
  [
    "queued",
    "preparing",
    "analysing_profile",
    "analysing_requirements",
    "comparing_skills",
    "prioritising_gaps",
    "generating_guidance",
    "validating",
  ].includes(status);
export const readyGap = (status?: string) =>
  !!status && ["completed", "partial", "needs_review"].includes(status);
export type GapEvidence = {
  path: string;
  original: string;
  origin: string;
  strength: string;
  confidence: string;
  source: Record<string, unknown>;
  denied: boolean;
};
export type GapInventory = {
  normalized: string;
  originals: string[];
  category: string;
  evidence: GapEvidence[];
  explicitly_confirmed: boolean;
  proficiency: string;
};
export type Gap = {
  id: string;
  skill: string;
  normalized: string;
  category: string;
  requirement_type: string;
  original_wordings: string[];
  affected_jobs: string[];
  affected_count: number;
  required_count: number;
  preferred_count: number;
  optional_count: number;
  corpus_required_count: number;
  corpus_preferred_count: number;
  priority: "Critical" | "High" | "Medium" | "Low";
  priority_score: number;
  priority_components: Record<string, { value: number; weight: number; contribution: number }>;
  priority_reason: string;
  candidate_evidence: GapEvidence[];
  related_skills: {
    skill: string;
    relationship: string;
    reason: string;
    evidence_paths: string[];
  }[];
  classification_counts: Record<string, number>;
  learnability: string;
  confidence: string;
  review_status: string;
  explanation: string;
  impact: {
    job_id: string;
    current_score: number;
    simulated_score: number;
    delta: number;
    saved_match_score: number | null;
    confidence: string;
    method: string;
  }[];
  average_score_impact: number;
  guidance: { id: string; text: string; evidence_job_ids: string[] }[];
};
export type GapPage = {
  run: GapRun;
  inventory: GapInventory[];
  jobs: { job: DemoJob; current_score: number; saved_match_score: number | null }[];
  items: Gap[];
  total: number;
  page: number;
  page_size: number;
  reviews: Record<string, { decision: string; note: string; updated_at: string }>;
  validation: Record<string, unknown>;
  conflicts: Record<string, unknown>[];
  selection: Record<string, unknown>;
};
export type GapStart = {
  mode: "single" | "selected" | "top_ranked" | "target";
  job_ids: string[];
  matching_run_id?: string;
  top_k: number;
  filters: Record<string, string>;
  use_ai: boolean;
  allow_external_processing: boolean;
};
