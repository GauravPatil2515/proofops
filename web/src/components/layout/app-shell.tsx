import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from '../navigation/sidebar'
import { Topbar } from './topbar'
import { Sheet, SheetContent } from '../ui/sheet'
import { cn } from '../../lib/utils'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <div className="flex h-screen w-full overflow-hidden bg-canvas">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((v) => !v)} />
      </div>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[260px] max-w-[80vw]">
          <Sidebar collapsed={false} onToggleCollapsed={() => setMobileOpen(false)} onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onOpenMobileNav={() => setMobileOpen(true)} />
        <main className={cn('flex-1 overflow-y-auto')}>{children}</main>
      </div>
    </div>
  )
}
