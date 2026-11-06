import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format an ISO timestamp into a short, app-grade date label
export function formatDate(iso: string | undefined | null): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return '—'
  }
}

// Format a date with time
export function formatDateTime(iso: string | undefined | null): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

// Relative time, e.g. "3h ago", "2d ago"
export function timeAgo(iso: string | undefined | null): string {
  if (!iso) return '—'
  try {
    const then = new Date(iso).getTime()
    const now = Date.now()
    const diff = Math.max(0, now - then)
    const sec = Math.floor(diff / 1000)
    const min = Math.floor(sec / 60)
    const hr = Math.floor(min / 60)
    const day = Math.floor(hr / 24)
    if (sec < 60) return 'just now'
    if (min < 60) return `${min}m ago`
    if (hr < 24) return `${hr}h ago`
    if (day < 30) return `${day}d ago`
    return formatDate(iso)
  } catch {
    return '—'
  }
}

// Days until due date — negative if overdue
export function daysUntil(iso: string | undefined | null): number | null {
  if (!iso) return null
  try {
    const then = new Date(iso).getTime()
    const now = Date.now()
    return Math.ceil((then - now) / (1000 * 60 * 60 * 24))
  } catch {
    return null
  }
}

// Human-readable byte size
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`
}

// Short-hash an arbitrary string for demo display only — clearly labeled as illustrative
export function demoHash(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i)
    h |= 0
  }
  const hex = (h >>> 0).toString(16).padStart(8, '0')
  return `sha256:${hex}…`.slice(0, 16)
}

// Truncate long text in tables
export function truncate(s: string, n: number): string {
  if (s.length <= n) return s
  return s.slice(0, n - 1) + '…'
}
