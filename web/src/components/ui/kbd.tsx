// KBD — keyboard shortcut pill

import * as React from 'react'
import { cn } from '../../lib/utils'

export function Kbd({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-app-sm border border-line bg-surface-muted text-app-2xs font-mono text-ink-subtle',
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  )
}
