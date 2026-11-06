import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ShieldCheck,
  FolderLock,
  FileQuestion,
  ListChecks,
  Plug,
  History,
  Settings,
  LifeBuoy,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { Separator } from '../ui/separator'
import { Button } from '../ui/button'
import { ProoflineWordmark } from './wordmark'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapsed: () => void
  onClose?: () => void
}

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
}

const workspaceNav: NavItem[] = [
  { to: '/overview', label: 'Incident Command', icon: LayoutDashboard, end: true },
  { to: '/evidence', label: 'Evidence Vault', icon: FolderLock },
  { to: '/security-checks', label: 'Verification Gates', icon: ShieldCheck },
  { to: '/rules', label: 'Benchmark & Policy', icon: ListChecks },
]

const managementNav: NavItem[] = [
  { to: '/integrations', label: 'Switch & Webhooks', icon: Plug },
  { to: '/audit-trail', label: 'Cryptographic Audit', icon: History },
  { to: '/demo', label: 'Interactive Demo', icon: FileQuestion },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function NavItemView({ item, collapsed, onClick }: { item: NavItem; collapsed: boolean; onClick?: () => void }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) =>
        cn('nav-item', isActive && 'active', collapsed && 'justify-center px-0')
      }
      title={collapsed ? item.label : undefined}
    >
      <Icon className={cn('nav-item-icon h-4 w-4 shrink-0 text-ink-subtle', collapsed && 'h-4 w-4')} strokeWidth={1.75} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  )
}

export function Sidebar({ collapsed, onToggleCollapsed, onClose }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-surface-subtle border-r border-line transition-[width] duration-200 ease-app',
        collapsed ? 'w-[56px]' : 'w-[232px]',
      )}
    >
      {/* Wordmark + collapse toggle */}
      <div className="flex items-center justify-between gap-2 px-3 h-14 border-b border-line shrink-0">
        <div className={cn('flex items-center', collapsed && 'justify-center w-full')}>
          <ProoflineWordmark collapsed={collapsed} />
        </div>
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleCollapsed}
            aria-label="Collapse sidebar"
            className="hidden lg:flex text-ink-subtle hover:text-ink"
          >
            <ChevronsLeft className="h-4 w-4" strokeWidth={1.75} />
          </Button>
        )}
      </div>

      {/* If collapsed, show expand button */}
      {collapsed && (
        <div className="px-2 pt-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleCollapsed}
            aria-label="Expand sidebar"
            className="w-full h-8 text-ink-subtle hover:text-ink"
          >
            <ChevronsRight className="h-4 w-4" strokeWidth={1.75} />
          </Button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          {!collapsed && <div className="section-label py-1">Workspace</div>}
          {workspaceNav.map((item) => (
            <NavItemView key={item.to} item={item} collapsed={collapsed} onClick={onClose} />
          ))}
        </div>

        <Separator />

        <div className="flex flex-col gap-0.5">
          {!collapsed && <div className="section-label py-1">Management</div>}
          {managementNav.map((item) => (
            <NavItemView key={item.to} item={item} collapsed={collapsed} onClick={onClose} />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-line p-2 shrink-0">
        <div className="flex flex-col gap-0.5">
          <a
            href="#"
            className={cn('nav-item', collapsed && 'justify-center px-0')}
            title={collapsed ? 'Help and documentation' : undefined}
            onClick={(e) => e.preventDefault()}
          >
            <LifeBuoy className="h-4 w-4 text-ink-subtle" strokeWidth={1.75} />
            {!collapsed && <span className="truncate">Help & docs</span>}
          </a>
        </div>
      </div>
    </aside>
  )
}
