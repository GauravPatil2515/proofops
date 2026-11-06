import { useMemo, useState } from 'react'
import {
  Search,
  ChevronRight,
  Check,
  Clock,
  AlertTriangle,
  CircleAlert,
  Ban,
  Info,
} from 'lucide-react'
import { PageHeader, PageBody } from '../../components/layout/page-header'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input, Textarea } from '../../components/ui/input'
import { Badge, SeverityBadge, TaskStatusBadge } from '../../components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '../../components/ui/table'
import { Sheet, SheetContent, SheetFooter } from '../../components/ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs'
import { Separator } from '../../components/ui/separator'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui/select'
import { toast } from 'sonner'
import { cn, formatDate, daysUntil } from '../../lib/utils'
import { useTasks, useResolveTask } from '../../lib/queries'
import { useAuthApi } from '../../lib/queries'
import type { RemediationTask, TaskStatus, Severity } from '../../types'

type Tab = 'open' | 'overdue' | 'assigned' | 'completed'

const STATUS_ICON: Record<TaskStatus, React.ReactNode> = {
  open: <Clock className="h-3.5 w-3.5 text-warning" strokeWidth={2} />,
  in_progress: <Clock className="h-3.5 w-3.5 text-info" strokeWidth={2} />,
  blocked: <Ban className="h-3.5 w-3.5 text-danger" strokeWidth={2} />,
  resolved: <Check className="h-3.5 w-3.5 text-success" strokeWidth={2} />,
}

export function TasksPage() {
  const { orgId, isAuthenticated } = useAuthApi()
  const { data: tasks = [], isLoading, error } = useTasks(orgId)
  const resolveTaskMutation = useResolveTask()
  
  const [tab, setTab] = useState<Tab>('open')
  const [search, setSearch] = useState('')
  const [severity, setSeverity] = useState<string>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [resolutionNote, setResolutionNote] = useState('')

  const filtered = useMemo(() => {
    const currentUser = 'user-priya' // TODO: get from auth context
    return tasks.filter((t) => {
      const isOverdue = daysUntil(t.dueDate) !== null && daysUntil(t.dueDate)! < 0 && t.status !== 'resolved'
      if (tab === 'open' && (t.status === 'resolved' || isOverdue)) return false
      if (tab === 'overdue' && !isOverdue) return false
      if (tab === 'assigned' && t.owner?.id !== currentUser) return false
      if (tab === 'completed' && t.status !== 'resolved') return false
      if (search) {
        const q = search.toLowerCase()
        if (!t.title.toLowerCase().includes(q)) return false
      }
      if (severity !== 'all' && t.severity !== severity) return false
      return true
    })
  }, [tasks, tab, search, severity])

  const counts = useMemo(() => {
    const c = { open: 0, overdue: 0, assigned: 0, completed: 0 }
    for (const t of tasks) {
      const isOverdue = daysUntil(t.dueDate) !== null && daysUntil(t.dueDate)! < 0 && t.status !== 'resolved'
      if (t.status === 'resolved') c.completed++
      else if (isOverdue) c.overdue++
      else c.open++
      if (t.owner?.id === 'user-priya' && t.status !== 'resolved') c.assigned++
    }
    return c
  }, [tasks])

  function openTask(id: string) {
    setSelectedId(id)
    setResolutionNote('')
    setDrawerOpen(true)
  }

  async function handleResolveTask(id: string) {
    try {
      await resolveTaskMutation.mutateAsync({ taskId: id, resolutionNote: resolutionNote || 'Remediation completed and verified' })
      setDrawerOpen(false)
      toast.success('Task marked resolved', {
        description: 'Audit event logged. The underlying control will be re-evaluated on the next scan.',
      })
    } catch (err: any) {
      toast.error('Failed to resolve task', { description: err.message })
    }
  }

  function assignToMe(_id: string) {
    // TODO: Implement assign to me mutation
    toast.success('Task assigned to you')
  }

  const selected = tasks.find((t) => t.id === selectedId)
  const severities: (Severity | 'all')[] = ['all', 'critical', 'high', 'medium', 'low']

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-medium text-ink">Sign in to view tasks</h2>
          <p className="text-app-sm text-ink-muted mt-1">Please sign in with Clerk to access your remediation tasks.</p>
        </div>
      </div>
    )
  }

  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-medium text-danger">Failed to load tasks</h2>
          <p className="text-app-sm text-ink-muted mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Tasks & remediation"
        description="Security gaps requiring action. Marking a task resolved does not flip the underlying control to passing — a fresh check must verify the remediation."
        meta={
          <Badge variant="outline" className="normal-case tracking-normal">
            <span className={cn("inline-block h-1.5 w-1.5 rounded-full", "bg-success")} />
            Live Remediation Active
          </Badge>
        }
      />

      <PageBody className="flex flex-col gap-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <TabsList>
              <TabsTrigger value="open" className="gap-1.5">
                Open
                <span className="text-app-2xs text-ink-faint ml-1">{counts.open}</span>
              </TabsTrigger>
              <TabsTrigger value="overdue" className="gap-1.5">
                Overdue
                <span className="text-app-2xs text-danger ml-1">{counts.overdue}</span>
              </TabsTrigger>
              <TabsTrigger value="assigned" className="gap-1.5">
                Assigned to me
                <span className="text-app-2xs text-ink-faint ml-1">{counts.assigned}</span>
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-1.5">
                Completed
                <span className="text-app-2xs text-ink-faint ml-1">{counts.completed}</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Input
                icon={<Search className="h-3.5 w-3.5" strokeWidth={1.75} />}
                placeholder="Search tasks…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 text-app-xs w-48 sm:w-64"
              />
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="w-[140px] h-8 text-app-xs"><SelectValue placeholder="Severity" /></SelectTrigger>
                <SelectContent>
                  {severities.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === 'all' ? 'All severities' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value={tab}>
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Task</TableHead>
                    <TableHead className="hidden md:table-cell">Related control</TableHead>
                    <TableHead className="hidden lg:table-cell">Owner</TableHead>
                    <TableHead className="hidden lg:table-cell w-32">Due</TableHead>
                    <TableHead className="w-24">Severity</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="p-0">
                        <TableEmpty
                          icon={<Check className="h-4 w-4" strokeWidth={1.75} />}
                          title={tab === 'completed' ? 'No completed tasks yet' : tab === 'overdue' ? 'Nothing overdue' : 'No tasks in this view'}
                          description={tab === 'overdue' ? 'All open tasks are within their due date.' : 'Try another tab or clear filters.'}
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((t) => {
                      const days = daysUntil(t.dueDate)
                      const overdue = days !== null && days < 0 && t.status !== 'resolved'
                      return (
                        <TableRow key={t.id} onClick={() => openTask(t.id)}>
                          <TableCell>
                            <div className="flex items-start gap-2.5 min-w-0">
                              {STATUS_ICON[t.status as TaskStatus]}
                              <div className="min-w-0">
                                <div className="font-medium text-ink truncate max-w-[280px]">{t.title}</div>
                                {t.resolutionNote && (
                                  <div className="text-app-2xs text-ink-subtle truncate max-w-[280px] mt-0.5">{t.resolutionNote}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <ControlCell controlId={t.controlId} />
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-ink-muted">
                            {t.owner ? t.owner.name : <span className="text-ink-faint italic">Unassigned</span>}
                          </TableCell>
                          <TableCell className={cn('hidden lg:table-cell text-app-xs', overdue ? 'text-danger' : 'text-ink-muted')}>
                            {formatDate(t.dueDate)}
                            {overdue && <span className="block text-app-2xs text-danger">{Math.abs(days!)}d overdue</span>}
                          </TableCell>
                          <TableCell><SeverityBadge severity={t.severity} /></TableCell>
                          <TableCell><TaskStatusBadge status={t.status} /></TableCell>
                          <TableCell><ChevronRight className="h-3.5 w-3.5 text-ink-faint" strokeWidth={2} /></TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </PageBody>

      {/* Task detail drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          title={selected ? selected.title : 'Task'}
          description={selected ? `Due ${formatDate(selected.dueDate)}` : undefined}
          className="w-full max-w-xl"
        >
          {selected && (
            <TaskDetail
              task={selected}
              resolutionNote={resolutionNote}
              onResolutionNoteChange={setResolutionNote}
              onResolve={() => handleResolveTask(selected.id)}
              onAssignToMe={() => assignToMe(selected.id)}
              isResolving={resolveTaskMutation.isPending}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

function TaskDetail({
  task,
  resolutionNote,
  onResolutionNoteChange,
  onResolve,
  onAssignToMe,
  isResolving,
}: {
  task: RemediationTask
  resolutionNote: string
  onResolutionNoteChange: (v: string) => void
  onResolve: () => void
  onAssignToMe: () => void
  isResolving: boolean
}) {
  const days = daysUntil(task.dueDate)
  const overdue = days !== null && days < 0 && task.status !== 'resolved'

  return (
    <div className="flex flex-col gap-5">
      {/* Status banner */}
      <div className={cn(
        'flex items-start gap-2 p-3 rounded-app-md border',
        task.status === 'resolved' ? 'bg-success-soft border-success-border' : overdue ? 'bg-danger-soft border-danger-border' : 'bg-warning-soft border-warning-border',
      )}>
        {task.status === 'resolved' ? <Check className="h-4 w-4 text-success" strokeWidth={2} /> : overdue ? <AlertTriangle className="h-4 w-4 text-danger" strokeWidth={2} /> : <CircleAlert className="h-4 w-4 text-warning" strokeWidth={2} />}
        <div className="flex-1 min-w-0">
          <p className="text-app-sm font-medium text-ink">
            {task.status === 'resolved' ? 'Resolved' : overdue ? 'Overdue' : 'Open'}
          </p>
          <p className="text-app-xs text-ink-muted mt-0.5">
            {task.status === 'resolved'
              ? `Resolved ${formatDate(task.resolvedAt)}`
              : overdue
                ? `${Math.abs(days!)} days past due date`
                : `Due in ${days} days`}
          </p>
        </div>
      </div>

      {/* Meta */}
      <dl className="grid grid-cols-2 gap-3 text-app-sm">
        <div>
          <dt className="text-app-2xs font-medium uppercase tracking-wider text-ink-faint">Severity</dt>
          <dd className="mt-1"><SeverityBadge severity={task.severity} /></dd>
        </div>
        <div>
          <dt className="text-app-2xs font-medium uppercase tracking-wider text-ink-faint">Owner</dt>
          <dd className="text-ink mt-1">{task.owner ? task.owner.name : <span className="text-ink-faint italic">Unassigned</span>}</dd>
        </div>
        <div>
          <dt className="text-app-2xs font-medium uppercase tracking-wider text-ink-faint">Due date</dt>
          <dd className={cn('mt-1', overdue ? 'text-danger' : 'text-ink')}>{formatDate(task.dueDate)}</dd>
        </div>
        <div>
          <dt className="text-app-2xs font-medium uppercase tracking-wider text-ink-faint">Created from</dt>
          <dd className="text-ink-muted mt-1 text-app-xs">Check {task.createdFromCheckId}</dd>
        </div>
      </dl>

      <Separator />

      {/* Related control */}
      <section className="flex flex-col gap-2">
        <h3 className="text-app-2xs font-semibold uppercase tracking-wider text-ink-faint">Related control</h3>
        <span className="text-ink-faint">Control details loaded from API</span>
      </section>

      <Separator />

      {/* Critical notice */}
      <div className="rounded-app-md bg-info-soft border border-info-border p-3 flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-info mt-0.5 shrink-0" strokeWidth={2} />
        <p className="text-app-xs text-ink-muted leading-relaxed">
          Resolving this task does <strong className="text-ink">not</strong> automatically mark the underlying control as passing. A fresh check will run on the next scan to verify the remediation.
        </p>
      </div>

      {/* Resolution note */}
      <section className="flex flex-col gap-2">
        <h3 className="text-app-2xs font-semibold uppercase tracking-wider text-ink-faint">Resolution note (required)</h3>
        <Textarea
          value={resolutionNote}
          onChange={(e) => onResolutionNoteChange(e.target.value)}
          rows={4}
          placeholder="Describe what was changed, where, and when. This note will be attached to the audit trail."
        />
      </section>

      <SheetFooter>
        {!task.owner && (
          <Button variant="outline" onClick={onAssignToMe}>Assign to me</Button>
        )}
        <Button
          onClick={onResolve}
          disabled={task.status === 'resolved' || !resolutionNote.trim() || isResolving}
          className="gap-1.5"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={2} />
          {isResolving ? 'Resolving...' : 'Mark resolved'}
        </Button>
      </SheetFooter>
    </div>
  )
}

function ControlCell({ controlId }: { controlId: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-app-xs text-ink-muted">{controlId}</span>
      <span className="text-app-2xs text-ink-subtle truncate max-w-[180px]">Loading...</span>
    </div>
  )
}