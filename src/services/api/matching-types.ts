import type { DemoJob, FilterAudit } from "./types";
export type MatchStatus =
  | "queued"
  | "preparing"
  | "normalizing"
  | "calculating_baseline"
  | "retrieving"
  | "calibrating"
  | "calculating_hybrid"
  | "generating_explanations"
  | "validating"
  | "completed"
  | "partial"
  | "failed"
  | "cancelled";
export const activeMatching = (status?: MatchStatus) =>
  !!status && !["completed", "partial", "failed", "cancelled"].includes(status);
export type MatchReadiness = {
  profile_exists: boolean;
  profile_revision: number;
  can_match: boolean;
  confirmed_fields: string[];
  excluded_unconfirmed_fields: string[];
  missing_fields: string[];
  message: string;
};
export type MatchingRun = {
  id: string;
  status: MatchStatus;
  stage: string;
  profile_revision: number;
  stale: boolean;
  dataset_version: string;
  dataset_reference_date: string;
  total_jobs: number;
  eligible_jobs: number;
  result_count: number;
  minimum_score: number;
  filters: Record<string, unknown>;
  config: Record<string, unknown>;
  provider_metadata: Record<
    string,
    {
      status: string;
      model?: string | null;
      provider?: string;
      reviewed_jobs?: number;
      error_code?: string;
    }
  >;
  tasks: {
    stage: string;
    name: string;
    status: string;
    method: string;
    model?: string;
    elapsed_ms?: number;
    error_code?: string;
  }[];
  warnings: string[];
  validation: Record<string, unknown>;
  error_code: string | null;
  created_at: string;
  completed_at: string | null;
  elapsed_ms: number | null;
};
export type SkillMapping = {
  original: string;
  normalized: string;
  source_path: string;
  candidate_evidence?: { original: string; normalized: string; source_path: string }[];
  reason?: string;
  match_type?: "exact" | "synonym";
};
export type MatchComponent = {
  score: number | null;
  state: string;
  configured_weight: number;
  effective_weight: number;
  contribution: number;
  reason: string;
  evidence: Record<string, unknown>[];
};
export type RankedMatch = {
  job: DemoJob;
  rank: number;
  baseline_score: number;
  hybrid_score: number;
  match_percentage?: number | null;
  calibration?: {
    status: string;
    version?: string;
    interpretation?: string;
    bin_examples?: number;
    raw_range?: number[];
  };
  retrieval?: { method_ranks?: Record<string, number>; fusion_score?: number };
  method_scores?: Record<string, number | null>;
  filter_evidence?: Record<string, { accepted: boolean; relation: string; reason: string }>;
  components: Record<string, MatchComponent>;
  calculation: {
    weighted_sum: number;
    available_weight: number;
    critical_skill_penalty: number;
    uncertainty_ceiling: number;
    formula: string;
    semantic_fallback: boolean;
  };
  matched_required: SkillMapping[];
  missing_required: SkillMapping[];
  matched_preferred: SkillMapping[];
  missing_preferred: SkillMapping[];
  transferable_skills: { candidate_skill: string; job_skill: string; reason: string }[];
  reasons: { id: string; kind: string; text: string; evidence: Record<string, unknown>[] }[];
  explanation: string;
  explanation_method: string;
  warnings: string[];
};
export type MatchingPage = {
  diagnostics?: {
    empty_state: string;
    total_jobs: number;
    after_hard_filters: number;
    after_retrieval: number;
    after_score_filter: number;
    after_result_filters: number;
    displayed_items: number;
    saved_minimum_score: number;
    effective_minimum_score: number;
    score_scale: string;
  };
  run: MatchingRun;
  items: RankedMatch[];
  total: number;
  page: number;
  page_size: number;
};
export type MatchAudit = {
  filter_audit?: FilterAudit;
  retrieval?: Record<string, unknown>;
  run: MatchingRun;
  candidate_snapshot: {
    confirmed_facts: Record<string, unknown>;
    normalized?: Record<string, unknown>;
  };
  profile_source: string;
  draft_data_used: boolean;
};
export type MatchDetail = {
  run: MatchingRun;
  recommendation: RankedMatch;
  normalized_job: Record<string, unknown>;
  candidate_snapshot: MatchAudit["candidate_snapshot"];
};
export type ResultFilters = {
  keyword: string;
  category: string;
  work_mode: string;
  skill: string;
  minimum_score: string;
  saved_only: boolean;
  sort: "hybrid" | "baseline";
};
export type MatchingStart = {
  filters: Record<string, unknown>;
  minimum_score: number;
  retrieval_pool_size?: number;
  use_ai: boolean;
  allow_external_processing: boolean;
};
