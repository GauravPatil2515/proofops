// Empty state — for tables, pages, and panels with no content.

import * as React from 'react'
import { cn } from '../../lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-4', className)}>
      {icon && (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-app-md bg-surface-muted text-ink-subtle">
          {icon}
        </div>
      )}
      <p className="text-app-sm font-medium text-ink">{title}</p>
      {description && <p className="mt-1 text-app-xs text-ink-muted max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
