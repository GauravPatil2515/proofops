import * as React from 'react'
import { cn } from '../../lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  meta?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, meta, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-6 sm:px-8 pt-6 pb-4 border-b border-line', className)}>
      <div className="flex flex-col gap-1 min-w-0">
        <h1 className="text-app-xl font-semibold text-ink tracking-tight">{title}</h1>
        {description && <p className="text-app-sm text-ink-muted max-w-2xl">{description}</p>}
        {meta && <div className="flex items-center gap-2 mt-1">{meta}</div>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}

export function PageBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-6 sm:px-8 py-6', className)}>{children}</div>
}
