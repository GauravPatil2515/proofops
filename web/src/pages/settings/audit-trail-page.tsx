import { useMemo, useState, useEffect } from 'react'
import {
  Search,
  Filter,
  ShieldCheck,
  FolderLock,
  FileQuestion,
  FileText,
  ListChecks,
  Plug,
  Users,
  Check,
} from 'lucide-react'
import { PageHeader, PageBody } from '../../components/layout/page-header'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '../../components/ui/table'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui/select'
import { UserAvatar } from '../../components/ui/avatar'
import { cn, formatDateTime, timeAgo } from '../../lib/utils'
import { api, useApiClient } from '../../lib/api-client'
import { useAuthApi } from '../../lib/queries'
import type { AuditEventKind, AuditEvent } from '../../types'

const KIND_ICON: Record<AuditEventKind, React.ReactNode> = {
  check_run: <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} />,
  evidence_uploaded: <FolderLock className="h-3.5 w-3.5" strokeWidth={1.75} />,
  evidence_approved: <Check className="h-3.5 w-3.5" strokeWidth={1.75} />,
  answer_approved: <FileQuestion className="h-3.5 w-3.5" strokeWidth={1.75} />,
  policy_published: <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />,
  task_resolved: <ListChecks className="h-3.5 w-3.5" strokeWidth={1.75} />,
  integration_connected: <Plug className="h-3.5 w-3.5" strokeWidth={1.75} />,
  integration_disconnected: <Plug className="h-3.5 w-3.5" strokeWidth={1.75} />,
  member_invited: <Users className="h-3.5 w-3.5" strokeWidth={1.75} />,
}

const KIND_LABEL: Record<AuditEventKind, string> = {
  check_run: 'Check run',
  evidence_uploaded: 'Evidence uploaded',
  evidence_approved: 'Evidence approved',
  answer_approved: 'Answer approved',
  policy_published: 'Policy published',
  task_resolved: 'Task resolved',
  integration_connected: 'Integration connected',
  integration_disconnected: 'Integration disconnected',
  member_invited: 'Member invited',
}

const KINDS: (AuditEventKind | 'all')[] = [
  'all',
  'check_run',
  'evidence_uploaded',
  'evidence_approved',
  'answer_approved',
  'policy_published',
  'task_resolved',
  'integration_connected',
  'member_invited',
]

export function AuditTrailPage() {
  const { orgId } = useAuthApi()
  const { ensureAuthenticated } = useApiClient()
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState<string>('all')
  const [isLive, setIsLive] = useState<boolean>(false)

  async function loadAuditEvents() {
    if (!orgId) return
    try {
      await ensureAuthenticated()
      const data = await api.getAuditEvents(orgId)
      if (data && data.length > 0) {
        const mapped: AuditEvent[] = data.map((ev: any) => ({
          id: ev.id,
          at: ev.created_at,
          kind: ev.kind as AuditEventKind,
          actor: { id: 'dev', name: ev.actor_name || 'Dev', role: 'owner' as const },
          summary: ev.summary,
          target: { kind: ev.target_kind || 'system', id: ev.target_id || '', label: ev.target_kind || 'Resource' },
        }))
        setEvents(mapped)
        setIsLive(true)
      }
    } catch (err) {
      console.warn('Backend audit events unavailable, using fallback:', err)
    }
  }

  useEffect(() => {
    loadAuditEvents()
  }, [orgId])

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (search) {
        const q = search.toLowerCase()
        if (!e.summary.toLowerCase().includes(q) && !e.actor.name.toLowerCase().includes(q) && !e.target?.label.toLowerCase().includes(q)) return false
      }
      if (kind !== 'all' && e.kind !== kind) return false
      return true
    })
  }, [events, search, kind])

  return (
    <>
      <PageHeader
        title="Audit trail"
        description="Every significant workspace event, with actor, target, and timestamp. The audit trail is immutable — events cannot be edited or deleted."
        meta={
          <Badge variant="outline" className="normal-case tracking-normal">
            <span className={cn("inline-block h-1.5 w-1.5 rounded-full", isLive ? "bg-success" : "bg-warning")} />
            {isLive ? 'Live Audit Events Active' : 'Sample demo data'}
          </Badge>
        }
      />

      <PageBody className="flex flex-col gap-4">
        <Card className="p-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
            <Input
              icon={<Search className="h-3.5 w-3.5" strokeWidth={1.75} />}
              placeholder="Search by event, actor, or target…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-app-xs lg:w-72"
            />
            <div className="flex items-center gap-2 lg:ml-auto">
              <Select value={kind} onValueChange={setKind}>
                <SelectTrigger className="w-[180px] h-8 text-app-xs"><SelectValue placeholder="Event type" /></SelectTrigger>
                <SelectContent>
                  {KINDS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k === 'all' ? 'All event types' : KIND_LABEL[k as AuditEventKind]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-app-xs text-ink-subtle">{filtered.length} of {events.length}</span>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-8"></TableHead>
                <TableHead>Event</TableHead>
                <TableHead className="hidden md:table-cell">Actor</TableHead>
                <TableHead className="hidden lg:table-cell">Target</TableHead>
                <TableHead className="w-32">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <TableEmpty
                      icon={<Filter className="h-4 w-4" strokeWidth={1.75} />}
                      title="No events match"
                      description="Try clearing your search or filter."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e) => {
                  return (
                    <TableRow key={e.id}>
                      <TableCell>
                        <span className="flex items-center justify-center h-6 w-6 rounded-app-sm bg-surface-muted text-ink-subtle">
                          {KIND_ICON[e.kind]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-ink text-app-sm">{e.summary}</div>
                        <div className="text-app-2xs text-ink-subtle mt-0.5">{KIND_LABEL[e.kind]}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <UserAvatar initials={e.actor.name.slice(0, 2).toUpperCase()} color="#4F46E5" size="xs" />
                          <div>
                            <div className="text-app-xs text-ink">{e.actor.name}</div>
                            <div className="text-app-2xs text-ink-subtle capitalize">{e.actor.role}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {e.target ? (
                          <div className="flex flex-col">
                            <span className="text-app-xs text-ink-muted">{e.target.label}</span>
                            <span className="text-app-2xs text-ink-faint font-mono">{e.target.kind}:{e.target.id.slice(0, 12)}</span>
                          </div>
                        ) : <span className="text-ink-faint">—</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-app-xs text-ink-muted">{timeAgo(e.at)}</span>
                          <span className="text-app-2xs text-ink-faint">{formatDateTime(e.at)}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </PageBody>
    </>
  )
}
