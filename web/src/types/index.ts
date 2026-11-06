// Proofline data model — typed interfaces used across the app.
// These mirror what a FastAPI + Supabase backend will eventually expose.

export type ID = string

// ----------------------------------------------------------------------------
// Statuses — explicit and unforgiving. "Unknown" must never collapse to "Passing".
// ----------------------------------------------------------------------------

export type CheckStatus =
  | 'passing'
  | 'failing'
  | 'needs_review'
  | 'not_checked'

export const CHECK_STATUS_LABEL: Record<CheckStatus, string> = {
  passing: 'Passing',
  failing: 'Failing',
  needs_review: 'Needs review',
  not_checked: 'Not checked',
}

export type Severity = 'critical' | 'high' | 'medium' | 'low'

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export type FrameworkTag =
  | 'SOC 2'
  | 'ISO 27001'
  | 'HIPAA'
  | 'GDPR'
  | 'PCI DSS'
  | 'NIST CSF'

// ----------------------------------------------------------------------------
// Core entities
// ----------------------------------------------------------------------------

export interface Organization {
  id: ID
  name: string
  slug: string
  plan: 'free' | 'team' | 'enterprise'
  status: 'active' | 'trial' | 'suspended'
  readinessScore: number  // 0..100, sample demo value
}

export interface User {
  id: ID
  name: string
  email: string
  initials: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  avatarColor: string
}

export type IntegrationKind = 'github' | 'aws' | 'slack' | 'gcp' | 'azure' | 'vercel' | 'linear' | 'okta'
export type IntegrationStatus = 'available' | 'connected' | 'coming_soon' | 'error'

export interface Integration {
  id: ID
  kind: IntegrationKind
  name: string
  description: string
  status: IntegrationStatus
  permissions: string[]
  lastSync: string | null
  scopes?: string[]
}

// ----------------------------------------------------------------------------
// Controls + check results
// ----------------------------------------------------------------------------

export type ControlSource = 'github' | 'aws' | 'gcp' | 'manual' | 'internal'

export interface Control {
  id: ID
  code: string                   // e.g. "CC1.1", "AC-2"
  title: string
  description: string
  whyItMatters: string
  expected: string                // human-readable expected configuration
  frameworkMappings: { framework: FrameworkTag; ref: string }[]
  source: ControlSource
  severity: Severity
  ruleVersion: string            // e.g. "1.4.2"
}

export interface CheckResult {
  id: ID
  controlId: ID
  status: CheckStatus
  observed: string               // human-readable observed state
  explanation: string            // why this status
  source: ControlSource
  checkedAt: string               // ISO timestamp
  ruleVersion: string
  evidenceIds: ID[]
  remediation?: string           // optional guidance
}

// ----------------------------------------------------------------------------
// Evidence
// ----------------------------------------------------------------------------

export type EvidenceReviewStatus = 'approved' | 'in_review' | 'rejected' | 'missing'

export const EVIDENCE_REVIEW_LABEL: Record<EvidenceReviewStatus, string> = {
  approved: 'Approved',
  in_review: 'In review',
  rejected: 'Rejected',
  missing: 'Missing',
}

export interface EvidenceItem {
  id: ID
  name: string
  relatedControlId: ID
  source: ControlSource
  collectedAt: string            // ISO timestamp
  freshness: 'fresh' | 'stale' | 'expired'
  reviewStatus: EvidenceReviewStatus
  contentType: string            // e.g. "application/json", "image/png"
  sizeBytes: number
  // NOTE: contentHash is a placeholder. We never claim hashes guarantee immutable storage.
  // Real provenance requires signed, content-addressed, externally verifiable artifacts.
  contentHash?: string
  contentHashNote: 'placeholder_illustrative' | 'sha256_verified'
  versions: { version: number; collectedAt: string; note: string; contentHash?: string }[]
  uploader?: { id: ID; name: string }
  sourceMetadata?: Record<string, string>
}

// ----------------------------------------------------------------------------
// Questionnaires
// ----------------------------------------------------------------------------

export type QuestionnaireStatus = 'draft' | 'in_progress' | 'in_review' | 'completed'

export const QUESTIONNAIRE_STATUS_LABEL: Record<QuestionnaireStatus, string> = {
  draft: 'Draft',
  in_progress: 'In progress',
  in_review: 'In review',
  completed: 'Completed',
}

export type AnswerStatus = 'draft' | 'needs_review' | 'approved'

export const ANSWER_STATUS_LABEL: Record<AnswerStatus, string> = {
  draft: 'Draft',
  needs_review: 'Needs review',
  approved: 'Approved',
}

export interface QuestionnaireQuestion {
  id: ID
  question: string
  category?: string
  draftAnswer: string
  answerStatus: AnswerStatus
  evidenceIds: ID[]
  confidence: 'high' | 'medium' | 'low' | 'none'
  aiGenerated: boolean
  approvedBy?: { id: ID; name: string } | null
  approvedAt?: string | null
  lastEditedAt: string
}

export interface Questionnaire {
  id: ID
  name: string
  customer: string
  format: 'csv' | 'xlsx'
  status: QuestionnaireStatus
  createdAt: string
  updatedAt: string
  questionCount: number
  questions: QuestionnaireQuestion[]
}

// ----------------------------------------------------------------------------
// Policies
// ----------------------------------------------------------------------------

export type PolicyCategory =
  | 'Information Security'
  | 'Access Control'
  | 'Incident Response'
  | 'Data Retention'
  | 'Business Continuity'

export type PolicyStatus = 'published' | 'draft' | 'in_review' | 'archived'

export interface PolicyVersion {
  version: number
  reviewedAt: string
  reviewedBy: { id: ID; name: string }
  status: PolicyStatus
  changeSummary: string
  aiDrafted: boolean
}

export interface Policy {
  id: ID
  title: string
  category: PolicyCategory
  version: string                // display version, e.g. "1.3"
  owner: { id: ID; name: string }
  lastReviewedAt: string
  nextReviewAt?: string
  status: PolicyStatus
  summary: string
  body: string                   // markdown-ish plain text
  versions: PolicyVersion[]
  aiDrafted: boolean
}

// ----------------------------------------------------------------------------
// Remediation tasks
// ----------------------------------------------------------------------------

export type TaskStatus = 'open' | 'in_progress' | 'blocked' | 'resolved'
export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  blocked: 'Blocked',
  resolved: 'Resolved',
}

export interface RemediationTask {
  id: ID
  title: string
  severity: Severity
  controlId: ID
  owner: { id: ID; name: string } | null
  dueDate: string
  status: TaskStatus
  createdFromCheckId?: ID
  resolutionNote?: string
  resolvedAt?: string
  // Important: a task's "resolved" state does NOT flip the underlying control to "passing".
  // A fresh check must verify the remediation. See tasks page implementation.
}

// ----------------------------------------------------------------------------
// Audit trail
// ----------------------------------------------------------------------------

export type AuditEventKind =
  | 'check_run'
  | 'evidence_uploaded'
  | 'evidence_approved'
  | 'answer_approved'
  | 'policy_published'
  | 'task_resolved'
  | 'integration_connected'
  | 'integration_disconnected'
  | 'member_invited'

export interface AuditEvent {
  id: ID
  kind: AuditEventKind
  at: string                     // ISO timestamp
  actor: { id: ID; name: string; role: User['role'] }
  target?: { kind: string; id: ID; label: string }
  summary: string
  meta?: Record<string, string>
}

// ----------------------------------------------------------------------------
// Audit / dashboard rollups
// ----------------------------------------------------------------------------

export interface ReadinessTrendPoint {
  date: string                   // ISO date
  score: number
}

export interface IssueRow {
  id: ID
  severity: Severity
  title: string
  resource: string
  owner: string | null
  status: CheckStatus
  controlId: ID
}
