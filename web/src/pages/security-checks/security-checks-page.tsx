import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  CircleAlert,
  Info,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import { PageHeader, PageBody } from '../../components/layout/page-header'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge, SeverityBadge } from '../../components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '../../components/ui/table'
import { Sheet, SheetContent, SheetFooter } from '../../components/ui/sheet'
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from '../../components/ui/select'
import { Separator } from '../../components/ui/separator'
import { toast } from 'sonner'
import { cn, formatDateTime, timeAgo } from '../../lib/utils'
import { useControls, useCheckRuns, useRunAllChecks } from '../../lib/queries'
import { useAuthApi } from '../../lib/queries'
import type { Control, CheckResult, FrameworkTag, Severity, CheckStatus, ControlSource } from '../../types'

const FRAMEWORKS: (FrameworkTag | 'all')[] = ['all', 'SOC 2', 'ISO 27001', 'HIPAA', 'GDPR', 'PCI DSS', 'NIST CSF']
const SOURCES: (ControlSource | 'all')[] = ['all', 'github', 'aws', 'gcp', 'manual', 'internal']
const STATUSES: (CheckStatus | 'all')[] = ['all', 'passing', 'failing', 'needs_review', 'not_checked']
const SEVERITIES: (Severity | 'all')[] = ['all', 'critical', 'high', 'medium', 'low']

const SOURCE_LABEL: Record<ControlSource, string> = {
  github: 'GitHub',
  aws: 'AWS',
  gcp: 'GCP',
  manual: 'Manual',
  internal: 'Internal',
}

const STATUS_ICON: Record<CheckStatus, React.ReactNode> = {
  passing: <ShieldCheck className="h-4 w-4 text-success" strokeWidth={2} />,
  failing: <AlertTriangle className="h-4 w-4 text-danger" strokeWidth={2} />,
  needs_review: <CircleAlert className="h-4 w-4 text-warning" strokeWidth={2} />,
  not_checked: <Info className="h-4 w-4 text-ink-faint" strokeWidth={2} />,
}

export function SecurityChecksPage() {
  const navigate = useNavigate()
  const { orgId, isAuthenticated, isLoading: authLoading } = useAuthApi()
  const { data: controls = [], isLoading: controlsLoading, error: controlsError } = useControls(orgId)
  const { data: checkRuns = [], isLoading: runsLoading, error: runsError } = useCheckRuns(orgId)
  const runAllChecksMutation = useRunAllChecks()

  const [search, setSearch] = useState('')
  const [framework, setFramework] = useState<string>('all')
  const [source, setSource] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')
  const [severity, setSeverity] = useState<string>('all')
  const [selectedControlId, setSelectedControlId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isLoading = authLoading || controlsLoading || runsLoading
  const isLive = isAuthenticated && !controlsError && !runsError

  // Map controls to check results
  const unifiedControls: { control: Control; check: CheckResult }[] = useMemo(() => {
    return controls.map((c: any) => {
      const latestRun = checkRuns.find((r: any) => r.check_definition?.control_id === c.id)
      const controlObj: Control = {
        id: c.id,
        code: c.control_code,
        title: c.title,
        description: c.description,
        whyItMatters: c.why_it_matters || 'Protects against unauthorized code changes and software vulnerabilities.',
        expected: c.expected || 'Enforce MFA, code reviews, and dependency vulnerability patching.',
        severity: (c.severity as Severity) || 'high',
        ruleVersion: c.rule_version || '1.0.0',
        source: (c.source as ControlSource) || 'github',
        frameworkMappings: [{ framework: 'SOC 2', ref: c.control_code }],
      }

      const checkObj: CheckResult = {
        id: latestRun?.id || `chk-${c.id}`,
        controlId: c.id,
        source: (c.source as ControlSource) || 'github',
        status: (c.status as CheckStatus) || (latestRun?.status as CheckStatus) || 'not_checked',
        observed: latestRun?.observed || 'Evaluation pending or verified via automated check runner.',
        explanation: latestRun?.explanation || 'Verification engine operates on commit signatures, PR rules, and Dependabot triage.',
        ruleVersion: c.rule_version || '1.0.0',
        checkedAt: latestRun?.created_at || new Date().toISOString(),
        evidenceIds: [],
        remediation: latestRun?.remediation || undefined,
      }

      return { control: controlObj, check: checkObj }
    })
  }, [controls, checkRuns])

  // Filters
  const rows = useMemo(() => {
    return unifiedControls.filter(({ control, check }) => {
      if (search) {
        const q = search.toLowerCase()
        if (
          !control.title.toLowerCase().includes(q) &&
          !control.code.toLowerCase().includes(q) &&
          !control.description.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      if (framework !== 'all' && !control.frameworkMappings.some((m) => m.framework === framework)) return false
      if (source !== 'all' && control.source !== source) return false
      if (status !== 'all' && check.status !== status) return false
      if (severity !== 'all' && control.severity !== severity) return false
      return true
    })
  }, [unifiedControls, search, framework, source, status, severity])

  const selectedRow = rows.find((r) => r.control.id === selectedControlId)
  const activeFilters =
    (framework !== 'all' ? 1 : 0) +
    (source !== 'all' ? 1 : 0) +
    (status !== 'all' ? 1 : 0) +
    (severity !== 'all' ? 1 : 0)

  function clearFilters() {
    setFramework('all')
    setSource('all')
    setStatus('all')
    setSeverity('all')
  }

  function openControl(id: string) {
    setSelectedControlId(id)
    setDrawerOpen(true)
  }

  async function handleRunAllChecks() {
    try {
      await runAllChecksMutation.mutateAsync()
      toast.success('Security checks completed', {
        description: 'Live branch protection, PR review, Dependabot, and signature checks refreshed.',
      })
    } catch (err: any) {
      toast.error('Check evaluation failed', { description: err.message })
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-medium text-ink">Sign in to view security checks</h2>
          <p className="text-app-sm text-ink-muted mt-1">Please sign in with Clerk to access your security controls.</p>
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

  if (controlsError || runsError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-medium text-danger">Failed to load security checks</h2>
          <p className="text-app-sm text-ink-muted mt-1">
            {controlsError?.message || runsError?.message}
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Security checks"
        description="Searchable, filterable view of every control evaluated by Proofline's deterministic rules engine. Click any row to see control details, observed configuration, and remediation guidance."
        actions={
          <Button
            onClick={handleRunAllChecks}
            disabled={runAllChecksMutation.isPending}
            className="gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", runAllChecksMutation.isPending && "animate-spin")} strokeWidth={2} />
            {runAllChecksMutation.isPending ? 'Running scan...' : 'Run all checks'}
          </Button>
        }
        meta={
          <Badge variant="outline" className="normal-case tracking-normal">
            <span className={cn("inline-block h-1.5 w-1.5 rounded-full", isLive ? "bg-success" : "bg-warning")} />
            {isLive ? 'Live Evaluation Active' : 'Sample demo data'}
          </Badge>
        }
      />

      <PageBody className="flex flex-col gap-4">
        {/* Filters */}
        <Card className="p-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
            <Input
              icon={<Search className="h-3.5 w-3.5" strokeWidth={1.75} />}
              placeholder="Search controls, codes, descriptions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-app-xs lg:w-72"
            />
            <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
              <Select value={framework} onValueChange={setFramework}>
                <SelectTrigger className="w-[130px] h-8 text-app-xs">
                  <SelectValue placeholder="Framework" />
                </SelectTrigger>
                <SelectContent>
                  {FRAMEWORKS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f === 'all' ? 'All frameworks' : f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[140px] h-8 text-app-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === 'all'
                        ? 'All statuses'
                        : s === 'passing'
                        ? 'Passing'
                        : s === 'failing'
                        ? 'Failing'
                        : s === 'needs_review'
                        ? 'Needs review'
                        : 'Not checked'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="w-[130px] h-8 text-app-xs">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === 'all' ? 'All severities' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="w-[120px] h-8 text-app-xs">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === 'all' ? 'All sources' : SOURCE_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {activeFilters > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-app-xs text-ink-muted">
                  Clear ({activeFilters})
                </Button>
              )}
              <span className="text-app-xs text-ink-subtle">
                {rows.length} of {unifiedControls.length}
              </span>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16">Code</TableHead>
                <TableHead>Control</TableHead>
                <TableHead className="hidden md:table-cell">Framework</TableHead>
                <TableHead className="hidden lg:table-cell">Source</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="hidden lg:table-cell w-32">Last checked</TableHead>
                <TableHead className="w-24">Severity</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-0">
                    <TableEmpty
                      icon={<Filter className="h-4 w-4" strokeWidth={1.75} />}
                      title="No controls match these filters"
                      description="Try clearing one or more filters to widen the search."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(({ control, check }) => (
                  <TableRow key={control.id} onClick={() => openControl(control.id)} className="cursor-pointer">
                    <TableCell>
                      <span className="font-mono text-app-xs text-ink-muted">{control.code}</span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-ink truncate max-w-[420px]">{control.title}</div>
                      <div className="text-app-xs text-ink-subtle truncate max-w-[420px]">{control.description}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {control.frameworkMappings.slice(0, 2).map((m) => (
                          <Badge key={m.framework + m.ref} variant="default" className="font-normal normal-case tracking-normal">
                            {m.framework}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-ink-muted">
                      {SOURCE_LABEL[control.source]}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {STATUS_ICON[check.status]}
                        <span className="text-app-xs text-ink-muted">
                          {check.status === 'passing'
                            ? 'Passing'
                            : check.status === 'failing'
                            ? 'Failing'
                            : check.status === 'needs_review'
                            ? 'Needs review'
                            : 'Not checked'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-ink-muted text-app-xs">
                      {timeAgo(check.checkedAt)}
                    </TableCell>
                    <TableCell>
                      <SeverityBadge severity={control.severity} />
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-3.5 w-3.5 text-ink-faint" strokeWidth={2} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </PageBody>

      {/* Control detail drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          title={selectedRow ? `${selectedRow.control.code} · ${selectedRow.control.title}` : 'Control'}
          description={selectedRow ? SOURCE_LABEL[selectedRow.control.source] : undefined}
          className="w-full max-w-xl"
        >
          {selectedRow && (
            <ControlDetail
              control={selectedRow.control}
              check={selectedRow.check}
              onRecheck={handleRunAllChecks}
              onEvidence={() => {
                setDrawerOpen(false)
                navigate('/evidence')
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

function ControlDetail({
  control,
  check,
  onRecheck,
}: {
  control: Control
  check: CheckResult
  onRecheck: () => void
  onEvidence?: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* Status banner */}
      <div
        className={cn(
          'flex items-start gap-2 p-3 rounded-app-md border',
          check.status === 'passing'
            ? 'bg-success-soft border-success-border'
            : check.status === 'failing'
            ? 'bg-danger-soft border-danger-border'
            : check.status === 'needs_review'
            ? 'bg-warning-soft border-warning-border'
            : 'bg-surface-muted border-line',
        )}
      >
        {STATUS_ICON[check.status]}
        <div className="flex-1 min-w-0">
          <p className="text-app-sm font-medium text-ink">
            {check.status === 'passing'
              ? 'Passing'
              : check.status === 'failing'
              ? 'Failing'
              : check.status === 'needs_review'
              ? 'Needs human review'
              : 'Not yet checked'}
          </p>
          <p className="text-app-xs text-ink-muted mt-0.5">
            Last checked {formatDateTime(check.checkedAt)} · rule v{check.ruleVersion}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={onRecheck} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
          Recheck
        </Button>
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="text-app-2xs font-semibold uppercase tracking-wider text-ink-faint">Control description</h3>
        <p className="text-app-sm text-ink leading-relaxed">{control.description}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-app-2xs font-semibold uppercase tracking-wider text-ink-faint">Why it matters</h3>
        <p className="text-app-sm text-ink-muted leading-relaxed">{control.whyItMatters}</p>
      </section>

      <Separator />

      <section className="flex flex-col gap-2">
        <h3 className="text-app-2xs font-semibold uppercase tracking-wider text-ink-faint">Expected configuration</h3>
        <p className="text-app-sm text-ink-muted leading-relaxed">{control.expected}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-app-2xs font-semibold uppercase tracking-wider text-ink-faint">Observed result</h3>
        <p className="text-app-sm text-ink leading-relaxed">{check.observed}</p>
        {check.explanation && <p className="text-app-xs text-ink-subtle mt-1">{check.explanation}</p>}
      </section>

      <Separator />

      {/* Framework mappings */}
      <section className="flex flex-col gap-2">
        <h3 className="text-app-2xs font-semibold uppercase tracking-wider text-ink-faint">Framework mappings</h3>
        <div className="flex flex-wrap gap-1.5">
          {control.frameworkMappings.map((m) => (
            <Badge key={m.framework + m.ref} variant="default" className="normal-case tracking-normal">
              {m.framework} · <span className="font-mono">{m.ref}</span>
            </Badge>
          ))}
        </div>
      </section>

      {/* Remediation */}
      {check.remediation && (
        <section className="flex flex-col gap-2">
          <h3 className="text-app-2xs font-semibold uppercase tracking-wider text-ink-faint">Remediation instructions</h3>
          <div className="rounded-app-md bg-surface-muted p-3 text-app-sm text-ink-muted leading-relaxed">
            {check.remediation}
          </div>
        </section>
      )}

      <SheetFooter>
        <Button variant="secondary" onClick={onRecheck} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
          Recheck now
        </Button>
      </SheetFooter>
    </div>
  )
}