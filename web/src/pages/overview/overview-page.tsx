import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import {
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  FolderLock,
  TrendingUp,
  Play,
  ChevronRight,
  CircleAlert,
  RefreshCw,
} from 'lucide-react'
import { PageHeader, PageBody } from '../../components/layout/page-header'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge, CheckStatusBadge, SeverityBadge } from '../../components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table'
import { cn, formatDate, timeAgo, daysUntil } from '../../lib/utils'
import { useOverview, useTasks } from '../../lib/queries'
import { useAuthApi } from '../../lib/queries'
import { IncidentCommandCenter } from '../../components/incidents/incident-command-center'
import type { CheckStatus } from '../../types'
import { toast } from 'sonner'

const STATUS_COLORS: Record<CheckStatus, string> = {
  passing: '#16794B',
  failing: '#B42318',
  needs_review: '#956200',
  not_checked: '#A8A59B',
}

function StatCard({
  label,
  value,
  icon,
  delta,
  accent,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  delta?: { value: string; direction: 'up' | 'down' | 'flat' }
  accent?: 'default' | 'success' | 'warning' | 'danger'
}) {
  const accentClass = {
    default: 'bg-surface-muted text-ink-subtle',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
  }[accent || 'default']

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-app-2xs font-medium uppercase tracking-wider text-ink-subtle">{label}</span>
          <span className="text-app-2xl font-semibold text-ink tabular-nums leading-tight">{value}</span>
          {delta && (
            <span
              className={cn(
                'text-app-2xs font-medium flex items-center gap-0.5',
                delta.direction === 'up' ? 'text-success' : delta.direction === 'down' ? 'text-danger' : 'text-ink-subtle',
              )}
            >
              {delta.direction === 'up' && <ArrowUpRight className="h-3 w-3" strokeWidth={2} />}
              {delta.direction === 'down' && <ArrowUpRight className="h-3 w-3 rotate-90" strokeWidth={2} />}
              {delta.direction === 'flat' && <span className="inline-block h-1 w-1 rounded-full bg-ink-subtle" />}
              {delta.value}
            </span>
          )}
        </div>
        <span className={cn('flex items-center justify-center h-9 w-9 rounded-app-md', accentClass)}>
          {icon}
        </span>
      </CardContent>
    </Card>
  )
}

export function OverviewPage() {
  const navigate = useNavigate()
  const { orgId, isAuthenticated, isLoading: authLoading } = useAuthApi()
  const { data: overview, isLoading: overviewLoading, error: overviewError } = useOverview(orgId)
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(orgId)

  const isLoading = authLoading || overviewLoading || tasksLoading
  const isLive = isAuthenticated && !overviewError

  const readinessScore = overview ? `${overview.readiness_score}%` : '0%'
  const passingChecks = overview?.checks_passing ?? 0
  const openIssues = (overview?.checks_failing ?? 0) + (overview?.checks_needs_review ?? 0)
  const evidenceItems = overview?.evidence_items_count ?? 0

  const pieData = useMemo(() => {
    if (overview && overview.checks_total > 0) {
      return [
        { name: 'Passing', value: overview.checks_passing, color: STATUS_COLORS.passing },
        { name: 'Failing', value: overview.checks_failing, color: STATUS_COLORS.failing },
        { name: 'Needs review', value: overview.checks_needs_review, color: STATUS_COLORS.needs_review },
        { name: 'Not checked', value: overview.checks_not_checked, color: STATUS_COLORS.not_checked },
      ].filter((d) => d.value > 0)
    }
    return []
  }, [overview])

  const upcomingTasks = useMemo(() => {
    return tasks.filter((t: any) => t.status !== 'resolved').slice(0, 5)
  }, [tasks])

  const recentActivity = useMemo(() => {
    if (overview?.recent_events && overview.recent_events.length > 0) {
      return overview.recent_events.slice(0, 6).map((e: any) => ({
        id: e.id,
        summary: e.summary,
        actor: { name: e.actor_name || 'System' },
        target: { label: e.target_kind || 'Control' },
        at: e.created_at,
      }))
    }
    return []
  }, [overview])

  async function downloadReport() {
    if (!orgId) return
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
      const res = await fetch(`${apiBase}/organizations/${orgId}/report/pdf`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('proofline_token') || ''}`,
        },
      })
      if (!res.ok) throw new Error('PDF generation failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Proofline_SOC2_Readiness_Report.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Assessment report downloaded', {
        description: 'Audit-ready PDF generated from verified controls and evidence.',
      })
    } catch (err: any) {
      toast.error('Download failed', { description: err.message })
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-medium text-ink">Sign in to view overview</h2>
          <p className="text-app-sm text-ink-muted mt-1">Please sign in with Clerk to access your security overview.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (overviewError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-medium text-danger">Failed to load overview</h2>
          <p className="text-app-sm text-ink-muted mt-1">{overviewError.message}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Security overview"
        description="Continuous assessment of your SOC 2 Type I readiness against live engineering posture."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadReport}
              className="gap-1.5 h-8"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              Export Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="gap-1.5 h-8"
              disabled={overviewLoading}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", overviewLoading && "animate-spin")} />
              Sync
            </Button>
            <Button onClick={() => navigate('/security-checks')} className="gap-1.5 h-8">
              <Play className="h-3.5 w-3.5" strokeWidth={2.5} />
              Run checks
            </Button>
          </div>
        }
        meta={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="normal-case tracking-normal">
              <span className={cn("inline-block h-1.5 w-1.5 rounded-full", isLive ? "bg-success" : "bg-warning")} />
              {isLive ? 'Live Backend Connected' : 'Sample demo data'}
            </Badge>
            <span className="text-app-xs text-ink-subtle">
              {isLive ? 'Active continuous sync' : 'Offline sandbox mode'}
            </span>
          </div>
        }
      />

      <PageBody className="flex flex-col gap-6">
        {/* Top summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Readiness score"
            value={readinessScore}
            icon={<TrendingUp className="h-4 w-4" strokeWidth={2} />}
            delta={{ value: isLive ? 'Real-time verified' : '—', direction: 'up' }}
            accent="success"
          />
          <StatCard
            label="Passing checks"
            value={passingChecks}
            icon={<ShieldCheck className="h-4 w-4" strokeWidth={2} />}
            delta={{ value: isLive ? 'Deterministic scan' : '—', direction: 'up' }}
            accent="success"
          />
          <StatCard
            label="Open issues"
            value={openIssues}
            icon={<AlertTriangle className="h-4 w-4" strokeWidth={2} />}
            delta={{ value: isLive ? `${openIssues} pending review` : '—', direction: openIssues > 0 ? 'down' : 'flat' }}
            accent={openIssues > 0 ? 'warning' : 'default'}
          />
          <StatCard
            label="Evidence items"
            value={evidenceItems}
            icon={<FolderLock className="h-4 w-4" strokeWidth={2} />}
            delta={{ value: isLive ? 'Cryptographically hashed' : '—', direction: 'up' }}
            accent="default"
          />
        </div>

        {/* Autonomous Incident Command Console */}
        <IncidentCommandCenter />

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Readiness trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex flex-col gap-0.5">
                <CardTitle>Readiness trend</CardTitle>
                <CardDescription>
                  {isLive ? '30-day verified compliance trajectory' : 'Last 30 days · sample demo data'}
                </CardDescription>
              </div>
              <Badge variant="success" className="normal-case tracking-normal">
                <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
                {readinessScore}
              </Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[200px] -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={(overview as any)?.readiness_trend || []} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="readinessGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EFEDE6" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#8A877E' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(d) => {
                        const date = new Date(d)
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      }}
                      interval={4}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#8A877E' }}
                      tickLine={false}
                      axisLine={false}
                      width={32}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (!active || !payload?.length) return null
                        const p = payload[0].payload
                        return (
                          <div className="rounded-app-md bg-ink px-2.5 py-1.5 text-white text-app-xs shadow-app-md">
                            <div className="font-medium">{formatDate(p.date)}</div>
                            <div className="text-ink-faint">{p.score}% readiness</div>
                          </div>
                        )
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#4F46E5"
                      strokeWidth={1.5}
                      fill="url(#readinessGradient)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Status breakdown */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-0.5">
                <CardTitle>Security checks</CardTitle>
                <CardDescription>Evaluated controls by verification state</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-line">
                {pieData.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-app-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-ink-subtle">{s.name}</span>
                    </div>
                    <span className="font-medium text-ink tabular-nums">{s.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom grid: Open issues + Upcoming tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* High-priority issues */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-0.5">
                <CardTitle>High-priority gaps</CardTitle>
                <CardDescription>Controls failing or requiring remediation to reach readiness</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/security-checks')} className="gap-1 text-ink-muted">
                View all
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Control</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {((overview as any)?.issues || []).slice(0, 4).map((row: any) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => navigate('/security-checks')}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-mono text-app-2xs text-ink-subtle">{row.controlId}</span>
                          <span className="font-medium text-ink truncate max-w-[220px]">{row.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <SeverityBadge severity={row.severity} />
                      </TableCell>
                      <TableCell>
                        <CheckStatusBadge status={row.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Upcoming remediation tasks */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-0.5">
                <CardTitle>Remediation tasks</CardTitle>
                <CardDescription>Tasks scheduled to resolve security controls</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')} className="gap-1 text-ink-muted">
                View all
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
              </Button>
            </CardHeader>
            <CardContent className="pt-0 flex flex-col gap-0.5">
              {upcomingTasks.map((t: any) => {
                const dueDate = t.dueDate || t.due_date || new Date().toISOString()
                const days = daysUntil(dueDate)
                const overdue = days !== null && days < 0
                return (
                  <button
                    key={t.id}
                    onClick={() => navigate('/tasks')}
                    className="flex items-start gap-2 rounded-app-md p-2 text-left hover:bg-surface-muted transition-colors"
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex items-center justify-center h-5 w-5 rounded-app-sm shrink-0',
                        overdue ? 'bg-danger-soft text-danger' : 'bg-surface-muted text-ink-subtle',
                      )}
                    >
                      <CircleAlert className="h-3 w-3" strokeWidth={2} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-app-sm text-ink truncate font-medium">{t.title}</div>
                      <div className="text-app-xs text-ink-subtle mt-0.5 flex items-center gap-2">
                        <span>{t.owner ? (t.owner.name || t.owner) : 'Assigned to Dev'}</span>
                        <span className="text-ink-faint">·</span>
                        <span className={overdue ? 'text-danger' : ''}>
                          {overdue ? `${Math.abs(days!)}d overdue` : `Due in ${days || 7}d`}
                        </span>
                      </div>
                    </div>
                    <SeverityBadge severity={t.severity || 'high'} />
                  </button>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Recent evidence activity */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-0.5">
              <CardTitle>Recent evidence activity</CardTitle>
              <CardDescription>
                {isLive ? 'Real-time cryptographically verified audit events' : 'Latest events from your workspace · sample demo data'}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/audit-trail')} className="gap-1 text-ink-muted">
              View audit log
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <ol className="relative flex flex-col">
              {recentActivity.map((e: any, i: number) => (
                <li key={e.id} className="flex items-start gap-3 py-2.5">
                  <div className="flex flex-col items-center self-stretch">
                    <span className="mt-1 flex items-center justify-center h-2 w-2 rounded-full bg-accent ring-4 ring-accent-soft" />
                    {i < recentActivity.length - 1 && <span className="flex-1 w-px bg-line mt-1" />}
                  </div>
                  <div className="flex-1 min-w-0 flex items-start justify-between gap-3 pb-1">
                    <div className="min-w-0">
                      <p className="text-app-sm text-ink">{e.summary}</p>
                      <p className="text-app-xs text-ink-subtle mt-0.5">
                        {e.actor?.name || 'Dev'} · {e.target?.label || e.target_kind || 'Control'}
                      </p>
                    </div>
                    <span className="text-app-xs text-ink-faint shrink-0 whitespace-nowrap">
                      {timeAgo(e.at || e.created_at)}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </PageBody>
    </>
  )
}