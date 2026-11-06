import { useMemo, useState, useEffect } from 'react'
import {
  Search,
  Filter,
  ChevronRight,
  FileText,
  History,
  Sparkles,
  Save,
  Eye,
  Pencil,
} from 'lucide-react'
import { PageHeader, PageBody } from '../../components/layout/page-header'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input, Textarea } from '../../components/ui/input'
import { Badge, PolicyStatusBadge } from '../../components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '../../components/ui/table'
import { Sheet, SheetContent, SheetFooter } from '../../components/ui/sheet'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui/select'
import { Separator } from '../../components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs'
import { cn, formatDate } from '../../lib/utils'
import { usePolicies } from '../../lib/queries'
import { useAuthApi } from '../../lib/queries'
import type { Policy, PolicyCategory, PolicyStatus } from '../../types'

const CATEGORIES: (PolicyCategory | 'all')[] = [
  'all',
  'Information Security',
  'Access Control',
  'Incident Response',
  'Data Retention',
  'Business Continuity',
]

const STATUS_LABEL: Record<PolicyStatus, string> = {
  published: 'Published',
  draft: 'Draft',
  in_review: 'In review',
  archived: 'Archived',
}

export function PoliciesPage() {
  const { orgId, isAuthenticated, isLoading: authLoading } = useAuthApi()
  const { data: policies = [], isLoading: policiesLoading, error: policiesError } = usePolicies(orgId)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isLoading = authLoading || policiesLoading
  const isLive = isAuthenticated && !policiesError

  // Moved useMemo before early returns to maintain hooks order
  const filtered = useMemo(() => {
    return policies.filter((p) => {
      if (search) {
        const q = search.toLowerCase()
        if (!p.title.toLowerCase().includes(q) && !p.summary.toLowerCase().includes(q)) return false
      }
      if (category !== 'all' && p.category !== category) return false
      return true
    })
  }, [policies, search, category])

  function openPolicy(id: string) {
    setSelectedId(id)
    setDrawerOpen(true)
  }

  const selected = policies.find((p) => p.id === selectedId)

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-medium text-ink">Sign in to view policies</h2>
          <p className="text-app-sm text-ink-muted mt-1">Please sign in with Clerk to access your policies.</p>
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

  if (policiesError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-medium text-danger">Failed to load policies</h2>
          <p className="text-app-sm text-ink-muted mt-1">{policiesError.message}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Policies"
        description="Documented, version-controlled policies across information security, access control, incident response, data retention, and business continuity. AI-assisted drafts require human review before publishing."
        meta={
          <Badge variant="outline" className="normal-case tracking-normal">
            <span className={cn("inline-block h-1.5 w-1.5 rounded-full", isLive ? "bg-success" : "bg-warning")} />
            {isLive ? 'Live Version Controlled' : 'Sample demo data'}
          </Badge>
        }
      />

      <PageBody className="flex flex-col gap-4">
        <Card className="p-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
            <Input
              icon={<Search className="h-3.5 w-3.5" strokeWidth={1.75} />}
              placeholder="Search policies…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-app-xs lg:w-72"
            />
            <div className="flex items-center gap-2 lg:ml-auto">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[180px] h-8 text-app-xs"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c === 'all' ? 'All categories' : c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-app-xs text-ink-subtle">{filtered.length} of {policies.length}</span>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Policy</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden lg:table-cell">Version</TableHead>
                <TableHead className="hidden lg:table-cell">Owner</TableHead>
                <TableHead className="hidden lg:table-cell">Last reviewed</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <TableEmpty
                      icon={<Filter className="h-4 w-4" strokeWidth={1.75} />}
                      title="No policies match"
                      description="Try clearing filters or create a new policy."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id} onClick={() => openPolicy(p.id)}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 text-ink-subtle" strokeWidth={1.75} />
                        <div className="min-w-0">
                          <div className="font-medium text-ink truncate max-w-[280px] flex items-center gap-1.5">
                            {p.title}
                            {p.aiDrafted && <Sparkles className="h-3 w-3 text-accent" strokeWidth={2} />}
                          </div>
                          <div className="text-app-2xs text-ink-subtle truncate max-w-[280px]">{p.summary}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-ink-muted text-app-xs">{p.category}</TableCell>
                    <TableCell className="hidden lg:table-cell font-mono text-app-xs text-ink-muted">v{p.version}</TableCell>
                    <TableCell className="hidden lg:table-cell text-ink-muted text-app-xs">{p.owner?.name || 'Unknown'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-ink-muted text-app-xs">{formatDate(p.lastReviewedAt)}</TableCell>
                    <TableCell><PolicyStatusBadge status={p.status} /></TableCell>
                    <TableCell><ChevronRight className="h-3.5 w-3.5 text-ink-faint" strokeWidth={2} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </PageBody>

      {/* Policy detail drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          title={selected ? selected.title : 'Policy'}
          description={selected ? `${selected.category} · v${selected.version}` : undefined}
          className="w-full max-w-2xl"
        >
          {selected && (
            <PolicyDetail
              policy={selected}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

function PolicyDetail({
  policy,
}: {
  policy: Policy
}) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [body, setBody] = useState(policy.body)

  // Reset body when policy changes
  useEffect(() => {
    setBody(policy.body)
    setMode('view')
  }, [policy.id, policy.body])

  return (
    <div className="flex flex-col gap-5">
      {/* Status + meta */}
      <div className="flex items-center gap-2 flex-wrap">
        <PolicyStatusBadge status={policy.status} />
        <Badge variant="default" className="normal-case tracking-normal">{policy.category}</Badge>
        {policy.aiDrafted && (
          <Badge variant="accent" className="normal-case tracking-normal">
            <Sparkles className="h-3 w-3" strokeWidth={2} />
            AI-assisted
          </Badge>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-2 text-app-sm">
        <div>
          <dt className="text-app-2xs font-medium uppercase tracking-wider text-ink-faint">Owner</dt>
          <dd className="text-ink mt-0.5">{policy.owner?.name || 'Unknown'}</dd>
        </div>
        <div>
          <dt className="text-app-2xs font-medium uppercase tracking-wider text-ink-faint">Last reviewed</dt>
          <dd className="text-ink mt-0.5">{formatDate(policy.lastReviewedAt)}</dd>
        </div>
        <div>
          <dt className="text-app-2xs font-medium uppercase tracking-wider text-ink-faint">Next review</dt>
          <dd className="text-ink mt-0.5">{policy.nextReviewAt ? formatDate(policy.nextReviewAt) : '—'}</dd>
        </div>
        <div>
          <dt className="text-app-2xs font-medium uppercase tracking-wider text-ink-faint">Version</dt>
          <dd className="text-ink mt-0.5 font-mono">v{policy.version}</dd>
        </div>
      </dl>

      <Separator />

      <Tabs value={mode} onValueChange={(v) => setMode(v as 'view' | 'edit')}>
        <TabsList>
          <TabsTrigger value="view" className="gap-1.5">
            <Eye className="h-3 w-3" strokeWidth={1.75} />
            View
          </TabsTrigger>
          <TabsTrigger value="edit" className="gap-1.5">
            <Pencil className="h-3 w-3" strokeWidth={1.75} />
            Edit draft
          </TabsTrigger>
        </TabsList>
        <TabsContent value="view">
          <div className="rounded-app-md bg-surface-muted p-4">
            <pre className="text-app-sm text-ink-muted leading-relaxed whitespace-pre-wrap font-sans">{policy.body}</pre>
          </div>
        </TabsContent>
        <TabsContent value="edit">
          <div className="flex flex-col gap-2">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={14}
              className="font-mono text-app-xs"
            />
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setBody(policy.body); setMode('view') }}>Cancel</Button>
              <Button size="sm" onClick={() => { setMode('view') }} className="gap-1.5" disabled>
                <Save className="h-3.5 w-3.5" strokeWidth={2} />
                Save draft (API only)
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Version history */}
      <section className="flex flex-col gap-2">
        <h3 className="text-app-2xs font-semibold uppercase tracking-wider text-ink-faint flex items-center gap-1.5">
          <History className="h-3 w-3" strokeWidth={2} />
          Version history
        </h3>
        <ol className="flex flex-col">
          {policy.versions.map((v, i) => (
            <li key={v.version} className="flex items-start gap-2 py-1.5">
              <div className="flex flex-col items-center self-stretch">
                <span className={cn('flex items-center justify-center h-5 w-5 rounded-full text-app-2xs font-semibold', i === 0 ? 'bg-accent text-white' : 'bg-surface-muted text-ink-subtle')}>v{v.version}</span>
                {i < policy.versions.length - 1 && <span className="flex-1 w-px bg-line mt-1" />}
              </div>
              <div className="flex-1 pb-1">
                <div className="text-app-sm text-ink flex items-center gap-1.5">
                  {v.changeSummary}
                  {v.aiDrafted && (
                    <Badge variant="accent" className="normal-case tracking-normal">
                      <Sparkles className="h-2.5 w-2.5" strokeWidth={2} />
                      AI
                    </Badge>
                  )}
                </div>
                <div className="text-app-xs text-ink-subtle mt-0.5">
                  {STATUS_LABEL[v.status]} · {v.reviewedBy?.name || 'Unknown'} · {formatDate(v.reviewedAt)}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <SheetFooter>
        <p className="text-app-2xs text-ink-subtle italic">
          Use the API to create new versions, publish, or draft with AI.
        </p>
      </SheetFooter>

      {/* AI disclaimer */}
      {policy.aiDrafted && (
        <p className="text-app-2xs text-ink-subtle italic border-t border-line pt-3">
          This policy contains AI-drafted sections. AI-generated content is distinguishable from verified facts and must be reviewed by a human before publication.
        </p>
      )}
    </div>
  )
}