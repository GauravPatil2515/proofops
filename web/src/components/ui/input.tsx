import * as React from 'react'
import { cn } from '../../lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }>(
  ({ className, type = 'text', icon, ...props }, ref) => {
    if (icon) {
      return (
        <div className="relative flex items-center">
          <span className="absolute left-2.5 text-ink-subtle pointer-events-none flex items-center justify-center">
            {icon}
          </span>
          <input
            ref={ref}
            type={type}
            className={cn(
              'flex h-9 w-full rounded-app-md border border-line bg-surface pl-8 pr-3 text-app-sm text-ink',
              'placeholder:text-ink-faint transition-colors',
              'focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              className,
            )}
            {...props}
          />
        </div>
      )
    }
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'flex h-9 w-full rounded-app-md border border-line bg-surface px-3 text-app-sm text-ink',
          'placeholder:text-ink-faint transition-colors',
          'focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-app-md border border-line bg-surface px-3 py-2 text-app-sm text-ink',
        'placeholder:text-ink-faint transition-colors resize-y',
        'focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'

export { Input, Textarea }
