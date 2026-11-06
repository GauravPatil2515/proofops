import * as React from 'react'
import { cn } from '../../lib/utils'

// Lightweight, dependency-free table primitives — match shadcn/ui API surface.
// Compact, readable data tables with consistent typography.

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-x-auto">
      <table ref={ref} className={cn('w-full border-collapse text-app-sm', className)} {...props} />
    </div>
  ),
)
Table.displayName = 'Table'

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('border-b border-line', className)} {...props} />
  ),
)
TableHeader.displayName = 'TableHeader'

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('divide-y divide-line-subtle', className)} {...props} />
  ),
)
TableBody.displayName = 'TableBody'

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, onClick, ...props }, ref) => (
    <tr
      ref={ref}
      onClick={onClick}
      className={cn(
        'group/row transition-colors',
        onClick && 'cursor-pointer hover:bg-surface-muted',
        className,
      )}
      {...props}
    />
  ),
)
TableRow.displayName = 'TableRow'

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'text-app-2xs font-semibold uppercase tracking-wider text-ink-subtle text-left px-3 h-9 align-middle whitespace-nowrap',
        className,
      )}
      {...props}
    />
  ),
)
TableHead.displayName = 'TableHead'

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn('px-3 py-2.5 align-middle text-ink', className)} {...props} />
  ),
)
TableCell.displayName = 'TableCell'

const TableEmpty = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { title?: string; description?: string; icon?: React.ReactNode }>(
  ({ className, title = 'Nothing here yet', description, icon, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col items-center justify-center text-center py-12 px-4', className)} {...props}>
      {icon && (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-app-md bg-surface-muted text-ink-subtle">
          {icon}
        </div>
      )}
      <p className="text-app-sm font-medium text-ink">{title}</p>
      {description && <p className="mt-1 text-app-xs text-ink-muted max-w-sm">{description}</p>}
    </div>
  ),
)
TableEmpty.displayName = 'TableEmpty'

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty }
