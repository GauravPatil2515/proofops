import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 h-5 px-1.5 rounded-app-sm text-app-2xs font-medium uppercase tracking-wide border',
  {
    variants: {
      variant: {
        default: 'bg-surface-muted text-ink-muted border-line',
        accent: 'bg-accent-soft text-accent border-accent-border',
        success: 'bg-success-soft text-success border-success-border',
        warning: 'bg-warning-soft text-warning border-warning-border',
        danger: 'bg-danger-soft text-danger border-danger-border',
        info: 'bg-info-soft text-info border-info-border',
        outline: 'bg-transparent text-ink-muted border-line-strong',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

// Status-specific badges — used everywhere in the app for consistent visual language

import type { CheckStatus, Severity, EvidenceReviewStatus, AnswerStatus, TaskStatus, PolicyStatus, QuestionnaireStatus } from '../../types'

const STATUS_DOT: Record<CheckStatus, string> = {
  passing: 'bg-success',
  failing: 'bg-danger',
  needs_review: 'bg-warning',
  not_checked: 'bg-ink-faint',
}

export function StatusDot({ status, className }: { status: CheckStatus; className?: string }) {
  return (
    <span
      className={cn('inline-block h-1.5 w-1.5 rounded-full', STATUS_DOT[status], className)}
      aria-hidden
    />
  )
}

export function CheckStatusBadge({ status }: { status: CheckStatus }) {
  const variant: BadgeProps['variant'] =
    status === 'passing'
      ? 'success'
      : status === 'failing'
        ? 'danger'
        : status === 'needs_review'
          ? 'warning'
          : 'outline'
  return (
    <Badge variant={variant} className="normal-case tracking-normal">
      <StatusDot status={status} />
      {status === 'passing' ? 'Passing' : status === 'failing' ? 'Failing' : status === 'needs_review' ? 'Needs review' : 'Not checked'}
    </Badge>
  )
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const variant: BadgeProps['variant'] =
    severity === 'critical' ? 'danger' : severity === 'high' ? 'warning' : severity === 'medium' ? 'info' : 'default'
  return <Badge variant={variant}>{severity}</Badge>
}

export function EvidenceReviewBadge({ status }: { status: EvidenceReviewStatus }) {
  const variant: BadgeProps['variant'] =
    status === 'approved' ? 'success' : status === 'in_review' ? 'info' : status === 'rejected' ? 'danger' : 'warning'
  const label = status === 'approved' ? 'Approved' : status === 'in_review' ? 'In review' : status === 'rejected' ? 'Rejected' : 'Missing'
  return <Badge variant={variant}>{label}</Badge>
}

export function AnswerStatusBadge({ status }: { status: AnswerStatus }) {
  const variant: BadgeProps['variant'] =
    status === 'approved' ? 'success' : status === 'needs_review' ? 'warning' : 'default'
  const label = status === 'approved' ? 'Approved' : status === 'needs_review' ? 'Needs review' : 'Draft'
  return <Badge variant={variant}>{label}</Badge>
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const variant: BadgeProps['variant'] =
    status === 'resolved' ? 'success' : status === 'in_progress' ? 'info' : status === 'blocked' ? 'danger' : 'warning'
  const label = status === 'resolved' ? 'Resolved' : status === 'in_progress' ? 'In progress' : status === 'blocked' ? 'Blocked' : 'Open'
  return <Badge variant={variant}>{label}</Badge>
}

export function PolicyStatusBadge({ status }: { status: PolicyStatus }) {
  const variant: BadgeProps['variant'] =
    status === 'published' ? 'success' : status === 'in_review' ? 'info' : status === 'archived' ? 'outline' : 'warning'
  const label = status === 'published' ? 'Published' : status === 'in_review' ? 'In review' : status === 'archived' ? 'Archived' : 'Draft'
  return <Badge variant={variant}>{label}</Badge>
}

export function QuestionnaireStatusBadge({ status }: { status: QuestionnaireStatus }) {
  const variant: BadgeProps['variant'] =
    status === 'completed' ? 'success' : status === 'in_review' ? 'info' : status === 'in_progress' ? 'info' : 'warning'
  const label =
    status === 'completed' ? 'Completed' : status === 'in_review' ? 'In review' : status === 'in_progress' ? 'In progress' : 'Draft'
  return <Badge variant={variant}>{label}</Badge>
}
