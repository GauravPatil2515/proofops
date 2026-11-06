import { useEffect, useMemo, useState, useRef } from 'react'
import {
  Search,
  Upload,
  Filter,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  ArrowLeft,
  Check,
  AlertTriangle,
  Bot,
  ShieldCheck,
  Download,
  Sparkles,
  Pencil,
} from 'lucide-react'
import { PageHeader, PageBody } from '../../components/layout/page-header'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input, Textarea } from '../../components/ui/input'
import { Badge, AnswerStatusBadge, QuestionnaireStatusBadge } from '../../components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '../../components/ui/table'
import { Separator } from '../../components/ui/separator'
import { toast } from 'sonner'
import { cn, formatDate, timeAgo } from '../../lib/utils'
import { api, useApiClient } from '../../lib/api-client'
import { useAuthApi } from '../../lib/queries'
import type { Questionnaire, QuestionnaireQuestion, AnswerStatus } from '../../types'

const CONFIDENCE_LABEL = {
  high: { label: 'High', variant: 'success' as const },
  medium: { label: 'Medium', variant: 'info' as const },
  low: { label: 'Low', variant: 'warning' as const },
  none: { label: 'None', variant: 'danger' as const },
}

export function QuestionnairesPage() {
  const { orgId, isAuthenticated, isLoading: authLoading } = useAuthApi()
  const { ensureAuthenticated } = useApiClient()
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch questionnaires on mount
  useEffect(() => {
    if (!isAuthenticated || !orgId) return
    let mounted = true
    async function fetchQuestionnaires() {
      setIsLoading(true)
      try {
        const data = await api.getQuestionnaires(orgId!)
        if (mounted) setQuestionnaires(data)
      } catch (err: any) {
        if (mounted) toast.error('Failed to load questionnaires', { description: err.message })
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    fetchQuestionnaires()
    return () => { mounted = false }
  }, [isAuthenticated, orgId])

  const filtered = useMemo(() => {
    if (!search) return questionnaires
    const q = search.toLowerCase()
    return questionnaires.filter((x) => x.name.toLowerCase().includes(q) || x.customer.toLowerCase().includes(q))
  }, [questionnaires, search])

  const selected = questionnaires.find((q) => q.id === selectedId)

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-medium text-ink">Sign in to view questionnaires</h2>
          <p className="text-app-sm text-ink-muted mt-1">Please sign in with Clerk to access your questionnaires.</p>
        </div>
      </div>
    )
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  function handleFileUpload(file: File) {
    const isXlsx = file.name.endsWith('.xlsx')
    const isCsv = file.name.endsWith('.csv')
    if (!isXlsx && !isCsv) {
      toast.error('Unsupported format', { description: 'Upload a .csv or .xlsx questionnaire file.' })
      return
    }
    // Upload via API
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', file.name.replace(/\.(csv|xlsx)$/, ''))
    formData.append('customer', '—')
    async function upload() {
      try {
        if (!orgId) throw new Error('No organization selected')
        await ensureAuthenticated()
        const newQ = await api.request<any>(`/organizations/${orgId}/questionnaires/import`, {
          method: 'POST',
          body: formData,
        })
        setQuestionnaires((prev) => [newQ, ...prev])
        toast.success('Questionnaire uploaded', { description: `${file.name} imported with ${newQ.question_count || 0} questions.` })
      } catch (err: any) {
        toast.error('Upload failed', { description: err.message })
      }
    }
    upload()
  }

  function approveAnswer(qId: string, qqId: string) {
    setQuestionnaires((prev) =>
      prev.map((q) =>
        q.id === qId
          ? {
              ...q,
              updatedAt: new Date().toISOString(),
              questions: q.questions.map((qq) =>
                qq.id === qqId
                  ? {
                      ...qq,
                      answerStatus: 'approved' as AnswerStatus,
                      approvedBy: { id: 'user-priya', name: 'Priya Iyer' },
                      approvedAt: new Date().toISOString(),
                      lastEditedAt: new Date().toISOString(),
                    }
                  : qq,
              ),
            }
          : q,
      ),
    )
    toast.success('Answer approved', { description: 'The answer is now admissible for export.' })
  }

  function saveDraftAnswer(qId: string, qqId: string, draft: string) {
    setQuestionnaires((prev) =>
      prev.map((q) =>
        q.id === qId
          ? {
              ...q,
              updatedAt: new Date().toISOString(),
              questions: q.questions.map((qq) =>
                qq.id === qqId
                  ? { ...qq, draftAnswer: draft, lastEditedAt: new Date().toISOString(), answerStatus: qq.answerStatus === 'approved' ? 'needs_review' : qq.answerStatus }
                  : qq,
              ),
            }
          : q,
      ),
    )
    toast.success('Draft saved', { description: 'Marked as "Needs review" — a human must approve before this answer can be exported.' })
  }

  function markNeedsReview(qId: string, qqId: string) {
    setQuestionnaires((prev) =>
      prev.map((q) =>
        q.id === qId
          ? {
              ...q,
              questions: q.questions.map((qq) =>
                qq.id === qqId ? { ...qq, answerStatus: 'needs_review' as AnswerStatus, lastEditedAt: new Date().toISOString() } : qq,
              ),
            }
          : q,
      ),
    )
    toast.success('Answer marked for review')
  }

  if (selected) {
    return (
      <QuestionnaireDetail
        questionnaire={selected}
        orgId={orgId}
        ensureAuthenticated={ensureAuthenticated}
        onBack={() => setSelectedId(null)}
        onApprove={(qqId) => approveAnswer(selected.id, qqId)}
        onSaveDraft={(qqId, draft) => saveDraftAnswer(selected.id, qqId, draft)}
        onMarkNeedsReview={(qqId) => markNeedsReview(selected.id, qqId)}
      />
    )
  }

  return (
    <>
      <PageHeader
        title="Questionnaires"
        description="A dedicated workspace for security questionnaires (RFPs, DDQs, vendor reviews). Upload customer questionnaires, draft answers from your verified evidence, and approve before exporting."
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFileUpload(f)
                e.target.value = ''
              }}
            />
            <Button onClick={() => fileInputRef.current?.click()} className="gap-1.5">
              <Upload className="h-3.5 w-3.5" strokeWidth={2} />
              Upload questionnaire
            </Button>
          </>
        }
        meta={
          <div className="flex items-center gap-1.5">
            <Badge variant="default" className="normal-case tracking-normal">CSV</Badge>
            <Badge variant="default" className="normal-case tracking-normal">XLSX</Badge>
            <Badge variant="outline" className="normal-case tracking-normal">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-warning" />
              Sample demo data
            </Badge>
          </div>
        }
      />

      <PageBody className="flex flex-col gap-4">
        <Card className="p-3">
          <Input
            icon={<Search className="h-3.5 w-3.5" strokeWidth={1.75} />}
            placeholder="Search questionnaires by name or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-app-xs lg:w-80"
          />
        </Card>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Questionnaire</TableHead>
                <TableHead className="hidden md:table-cell">Customer</TableHead>
                <TableHead className="hidden lg:table-cell">Format</TableHead>
                <TableHead className="w-24">Progress</TableHead>
                <TableHead className="w-24">Needs review</TableHead>
                <TableHead className="w-32">Updated</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-0">
                    <TableEmpty
                      icon={<Filter className="h-4 w-4" strokeWidth={1.75} />}
                      title="No questionnaires match"
                      description="Try clearing your search or upload a new questionnaire."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((q) => {
                  const total = q.questions.length || q.questionCount
                  const approved = q.questions.filter((qq) => qq.answerStatus === 'approved').length
                  const needsReview = q.questions.filter((qq) => qq.answerStatus === 'needs_review').length
                  const progress = total > 0 ? Math.round((approved / total) * 100) : 0
                  return (
                    <TableRow key={q.id} onClick={() => setSelectedId(q.id)}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          {q.format === 'xlsx' ? <FileSpreadsheet className="h-4 w-4 text-ink-subtle" strokeWidth={1.75} /> : <FileText className="h-4 w-4 text-ink-subtle" strokeWidth={1.75} />}
                          <div className="font-medium text-ink truncate max-w-[280px]">{q.name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-ink-muted">{q.customer}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="default" className="normal-case tracking-normal uppercase">{q.format}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-12 rounded-full bg-surface-muted overflow-hidden">
                            <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-app-2xs text-ink-subtle tabular-nums">{progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-ink-muted tabular-nums">{needsReview}</TableCell>
                      <TableCell className="text-ink-muted text-app-xs">{timeAgo(q.updatedAt)}</TableCell>
                      <TableCell><QuestionnaireStatusBadge status={q.status} /></TableCell>
                      <TableCell><ChevronRight className="h-3.5 w-3.5 text-ink-faint" strokeWidth={2} /></TableCell>
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

function QuestionnaireDetail({
  questionnaire,
  orgId,
  ensureAuthenticated,
  onBack,
  onApprove,
  onSaveDraft,
  onMarkNeedsReview,
}: {
  questionnaire: Questionnaire
  orgId: string | undefined
  ensureAuthenticated: () => Promise<string>
  onBack: () => void
  onApprove: (qqId: string) => void
  onSaveDraft: (qqId: string, draft: string) => void
  onMarkNeedsReview: (qqId: string) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftText, setDraftText] = useState('')

  const approvedCount = questionnaire.questions.filter((q) => q.answerStatus === 'approved').length
  const progress = questionnaire.questions.length ? Math.round((approvedCount / questionnaire.questions.length) * 100) : 0

  function startEdit(q: QuestionnaireQuestion) {
    setEditingId(q.id)
    setDraftText(q.draftAnswer)
  }
  function saveEdit(qqId: string) {
    onSaveDraft(qqId, draftText)
    setEditingId(null)
  }

  return (
    <>
      <PageHeader
        title={questionnaire.name}
        description={`${questionnaire.customer} · ${questionnaire.format.toUpperCase()} · ${questionnaire.questionCount} questions`}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
              Back
            </Button>
            <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => toast.success('Export queued', { description: 'A CSV with approved answers will be generated.' })}>
              <Download className="h-3.5 w-3.5" strokeWidth={2} />
              Export
            </Button>
          </>
        }
        meta={
          <div className="flex items-center gap-3">
            <QuestionnaireStatusBadge status={questionnaire.status} />
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 rounded-full bg-surface-muted overflow-hidden">
                <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-app-xs text-ink-muted tabular-nums">{approvedCount}/{questionnaire.questions.length} approved</span>
            </div>
          </div>
        }
      />

      <PageBody className="flex flex-col gap-3">
        {questionnaire.questions.length === 0 && (
          <Card>
            <CardContent className="py-12 flex flex-col items-center text-center">
              <FileText className="h-8 w-8 text-ink-faint mb-2" strokeWidth={1.5} />
              <p className="text-app-sm font-medium text-ink">No questions parsed yet</p>
              <p className="text-app-xs text-ink-muted mt-1 max-w-sm">
                Question parsing is part of the upcoming FastAPI backend. Upload is captured in demo state for now.
              </p>
            </CardContent>
          </Card>
        )}

        {questionnaire.questions.map((qq) => {
          const linkedEvidence: any[] = []
          const isEditing = editingId === qq.id
          const isApproved = qq.answerStatus === 'approved'
          const needsEvidence = qq.confidence === 'none' || linkedEvidence.length === 0
          return (
            <Card key={qq.id} className={cn(needsEvidence && !isApproved && 'border-warning-border')}>
              <CardContent className="p-4 flex flex-col gap-3">
                {/* Question */}
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    {qq.category && (
                      <div className="text-app-2xs font-medium uppercase tracking-wider text-ink-subtle mb-1">{qq.category}</div>
                    )}
                    <p className="text-app-sm font-medium text-ink">{qq.question}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <AnswerStatusBadge status={qq.answerStatus} />
                    <Badge variant={CONFIDENCE_LABEL[qq.confidence].variant} className="normal-case tracking-normal">
                      Confidence: {CONFIDENCE_LABEL[qq.confidence].label}
                    </Badge>
                    {qq.aiGenerated && (
                      <Badge variant="accent" className="normal-case tracking-normal">
                        <Bot className="h-3 w-3" strokeWidth={2} />
                        AI draft
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Answer */}
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <Textarea
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      rows={5}
                      placeholder="Enter the answer…"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                      <Button size="sm" onClick={() => saveEdit(qq.id)} className="gap-1.5">
                        <Check className="h-3.5 w-3.5" strokeWidth={2} />
                        Save as draft
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {qq.draftAnswer ? (
                      <p className="text-app-sm text-ink-muted leading-relaxed whitespace-pre-wrap">{qq.draftAnswer}</p>
                    ) : (
                      <p className="text-app-sm text-ink-faint italic">No answer drafted yet.</p>
                    )}
                    {qq.aiGenerated && (
                      <p className="text-app-2xs text-ink-subtle italic flex items-center gap-1">
                        <Sparkles className="h-3 w-3" strokeWidth={1.75} />
                        This answer was drafted by AI and remains a draft until a human approves it.
                      </p>
                    )}
                  </div>
                )}

                {/* Evidence coverage */}
                <div className="flex items-start gap-2 rounded-app-md bg-surface-muted p-2.5">
                  {needsEvidence && !isApproved ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" strokeWidth={2} />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" strokeWidth={2} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-app-xs font-medium text-ink">
                      {needsEvidence && !isApproved
                        ? 'Evidence required — this answer cannot be verified from the available information.'
                        : `${linkedEvidence.length} evidence item${linkedEvidence.length === 1 ? '' : 's'} linked`}
                    </div>
                    {linkedEvidence.length > 0 && (
                      <ul className="mt-1 flex flex-col gap-0.5">
                        {linkedEvidence.map((e) => (
                          <li key={e!.id} className="text-app-xs text-ink-subtle">
                            <span className="font-mono text-app-2xs">{e!.contentHash}</span> · {e!.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Footer / actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="text-app-2xs text-ink-faint">
                    {qq.approvedBy && qq.approvedAt ? (
                      <span>Approved by {qq.approvedBy.name} · {formatDate(qq.approvedAt)}</span>
                    ) : (
                      <span>Last edited {timeAgo(qq.lastEditedAt)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {!isEditing && !isApproved && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={async () => {
                            try {
                              if (!orgId) throw new Error('No organization selected')
                              await ensureAuthenticated()
                              const drafted = await api.draftAnswerWithAI(orgId, questionnaire.id, qq.id)
                              onSaveDraft(qq.id, drafted.draft_answer)
                              toast.success('Grounded draft generated', {
                                description: `Confidence: ${drafted.confidence.toUpperCase()}. Citing policies and verified evidence.`,
                              })
                            } catch (err: any) {
                              toast.error('Draft generation failed', { description: err.message })
                            }
                          }}
                          className="gap-1.5"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
                          AI Assist
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => startEdit(qq)} className="gap-1.5">
                          <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                          Edit
                        </Button>
                      </>
                    )}
                    {isApproved ? (
                      <Button variant="outline" size="sm" onClick={() => onMarkNeedsReview(qq.id)}>
                        Reopen
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => onApprove(qq.id)}
                        className="gap-1.5"
                        disabled={needsEvidence}
                        title={needsEvidence ? 'Cannot approve without supporting evidence' : undefined}
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={2} />
                        Approve answer
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </PageBody>
    </>
  )
}
