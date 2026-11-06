import { useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Upload,
  Filter,
  ChevronRight,
  FileText,
  FileJson,
  FileImage,
  FileSpreadsheet,
  File as FileIcon,
  History,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import { PageHeader, PageBody } from '../../components/layout/page-header'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge, EvidenceReviewBadge } from '../../components/ui/badge'
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
import { toast } from 'sonner'
import { cn, formatDate, timeAgo, formatBytes } from '../../lib/utils'
import { useEvidence, useGetUploadUrl, useCompleteUpload, useReviewEvidence, useDownloadEvidence, useVerifyEvidenceHash } from '../../lib/queries'
import { useAuthApi } from '../../lib/queries'
import { useControls } from '../../lib/queries'
import type { EvidenceItem, ControlSource, EvidenceReviewStatus, Control } from '../../types'

const SOURCES: (ControlSource | 'all')[] = ['all', 'github', 'aws', 'gcp', 'manual', 'internal']
const REVIEW_STATUSES: (EvidenceReviewStatus | 'all')[] = ['all', 'approved', 'in_review', 'rejected', 'missing']

const SOURCE_LABEL: Record<ControlSource, string> = {
  github: 'GitHub',
  aws: 'AWS',
  gcp: 'GCP',
  manual: 'Manual',
  internal: 'Internal',
}

function contentTypeIcon(contentType: string) {
  if (contentType.includes('json')) return <FileJson className="h-4 w-4 text-ink-subtle" strokeWidth={1.75} />
  if (contentType.includes('image')) return <FileImage className="h-4 w-4 text-ink-subtle" strokeWidth={1.75} />
  if (contentType.includes('sheet') || contentType.includes('excel')) return <FileSpreadsheet className="h-4 w-4 text-ink-subtle" strokeWidth={1.75} />
  if (contentType.includes('pdf') || contentType.includes('text')) return <FileText className="h-4 w-4 text-ink-subtle" strokeWidth={1.75} />
  return <FileIcon className="h-4 w-4 text-ink-subtle" strokeWidth={1.75} />
}

export function EvidencePage() {
  const navigate = useNavigate()
  const { orgId, isAuthenticated, isLoading: authLoading } = useAuthApi()
  const { data: evidence = [], isLoading: evidenceLoading, error: evidenceError } = useEvidence(orgId)
const { data: controls = [] } = useControls(orgId)
   
   const getUploadUrlMutation = useGetUploadUrl()
   const completeUploadMutation = useCompleteUpload()
   const reviewEvidenceMutation = useReviewEvidence()
   const downloadEvidenceMutation = useDownloadEvidence()
   const verifyHashMutation = useVerifyEvidenceHash()

  const [search, setSearch] = useState('')
  const [source, setSource] = useState<string>('all')
  const [review, setReview] = useState<string>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)
  const [uploadControlId, setUploadControlId] = useState<string>('')
  const [uploadStep, setUploadStep] = useState<'select' | 'upload' | 'complete'>('select')
  const [uploadUrlData, setUploadUrlData] = useState<{ upload_url: string; evidence_id: string; object_key: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    return evidence.filter((e) => {
      if (search) {
        const q = search.toLowerCase()
        if (!e.name.toLowerCase().includes(q)) return false
      }
      if (source !== 'all' && e.source !== source) return false
      if (review !== 'all' && e.reviewStatus !== review) return false
      return true
    })
  }, [evidence, search, source, review])

  const approvedCount = evidence.filter((e) => e.reviewStatus === 'approved').length
  const inReviewCount = evidence.filter((e) => e.reviewStatus === 'in_review').length
  const missingCount = controls.filter((c: any) => !evidence.some((e: any) => e.relatedControlId === c.id)).length

  function openItem(id: string) {
    setSelectedId(id)
    setDrawerOpen(true)
  }

  function handleFileSelected(file: File) {
    setUploadingFile(file)
    setUploadOpen(true)
    setUploadStep('select')
  }

  async function handleGetUploadUrl() {
    if (!uploadingFile) return
    try {
      // Compute SHA-256 hash on client
      const buffer = await uploadingFile.arrayBuffer()
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      
      const result = await getUploadUrlMutation.mutateAsync({
        title: uploadingFile.name,
        contentType: uploadingFile.type || 'application/octet-stream',
        contentHash,
        controlId: uploadControlId || undefined,
      })
      setUploadUrlData(result)
      setUploadStep('upload')
    } catch (err: any) {
      toast.error('Failed to get upload URL', { description: err.message })
    }
  }

  async function handleDirectUpload() {
    if (!uploadingFile || !uploadUrlData) return
    try {
      const response = await fetch(uploadUrlData.upload_url, {
        method: 'PUT',
        body: uploadingFile,
        headers: {
          'Content-Type': uploadingFile.type || 'application/octet-stream',
        },
      })
      if (!response.ok) throw new Error('Upload to R2 failed')
      
      // Complete the upload
      await completeUploadMutation.mutateAsync(uploadUrlData.evidence_id)
      toast.success('Evidence uploaded & verified', {
        description: `SHA-256 verified and stored in tenant locker.`,
      })
      setUploadOpen(false)
      setUploadingFile(null)
      setUploadControlId('')
      setUploadUrlData(null)
      setUploadStep('select')
    } catch (err: any) {
      toast.error('Upload failed', { description: err.message })
    }
  }

  async function handleApprove(id: string) {
    try {
      await reviewEvidenceMutation.mutateAsync({ evidenceId: id, status: 'approved', notes: 'Verified and approved by compliance officer' })
      toast.success('Evidence approved & recorded', { description: 'Audit trail updated. Admissible for SOC 2 evidence pack.' })
    } catch (err: any) {
      toast.error('Approval failed', { description: err.message })
    }
  }

  async function handleReject(id: string) {
    try {
      await reviewEvidenceMutation.mutateAsync({ evidenceId: id, status: 'rejected', notes: 'Evidence rejected during manual review' })
      toast.success('Evidence rejected in database')
    } catch (err: any) {
      toast.error('Rejection failed', { description: err.message })
    }
  }

  async function handleDownload(id: string) {
    try {
      const result = await downloadEvidenceMutation.mutateAsync(id)
      window.open(result.download_url, '_blank')
    } catch (err: any) {
      toast.error('Download failed', { description: err.message })
    }
  }

  async function handleVerifyHash(id: string) {
    try {
      const result = await verifyHashMutation.mutateAsync(id)
      toast.success(result.verified ? 'Hash verified - file integrity confirmed' : 'Hash mismatch - file may be corrupted', {
        description: `Expected: ${result.expected_hash}`,
      })
    } catch (err: any) {
      toast.error('Verification failed', { description: err.message })
    }
  }

  const selected = evidence.find((e) => e.id === selectedId)

  const isLoading = authLoading || evidenceLoading

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-medium text-ink">Sign in to view evidence</h2>
          <p className="text-app-sm text-ink-muted mt-1">Please sign in with Clerk to access your evidence library.</p>
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

  if (evidenceError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-medium text-danger">Failed to load evidence</h2>
          <p className="text-app-sm text-ink-muted mt-1">{evidenceError.message}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Evidence library"
        description="All artifacts used to demonstrate control operation. Upload new evidence, link it to controls, and submit for human approval."
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFileSelected(f)
                e.target.value = ''
              }}
            />
            <Button onClick={() => fileInputRef.current?.click()} className="gap-1.5">
              <Upload className="h-3.5 w-3.5" strokeWidth={2} />
              Upload evidence
            </Button>
          </>
        }
        meta={
          <Badge variant="outline" className="normal-case tracking-normal">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
            Live Evidence Active
          </Badge>
        }
      />

      <PageBody className="flex flex-col gap-4">
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <span className="flex items-center justify-center h-8 w-8 rounded-app-md bg-surface-muted text-ink-subtle">
                <FileText className="h-4 w-4" strokeWidth={2} />
              </span>
              <div>
                <div className="text-app-2xs font-medium uppercase tracking-wider text-ink-subtle">Total items</div>
                <div className="text-app-lg font-semibold text-ink tabular-nums">{evidence.length}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <span className="flex items-center justify-center h-8 w-8 rounded-app-md bg-success-soft text-success">
                <ShieldCheck className="h-4 w-4" strokeWidth={2} />
              </span>
              <div>
                <div className="text-app-2xs font-medium uppercase tracking-wider text-ink-subtle">Approved</div>
                <div className="text-app-lg font-semibold text-ink tabular-nums">{approvedCount}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <span className="flex items-center justify-center h-8 w-8 rounded-app-md bg-info-soft text-info">
                <History className="h-4 w-4" strokeWidth={2} />
              </span>
              <div>
                <div className="text-app-2xs font-medium uppercase tracking-wider text-ink-subtle">In review</div>
                <div className="text-app-lg font-semibold text-ink tabular-nums">{inReviewCount}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <span className="flex items-center justify-center h-8 w-8 rounded-app-md bg-warning-soft text-warning">
                <AlertTriangle className="h-4 w-4" strokeWidth={2} />
              </span>
              <div>
                <div className="text-app-2xs font-medium uppercase tracking-wider text-ink-subtle">Missing</div>
                <div className="text-app-lg font-semibold text-ink tabular-nums">{missingCount}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Missing evidence callout */}
        {missingCount > 0 && (
          <Card className="border-warning-border bg-warning-soft/50">
            <CardContent className="p-3 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5" strokeWidth={2} />
              <div className="flex-1">
                <div className="text-app-sm font-medium text-ink">Missing evidence for {missingCount} control{missingCount > 1 ? 's' : ''}</div>
                <ul className="mt-1.5 flex flex-col gap-0.5">
                  {controls.filter((c: any) => !evidence.some((e: any) => e.relatedControlId === c.id)).map((c: any) => (
                    <li key={c.id} className="text-app-xs text-ink-muted">
                      <span className="font-mono">{c.code}</span> · No evidence linked
                    </li>
                  ))}
                </ul>
              </div>
              <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                Upload now
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="p-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
            <Input
              icon={<Search className="h-3.5 w-3.5" strokeWidth={1.75} />}
              placeholder="Search evidence by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-app-xs lg:w-72"
            />
            <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="w-[140px] h-8 text-app-xs"><SelectValue placeholder="Source" /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>{s === 'all' ? 'All sources' : SOURCE_LABEL[s as ControlSource]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={review} onValueChange={setReview}>
                <SelectTrigger className="w-[140px] h-8 text-app-xs"><SelectValue placeholder="Review status" /></SelectTrigger>
                <SelectContent>
                  {REVIEW_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === 'all' ? 'All statuses' : s === 'approved' ? 'Approved' : s === 'in_review' ? 'In review' : s === 'rejected' ? 'Rejected' : 'Missing'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-app-xs text-ink-subtle">{filtered.length} of {evidence.length}</span>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Evidence</TableHead>
                <TableHead className="hidden md:table-cell">Related control</TableHead>
                <TableHead className="hidden lg:table-cell">Source</TableHead>
                <TableHead className="hidden lg:table-cell">Collected</TableHead>
                <TableHead className="w-24">Freshness</TableHead>
                <TableHead className="w-32">Review</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <TableEmpty
                      icon={<Filter className="h-4 w-4" strokeWidth={1.75} />}
                      title="No evidence matches these filters"
                      description="Try clearing filters or upload new evidence."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e) => {
                  const control = controls.find((c: any) => c.id === e.relatedControlId)
                  return (
                    <TableRow key={e.id} onClick={() => openItem(e.id)}>
                      <TableCell>
                        <div className="flex items-center gap-2.5 min-w-0">
                          {contentTypeIcon(e.contentType)}
                          <div className="min-w-0">
                            <div className="font-medium text-ink truncate max-w-[260px]">{e.name}</div>
                            <div className="text-app-2xs text-ink-subtle font-mono">{e.contentHash} · illustrative</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {control ? (
                          <div className="flex flex-col">
                            <span className="text-app-xs text-ink-muted font-mono">{control.code}</span>
                            <span className="text-app-2xs text-ink-subtle truncate max-w-[180px]">{control.title}</span>
                          </div>
                        ) : <span className="text-ink-faint">—</span>}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-ink-muted">{SOURCE_LABEL[e.source as ControlSource]}</TableCell>
                      <TableCell className="hidden lg:table-cell text-ink-muted text-app-xs">{timeAgo(e.collectedAt)}</TableCell>
                      <TableCell>
                        <span className={cn(
                          'inline-flex items-center gap-1 text-app-xs',
                          e.freshness === 'fresh' ? 'text-success' : e.freshness === 'stale' ? 'text-warning' : 'text-danger',
                        )}>
                          <span className={cn(
                            'inline-block h-1.5 w-1.5 rounded-full',
                            e.freshness === 'fresh' ? 'bg-success' : e.freshness === 'stale' ? 'bg-warning' : 'bg-danger',
                          )} />
                          {e.freshness === 'fresh' ? 'Fresh' : e.freshness === 'stale' ? 'Stale' : 'Expired'}
                        </span>
                      </TableCell>
                      <TableCell><EvidenceReviewBadge status={e.reviewStatus} /></TableCell>
                      <TableCell><ChevronRight className="h-3.5 w-3.5 text-ink-faint" strokeWidth={2} /></TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </PageBody>

      {/* Evidence detail drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          title={selected ? selected.name : 'Evidence'}
          description={selected ? `${SOURCE_LABEL[selected.source as ControlSource]} · ${formatBytes(selected.sizeBytes)} · ${selected.contentType}` : undefined}
          className="w-full max-w-xl"
        >
          {selected && (
            <EvidenceDetail
              evidence={selected}
              onApprove={() => handleApprove(selected.id)}
              onReject={() => handleReject(selected.id)}
              onControlOpen={() => { setDrawerOpen(false); navigate('/security-checks') }}
              onDownload={() => handleDownload(selected.id)}
              onVerifyHash={() => handleVerifyHash(selected.id)}
              controls={controls}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Upload dialog */}
      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        file={uploadingFile}
        step={uploadStep}
        onStepChange={setUploadStep}
        controlId={uploadControlId}
        onControlIdChange={setUploadControlId}
        onGetUploadUrl={handleGetUploadUrl}
        onDirectUpload={handleDirectUpload}
        controls={controls}
      />
    </>
  )
}

function EvidenceDetail({
  evidence,
  onApprove,
  onReject,
  onControlOpen,
  onDownload,
  onVerifyHash,
  controls,
}: {
  evidence: EvidenceItem
  onApprove: () => void
  onReject: () => void
  onControlOpen: () => void
  onDownload: () => void
  onVerifyHash: () => void
  controls: Control[]
}) {
  const control = controls.find((c: Control) => c.id === evidence.relatedControlId)
  return (
    <div className="flex flex-col gap-5">
      {/* Status + content hash */}
      <div className="flex items-center gap-2">
        <EvidenceReviewBadge status={evidence.reviewStatus} />
        <Badge variant="outline" className="normal-case tracking-normal">{SOURCE_LABEL[evidence.source as ControlSource]}</Badge>
        <Badge variant={evidence.freshness === 'fresh' ? 'success' : evidence.freshness === 'stale' ? 'warning' : 'danger'} className="normal-case tracking-normal">
          {evidence.freshness === 'fresh' ? 'Fresh' : evidence.freshness === 'stale' ? 'Stale' : 'Expired'}
        </Badge>
      </div>

      {/* Content hash placeholder */}
      <div className="rounded-app-md bg-surface-muted p-3 flex items-start gap-2">
        <FileText className="h-4 w-4 text-ink-subtle mt-0.5" strokeWidth={1.75} />
        <div className="flex-1 min-w-0">
          <div className="text-app-xs font-medium text-ink">Content hash</div>
          <div className="text-app-xs text-ink-muted mt-0.5 font-mono">{evidence.contentHash}</div>
          <div className="text-app-2xs text-ink-faint mt-1.5 italic">
            Illustrative placeholder. A content hash alone does not guarantee immutable storage — production systems must additionally sign and time-stamp the artifact.
          </div>
        </div>
      </div>

      <Separator />

      {/* Related control */}
      <section className="flex flex-col gap-2">
        <h3 className="text-app-2xs font-semibold uppercase tracking-wider text-ink-faint">Related control</h3>
        {control ? (
          <button onClick={onControlOpen} className="flex items-center justify-between w-full p-2 rounded-app-md hover:bg-surface-muted transition-colors text-left -mx-2">
            <div>
              <div className="text-app-sm text-ink font-medium">
                <span className="font-mono text-app-xs text-ink-muted">{control.code}</span> · {control.title}
              </div>
              <div className="text-app-xs text-ink-subtle mt-0.5">{control.description}</div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-ink-faint shrink-0" strokeWidth={1.75} />
          </button>
        ) : <span className="text-ink-faint">—</span>}
      </section>

      <Separator />

      {/* Source metadata */}
      <section className="flex flex-col gap-2">
        <h3 className="text-app-2xs font-semibold uppercase tracking-wider text-ink-faint">Source metadata</h3>
        <dl className="flex flex-col gap-1.5 text-app-sm">
          {evidence.uploader && (
            <div className="flex items-center justify-between">
              <dt className="text-ink-subtle">Uploader</dt>
              <dd className="text-ink">{evidence.uploader.name}</dd>
            </div>
          )}
          <div className="flex items-center justify-between">
            <dt className="text-ink-subtle">Collected at</dt>
            <dd className="text-ink">{formatDate(evidence.collectedAt)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-ink-subtle">Size</dt>
            <dd className="text-ink">{formatBytes(evidence.sizeBytes)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-ink-subtle">Content type</dt>
            <dd className="text-ink font-mono text-app-xs">{evidence.contentType}</dd>
          </div>
          {evidence.sourceMetadata &&
            Object.entries(evidence.sourceMetadata).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <dt className="text-ink-subtle capitalize">{k.replace(/([A-Z])/g, ' $1').toLowerCase()}</dt>
                <dd className="text-ink font-mono text-app-xs">{v}</dd>
              </div>
            ))}
        </dl>
      </section>

      <Separator />

      {/* Version history */}
      <section className="flex flex-col gap-2">
        <h3 className="text-app-2xs font-semibold uppercase tracking-wider text-ink-faint">Version history</h3>
        <ol className="flex flex-col">
          {evidence.versions.map((v, i) => (
            <li key={v.version} className="flex items-start gap-2 py-1.5">
              <div className="flex flex-col items-center self-stretch">
                <span className={cn('flex items-center justify-center h-5 w-5 rounded-full text-app-2xs font-semibold', i === 0 ? 'bg-accent text-white' : 'bg-surface-muted text-ink-subtle')}>v{v.version}</span>
                {i < evidence.versions.length - 1 && <span className="flex-1 w-px bg-line mt-1" />}
              </div>
              <div className="flex-1 pb-1">
                <div className="text-app-sm text-ink">{v.note}</div>
                <div className="text-app-xs text-ink-subtle mt-0.5 flex items-center gap-2">
                  <span>{formatDate(v.collectedAt)}</span>
                  {v.contentHash && <span className="font-mono text-ink-faint">{v.contentHash}</span>}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <SheetFooter>
        {evidence.reviewStatus !== 'approved' && (
          <Button onClick={onApprove} className="gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
            Approve evidence
          </Button>
        )}
        {evidence.reviewStatus !== 'rejected' && (
          <Button variant="outline" onClick={onReject}>Reject</Button>
        )}
        <Button variant="outline" onClick={onDownload} className="gap-1.5">
          <FileText className="h-3.5 w-3.5" strokeWidth={2} />
          Download
        </Button>
        <Button variant="ghost" onClick={onVerifyHash} className="gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
          Verify hash
        </Button>
      </SheetFooter>
    </div>
  )
}

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog'

function UploadDialog({
  open,
  onOpenChange,
  file,
  step,
  onStepChange,
  controlId,
  onControlIdChange,
  onGetUploadUrl,
  onDirectUpload,
  controls,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  file: File | null
  step: 'select' | 'upload' | 'complete'
  onStepChange: (v: 'select' | 'upload' | 'complete') => void
  controlId: string
  onControlIdChange: (v: string) => void
  onGetUploadUrl: () => void
  onDirectUpload: () => void
  controls: Control[]
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload evidence</DialogTitle>
          <DialogDescription>
            This file will be uploaded directly to Cloudflare R2 with SHA-256 verification. The hash is computed client-side for integrity.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {file && (
            <div className="flex items-center gap-2.5 rounded-app-md border border-line p-2.5">
              {contentTypeIcon(file.type)}
              <div className="flex-1 min-w-0">
                <div className="text-app-sm text-ink truncate">{file.name}</div>
                <div className="text-app-xs text-ink-subtle">{formatBytes(file.size)}</div>
              </div>
            </div>
          )}
          {step === 'select' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-app-xs font-medium text-ink-muted">Related control</label>
              <Select value={controlId} onValueChange={onControlIdChange}>
                <SelectTrigger><SelectValue placeholder="Select a control (optional)" /></SelectTrigger>
                <SelectContent>
                  {controls.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="font-mono text-app-2xs">{c.code}</span> · {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {step === 'upload' && (
            <div className="flex flex-col gap-1.5">
              <p className="text-app-sm text-ink-muted">Uploading directly to R2...</p>
              <Button onClick={onDirectUpload} className="gap-1.5">
                <Upload className="h-3.5 w-3.5" strokeWidth={2} />
                Upload to R2
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); onStepChange('select'); }}>Cancel</Button>
          {step === 'select' && (
            <Button onClick={onGetUploadUrl} disabled={!file}>Get upload URL</Button>
          )}
          {step === 'complete' && (
            <Button variant="outline" onClick={() => { onOpenChange(false); onStepChange('select'); }}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}