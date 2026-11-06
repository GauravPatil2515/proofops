import { Sun, Moon } from 'lucide-react'
import { Button } from '../ui/button'
import { useTheme } from './theme-provider'

export function ThemeToggle({ className }: { className?: string }) {
  const { effectiveTheme, toggleTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleTheme}
      className={className || 'text-ink-subtle hover:text-ink transition-colors'}
      aria-label={`Switch to ${effectiveTheme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${effectiveTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {effectiveTheme === 'dark' ? (
        <Sun className="h-4 w-4 text-warning transition-transform hover:rotate-45" strokeWidth={1.75} />
      ) : (
        <Moon className="h-4 w-4 text-ink-muted transition-transform hover:-rotate-12" strokeWidth={1.75} />
      )}
    </Button>
  )
}
