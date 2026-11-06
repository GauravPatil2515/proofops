import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn } from '../../lib/utils'

const Avatar = AvatarPrimitive.Root

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image ref={ref} className={cn('aspect-square h-full w-full', className)} {...props} />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn('flex h-full w-full items-center justify-center rounded-full text-app-xs font-semibold text-white', className)}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

interface UserAvatarProps {
  initials: string
  color: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

export function UserAvatar({ initials, color, size = 'sm', className }: UserAvatarProps) {
  const sizeClass = {
    xs: 'h-6 w-6 text-app-2xs',
    sm: 'h-7 w-7 text-app-xs',
    md: 'h-8 w-8 text-app-sm',
    lg: 'h-10 w-10 text-app-md',
  }[size]
  return (
    <Avatar className={cn(sizeClass, 'rounded-full shrink-0', className)} style={{ background: color }}>
      <AvatarFallback style={{ background: color }}>{initials}</AvatarFallback>
    </Avatar>
  )
}

export { Avatar, AvatarImage, AvatarFallback }
