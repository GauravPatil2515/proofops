import { useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Search, Bell, Menu, ChevronRight, Plus, LogOut } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu'
import { cn } from '../../lib/utils'
import { useAuthApi } from '../../lib/queries'
import { useClerk } from '@clerk/clerk-react'
import { ThemeToggle } from '../theme/theme-toggle'

// Page title map for breadcrumb generation
const PAGE_TITLES: Record<string, { title: string; crumb: string }> = {
  '/overview': { title: 'Incident Command & Resolution Console', crumb: 'Incident Command' },
  '/security-checks': { title: 'ProofOps Verification Gates & Policy', crumb: 'Verification Gates' },
  '/evidence': { title: 'Cryptographic Evidence Vault (in-toto DSSE)', crumb: 'Evidence Vault' },
  '/benchmarks': { title: 'AgentChaos Benchmark (100% vs 12.5%)', crumb: 'AgentChaos' },
  '/questionnaires': { title: 'Questionnaires & Compliance', crumb: 'Questionnaires' },
  '/policies': { title: 'Incident & Verification Policies', crumb: 'Policies' },
  '/tasks': { title: 'Triage Tasks & Remediation', crumb: 'Tasks' },
  '/integrations': { title: 'Switch Mesh & Telemetry Integrations', crumb: 'Switch & Integrations' },
  '/audit-trail': { title: 'Cryptographic Audit Trail', crumb: 'Audit Trail' },
  '/settings': { title: 'System Settings', crumb: 'Settings' },
}

interface TopbarProps {
  onOpenMobileNav: () => void
}

export function Topbar({ onOpenMobileNav }: TopbarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { orgId, isAuthenticated, isLoading } = useAuthApi()
  const { signOut } = useClerk()

  const pathKey = Object.keys(PAGE_TITLES).find((p) =>
    p === '/' ? location.pathname === '/' : location.pathname.startsWith(p),
  )
  const pageMeta = pathKey ? PAGE_TITLES[pathKey] : { title: 'ProofOps', crumb: 'ProofOps' }

  const handleSignOut = async () => {
    try {
      await signOut({ redirectUrl: '/sign-in' })
    } catch {
      // Fallback if Clerk signOut fails
      navigate('/sign-in')
    }
  }

  // Redirect unauthenticated users to sign-in (except on sign-in page)
  useEffect(() => {
    if (!isLoading && !isAuthenticated && location.pathname !== '/sign-in') {
      navigate('/sign-in', { replace: true })
    }
  }, [isLoading, isAuthenticated, location.pathname, navigate])

  if (!isAuthenticated || isLoading || !orgId) {
    return (
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-canvas/80 backdrop-blur-md px-3 sm:px-5">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onOpenMobileNav}
          className="lg:hidden text-ink-subtle hover:text-ink"
          aria-label="Open navigation"
        >
          <Menu className="h-4.5 w-4.5" strokeWidth={1.75} />
        </Button>
        <nav className="flex items-center gap-1.5 min-w-0">
          <Link to="/sign-in" className="text-app-sm text-ink-subtle hover:text-ink transition-colors hidden sm:inline">
            Sign in
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-ink-faint hidden sm:inline" strokeWidth={1.75} />
          <span className="text-app-sm font-medium text-ink truncate">{pageMeta.crumb}</span>
        </nav>
        <div className="flex-1" />
        <ThemeToggle />
      </header>
    )
  }

  const org = { id: orgId, name: 'Acme SaaS', plan: 'Team' }
  const currentUser = { name: 'Gaurav Patil', email: 'gaurav@example.com', initials: 'GP', avatarColor: '#B9382B' }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-canvas/80 backdrop-blur-md px-3 sm:px-5">
      {/* Mobile menu trigger */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onOpenMobileNav}
        className="lg:hidden text-ink-subtle hover:text-ink"
        aria-label="Open navigation"
      >
        <Menu className="h-4.5 w-4.5" strokeWidth={1.75} />
      </Button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 min-w-0">
        <Link to={`/overview`} className="text-app-sm text-ink-subtle hover:text-ink transition-colors hidden sm:inline">
          Workspace
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-ink-faint hidden sm:inline" strokeWidth={1.75} />
        <span className="text-app-sm font-medium text-ink truncate">{pageMeta.crumb}</span>
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Global search — compact trigger on small screens, full input on lg */}
      <div className="hidden md:block">
        <Input
          icon={<Search className="h-3.5 w-3.5" strokeWidth={1.75} />}
          placeholder="Search controls, evidence, policies…"
          className="w-64 lg:w-72 h-8 text-app-xs"
        />
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden text-ink-subtle hover:text-ink"
        aria-label="Search"
      >
        <Search className="h-4 w-4" strokeWidth={1.75} />
      </Button>

      {/* Live indicator */}
      <Badge variant="outline" className="hidden lg:inline-flex normal-case tracking-normal">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
        Live
      </Badge>

      {/* Dark / Light Theme Toggle */}
      <ThemeToggle />

      {/* Notifications */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-ink-subtle hover:text-ink relative"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" strokeWidth={1.75} />
        <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-accent ring-2 ring-canvas" />
      </Button>

      {/* Organization status pill */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="hidden sm:inline-flex gap-2 h-8 px-2.5">
            <span className="flex items-center justify-center h-4 w-4 rounded-app-sm bg-accent-soft text-accent text-app-2xs font-semibold">
              {org.name.charAt(0)}
            </span>
            <span className="text-app-xs text-ink-muted max-w-[120px] truncate">{org.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
          <DropdownMenuItem>
            <span className="truncate">{org.name}</span>
            <span className="text-app-2xs text-ink-faint uppercase">{org.plan}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/settings')}>
            Manage organizations
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Primary contextual action */}
      <Button size="sm" className="h-8 gap-1.5" onClick={() => navigate('/security-checks')}>
        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
        <span className="hidden sm:inline">Run checks</span>
      </Button>

      {/* User avatar */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'flex items-center gap-1.5 rounded-app-md p-0.5 pr-1.5 h-8 transition-colors hover:bg-surface-muted',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
            )}
            aria-label="Account menu"
          >
            <span
              className="flex items-center justify-center h-7 w-7 rounded-full text-app-xs font-semibold text-white"
              style={{ background: currentUser.avatarColor }}
            >
              {currentUser.initials}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>
            <div className="flex flex-col gap-0.5">
              <span className="text-app-sm font-medium text-ink normal-case tracking-normal">{currentUser.name}</span>
              <span className="text-app-2xs text-ink-faint normal-case tracking-normal">{currentUser.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/settings')}>Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onClick={handleSignOut} className="gap-2">
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}