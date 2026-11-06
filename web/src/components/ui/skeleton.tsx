// Skeleton — for loading states

import * as React from 'react'
import { cn } from '../../lib/utils'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-app-sm bg-surface-muted', className)} {...props} />
}

export { Skeleton }
