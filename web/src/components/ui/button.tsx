import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-app-md text-app-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-white hover:bg-accent-hover shadow-app-xs',
        secondary: 'bg-surface text-ink border border-line hover:bg-surface-muted hover:border-line-strong shadow-app-xs',
        ghost: 'text-ink-muted hover:text-ink hover:bg-surface-muted',
        outline: 'border border-line bg-transparent text-ink-muted hover:text-ink hover:bg-surface-muted hover:border-line-strong',
        subtle: 'bg-surface-muted text-ink-muted hover:bg-line hover:text-ink',
        danger: 'bg-danger text-white hover:bg-danger/90 shadow-app-xs',
        link: 'text-accent hover:text-accent-hover underline-offset-4 hover:underline h-auto p-0',
      },
      size: {
        sm: 'h-8 px-2.5 text-app-xs gap-1',
        default: 'h-9 px-3.5',
        lg: 'h-10 px-4 text-app-md',
        icon: 'h-9 w-9 p-0',
        'icon-sm': 'h-8 w-8 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  },
)
Button.displayName = 'Button'

export { buttonVariants }
